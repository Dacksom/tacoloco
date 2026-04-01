
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubItem, ProductType } from '../types';

// Fallback Menu Categories (used if no DB data)
const DEFAULT_MENU_CATEGORIES = [
  { id: 'sandwich', name: 'Sandwich', type: 'builder' as const, builder_type: 'SANDWICH' as ProductType, color: '#006837', emoji: '🥖', image_url: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/sandwich.jpg', active: true },
  { id: 'salad', name: 'Ensalada', type: 'builder' as const, builder_type: 'SALAD' as ProductType, color: '#8BC34A', emoji: '🥗', image_url: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/ensalada.jpg', active: true },
  { id: 'pizza', name: 'Pizza', type: 'builder' as const, builder_type: 'PIZZA' as ProductType, color: '#E53935', emoji: '🍕', image_url: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/pizza-card-personal.jpg', active: true },
  { id: 'tequenos', name: 'Tequeños', type: 'item' as const, color: '#FF9800', emoji: '🧀', image_url: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/tequeños-card.jpg', active: true },
  { id: 'pasticho', name: 'Pasticho', type: 'item' as const, color: '#7B1FA2', emoji: '🍝', image_url: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/pasticho-card.jpg', active: true },
  { id: 'tenders', name: 'Tenders de Pollo', displayName: 'Tenders', type: 'item' as const, color: '#F57C00', emoji: '🍗', image_url: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/tenders-card.jpg', active: true },
  { id: 'papas', name: 'Servicio de Papas', displayName: 'Papas Fritas', type: 'item' as const, color: '#FFC107', emoji: '🍟', image_url: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/assets/front-menu/papitas-fritas-card.jpg', active: true },
];

interface MenuDisplayProps {
  proteins: SubItem[];
  otherItems?: SubItem[];
  mainProducts?: any[]; // From database
  desserts?: SubItem[]; // Desserts from database
  coffee?: SubItem[]; // Coffee variants from database
  onStartBuilder: (type: ProductType) => void;
  onAddToCart?: (item: SubItem) => void;
}

const MenuDisplay: React.FC<MenuDisplayProps> = ({ proteins, otherItems = [], mainProducts, desserts = [], coffee = [], onStartBuilder, onAddToCart }) => {
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);

  // Use DB mainProducts if available, otherwise fallback
  const menuCategories = (mainProducts && mainProducts.length > 0 ? mainProducts : DEFAULT_MENU_CATEGORIES)
    .filter(p => p.active !== false); // Only show active products

  // Find item from otherItems by matching name (case insensitive, partial)
  const findItem = (keyword: string): SubItem | undefined => {
    return otherItems.find(item => item.name.toLowerCase().includes(keyword.toLowerCase()));
  };

  const handleCategoryClick = (category: any) => {
    if (category.type === 'builder') {
      onStartBuilder(category.builder_type as ProductType);
    } else {
      // Find the matching item from otherItems and add to cart
      const item = findItem(category.name);
      if (item && onAddToCart) {
        onAddToCart(item);
      }
    }
  };

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-black text-[#006837] font-brand mb-4 uppercase tracking-tighter">Nuestro Menú</h2>
          <div className="h-2 w-24 md:w-32 bg-[#FFCC00] mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-500 font-medium max-w-2xl mx-auto text-sm md:text-lg px-4">
            Elige lo que se te antoje hoy.
          </p>
        </motion.div>

        {/* GRID 2x2 on Mobile, 4 columns on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {menuCategories.map((category, index) => {
            const item = category.type === 'item' ? findItem(category.name) : null;
            const hasItem = category.type === 'builder' || item;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => hasItem && handleCategoryClick(category)}
                className={`relative rounded-2xl overflow-hidden shadow-lg cursor-pointer flex flex-col transition-all ${!hasItem ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ backgroundColor: category.color }}
              >
                {/* Image or Emoji Content */}
                {category.image_url ? (
                  <>
                    <div className="aspect-square w-full overflow-hidden">
                      <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="z-10 text-center aspect-square flex flex-col items-center justify-center p-3">
                      <span className="text-3xl md:text-4xl mb-2 block">{category.emoji}</span>
                      <h3 className="text-sm md:text-lg font-black text-white font-brand uppercase tracking-tight leading-tight">
                        {category.name}
                      </h3>
                      {item && (
                        <span className="mt-2 inline-block bg-white/90 text-gray-800 font-bold px-2 py-0.5 rounded-full text-[10px] md:text-xs">
                          ${item.price}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Postres y Café Section */}
        {(desserts.length > 0 || coffee.length > 0) && (
          <div className="mt-12">
            <h3 className="text-2xl font-black text-gray-800 font-brand text-center uppercase tracking-tighter mb-6">
              🍪 Postres & Café
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {/* Café Card - Opens Modal */}
              {coffee.length > 0 && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCoffeeModal(true)}
                  className="bg-gradient-to-br from-amber-800 to-amber-950 border-2 border-amber-600 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer col-span-1"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/cafe/nescafe-alegria-machine.jpg"
                      alt="Café"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-white/90 text-amber-800 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                      Ver opciones
                    </div>
                  </div>
                  <div className="p-2 text-center bg-amber-900/50">
                    <h4 className="font-black text-white text-xs uppercase">Café</h4>
                    <span className="text-amber-200 text-[10px] font-bold">Desde $1.50</span>
                  </div>
                </motion.div>
              )}
              {/* Desserts */}
              {desserts.filter(item => item.stock_status !== false).map(item => (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAddToCart?.(item)}
                  className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="aspect-square bg-gray-50 flex items-center justify-center p-2">
                    <img src={item.image} className="max-w-full max-h-full object-contain" alt={item.name} />
                  </div>
                  <div className="p-2 text-center">
                    <h4 className="font-bold text-gray-800 text-[10px] md:text-xs uppercase leading-tight truncate">{item.name}</h4>
                    <span className="font-black text-[#006837] text-sm">${item.price}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bebidas Section (if any) */}
        {otherItems.filter(i => i.category === 'beverage').length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-black text-gray-800 font-brand text-center uppercase tracking-tighter mb-6">
              Bebidas
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {otherItems.filter(i => i.category === 'beverage').map(item => (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAddToCart?.(item)}
                  className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="aspect-square bg-gray-50 flex items-center justify-center p-2">
                    <img src={item.image} className="max-w-full max-h-full object-contain" alt={item.name} />
                  </div>
                  <div className="p-2 text-center">
                    <h4 className="font-bold text-gray-800 text-[10px] md:text-xs uppercase leading-tight truncate">{item.name}</h4>
                    <span className="font-black text-[#006837] text-sm">${item.price}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coffee Modal */}
      <AnimatePresence>
        {showCoffeeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCoffeeModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden pointer-events-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-800 to-amber-950 p-6 text-center relative">
                  <button
                    onClick={() => setShowCoffeeModal(false)}
                    className="absolute top-4 right-4 text-white/80 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="text-5xl mb-2 block">☕</span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Nuestros Cafés</h3>
                  <p className="text-amber-200 text-sm mt-1">Elige tu favorito</p>
                </div>

                {/* Coffee Grid */}
                <div className="p-4 overflow-y-auto max-h-[50vh]">
                  <div className="grid grid-cols-2 gap-3">
                    {coffee.map(item => {
                      const isAvailable = item.stock_status !== false;
                      return (
                        <motion.button
                          key={item.id}
                          whileTap={isAvailable ? { scale: 0.95 } : undefined}
                          onClick={() => {
                            if (isAvailable) {
                              onAddToCart?.(item);
                              setShowCoffeeModal(false);
                            }
                          }}
                          disabled={!isAvailable}
                          className={`rounded-xl p-4 text-center transition-all relative ${isAvailable
                            ? 'bg-amber-50 border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-100 cursor-pointer'
                            : 'bg-gray-100 border-2 border-gray-200 cursor-not-allowed opacity-60'
                            }`}
                        >
                          {!isAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl z-10">
                              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase">Agotado</span>
                            </div>
                          )}
                          <div className={`w-24 h-24 mx-auto mb-2 rounded-full overflow-hidden bg-white shadow-md ${!isAvailable ? 'grayscale' : ''}`}>
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <h4 className={`font-bold text-sm uppercase leading-tight ${isAvailable ? 'text-amber-900' : 'text-gray-400'}`}>{item.name}</h4>
                          <span className={`inline-block mt-2 font-black text-sm px-3 py-1 rounded-full ${isAvailable ? 'bg-amber-800 text-white' : 'bg-gray-300 text-gray-500'
                            }`}>
                            ${item.price?.toFixed(2)}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                  <button
                    onClick={() => setShowCoffeeModal(false)}
                    className="w-full py-3 text-gray-500 font-bold text-sm uppercase tracking-wide"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};

export default MenuDisplay;
