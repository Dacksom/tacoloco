
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomizedSub, SubItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CustomizedSub[];
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onAddMore?: () => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onClearCart?: () => void;
  unavailableItems?: string[];
  beverages?: SubItem[];
  onAddBeverage?: (item: SubItem) => void;
  autoShowBeverages?: boolean;
  onBeveragesShown?: () => void;
  onDuplicate?: (item: CustomizedSub, newName: string) => void;
  autoScrollToBottom?: boolean;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onRemove, onCheckout, onAddMore, onUpdateQuantity, onClearCart, unavailableItems = [], beverages = [], onAddBeverage, autoShowBeverages = false, onBeveragesShown, onDuplicate, autoScrollToBottom = false }) => {
  const [showBeverages, setShowBeverages] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [showAddedCheck, setShowAddedCheck] = useState(false);
  const [showBeverageScrollHint, setShowBeverageScrollHint] = useState(true);
  const addedCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const beverageScrollRef = useRef<HTMLDivElement>(null);
  const cartContentRef = useRef<HTMLDivElement>(null);

  // Duplicate modal state
  const [duplicatingItem, setDuplicatingItem] = useState<CustomizedSub | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Calculate beverage quantities from actual cart items (stays in sync when items removed)
  const beverageQuantities = React.useMemo(() => {
    const quantities: Record<string, number> = {};
    items.filter(item => item.type === 'OTHER').forEach(item => {
      // Use protein.id or protein.name as key to match with beverages
      const key = item.protein?.id || item.protein?.name || '';
      if (key) {
        quantities[key] = (quantities[key] || 0) + (item.quantity || 1);
      }
    });
    return quantities;
  }, [items]);

  const handleBeveragesScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Hide arrow when scrolled more than 50px or near the end
      setShowScrollHint(scrollLeft < 50 && scrollWidth > clientWidth);
    }
  };

  const handleBeverageVerticalScroll = () => {
    if (beverageScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = beverageScrollRef.current;
      // Hide arrow when scrolled more than 20px or near the bottom
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 20;
      setShowBeverageScrollHint(scrollTop < 20 && !isNearBottom);
    }
  };
  const total = items.reduce((sum, item) => {
    const qty = item.quantity || 1;
    return sum + (item.price * qty);
  }, 0);

  // Close beverages sheet when closing cart
  const handleClose = () => {
    setShowBeverages(false);
    setShowDuplicateModal(false);
    onClose();
  };

  // Duplicate item functions
  const handleStartDuplicate = (item: CustomizedSub) => {
    setDuplicatingItem(item);
    setDuplicateName('');
    setShowDuplicateModal(true);
  };

  const handleConfirmDuplicate = () => {
    if (duplicatingItem && duplicateName.trim() && onDuplicate) {
      onDuplicate(duplicatingItem, duplicateName.trim());
      setShowDuplicateModal(false);
      setDuplicatingItem(null);
      setDuplicateName('');
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setDuplicatingItem(null);
    setDuplicateName('');
  };

  // Auto-open beverages panel when cart opens with autoShowBeverages flag
  useEffect(() => {
    if (isOpen && autoShowBeverages && beverages.length > 0) {
      // Small delay to let cart animation complete
      const timer = setTimeout(() => {
        setShowBeverages(true);
        if (onBeveragesShown) {
          onBeveragesShown();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoShowBeverages, beverages.length, onBeveragesShown]);

  // Auto-scroll to bottom when cart opens with fixed items
  useEffect(() => {
    if (isOpen && autoScrollToBottom && cartContentRef.current) {
      // Delay to let cart animation complete
      const timer = setTimeout(() => {
        cartContentRef.current?.scrollTo({
          top: cartContentRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoScrollToBottom]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b-4 border-[#FFCC00] flex justify-between items-center bg-[#006837] text-white">
              <h2 className="text-2xl font-black font-brand uppercase tracking-tighter">Tu Carrito</h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && onClearCart && (
                  <button
                    onClick={() => {
                      if (confirm('¿Limpiar todo el carrito?')) {
                        onClearCart();
                      }
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Limpiar carrito"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div ref={cartContentRef} className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
              {items.length === 0 ? (
                <div className="text-center py-20">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-6xl mb-4"
                  >
                    🛒
                  </motion.div>
                  <p className="text-gray-400 font-black uppercase tracking-widest text-sm mb-8">¡Tu pedido está vacío!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {/* Sort items: food first (SANDWICH, SALAD, PIZZA), then OTHER (beverages) */}
                  {[...items].sort((a, b) => {
                    const isAFood = a.type !== 'OTHER';
                    const isBFood = b.type !== 'OTHER';
                    if (isAFood && !isBFood) return -1;
                    if (!isAFood && isBFood) return 1;
                    return 0;
                  }).map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100, scale: 0.8 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                      className="bg-white rounded-3xl p-4 border-2 border-gray-100 relative group shadow-sm"
                    >
                      <button
                        onClick={() => onRemove(item.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-100 z-10 hover:scale-110 transition-transform"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>

                      {/* Duplicate button for non-OTHER items */}
                      {item.type !== 'OTHER' && onDuplicate && (
                        <button
                          onClick={() => handleStartDuplicate(item)}
                          className="absolute -top-2 right-7 bg-[#006837] text-white rounded-full px-2.5 py-1 shadow-lg opacity-100 z-10 hover:scale-105 transition-transform flex items-center gap-1"
                          title="Duplicar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] font-bold uppercase">Duplicar</span>
                        </button>
                      )}

                      <div className="flex gap-4 mb-3">
                        <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-gray-100 relative">
                          <img
                            src={
                              item.type === 'PIZZA'
                                ? 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/otros/pizza-wb.jpg'
                                : item.type === 'SALAD'
                                  ? 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/ensalada-wb.jpg'
                                  : item.type === 'SANDWICH'
                                    ? 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/sandwich-wb.jpg'
                                    : item.protein?.image || 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/sandwich-wb.jpg'
                            }
                            className="w-full h-full object-cover"
                          />
                          {item.type !== 'OTHER' && (
                            <div className="absolute bottom-0 w-full bg-[#FFCC00] text-[#006837] text-[8px] font-black text-center py-0.5 uppercase">
                              {item.type === 'SANDWICH' ? item.size : (item.type === 'PIZZA' ? 'Pizza' : 'Ensalada')}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-black text-[#006837] uppercase leading-none text-base mb-1">
                            {item.type === 'PIZZA' ? 'Pizza' : (item.type === 'SALAD' ? 'Ensalada' : item.protein?.name || 'Sandwich')}
                            {item.customerName && <span className="text-gray-400 font-bold ml-1 text-xs">({item.customerName})</span>}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            {item.type === 'PIZZA' ? 'Personal' : (item.type === 'SALAD' ? item.protein?.name : (item.bread ? item.bread.name : ''))}
                          </p>

                          {/* Free snack badge - for sandwiches and salads */}
                          {(item.type === 'SANDWICH' || item.type === 'SALAD') && (
                            <div
                              className="mt-1 inline-flex items-center gap-1 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md"
                              style={{
                                background: 'linear-gradient(90deg, #006837, #FFCC00, #006837)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s ease-in-out infinite'
                              }}
                            >
                              🍪 + Snack Gratis
                            </div>
                          )}
                        </div>
                        {/* Price at bottom-right of card for non-OTHER items */}
                        {item.type !== 'OTHER' && (
                          <div className="self-end text-[#006837] font-black text-xl leading-none ml-auto">
                            ${item.price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Quantity controls for OTHER type items - bottom right */}
                      {item.type === 'OTHER' && onUpdateQuantity && (
                        <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center bg-gray-100 rounded-full">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              whileHover={{ backgroundColor: '#e5e7eb' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newQty = (item.quantity || 1) - 1;
                                if (newQty < 1) {
                                  onRemove(item.id);
                                } else {
                                  onUpdateQuantity(item.id, newQty);
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center text-[#006837] font-bold text-xl rounded-full transition-colors"
                            >
                              -
                            </motion.button>
                            <motion.span
                              key={item.quantity}
                              initial={{ scale: 1.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className="w-8 text-center font-black text-[#006837]"
                            >
                              {item.quantity || 1}
                            </motion.span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              whileHover={{ backgroundColor: '#e5e7eb' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(item.id, (item.quantity || 1) + 1);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-[#006837] font-bold text-xl rounded-full transition-colors"
                            >
                              +
                            </motion.button>
                          </div>
                          <span className="text-[#006837] font-black text-xl min-w-[80px] text-right">
                            ${(item.price * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {(item.veggies.length > 0 || item.extras.length > 0) && (
                        <div className="text-[9px] font-bold text-gray-500 border-t border-gray-100 pt-2 uppercase truncate opacity-70">
                          {(() => {
                            // Group items by name and count duplicates
                            const allItems = [...item.extras, ...item.veggies];
                            const grouped = allItems.reduce((acc, v) => {
                              acc[v.name] = (acc[v.name] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            // Format with Doble for 2, x3+ for more
                            return Object.entries(grouped)
                              .map(([name, count]) => count === 2 ? `${name} Doble` : count > 2 ? `${name} x${count}` : name)
                              .join(', ');
                          })()}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {/* Botones de "Pídete algo más" y "Bebidas" lado a lado */}
              <div className="flex gap-3">
                {/* ¡Pídete algo más! - Izquierda - MÁS LLAMATIVO */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: ["0px 0px 0px rgba(0, 104, 55, 0)", "0px 0px 20px rgba(0, 104, 55, 0.5)", "0px 0px 0px rgba(0, 104, 55, 0)"],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  onClick={() => {
                    if (onAddMore) onAddMore();
                  }}
                  className="flex-1 relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-[#FFCC00] via-[#006837] to-[#FFCC00] bg-[length:200%_auto] animate-gradient-x"
                >
                  <div className="bg-[#006837] rounded-[0.9rem] py-5 flex flex-col items-center justify-center gap-2 transition-colors">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-14 h-14 rounded-full bg-[#FFCC00] flex items-center justify-center shadow-lg"
                    >
                      <span className="text-2xl">🥪</span>
                    </motion.div>
                    <span className="font-black uppercase tracking-tight text-base text-white">¡Pídete algo más!</span>
                  </div>
                </motion.button>

                {/* Bebidas - Derecha */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    boxShadow: ["0px 0px 0px rgba(255, 204, 0, 0)", "0px 0px 15px rgba(255, 204, 0, 0.4)", "0px 0px 0px rgba(255, 204, 0, 0)"],
                  }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  onClick={() => setShowBeverages(true)}
                  className="flex-1 relative group overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-[#FFCC00] via-white to-[#FFCC00] bg-[length:200%_auto] animate-gradient-x"
                >
                  <div className="bg-white rounded-[0.9rem] py-5 flex flex-col items-center justify-center gap-2 transition-colors group-hover:bg-[#FFCC00]/10">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-12 h-12 rounded-full bg-[#FFCC00] flex items-center justify-center shadow-md shadow-[#FFCC00]/30"
                    >
                      <span className="text-2xl">🥤</span>
                    </motion.div>
                    <span className="font-black uppercase tracking-tighter text-sm text-[#006837]">Bebidas</span>
                  </div>
                </motion.button>
              </div>

              {/* Beverages Bottom Sheet */}
              <AnimatePresence>
                {showBeverages && (
                  <>
                    {/* Backdrop to close on outside click */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowBeverages(false)}
                      className="absolute inset-0 bg-black/40 z-10"
                    />
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-2xl z-20 border-t-4 border-[#FFCC00]"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-black text-[#006837] uppercase tracking-tighter text-lg">🥤 Bebidas</h3>
                          <button
                            onClick={() => setShowBeverages(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Grid 3x2 container with vertical scroll */}
                        <div className="relative">
                          <div
                            ref={beverageScrollRef}
                            onScroll={handleBeverageVerticalScroll}
                            className="max-h-[280px] overflow-y-auto"
                          >
                            {beverages.length > 0 ? (
                              <div className="grid grid-cols-3 gap-3">
                                {beverages.map(bev => {
                                  const qty = beverageQuantities[bev.id] || 0;
                                  const isSelected = qty > 0;
                                  return (
                                    <motion.div
                                      key={bev.id}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        if (onAddBeverage) {
                                          onAddBeverage(bev);
                                          // Clear previous timeout
                                          if (addedCheckTimeoutRef.current) {
                                            clearTimeout(addedCheckTimeoutRef.current);
                                          }
                                          // Hide check temporarily to restart animation
                                          setShowAddedCheck(false);
                                          // Show check after 1 second of last selection
                                          addedCheckTimeoutRef.current = setTimeout(() => {
                                            setShowAddedCheck(true);
                                            // Hide check after 2 more seconds
                                            setTimeout(() => setShowAddedCheck(false), 2000);
                                          }, 1000);
                                        }
                                      }}
                                      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${isSelected
                                        ? 'border-[3px] border-[#006837] bg-[#006837]/5 shadow-lg shadow-[#006837]/20'
                                        : 'border-2 border-gray-100 bg-gray-50 hover:border-[#FFCC00]'
                                        }`}
                                    >
                                      {/* Quantity badge */}
                                      {isSelected && (
                                        <motion.div
                                          key={qty}
                                          initial={{ scale: 0, rotate: -180 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          className="absolute top-1 right-1 w-7 h-7 bg-[#006837] text-white rounded-full flex items-center justify-center font-black text-sm z-10 shadow-lg"
                                        >
                                          +{qty}
                                        </motion.div>
                                      )}
                                      <div className="w-full h-20 bg-white flex items-center justify-center p-2">
                                        <img src={bev.image} alt={bev.name} className="max-w-full max-h-full object-contain" />
                                      </div>
                                      <div className={`p-2 text-center ${isSelected ? 'bg-[#006837]/10' : ''}`}>
                                        <p className={`text-[9px] font-bold uppercase leading-tight truncate ${isSelected ? 'text-[#006837]' : 'text-gray-600'}`}>{bev.name}</p>
                                        <p className="text-sm font-black text-[#006837]">${bev.price}</p>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm py-4 text-center">No hay bebidas disponibles</p>
                            )}
                          </div>

                          {/* Scroll down hint arrow */}
                          <AnimatePresence>
                            {beverages.length > 6 && showBeverageScrollHint && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none flex items-end justify-center bg-gradient-to-t from-white via-white/80 to-transparent"
                              >
                                <motion.div
                                  animate={{ y: [0, 3, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.2 }}
                                  className="text-[#006837]/50 mb-1"
                                >
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7" />
                                  </svg>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Accept button to close beverages panel */}
                        <button
                          onClick={() => setShowBeverages(false)}
                          className="w-full py-3 mt-2 bg-[#006837] text-white font-bold rounded-xl uppercase text-sm hover:bg-[#004d29] transition-colors"
                        >
                          ✓ Aceptar
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-gray-50 border-t-4 border-[#FFCC00]">
                <div className="flex justify-between items-center mb-6 px-2">
                  <span className="text-gray-400 font-black uppercase tracking-widest text-xs">Subtotal</span>
                  <span className="text-3xl font-black text-[#006837] tracking-tighter">${total.toFixed(2)}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCheckout}
                  className="w-full bg-[#006837] text-white font-black py-5 rounded-3xl text-xl shadow-2xl hover:bg-[#004d29] transition-all uppercase tracking-tighter flex items-center justify-center gap-3"
                >
                  Confirmar Pedido
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M14 5l7 7-7 7" /></svg>
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Duplicate Name Modal */}
      {showDuplicateModal && duplicatingItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
          onClick={handleCancelDuplicate}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border-t-8 border-[#FFCC00]"
          >
            <div className="text-center space-y-4">
              <div className="text-5xl mb-2">📋</div>
              <h3 className="text-xl font-black text-[#006837] font-brand uppercase tracking-tighter leading-tight">
                ¿Quién se va a comer {duplicatingItem.type === 'PIZZA' ? 'esta pizza' : (duplicatingItem.type === 'SALAD' ? 'esta ensalada' : 'este pan')}?
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase">
                Duplicando: {duplicatingItem.type === 'PIZZA' ? 'Pizza' : (duplicatingItem.type === 'SALAD' ? 'Ensalada' : duplicatingItem.protein?.name)}
              </p>

              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Ej. Jonathan"
                className="w-full px-4 py-3 text-lg text-center font-bold text-[#006837] bg-gray-50 border-2 border-[#006837] rounded-2xl uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-[#006837]/20"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && duplicateName.trim() && handleConfirmDuplicate()}
              />

              <button
                onClick={handleConfirmDuplicate}
                disabled={!duplicateName.trim()}
                className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wide transition-all ${duplicateName.trim()
                  ? 'bg-[#006837] text-white shadow-lg hover:bg-[#005530]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                Duplicar 📋
              </button>

              <button
                onClick={handleCancelDuplicate}
                className="text-gray-400 font-bold text-sm uppercase tracking-wide"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Cart;
