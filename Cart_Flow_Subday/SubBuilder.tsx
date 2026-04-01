
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PRICES, EXTRA_COSTS, INCLUDED_LIMITS } from '../constants';
import { SubItem, CustomizedSub, OptionCategory, ProductType, ProductSize } from '../types';
import { api } from '../services/api';

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface SubBuilderProps {
  onAddToCart: (sub: CustomizedSub) => void;
  onFinish: () => void;
  onExit?: () => void; // Exit without opening cart (for back gesture)
  onRefreshMenu?: () => void; // Refresh menu when items become unavailable
  initialProtein?: SubItem | null;
  initialProductType?: ProductType; // [NEW] Accept initial type
  isCombo?: boolean;
  menu: {
    breads: OptionCategory;
    proteins: SubItem[];
    extras: OptionCategory;
    veggies: OptionCategory;
    sauces: OptionCategory;
  }
}

const SubBuilder: React.FC<SubBuilderProps> = ({ onAddToCart, onFinish, onExit, onRefreshMenu, initialProtein = null, initialProductType = 'SANDWICH', menu }) => {
  // SANDWICH: start at Step 1 (Bread)
  // SALAD: start at Step 2 (Protein selection) - skip bread
  // PIZZA: start at Step 3 (Extras/Embutidos) - skip bread and protein
  const getInitialStep = () => {
    if (initialProductType === 'PIZZA') return 3;
    if (initialProductType === 'SALAD') return 2;
    return 1; // SANDWICH
  };
  const [step, setStep] = useState(getInitialStep());
  const [direction, setDirection] = useState(0);

  const [productType, setProductType] = useState<ProductType>(initialProductType);
  const [productSize, setProductSize] = useState<ProductSize>('15cm');

  // [NEW] Modal State
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState('');
  const [shakeModal, setShakeModal] = useState(false);

  // [NEW] Tour State
  const [showHelpModal, setShowHelpModal] = useState(false);

  // [NEW] Unavailable Items Modal
  const [unavailableItems, setUnavailableItems] = useState<{ id: string; name: string; image?: string }[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Force N/A size for Salads
    if (productType === 'SALAD') {
      setProductSize('N/A');
    }
  }, [productType]);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeen = localStorage.getItem('subday_tour_completed');
    if (!hasSeen && !initialProtein) {
      setShowHelpModal(true);
    }
  }, [initialProtein]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      // Spanish translations
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '¡Listo!',
      progressText: '{{current}} de {{total}}',
      // Custom styling
      popoverClass: 'subday-tour-popover',
      steps: [
        {
          element: '#sub-builder-header',
          popover: {
            title: '📊 Tu Progreso',
            description: 'Aquí puedes ver en qué paso de la creación estás. La barra amarilla muestra tu avance.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#sub-builder-price',
          popover: {
            title: '💰 Control de Costo',
            description: 'El precio se actualiza automáticamente según lo que agregues. ¡Siempre sabrás cuánto pagarás!',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#sub-builder-options',
          popover: {
            title: productType === 'PIZZA' ? '🍕 Área de Selección' : (productType === 'SALAD' ? '🥗 Área de Selección' : '🥪 Área de Selección'),
            description: productType === 'PIZZA'
              ? 'Aquí elegirás los ingredientes de tu pizza: Embutidos, Vegetales y más. ¡Hazla a tu gusto!'
              : (productType === 'SALAD'
                ? 'Aquí elegirás los ingredientes de tu ensalada: Proteínas, Vegetales y más. ¡Hazla a tu gusto!'
                : 'Aquí elegirás tus ingredientes: Panes, Proteínas, Vegetales y más. ¡Hazlo a tu gusto!'),
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#sub-builder-nav',
          popover: {
            title: '🧭 Navegación',
            description: (productType === 'SALAD' || productType === 'PIZZA')
              ? 'Usa estos botones para avanzar al siguiente paso.'
              : 'Usa estos botones para avanzar al siguiente paso o cambiar el tamaño de tu Sub.',
            side: 'top',
            align: 'center'
          }
        },
      ]
    });
    driverObj.drive();
  };

  const handleHelpChoice = (wantsHelp: boolean) => {
    localStorage.setItem('subday_tour_completed', 'true');
    setShowHelpModal(false);
    if (wantsHelp) {
      setTimeout(() => startTour(), 500);
    }
  };

  const [selections, setSelections] = useState({
    bread: null as SubItem | null,
    protein: initialProtein,
    extraProtein: null as SubItem | null,
    extras: [] as SubItem[],
    veggies: [] as SubItem[],
    sauces: [] as SubItem[],
    customerName: '', // [NEW] Track name in selection
    hasParmesan: false, // [NEW] Free parmesan toggle
    hasSalt: false, // [NEW] Salt option
    hasPepper: false, // [NEW] Pepper option
    hasPesto: false, // [NEW] Pesto option for pizza ($1)
    customNote: '' // [NEW] Custom note for sandwich/salad/pizza
  });

  // [NEW] Salt & Pepper Modal State
  const [showSaltPepperModal, setShowSaltPepperModal] = useState(false);

  // [NEW] Pesto Modal State for Pizza
  const [showPestoModal, setShowPestoModal] = useState(false);

  // Cálculo de Precio
  const currentTotalPrice = useMemo(() => {
    let price = 0;
    if (productType === 'SANDWICH') {
      price = productSize === '15cm' ? PRICES.SANDWICH_15 : PRICES.SANDWICH_30;
    } else if (productType === 'PIZZA') {
      price = PRICES.PIZZA;
    } else {
      price = PRICES.SALAD;
    }

    let costs = EXTRA_COSTS.sandwich_15;
    if (productType === 'SANDWICH' && productSize === '30cm') costs = EXTRA_COSTS.sandwich_30;
    if (productType === 'SALAD') costs = EXTRA_COSTS.salad;
    if (productType === 'PIZZA') costs = EXTRA_COSTS.pizza;

    // Extra protein only for sandwich/salad, not pizza
    if (selections.extraProtein && productType !== 'PIZZA') price += PRICES.EXTRA_PROTEIN;

    // Dynamic Limits based on product type
    let limits = INCLUDED_LIMITS.sandwich;
    if (productType === 'SALAD') limits = INCLUDED_LIMITS.salad;
    if (productType === 'PIZZA') limits = INCLUDED_LIMITS.pizza;

    // Cada unidad en el array cuenta hacia el límite - premium items always count as extra
    const regularExtras = selections.extras.filter(i => i.category !== 'extra');
    const premiumExtras = selections.extras.filter(i => i.category === 'extra');

    // For Pizza, Parmesano counts as a regular extra item towards the limit
    const regularCount = regularExtras.length;
    const extraExtrasCount = Math.max(0, regularCount - limits.extras) + premiumExtras.length;
    price += extraExtrasCount * costs.extras;

    const extraVeggiesCount = Math.max(0, selections.veggies.length - limits.veggies);
    price += extraVeggiesCount * costs.veggies;

    // Sauces only for sandwich/salad, not pizza
    if (productType !== 'PIZZA') {
      const extraSaucesCount = Math.max(0, selections.sauces.length - limits.sauces);
      price += extraSaucesCount * costs.sauces;
    }

    // For pizza: Pesto costs $1
    if (productType === 'PIZZA' && selections.hasPesto) {
      price += 1.00;
    }

    return price;
  }, [productType, productSize, selections]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  useEffect(() => {
    if (initialProtein) {
      setSelections(prev => ({ ...prev, protein: initialProtein }));
      setStep(0);
    }
  }, [initialProtein]);

  // Handle browser back button - always exit to menu from builder
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Always exit to menu when back is pressed (use onExit if available, else onFinish)
      if (onExit) {
        onExit();
      } else {
        onFinish();
      }
    };

    // Push initial state to capture back gesture
    window.history.pushState({ inBuilder: true }, '');

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onFinish]);

  const confirmName = () => {
    setSelections(prev => ({ ...prev, customerName: tempCustomerName }));
    setShowNameModal(false);
    setDirection(1);
    let next = step + 1;
    // Skip steps based on product type
    if (productType === 'SALAD' && next === 1) next = 2;
    // PIZZA: skip step 5 (sauces) - go from 4 to 6
    if (productType === 'PIZZA' && next === 5) next = 6;
    setStep(Math.min(next, 6));
  };

  const skipName = () => {
    setSelections(prev => ({ ...prev, customerName: '' }));
    setShowNameModal(false);
    setDirection(1);
    let next = step + 1;
    if (productType === 'SALAD' && next === 1) next = 2;
    setStep(Math.min(next, 6));
  };

  const nextStep = () => {
    // [NEW] Logic to intercept for name modal
    // For Sandwich: show at Step 1 (Bread)
    // For Salad: show at Step 3 (first step after protein)
    // For Pizza: show at Step 3 (first step - embutidos)
    const shouldShowNameModal =
      (step === 1 && productType === 'SANDWICH') ||
      (step === 3 && productType === 'SALAD') ||
      (step === 3 && productType === 'PIZZA');

    if (shouldShowNameModal && !showNameModal && !selections.customerName) {
      setTempCustomerName('');
      setShowNameModal(true);
      return;
    }

    // [NEW] Show salt & pepper modal when going from step 5 to 6 (only for Salad)
    if (step === 5 && productType === 'SALAD' && !showSaltPepperModal) {
      setShowSaltPepperModal(true);
      return;
    }

    setDirection(1);
    let next = step + 1;
    if (productType === 'SALAD' && next === 1) next = 2;
    // PIZZA: skip step 5 (sauces) - go from 4 to 6, but show pesto modal first
    if (productType === 'PIZZA' && next === 5) {
      if (!showPestoModal) {
        setShowPestoModal(true);
        return; // Don't advance until pesto modal is handled
      }
      next = 6;
    }
    setStep(Math.min(next, 7)); // Changed from 6 to 7
  };

  const prevStep = () => {
    setDirection(-1);
    let prev = step - 1;

    // SANDWICH: minimum step is 1 (Bread)
    // SALAD: minimum step is 2 (Protein selection)
    // PIZZA: minimum step is 3 (Embutidos) - skip bread and protein
    let minStep = 1;
    if (productType === 'SALAD') minStep = 2;
    if (productType === 'PIZZA') minStep = 3;

    // PIZZA: skip step 5 (sauces) when going back from 6
    if (productType === 'PIZZA' && prev === 5) prev = 4;

    if (prev < minStep) return;
    setStep(prev);
  };

  const handlePagarAhora = async () => {
    setIsValidating(true);

    try {
      // First, validate the main product type (SANDWICH, PIZZA, etc.)
      const unavailableProduct = await api.validateProductType(productType);

      if (unavailableProduct) {
        setUnavailableItems([unavailableProduct]);
        setIsValidating(false);
        return; // Product type is no longer available
      }

      // Collect all item IDs to validate
      const itemIds: string[] = [];

      if (selections.protein?.id) itemIds.push(selections.protein.id);
      if (selections.bread?.id) itemIds.push(selections.bread.id);
      if (selections.extraProtein?.id) itemIds.push(selections.extraProtein.id);
      selections.extras.forEach(item => itemIds.push(item.id));
      selections.veggies.forEach(item => itemIds.push(item.id));
      selections.sauces.forEach(item => itemIds.push(item.id));

      // Remove duplicates
      const uniqueIds = [...new Set(itemIds)];

      // Validate stock status of ingredients
      const unavailable = await api.validateStockStatus(uniqueIds);

      if (unavailable.length > 0) {
        setUnavailableItems(unavailable);
        setIsValidating(false);
        return; // Don't add to cart
      }

      // Handle Parmesano for Pizza: if selected as a regular extra, move to configuration
      const pizzaParmesan = productType === 'PIZZA' && selections.extras.find(i => i.name?.toLowerCase().includes('parmesano'));
      const finalExtras = pizzaParmesan
        ? selections.extras.filter(i => !i.name?.toLowerCase().includes('parmesano'))
        : selections.extras;
      const finalHasParmesan = selections.hasParmesan || !!pizzaParmesan;

      // All items available - proceed
      const newSub: CustomizedSub = {
        id: Math.random().toString(36).substr(2, 9),
        type: productType,
        size: (productType === 'SALAD' || productType === 'PIZZA') ? 'N/A' : productSize,
        bread: productType === 'PIZZA' ? undefined : selections.bread || undefined,
        protein: productType === 'PIZZA' ? null! : selections.protein,
        extraProtein: productType === 'PIZZA' ? undefined : selections.extraProtein || undefined,
        extras: finalExtras,
        veggies: selections.veggies,
        sauces: productType === 'PIZZA' ? [] : selections.sauces,
        price: currentTotalPrice,
        customerName: selections.customerName || undefined,
        configuration: {
          hasParmesan: finalHasParmesan,
          hasSalt: selections.hasSalt,
          hasPepper: selections.hasPepper,
          hasPesto: selections.hasPesto,
          customNote: selections.customNote || undefined
        }
      };
      onAddToCart(newSub);
      onFinish();
    } catch (error) {
      console.error('Error validating stock:', error);
      // Handle Parmesano for Pizza: if selected as a regular extra, move to configuration
      const pizzaParmesan = productType === 'PIZZA' && selections.extras.find(i => i.name?.toLowerCase().includes('parmesano'));
      const finalExtras = pizzaParmesan
        ? selections.extras.filter(i => !i.name?.toLowerCase().includes('parmesano'))
        : selections.extras;
      const finalHasParmesan = selections.hasParmesan || !!pizzaParmesan;

      // All items available - proceed
      const newSub: CustomizedSub = {
        id: Math.random().toString(36).substr(2, 9),
        type: productType,
        size: (productType === 'SALAD' || productType === 'PIZZA') ? 'N/A' : productSize,
        bread: productType === 'PIZZA' ? undefined : selections.bread || undefined,
        protein: productType === 'PIZZA' ? null! : selections.protein,
        extraProtein: productType === 'PIZZA' ? undefined : selections.extraProtein || undefined,
        extras: finalExtras,
        veggies: selections.veggies,
        sauces: productType === 'PIZZA' ? [] : selections.sauces,
        price: currentTotalPrice,
        customerName: selections.customerName || undefined,
        configuration: {
          hasParmesan: finalHasParmesan,
          hasSalt: selections.hasSalt,
          hasPepper: selections.hasPepper,
          hasPesto: selections.hasPesto,
          customNote: selections.customNote || undefined
        }
      };
      onAddToCart(newSub);
      onFinish();
    }
    setIsValidating(false);
  };

  const toggleItem = (category: 'extras' | 'veggies' | 'sauces', item: SubItem) => {
    const currentList = [...selections[category]];
    const count = currentList.filter(i => i.id === item.id).length;

    if (count > 0) {
      // Si ya está (sea normal o doble), lo quitamos por completo
      const newList = currentList.filter(i => i.id !== item.id);
      setSelections({ ...selections, [category]: newList });
    } else {
      // Si no está, lo agregamos una vez
      currentList.push(item);
      setSelections({ ...selections, [category]: currentList });
    }
  };

  const toggleExtraPortion = (e: React.MouseEvent, category: 'extras' | 'veggies' | 'sauces', item: SubItem) => {
    e.stopPropagation();
    const currentList = [...selections[category]];
    const count = currentList.filter(i => i.id === item.id).length;

    if (count === 1) {
      currentList.push(item);
    } else if (count === 2) {
      const firstIndex = currentList.findIndex(i => i.id === item.id);
      currentList.splice(firstIndex, 1);
    }
    setSelections({ ...selections, [category]: currentList });
  };

  const getExtraPriceForCategory = (category: 'extras' | 'veggies' | 'sauces') => {
    let costs = EXTRA_COSTS.sandwich_15;
    if (productType === 'SANDWICH' && productSize === '30cm') costs = EXTRA_COSTS.sandwich_30;
    if (productType === 'SALAD') costs = EXTRA_COSTS.salad;
    if (productType === 'PIZZA') costs = EXTRA_COSTS.pizza;
    return costs[category];
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 })
  };

  const canGoNext = () => {
    if (step === 1 && productType === 'SANDWICH' && !selections.bread) return false;
    if (step === 2 && !selections.protein) return false;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      // NOTE: Case 0 has been removed - protein is selected from the menu before entering builder

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-3xl font-black text-[#006837] font-brand uppercase tracking-tighter">Elige tu Pan</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pb-12">
              {menu.breads.items.map(item => (
                <motion.button
                  key={item.id}
                  whileTap={item.stock_status !== false ? { scale: 0.95 } : {}}
                  onClick={() => item.stock_status !== false && setSelections(prev => ({ ...prev, bread: item }))}
                  className={`relative flex flex-col items-center border-[4px] rounded-[2rem] transition-all overflow-hidden ${item.stock_status === false ? 'cursor-not-allowed border-gray-100 bg-gray-50' : ''} ${selections.bread?.id === item.id ? 'border-[#FFCC00] bg-white ring-4 ring-[#006837]/10' : 'border-white bg-white shadow-sm'}`}
                >
                  <div className="w-full aspect-square bg-gray-50 relative">
                    <img
                      src={item.image}
                      className={`w-full h-full object-cover transition-all ${item.stock_status === false ? 'opacity-50 grayscale' : ''}`}
                      alt={item.name}
                    />
                    {item.stock_status === false && (
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <span className="bg-[#EF4444] text-white text-[10px] font-black px-3 py-1 rounded shadow-sm uppercase tracking-wider">AGOTADO</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 w-full text-center text-sm font-black uppercase tracking-tight ${selections.bread?.id === item.id ? 'text-[#006837]' : 'text-gray-500'}`}>
                    {item.name}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-3xl font-black text-[#006837] font-brand uppercase tracking-tighter">
                Elige tu Proteína
              </h3>
              <div className="mt-2 flex justify-center gap-2 h-6">
                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-colors ${selections.protein ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {selections.protein ? '1/1 Seleccionada' : '0/1 Seleccionada'}
                </span>
                <AnimatePresence>
                  {selections.extraProtein && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      className="bg-[#FFCC00] text-[#006837] px-3 py-1 rounded-full text-[9px] font-bold uppercase"
                    >
                      1 Extra +${PRICES.EXTRA_PROTEIN.toFixed(2)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-12">
              {menu.proteins.filter(p => productType === 'SANDWICH' ? !p.name.toLowerCase().includes('plancha') : true).map(item => {
                const isMain = selections.protein?.id === item.id;
                const isExtra = selections.extraProtein?.id === item.id;

                const handleSetBase = () => {
                  if (item.stock_status === false) return;
                  setSelections(prev => ({ ...prev, protein: item }));
                };

                const toggleExtra = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (item.stock_status === false) return;
                  setSelections(prev => ({
                    ...prev,
                    extraProtein: prev.extraProtein?.id === item.id ? null : item
                  }));
                };

                let borderClass = 'border-white bg-white shadow-sm';
                // Logic based on User Request:
                // 1. Double Protein (Main && Extra): Top-Left = "Proteína Doble"
                // 2. Different Extra (!Main && Extra): Top-Left = "Extra", Yellow Border
                // 3. Main Only (Main && !Extra): Top-Left = "Principal", Green Border

                if (isMain && isExtra) {
                  borderClass = 'border-[#006837] bg-white ring-4 ring-[#006837]/20';
                } else if (isMain) {
                  borderClass = 'border-[#006837] bg-white ring-4 ring-[#006837]/10';
                } else if (isExtra) {
                  borderClass = 'border-[#FFCC00] bg-white ring-4 ring-[#FFCC00]/20';
                }

                return (
                  <motion.div
                    key={item.id}
                    whileTap={item.stock_status !== false ? { scale: 0.95 } : {}}
                    onClick={handleSetBase}
                    className={`relative flex flex-col items-center border-[4px] rounded-[2rem] transition-all overflow-hidden ${item.stock_status === false ? 'cursor-not-allowed border-gray-100 bg-gray-50' : `cursor-pointer ${borderClass}`}`}
                  >
                    <div className="w-full aspect-square bg-gray-50 relative">
                      <img
                        src={item.image}
                        className={`w-full h-full object-cover transition-all ${item.stock_status === false ? 'opacity-50 grayscale' : ''}`}
                        alt={item.name}
                      />

                      {item.stock_status === false && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <span className="bg-[#EF4444] text-white text-[10px] font-black px-3 py-1 rounded shadow-sm uppercase tracking-wider">AGOTADO</span>
                        </div>
                      )}

                      {/* BOTÓN DE EXTRA (+) */}
                      <AnimatePresence>
                        {selections.protein && (
                          <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            onClick={toggleExtra}
                            className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 z-10 ${isExtra ? 'bg-[#FFCC00] border-white text-[#006837]' : 'bg-white border-gray-100 text-[#006837]'}`}
                          >
                            <svg className={`w-6 h-6 transition-transform ${isExtra ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" />
                            </svg>
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {/* BADGES SUPERIORES (Top-Left) */}
                      {isMain && isExtra && (
                        <div className="absolute top-2 left-2 bg-[#006837] text-white rounded-full px-2 py-0.5 text-[9px] font-black uppercase shadow-sm">Proteína Doble</div>
                      )}

                      {isMain && !isExtra && (
                        <div className="absolute top-2 left-2 bg-[#006837] text-white rounded-full px-2 py-0.5 text-[9px] font-black uppercase shadow-sm">Principal</div>
                      )}

                      {!isMain && isExtra && (
                        <div className="absolute top-2 left-2 bg-[#FFCC00] text-[#006837] rounded-full px-2 py-0.5 text-[9px] font-black uppercase shadow-sm">Extra</div>
                      )}
                    </div>

                    <div className={`p-4 w-full text-center text-sm font-black uppercase tracking-tight ${isMain ? 'text-[#006837]' : 'text-gray-500'}`}>
                      {item.name}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );

      case 3:
      case 4:
      case 5:
        const categoryKey = step === 3 ? 'extras' : step === 4 ? 'veggies' : 'sauces';
        const rawList = step === 3 ? menu.extras.items : step === 4 ? menu.veggies.items : menu.sauces.items;
        // Filter by available_for - if not defined, show for all product types
        const list = rawList.filter(item => {
          if (!item.available_for || item.available_for.length === 0) return true;
          return item.available_for.includes(productType);
        });

        // Dynamic Limits based on Product Type
        let limits = INCLUDED_LIMITS.sandwich;
        if (productType === 'SALAD') limits = INCLUDED_LIMITS.salad;
        if (productType === 'PIZZA') limits = INCLUDED_LIMITS.pizza;
        const limit = step === 3 ? limits.extras : step === 4 ? limits.veggies : limits.sauces;

        // Title changes for pizza
        const title = step === 3
          ? (productType === 'PIZZA' ? 'Embutidos' : 'Quesos y Embutidos')
          : step === 4 ? 'Vegetales' : 'Salsas';
        const extraPrice = getExtraPriceForCategory(categoryKey);
        const userSelectedList = selections[categoryKey] as SubItem[];

        // Count only non-premium items towards the included limit
        const nonPremiumSelected = userSelectedList.filter(i => i.category !== 'extra');

        // For Pizza, Parmesano counts towards the regular included limit for embutidos
        const currentCount = nonPremiumSelected.length;
        const isOverLimit = currentCount >= limit;

        // Count premium items (like Tocineta) - they're always paid extras
        const premiumSelected = userSelectedList.filter(i => i.category === 'extra');
        const premiumCount = premiumSelected.length;

        // Calculate total paid extras: premium items + non-premium items over limit
        const nonPremiumExtras = Math.max(0, currentCount - limit);
        const totalPaidExtras = premiumCount + nonPremiumExtras;
        const totalExtraCost = totalPaidExtras * extraPrice;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-4xl font-black text-[#006837] font-brand uppercase tracking-tighter">{title}</h3>
              <div className="mt-3 flex justify-center gap-2">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${currentCount >= limit ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                  {currentCount}/{limit} Incluidos
                </span>
                <AnimatePresence>
                  {totalPaidExtras > 0 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      className="bg-[#FFCC00] text-[#006837] px-4 py-1.5 rounded-full text-xs font-bold uppercase"
                    >
                      {totalPaidExtras} {totalPaidExtras === 1 ? 'Extra Activo' : 'Extras Activos'} +${totalExtraCost.toFixed(2)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Grid de items - Tocineta primero si existe, luego Parmesano, luego el resto */}
            <div className="grid grid-cols-2 gap-4 pb-12">
              {/* Primero renderizamos Tocineta si existe en step 3 */}
              {step === 3 && (() => {
                const tocineta = list.find(item => item.name?.toLowerCase().includes('tocineta') || item.name?.toLowerCase().includes('bacon'));
                if (!tocineta) return null;

                const itemInstances = userSelectedList.filter(i => i.id === tocineta.id);
                const itemCount = itemInstances.length;
                const isSelected = itemCount > 0;
                const isExtraPortion = itemCount > 1;
                const isPremiumItem = tocineta.category === 'extra';
                // Calculate index ONLY among non-premium items (Tocineta is premium so always paid)
                const nonPremiumList = userSelectedList.filter(i => i.category !== 'extra');
                const globalIndex = nonPremiumList.findIndex(i => i.id === tocineta.id);
                const isPaidItem = isSelected && (isPremiumItem || globalIndex >= limit);

                return (
                  <motion.div
                    key={tocineta.id}
                    whileTap={tocineta.stock_status !== false ? { scale: 0.98 } : {}}
                    onClick={() => tocineta.stock_status !== false && toggleItem(categoryKey, tocineta)}
                    className={`relative flex flex-col items-center rounded-[2rem] transition-all overflow-hidden ${tocineta.stock_status === false ? 'cursor-not-allowed border-[4px] border-gray-100 bg-white' : (isSelected ? 'cursor-pointer border-[4px] bg-white border-[#FFCC00] ring-4 ring-[#FFCC00]/20 shadow-lg' : 'cursor-pointer shadow-lg')}`}
                    style={!isSelected && tocineta.stock_status !== false ? {
                      padding: '4px',
                      background: 'linear-gradient(90deg, #006837, #FFCC00, #006837)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s ease-in-out infinite'
                    } : undefined}
                  >
                    <div className={`w-full flex flex-col ${!isSelected && tocineta.stock_status !== false ? 'bg-white rounded-[1.75rem] overflow-hidden' : 'bg-white rounded-[1.75rem] overflow-hidden'}`}>
                      {/* Premium badge - shows single or double price */}
                      {isPremiumItem && tocineta.stock_status !== false && (
                        <div className="absolute top-5 left-5 z-30 bg-gradient-to-r from-[#006837] to-[#004d29] text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg uppercase tracking-wider">
                          {isExtraPortion ? `⭐ Doble +$${(extraPrice * 2).toFixed(2)}` : `⭐ +$${extraPrice.toFixed(2)}`}
                        </div>
                      )}
                      <div className="w-full aspect-square bg-gray-50 relative">
                        <img
                          src={tocineta.image}
                          className={`w-full h-full object-cover transition-all ${tocineta.stock_status === false ? 'opacity-50 grayscale' : ''}`}
                          alt={tocineta.name}
                        />
                        {tocineta.stock_status === false && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <span className="bg-[#EF4444] text-white text-[10px] font-black px-3 py-1 rounded shadow-sm uppercase tracking-wider">AGOTADO</span>
                          </div>
                        )}
                        {/* BOTÓN DE EXTRA (+) para doble Tocineta */}
                        <AnimatePresence>
                          {isSelected && tocineta.stock_status !== false && (
                            <motion.button
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              onClick={(e) => toggleExtraPortion(e, categoryKey, tocineta)}
                              className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 ${isExtraPortion ? 'bg-red-500 border-white text-white' : 'bg-white border-gray-100 text-[#006837]'}`}
                            >
                              <svg className={`w-6 h-6 transition-transform ${isExtraPortion ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" />
                              </svg>
                            </motion.button>
                          )}
                        </AnimatePresence>
                        {/* Checkmark when selected */}
                        {isSelected && tocineta.stock_status !== false && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2 w-8 h-8 bg-[#FFCC00] rounded-full flex items-center justify-center shadow-lg"
                          >
                            <span className="text-[#006837] text-lg font-bold">✓</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="p-4 w-full text-center bg-white">
                        <p className={`text-xs font-black uppercase tracking-tight leading-tight transition-colors ${isSelected ? 'text-[#006837]' : 'text-gray-500'}`}>{tocineta.name}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Queso Parmesano Card - Second in grid on step 3 (ONLY FOR SANDWICH/SALAD) */}
              {step === 3 && productType !== 'PIZZA' && (() => {
                const isParmesanoSelected = selections.hasParmesan;
                const labelColor = isParmesanoSelected ? 'text-[#006837]' : 'text-gray-500';

                // [NEW] Check if Parmesano is available in the menu options
                // Look for an item named "Queso Parmesano" (case insensitive)
                const parmesanItem = list.find(i => i.name.toLowerCase().includes('parmesano'));
                const isStockAvailable = parmesanItem ? parmesanItem.stock_status !== false : true;

                return (
                  <motion.div
                    key="parmesano-card"
                    whileTap={isStockAvailable ? { scale: 0.98 } : {}}
                    onClick={() => isStockAvailable && setSelections(prev => ({ ...prev, hasParmesan: !prev.hasParmesan }))}
                    className={`relative flex flex-col items-center rounded-[2rem] transition-all overflow-hidden ${isStockAvailable ? 'cursor-pointer' : 'cursor-not-allowed border-gray-100 bg-gray-50'} border-[4px] bg-white ${isParmesanoSelected && isStockAvailable ? 'border-[#006837] ring-4 ring-[#006837]/5 shadow-lg' : 'border-white shadow-sm'}`}
                  >
                    <div className={`w-full flex flex-col bg-white rounded-[1.75rem] overflow-hidden ${!isStockAvailable ? 'opacity-75' : ''}`}>
                      {/* Badge: Gratis for sandwich/salad */}
                      {isStockAvailable && (
                        <div className="absolute top-5 left-5 z-30 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg uppercase tracking-wider bg-gradient-to-r from-green-500 to-green-600">
                          ⭐ Gratis
                        </div>
                      )}

                      <div className="w-full aspect-square bg-gray-50 relative">
                        <img
                          src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/parmesano-queso.jpg"
                          className={`w-full h-full object-cover transition-all ${selections.hasParmesan ? '' : 'opacity-70'} ${!isStockAvailable ? 'grayscale opacity-50' : ''}`}
                          alt="Queso Parmesano"
                        />

                        {/* AGOTADO Badge */}
                        {!isStockAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <span className="bg-[#EF4444] text-white text-[10px] font-black px-3 py-1 rounded shadow-sm uppercase tracking-wider">AGOTADO</span>
                          </div>
                        )}

                        {/* Checkmark when selected */}
                        {isParmesanoSelected && isStockAvailable && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2 w-8 h-8 bg-[#FFCC00] rounded-full flex items-center justify-center shadow-lg"
                          >
                            <span className="text-[#006837] text-lg font-bold">✓</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="p-4 w-full text-center bg-white">
                        <p className={`text-xs font-black uppercase tracking-tight leading-tight transition-colors ${labelColor}`}>Queso Parmesano</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
              {list.filter(item => !(item.name?.toLowerCase().includes('tocineta') || item.name?.toLowerCase().includes('bacon') || item.name?.toLowerCase().includes('parmesano'))).map((item) => {
                const itemInstances = userSelectedList.filter(i => i.id === item.id);
                const itemCount = itemInstances.length;
                const isSelected = itemCount > 0;
                const isExtraPortion = itemCount > 1;

                // Premium item styling (category 'extra' like Tocineta)
                const isPremiumItem = item.category === 'extra';

                // Calculate index ONLY among non-premium items
                const nonPremiumList = userSelectedList.filter(i => i.category !== 'extra');

                // For items with multiple portions, we need to count how many are paid
                // Find ALL indices of this item in the non-premium list
                const itemIndicesInNonPremium = nonPremiumList.reduce((indices, i, idx) => {
                  if (i.id === item.id) indices.push(idx);
                  return indices;
                }, [] as number[]);

                // Count how many portions are paid (index >= limit)
                const paidPortions = isPremiumItem ? itemCount : itemIndicesInNonPremium.filter(idx => idx >= limit).length;
                const isPaidItem = isSelected && paidPortions > 0;

                // Color de borde y estilo
                let borderClass = 'border-white shadow-sm';
                let labelColor = 'text-gray-500';
                let useShimmerBorder = false;

                // Premium items get animated shimmer border
                if (isPremiumItem) {
                  useShimmerBorder = true;
                  labelColor = 'text-[#006837]';
                }

                if (isSelected && !isPremiumItem) {
                  if (isPaidItem) {
                    borderClass = 'border-[#FFCC00] ring-4 ring-[#FFCC00]/20';
                    labelColor = 'text-[#006837]';
                  } else {
                    borderClass = 'border-[#006837] ring-4 ring-[#006837]/5';
                    labelColor = 'text-[#006837]';
                  }
                }
                // else if (isOverLimit) block REMOVED to prevent dimming

                return (
                  <motion.div
                    key={item.id}
                    whileTap={item.stock_status !== false ? { scale: 0.98 } : {}}
                    onClick={() => item.stock_status !== false && toggleItem(categoryKey, item)}
                    className={`relative flex flex-col items-center rounded-[2rem] transition-all overflow-hidden ${item.stock_status === false ? 'cursor-not-allowed border-[4px] border-gray-100 bg-white' : (useShimmerBorder ? 'cursor-pointer shadow-lg' : `cursor-pointer border-[4px] bg-white ${borderClass}`)}`}
                    style={useShimmerBorder && item.stock_status !== false ? {
                      padding: '4px',
                      background: 'linear-gradient(90deg, #006837, #FFCC00, #006837)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s ease-in-out infinite'
                    } : undefined}
                  >
                    {/* Inner white container for shimmer border effect */}
                    <div className={`w-full flex flex-col ${useShimmerBorder && item.stock_status !== false ? 'bg-white rounded-[1.75rem] overflow-hidden' : ''}`}>
                      {/* Premium badge for 'extra' category items - ALWAYS shows price */}
                      {isPremiumItem && item.stock_status !== false && (
                        <div className="absolute top-5 left-5 z-30 bg-gradient-to-r from-[#006837] to-[#004d29] text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg uppercase tracking-wider">
                          ⭐ +${extraPrice.toFixed(2)}
                        </div>
                      )}
                      <div className="w-full aspect-square bg-gray-50 relative">
                        <img
                          src={item.image}
                          className={`w-full h-full object-cover transition-all ${item.stock_status === false ? 'opacity-50 grayscale' : ''}`}
                          alt={item.name}
                        />

                        {item.stock_status === false && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <span className="bg-[#EF4444] text-white text-[10px] font-black px-3 py-1 rounded shadow-sm uppercase tracking-wider">AGOTADO</span>
                          </div>
                        )}

                        {/* BOTÓN DE EXTRA (+) */}
                        <AnimatePresence>
                          {isSelected && item.stock_status !== false && (
                            <motion.button
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              onClick={(e) => toggleExtraPortion(e, categoryKey, item)}
                              className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 ${isExtraPortion ? 'bg-red-500 border-white text-white' : 'bg-white border-gray-100 text-[#006837]'}`}
                            >
                              <svg className={`w-6 h-6 transition-transform ${isExtraPortion ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" />
                              </svg>
                            </motion.button>
                          )}
                        </AnimatePresence>

                        {/* BADGE DE COSTO EXTRA - Only show when there are actually paid portions */}
                        {isSelected && item.stock_status !== false && paidPortions > 0 && !isPremiumItem && (
                          <div className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase bg-gradient-to-r from-[#FFCC00] to-[#e6b800] text-[#006837]`}>
                            {paidPortions === 2
                              ? `Extra Doble +$${(extraPrice * 2).toFixed(2)}`
                              : `Extra +$${extraPrice.toFixed(2)}`
                            }
                          </div>
                        )}

                        {/* BADGE DE X2 / EXTRA ELIMINADO (Ya se muestra arriba) */}
                      </div>

                      <div className="p-4 w-full text-center bg-white">
                        <p className={`text-xs font-black uppercase tracking-tight leading-tight transition-colors ${labelColor}`}>{item.name}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );

      case 6:
        // Notes step (only for SANDWICH, SALAD, PIZZA)
        return (
          <div className="space-y-6 text-center">
            <h3 className="text-4xl font-black text-[#006837] font-brand tracking-tighter uppercase">
              ¿Deseas agregar una nota?
            </h3>
            <p className="text-gray-600 text-sm">
              Puedes agregar indicaciones especiales para tu pedido
            </p>

            <div className="bg-white p-6 rounded-[3rem] shadow-xl border-t-8 border-[#FFCC00]">
              <textarea
                value={selections.customNote}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setSelections(prev => ({ ...prev, customNote: e.target.value }));
                  }
                }}
                placeholder="Ej: Sin cebolla, extra tomate, bien tostado..."
                className="w-full px-4 py-3 border-2 border-[#006837] rounded-2xl focus:outline-none focus:border-[#FFCC00] resize-none font-medium text-gray-800 min-h-[120px]"
                maxLength={200}
              />
              <div className="text-right mt-2">
                <span className={`text-xs font-bold ${selections.customNote.length >= 180 ? 'text-red-500' : 'text-gray-400'}`}>
                  {selections.customNote.length}/200
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                className="w-full bg-[#006837] text-white font-black py-5 rounded-3xl text-xl shadow-2xl uppercase tracking-tighter"
              >
                {selections.customNote ? 'Continuar con nota' : 'Continuar sin nota'}
              </motion.button>
            </div>
          </div>
        );

      case 7:
        // Summary (was case 6)
        return (
          <div className="space-y-8 text-center">
            <h3 className="text-4xl font-black text-[#006837] font-brand tracking-tighter uppercase">¿LISTO PARA COMER?</h3>
            <div className="bg-white p-6 rounded-[3rem] shadow-xl border-t-8 border-[#FFCC00] space-y-6 text-left">
              <div className="text-center pb-4 border-b border-gray-100">
                <span className="bg-[#006837] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-2 inline-block">
                  {productType === 'SANDWICH' ? `Sandwich ${productSize}` : (productType === 'PIZZA' ? 'Pizza' : 'Ensalada')}
                </span>
                <p className="text-5xl font-black text-[#006837] tracking-tighter">${currentTotalPrice.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Only show protein/bread for non-pizza */}
                {productType !== 'PIZZA' && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Base</span>
                    <p className="font-black text-[#006837] uppercase text-sm">{selections.protein?.name}</p>
                    {selections.extraProtein && <p className="text-[10px] font-bold text-[#FFCC00] uppercase">+ Extra {selections.extraProtein.name}</p>}
                  </div>
                )}
                {selections.bread && productType !== 'PIZZA' && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Pan</span>
                    <p className="font-black text-[#006837] uppercase text-sm">{selections.bread.name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t text-xs font-medium text-gray-500">
                {(() => {
                  const formatList = (items: SubItem[]) => {
                    if (items.length === 0) return '-';
                    const counts: { [key: string]: number } = {};
                    items.forEach(i => counts[i.name] = (counts[i.name] || 0) + 1);
                    return Object.entries(counts).map(([name, count]) => `${name}${count > 1 ? ' (Doble)' : ''}`).join(', ');
                  };
                  return (
                    <>
                      <p><span className="text-[#006837] font-black uppercase mr-1">{productType === 'PIZZA' ? 'Embutidos:' : 'Quesos/Emb:'}</span> {formatList(selections.extras)}</p>
                      <p><span className="text-[#006837] font-black uppercase mr-1">Vegetales:</span> {formatList(selections.veggies)}</p>
                      {productType !== 'PIZZA' && (
                        <p><span className="text-[#006837] font-black uppercase mr-1">Salsas:</span> {formatList(selections.sauces)}</p>
                      )}
                      {/* Salt & Pepper */}
                      {(selections.hasSalt || selections.hasPepper) && (
                        <p className="text-orange-500 font-bold">
                          <span className="mr-1">🧂</span>
                          {[selections.hasSalt && 'Sal', selections.hasPepper && 'Pimienta'].filter(Boolean).join(' + ')}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <motion.button whileTap={{ scale: 0.95 }} onClick={handlePagarAhora} className="w-full bg-[#006837] text-white font-black py-6 rounded-3xl text-xl shadow-2xl uppercase tracking-tighter">Agregar al Carrito 🛒</motion.button>
              <button onClick={() => setStep(0)} className="text-[#006837] font-black uppercase text-[10px] tracking-widest border-b-2 border-transparent hover:border-[#006837] transition-all">Empezar de cero</button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div id="sub-builder-header" className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-40">
        {/* Back Button - Goes to previous step or exits to menu */}
        {(() => {
          let minStep = 1;
          if (productType === 'SALAD') minStep = 2;
          if (productType === 'PIZZA') minStep = 3;
          const isFirstStep = step <= minStep;

          return (
            <button
              onClick={() => {
                if (isFirstStep) {
                  // Use onExit to go home without opening cart, fallback to onFinish
                  if (onExit) {
                    onExit();
                  } else {
                    onFinish();
                  }
                } else {
                  prevStep();
                }
              }}
              className="p-2 rounded-xl bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <svg className="w-6 h-6 text-[#006837]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          );
        })()}
        <div className="flex-grow flex flex-col justify-center h-full">
          {(() => {
            // Calculate displayed step and total based on product type
            let displayStep = step;
            let totalSteps = 6;

            if (productType === 'PIZZA') {
              // Pizza: step 3 = display 1, step 4 = display 2, step 6 = display 3
              totalSteps = 3;
              if (step === 3) displayStep = 1;
              else if (step === 4) displayStep = 2;
              else if (step === 6) displayStep = 3;
            } else if (productType === 'SALAD') {
              // Salad: starts at step 2, so step 2-6 maps to 1-5
              totalSteps = 5;
              displayStep = step - 1;
            }

            return (
              <>
                <div className="flex justify-between items-center mb-1 px-1">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Paso {displayStep}/{totalSteps}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full">
                  <motion.div animate={{ width: `${(displayStep / totalSteps) * 100}%` }} className="h-full bg-[#FFCC00]" />
                </div>
              </>
            );
          })()}
        </div>
        <div id="sub-builder-price" className="bg-[#006837] text-white px-4 py-1.5 rounded-full font-black text-sm shadow-lg">${currentTotalPrice.toFixed(2)}</div>
      </div>

      <div className="flex-grow p-6 pb-40">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div id="sub-builder-options" key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full max-w-lg mx-auto">
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div id="sub-builder-nav" className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pointer-events-none z-30">
        <div className="max-w-lg mx-auto pointer-events-auto">
          {step < 6 && (
            <div className="flex gap-3">
              {productType === 'SANDWICH' && (
                <div className="bg-white rounded-3xl p-1 shadow-xl flex items-center h-[72px] min-w-[140px] border-4 border-gray-100">
                  <button onClick={() => setProductSize('15cm')} className={`flex-1 h-full rounded-[20px] font-black text-xs uppercase transition-all flex flex-col items-center justify-center leading-tight ${productSize === '15cm' ? 'bg-[#FFCC00] text-[#006837]' : 'text-gray-400'}`}>
                    <span>15 cm</span>
                    <span className="text-[9px] opacity-70">Pequeño</span>
                  </button>
                  <button onClick={() => setProductSize('30cm')} className={`flex-1 h-full rounded-[20px] font-black text-xs uppercase transition-all flex flex-col items-center justify-center leading-tight ${productSize === '30cm' ? 'bg-[#006837] text-white' : 'text-gray-400'}`}>
                    <span>30 cm</span>
                    <span className="text-[9px] opacity-70">Grande</span>
                  </button>
                </div>
              )}
              <motion.button whileTap={{ scale: 0.95 }} onClick={nextStep} disabled={!canGoNext()} className={`flex-grow py-5 rounded-3xl font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-tighter h-[72px] ${canGoNext() ? 'bg-[#FFCC00] text-[#006837]' : 'bg-gray-200 text-gray-400'} ${step === 0 ? 'hidden' : ''}`}>
                {/* Pizza goes from step 4 to 6 (skips 5), shows 'Resumen' at step 6 */}
                {step === 6 || (step === 4 && productType === 'PIZZA') ? 'Resumen' : 'Siguiente'}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M9 5l7 7-7 7" /></svg>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL "QUIEN SE LO COME" - NOMBRE OBLIGATORIO */}
      {createPortal(
        <AnimatePresence>
          {showNameModal && (
            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                  // Shake animation when clicking outside
                  setShakeModal(true);
                  setTimeout(() => setShakeModal(false), 500);
                }}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: -20 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                  x: shakeModal ? [0, -10, 10, -10, 10, -5, 5, 0] : 0
                }}
                transition={{
                  x: { duration: 0.4 }
                }}
                exit={{ scale: 0.9, opacity: 0, y: -20 }}
                className="bg-white rounded-[2rem] p-6 w-full max-w-sm relative z-10 shadow-2xl border-4 border-[#FFCC00]"
              >
                <div className="text-center space-y-4">
                  <div className="text-5xl mb-2">🤔</div>
                  <h3 className="text-2xl font-black text-[#006837] font-brand uppercase tracking-tighter leading-tight">
                    ¿Quién se va a comer {productType === 'PIZZA' ? 'esta pizza' : (productType === 'SALAD' ? 'esta ensalada' : 'este pan')}?
                  </h3>
                  <p className="text-sm text-gray-400 font-bold uppercase">
                    Escribe el nombre para identificarlo en la entrega
                  </p>

                  <input
                    type="text"
                    value={tempCustomerName}
                    onChange={(e) => setTempCustomerName(e.target.value)}
                    placeholder="Ej. Angelica"
                    autoFocus
                    className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-center text-lg font-bold text-[#006837] focus:border-[#006837] focus:outline-none placeholder-gray-300 uppercase ${shakeModal ? 'border-red-400' : 'border-gray-200'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempCustomerName.trim().length > 0) confirmName();
                    }}
                  />
                  {shakeModal && (
                    <p className="text-red-500 text-xs font-bold uppercase animate-pulse">⚠️ El nombre es obligatorio</p>
                  )}

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={confirmName}
                      disabled={tempCustomerName.trim().length === 0}
                      className={`w-full py-4 rounded-xl font-black uppercase tracking-tighter shadow-lg transition-all ${tempCustomerName.trim().length > 0 ? 'bg-[#006837] text-white hover:scale-105' : 'bg-gray-200 text-gray-400'}`}
                    >
                      Confirmar Nombre
                    </button>
                    <button
                      onClick={() => {
                        setShowNameModal(false);
                        prevStep();
                      }}
                      className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-[#006837] flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Volver
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL "SAL Y PIMIENTA" */}
      {createPortal(
        <AnimatePresence>
          {showSaltPepperModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => { }}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative z-10 shadow-2xl border-4 border-[#006837]"
              >
                <div className="text-center space-y-4">
                  <div className="text-5xl mb-2">🧂</div>
                  <h3 className="text-2xl font-black text-[#006837] font-brand uppercase tracking-tighter leading-tight">
                    ¿Quieres agregar?
                  </h3>
                  <p className="text-sm text-gray-500 font-bold">
                    Selecciona si deseas sal y/o pimienta en tu {productType === 'SALAD' ? 'ensalada' : 'sub'}
                  </p>

                  <div className="flex gap-4 py-4">
                    {/* Salt Toggle */}
                    <button
                      onClick={() => setSelections(prev => ({ ...prev, hasSalt: !prev.hasSalt }))}
                      className={`flex-1 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-4 overflow-hidden ${selections.hasSalt
                        ? 'border-[#006837] ring-4 ring-[#006837]/20 shadow-lg'
                        : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="w-full aspect-square bg-gray-50 relative">
                        <img
                          src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/otros/sal-a.jpg"
                          alt="Sal"
                          className="w-full h-full object-cover"
                        />
                        {selections.hasSalt && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2 w-8 h-8 bg-[#FFCC00] rounded-full flex items-center justify-center shadow-lg"
                          >
                            <span className="text-[#006837] text-lg font-bold">✓</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="py-3 bg-white w-full">
                        <span className={`font-black uppercase text-xs ${selections.hasSalt ? 'text-[#006837]' : 'text-gray-400'}`}>Sal</span>
                      </div>
                    </button>

                    {/* Pepper Toggle */}
                    <button
                      onClick={() => setSelections(prev => ({ ...prev, hasPepper: !prev.hasPepper }))}
                      className={`flex-1 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-4 overflow-hidden ${selections.hasPepper
                        ? 'border-[#006837] ring-4 ring-[#006837]/20 shadow-lg'
                        : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="w-full aspect-square bg-gray-50 relative">
                        <img
                          src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/otros/pimienta-a.jpg"
                          alt="Pimienta"
                          className="w-full h-full object-cover"
                        />
                        {selections.hasPepper && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2 w-8 h-8 bg-[#FFCC00] rounded-full flex items-center justify-center shadow-lg"
                          >
                            <span className="text-[#006837] text-lg font-bold">✓</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="py-3 bg-white w-full">
                        <span className={`font-black uppercase text-xs ${selections.hasPepper ? 'text-[#006837]' : 'text-gray-400'}`}>Pimienta</span>
                      </div>
                    </button>
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setShowSaltPepperModal(false);
                        // Continue to next step
                        setDirection(1);
                        setStep(6);
                      }}
                      className="w-full py-4 rounded-xl font-black uppercase tracking-tighter shadow-lg bg-[#006837] text-white hover:scale-105 transition-transform"
                    >
                      Continuar al Resumen
                    </button>
                    <button
                      onClick={() => {
                        setShowSaltPepperModal(false);
                      }}
                      className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-[#006837] flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Volver a Salsas
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL PESTO PARA PIZZA */}
      {createPortal(
        <AnimatePresence>
          {showPestoModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => { }}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative z-10 shadow-2xl border-4 border-[#006837]"
              >
                <div className="text-center space-y-4">
                  <div className="text-5xl mb-2">🌿</div>
                  <h3 className="text-2xl font-black text-[#006837] font-brand uppercase tracking-tighter leading-tight">
                    ¿Agregar Pesto?
                  </h3>
                  <p className="text-sm text-gray-500 font-bold">
                    Dale un toque especial a tu pizza con nuestra deliciosa salsa pesto
                  </p>

                  <div className="py-4">
                    <button
                      onClick={() => setSelections(prev => ({ ...prev, hasPesto: !prev.hasPesto }))}
                      className={`w-full rounded-2xl flex flex-col items-center justify-center transition-all border-4 overflow-hidden ${selections.hasPesto
                        ? 'border-[#006837] ring-4 ring-[#006837]/20 shadow-lg'
                        : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="w-full aspect-[2/1] bg-gray-50 relative">
                        <img
                          src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/pesto.jpg"
                          alt="Pesto"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-[#006837] to-[#004d29] text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                          +$1.00
                        </div>
                        {selections.hasPesto && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute bottom-2 right-2 w-10 h-10 bg-[#FFCC00] rounded-full flex items-center justify-center shadow-lg"
                          >
                            <span className="text-[#006837] text-xl font-bold">✓</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="py-4 bg-white w-full">
                        <span className={`font-black uppercase text-sm ${selections.hasPesto ? 'text-[#006837]' : 'text-gray-400'}`}>
                          {selections.hasPesto ? '¡Pesto Agregado!' : 'Toca para agregar'}
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setShowPestoModal(false);
                        setDirection(1);
                        setStep(6);
                      }}
                      className="w-full py-4 rounded-xl font-black uppercase tracking-tighter shadow-lg bg-[#006837] text-white hover:scale-105 transition-transform"
                    >
                      {selections.hasPesto ? 'Continuar al Resumen' : 'No, Gracias'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPestoModal(false);
                      }}
                      className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-[#006837] flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Volver a Vegetales
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL "NECESITAS AYUDA?" (TOUR) */}
      {createPortal(
        <AnimatePresence>
          {showHelpModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => { }}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative z-10 shadow-2xl border-4 border-[#006837]"
              >
                <div className="text-center space-y-4">
                  <div className="text-5xl mb-2">👋</div>
                  <h3 className="text-2xl font-black text-[#006837] font-brand uppercase tracking-tighter leading-tight">
                    ¿Es tu primera vez?
                  </h3>
                  <p className="text-sm text-gray-500 font-bold">
                    ¿Te gustaría una guía rápida para armar el Sub perfecto o prefieres hacerlo solo?
                  </p>

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={() => handleHelpChoice(true)}
                      className="w-full py-4 rounded-xl font-black uppercase tracking-tighter shadow-lg bg-[#FFCC00] text-[#006837] hover:scale-105 transition-transform"
                    >
                      Sí, necesito ayuda 🙋‍♂️
                    </button>
                    <button
                      onClick={() => handleHelpChoice(false)}
                      className="w-full py-4 rounded-xl font-black uppercase tracking-tighter shadow-sm bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                    >
                      Puedo armarlo solo 😎
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL ITEMS NO DISPONIBLES */}
      {createPortal(
        <AnimatePresence>
          {unavailableItems.length > 0 && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setUnavailableItems([])}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative z-10 shadow-2xl border-4 border-red-500"
              >
                <div className="text-center space-y-4">
                  <div className="text-5xl mb-2">😔</div>
                  <h3 className="text-xl font-black text-red-600 font-brand uppercase tracking-tighter leading-tight">
                    Lo sentimos
                  </h3>
                  <p className="text-sm text-gray-500 font-bold">
                    Los siguientes ingredientes ya no están disponibles:
                  </p>

                  <div className="bg-red-50 rounded-xl p-4 space-y-2">
                    {unavailableItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-red-200">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <span className="font-bold text-gray-800">{item.name}</span>
                        <span className="ml-auto text-xs font-bold text-red-500 uppercase">Agotado</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400">
                    Este producto ya no está disponible.
                  </p>

                  <button
                    onClick={() => {
                      setUnavailableItems([]);
                      if (onRefreshMenu) onRefreshMenu();
                      if (onExit) onExit();
                    }}
                    className="w-full py-4 rounded-xl font-black uppercase tracking-tighter shadow-lg bg-[#006837] text-white hover:brightness-110 transition-all"
                  >
                    Volver al Menú
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default SubBuilder;
