
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import MenuDisplay from './components/MenuDisplay';
import SubBuilder from './components/SubBuilder';
import Footer from './components/Footer';
import ProposalOverview from './components/ProposalOverview';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import AdminDashboard from './components/AdminDashboard';
import KitchenDisplay from './components/KitchenDisplay';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import { ViewMode, CustomizedSub, SubItem, Order, OrderStatus, Banner, ProductType } from './types';
import { PROTEINS, BREADS, EXTRAS, VEGETABLES, SAUCES } from './constants';
import { api } from './services/api';

// UUID Fallback for non-secure contexts (HTTP)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewMode>(ViewMode.HOME);
  const [cart, setCart] = useState<CustomizedSub[]>(() => {
    // Load cart from localStorage on init
    const savedCart = localStorage.getItem('subday_cart');
    const savedTimestamp = localStorage.getItem('subday_cart_timestamp');

    if (savedCart && savedTimestamp) {
      const timestamp = parseInt(savedTimestamp, 10);
      const now = Date.now();
      const hoursPassed = (now - timestamp) / (1000 * 60 * 60);

      // If more than 24 hours have passed, clear the cart
      if (hoursPassed >= 24) {
        localStorage.removeItem('subday_cart');
        localStorage.removeItem('subday_cart_timestamp');
        return [];
      }
      return JSON.parse(savedCart);
    }
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [unavailableItems, setUnavailableItems] = useState<string[]>([]); // Track unavailable items
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [autoShowBeverages, setAutoShowBeverages] = useState(false); // Auto-open beverages panel
  const [autoScrollToBottom, setAutoScrollToBottom] = useState(false); // Auto-scroll cart to bottom
  const [preselectedProtein, setPreselectedProtein] = useState<SubItem | null>(null);
  const [builderInitialType, setBuilderInitialType] = useState<ProductType>('SANDWICH'); // [NEW]
  const [isComboMode, setIsComboMode] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Global State for "Simulated Backend"
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('subday_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoading, setIsLoading] = useState(true);

  const [menuProteins, setMenuProteins] = useState(PROTEINS);
  const [menuBreads, setMenuBreads] = useState(BREADS);
  const [menuExtras, setMenuExtras] = useState(EXTRAS);
  const [menuVeggies, setMenuVeggies] = useState(VEGETABLES);
  const [menuSauces, setMenuSauces] = useState(SAUCES);
  const [menuOthers, setMenuOthers] = useState<SubItem[]>([]); // [NEW] For Tequeños, Pizza, etc.
  const [menuBeverages, setMenuBeverages] = useState<SubItem[]>([]); // [NEW] For beverages
  const [menuDesserts, setMenuDesserts] = useState<SubItem[]>([]); // [NEW] For desserts
  const [menuCoffee, setMenuCoffee] = useState<SubItem[]>([]); // [NEW] For coffee variants
  const [mainProducts, setMainProducts] = useState<any[]>([]); // [NEW] Main menu cards from DB

  // Staff Authentication
  const [staffUser, setStaffUser] = useState<any>(() => {
    const saved = localStorage.getItem('subday_staff');
    return saved ? JSON.parse(saved) : null;
  });

  // Business Hours State - Per day schedule
  type DaySchedule = { open: string; close: string; closed: boolean };
  const [businessHours, setBusinessHours] = useState<{
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
    enabled: boolean;
  } | null>(null);

  // Check if currently open
  const isOpen = (): boolean => {
    if (!businessHours || !businessHours.enabled) return true;

    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Sunday, 6 = Saturday
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const todayKey = dayKeys[dayIndex];
    const todayHours = businessHours[todayKey];

    if (todayHours.closed) return false;

    const [openH, openM] = todayHours.open.split(':').map(Number);
    const [closeH, closeM] = todayHours.close.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  };

  useEffect(() => {
    localStorage.setItem('subday_orders', JSON.stringify(orders));
  }, [orders]);

  // Fetch Menu from Supabase
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [allItems, activeBanners, products, hours] = await Promise.all([
          api.getMenuItems(),
          api.getBanners(true).catch(() => []),
          api.getMainProducts().catch(() => []),
          api.getSettings('business_hours').catch(() => null)
        ]);

        // Distribute by category
        const proteins = allItems.filter(i => i.category === 'protein');
        const breads = allItems.filter(i => i.category === 'bread');
        const cheese_cold_cut = allItems.filter(i => i.category === 'cheese_cold_cut');
        const extras_premium = allItems.filter(i => i.category === 'extra');
        const veggies = allItems.filter(i => i.category === 'veggie');
        const sauces = allItems.filter(i => i.category === 'sauce');
        const others = allItems.filter(i => i.category === 'other');
        const beverages = allItems.filter(i => i.category === 'beverage');
        const desserts = allItems.filter(i => i.category === 'dessert');
        const coffee = allItems.filter(i => i.category === 'coffee');

        if (proteins.length > 0) setMenuProteins(proteins);
        const availableOthers = [...others, ...beverages].filter(i => i.stock_status !== false);
        if (availableOthers.length > 0) setMenuOthers(availableOthers);
        if (beverages.length > 0) setMenuBeverages(beverages.filter(b => b.stock_status !== false));
        if (desserts.length > 0) setMenuDesserts(desserts.filter(d => d.stock_status !== false));
        if (coffee.length > 0) setMenuCoffee(coffee.filter(c => c.stock_status !== false));
        if (breads.length > 0) setMenuBreads({ title: 'Panes', items: breads });
        const allExtras = [...cheese_cold_cut, ...extras_premium];
        if (allExtras.length > 0) setMenuExtras({ title: 'Quesos y Embutidos', items: allExtras });
        if (veggies.length > 0) setMenuVeggies({ title: 'Vegetales', items: veggies });
        if (sauces.length > 0) setMenuSauces({ title: 'Salsas', items: sauces });

        setBanners(activeBanners || []);
        if (!activeBanners || activeBanners.length === 0) {
          setTimeout(async () => {
            try {
              const retryBanners = await api.getBanners(true);
              if (retryBanners && retryBanners.length > 0) setBanners(retryBanners);
            } catch (_) { /* silent retry */ }
          }, 3000);
        }

        // Set Main Products
        setMainProducts(products || []);

        // Preload All Images (Menu + Banners)
        const allImages = [
          ...allItems.map(i => i.image),
          ...(activeBanners || []).map(b => b.image_url),
          ...(activeBanners || []).map(b => b.mobile_image_url)
        ];
        preloadImages(allImages);

        // Set Business Hours
        if (hours) setBusinessHours(hours);

      } catch (e) {
        console.error('Error fetching menu:', e);
      }
    };

    fetchMenu();

    // FORCE SPLASH SCREEN FOR 4 SECONDS
    // FORCE SPLASH SCREEN FOR 2 SECONDS
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

  }, []);

  // [NEW] Asset Preloader to prevent lag
  const preloadImages = (urls: (string | undefined)[]) => {
    urls.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  };

  // Manejo de Rutas por Hash (#admin, #kitchen, #login)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (hash === '#login') {
        // Logout
        localStorage.removeItem('subday_staff');
        setStaffUser(null);
        setView(ViewMode.HOME);
        window.location.hash = '';
        return;
      }

      if (hash === '#admin' || hash === '#kitchen') {
        const savedUser = localStorage.getItem('subday_staff');
        if (!savedUser) {
          // Not logged in - show login
          setView(ViewMode.LOGIN);
          return;
        }

        const user = JSON.parse(savedUser);
        setStaffUser(user);

        // Redirect based on role
        if (hash === '#admin') {
          if (user.role === 'cocina') {
            // Cocina can't access admin, redirect to kitchen
            window.location.hash = '#kitchen';
            setView(ViewMode.KITCHEN);
          } else {
            setView(ViewMode.ADMIN);
          }
        } else if (hash === '#kitchen') {
          setView(ViewMode.KITCHEN);
        }
      }
    };

    // Verificar al cargar
    handleHashChange();

    // Escuchar cambios
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('subday_cart', JSON.stringify(cart));
  }, [cart]);

  // Check availability of cart items after menu loads
  useEffect(() => {
    if (menuOthers.length > 0 && cart.length > 0) {
      const allMenuItemIds = new Set([
        ...menuOthers.map(i => i.id),
        ...menuProteins.map(i => i.id),
      ]);

      const unavailable: string[] = [];
      cart.forEach(item => {
        // For OTHER items, check if the protein (the actual item) is still available
        if (item.type === 'OTHER' && item.protein && !allMenuItemIds.has(item.protein.id)) {
          unavailable.push(item.id);
        }
      });

      if (unavailable.length > 0) {
        setUnavailableItems(unavailable);
        // Optionally auto-remove unavailable items
        // setCart(prev => prev.filter(item => !unavailable.includes(item.id)));
      } else {
        setUnavailableItems([]);
      }
    }
  }, [menuOthers, menuProteins, cart.length]);

  const addToCart = (sub: CustomizedSub) => {
    setCart(prev => [...prev, sub]);
    // Update timestamp when item is added
    localStorage.setItem('subday_cart_timestamp', Date.now().toString());
  };

  // For OTHER items: increment quantity if already in cart, otherwise add new
  const addOrIncrementOtherItem = (item: SubItem) => {
    const existingIndex = cart.findIndex(
      cartItem => cartItem.type === 'OTHER' && cartItem.protein?.id === item.id
    );

    if (existingIndex >= 0) {
      // Item exists - increment quantity
      const existingItem = cart[existingIndex];
      updateQuantity(existingItem.id, (existingItem.quantity || 1) + 1);
    } else {
      // Item doesn't exist - add new
      addToCart({
        id: generateUUID(),
        type: 'OTHER',
        size: 'N/A',
        protein: item,
        extras: [],
        veggies: [],
        sauces: [],
        price: item.price || 0,
        quantity: 1
      });
    }
    localStorage.setItem('subday_cart_timestamp', Date.now().toString());
    // Auto-scroll cart to bottom to show newly added item
    setAutoScrollToBottom(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setUnavailableItems([]);
    localStorage.removeItem('subday_cart');
    localStorage.removeItem('subday_cart_timestamp');
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  // Duplicate an item in cart with a new customer name
  const handleDuplicateItem = (item: CustomizedSub, newName: string) => {
    const duplicatedItem: CustomizedSub = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      customerName: newName
    };
    setCart(prev => [...prev, duplicatedItem]);
  };

  const handleFinishBuilding = () => {
    setPreselectedProtein(null); // Limpiar para el siguiente
    setIsComboMode(false);
    setView(ViewMode.HOME);
    setIsCartOpen(true);
    setAutoShowBeverages(true); // Auto-open beverages panel
  };

  // Exit builder without opening cart (for back button/gesture)
  const handleExitBuilder = () => {
    setPreselectedProtein(null);
    setIsComboMode(false);
    setView(ViewMode.HOME);
    // Don't open cart
  };

  const handleAddMore = () => {
    setIsCartOpen(false);
    setPreselectedProtein(null);
    setIsComboMode(false);
    setView(ViewMode.MENU); // Navigate to full menu instead of builder
  };

  const startComboBuild = (protein: SubItem, isCombo: boolean) => {
    setPreselectedProtein(protein);
    setIsComboMode(isCombo);
    setView(ViewMode.BUILDER);
  };

  const goToCheckout = () => {
    setIsCartOpen(false);
    setView(ViewMode.CHECKOUT);
  };

  const handleConfirmOrder = async (orderData: any) => {
    console.log("Confirming order with atomic creation...");
    try {
      // Format Data
      const rawCedula = orderData.customer.cedula || '';
      const formattedCedula = rawCedula ? `V${rawCedula.padStart(9, '0')}` : '';

      const rawPhone = orderData.customer.phone || '';
      const countryCode = orderData.customer.countryCode || '+58';
      let formattedPhoneNumber = rawPhone;

      // If Venezuela (+58) and starts with 0, remove the leadin 0
      if (countryCode === '+58' && formattedPhoneNumber.startsWith('0')) {
        formattedPhoneNumber = formattedPhoneNumber.substring(1);
      }

      // 0. Save/Update Customer in clientes table
      console.log("Saving customer to clientes table...");
      try {
        await api.createOrUpdateCustomer({
          firstName: orderData.customer.firstName,
          lastName: orderData.customer.lastName,
          cedula: formattedCedula,
          countryCode: countryCode,
          phone: formattedPhoneNumber,
          email: orderData.customer.email || ''
        });
        console.log("Customer saved successfully");
      } catch (customerError) {
        console.error("Failed to save customer, continuing with order:", customerError);
      }

      let proofUrl = orderData.paymentProof; // Fallback (or undefined)
      if (orderData.paymentFile) {
        console.log("Uploading payment proof...");
        try {
          proofUrl = await api.uploadPaymentProof(orderData.paymentFile);
        } catch (err) {
          console.error("Payment upload failed, proceeding without proof", err);
        }
      }

      const orderId = generateUUID();

      // Build order header (short_id is now generated by the database)
      const mappedOrder = {
        id: orderId,
        customer_info: {
          name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
          cedula: formattedCedula,
          phone: `${countryCode}${formattedPhoneNumber}`,
          email: orderData.customer.email,
          address: orderData.customer.address,
          location: orderData.customer.location
        },
        subtotal: orderData.total - orderData.deliveryPrice,
        delivery_fee: orderData.deliveryPrice,
        total_amount: orderData.total,
        currency: orderData.currency,
        payment_reference: orderData.reference,
        payment_proof: proofUrl,
        status: 'PENDING_PAYMENT',
        // Payment Verification Fields
        usd_payment_method: orderData.usd_payment_method || null,
        zelle_email: orderData.titular_name || orderData.zelle_email || null,
        cash_bill_amount: orderData.cash_bill_amount || null,
        // Delivery Method
        delivery_method: orderData.delivery_method || null,
        // MIXED Payment Fields
        usd_payment_amount: orderData.usd_payment_amount || null,
        usd_payment_proof: orderData.usd_payment_proof || null
      };

      // Build order items
      const minifyItem = (i: any) => i ? ({ id: i.id, name: i.name, price: i.price, category: i.category, image: i.image }) : null;
      const minifyList = (list: any[]) => list.map(minifyItem);

      const mappedItems = orderData.items.map((item: any) => {
        const qty = item.quantity || 1;
        let productId = 'other';
        if (item.type === 'PIZZA') productId = 'pizza';
        else if (item.type === 'SALAD') productId = 'salad';
        else if (item.type === 'SANDWICH') productId = item.size === '15cm' ? 'sandwich_15' : 'sandwich_30';

        let itemName = 'Item';
        if (item.type === 'PIZZA') itemName = 'Pizza Subday';
        else if (item.type === 'SALAD') itemName = item.protein?.name ? `Ensalada ${item.protein.name}` : 'Ensalada';
        else if (item.type === 'SANDWICH') itemName = item.protein?.name ? `Sub ${item.protein.name}` : 'Sub';
        else if (item.type === 'OTHER') itemName = item.name || item.protein?.name || 'Item';

        return {
          order_id: orderId,
          product_id: productId,
          name: itemName,
          unit_price: item.price,
          quantity: qty,
          total_price: item.price * qty,
          configuration: {
            type: item.type,
            size: item.size,
            bread: minifyItem(item.bread),
            protein: minifyItem(item.protein),
            extraProtein: minifyItem(item.extraProtein),
            veggies: minifyList(item.veggies || []),
            extras: minifyList(item.extras || []),
            sauces: minifyList(item.sauces || []),
            customerName: item.customerName,
            quantity: qty,
            hasParmesan: (item.configuration as any)?.hasParmesan || false,
            hasSalt: (item.configuration as any)?.hasSalt || false,
            hasPepper: (item.configuration as any)?.hasPepper || false,
            hasPesto: (item.configuration as any)?.hasPesto || false,
            customNote: (item.configuration as any)?.customNote || undefined
          }
        };
      });

      // Save draft to localStorage BEFORE sending (safety net)
      try {
        const draft = { order: mappedOrder, items: mappedItems, timestamp: Date.now() };
        localStorage.setItem('subday_order_draft', JSON.stringify(draft));
        console.log("Draft saved to localStorage");
      } catch (e) {
        console.warn("Could not save draft to localStorage (quota exceeded), continuing with order:", e);
      }

      // ATOMIC: Create order + items in a single database transaction
      console.log("Creating order atomically...");
      const savedOrder = await api.createOrderAtomic(mappedOrder, mappedItems);
      console.log("Order created atomically:", savedOrder);

      // Clear draft on success
      localStorage.removeItem('subday_order_draft');

      // Add to local state — savedOrder is JSONB from SQL function
      const orderForState = {
        ...mappedOrder,
        short_id: savedOrder.short_id,
        created_at: savedOrder.created_at,
        items: mappedItems
      };
      setOrders(prev => [orderForState as any, ...prev]);
      setCart([]);
      localStorage.removeItem('subday_cart');
      localStorage.removeItem('subday_cart_timestamp');

      // Return order info for Checkout (WhatsApp button)
      return {
        short_id: savedOrder.short_id,
        total_amount: mappedOrder.total_amount,
        customer_name: `${orderData.customer.firstName} ${orderData.customer.lastName}`
      };
    } catch (error: any) {
      console.error("Critical error in handleConfirmOrder:", error);
      alert(`Error al enviar pedido: ${error.message || 'Error de conexión con el servidor'}`);
      throw error; // Re-lanzar para que Checkout sepa que falló
    }
  };

  // Admin Actions
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleUpdateMenu = (type: string, items: SubItem[]) => {
    switch (type) {
      case 'proteins': setMenuProteins(items); break;
      case 'breads': setMenuBreads(prev => ({ ...prev, items })); break;
      case 'extras': setMenuExtras(prev => ({ ...prev, items })); break;
      case 'veggies': setMenuVeggies(prev => ({ ...prev, items })); break;
      case 'sauces': setMenuSauces(prev => ({ ...prev, items })); break;
    }
  };


  /* RENDER CONTENT LOGIC */
  const renderContent = () => {
    switch (currentView) {
      case ViewMode.HOME:
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Hero
              banners={banners}
              onBuild={() => {
                setPreselectedProtein(null);
                setIsComboMode(false);
                setView(ViewMode.BUILDER);
              }}
            />
            <MenuDisplay
              proteins={menuProteins}
              otherItems={menuOthers}
              mainProducts={mainProducts}
              desserts={menuDesserts}
              coffee={menuCoffee}
              onStartBuilder={(type) => {
                setPreselectedProtein(null);
                setBuilderInitialType(type); // [CRITICAL FIX] This was missing!
                setView(ViewMode.BUILDER);
              }}
              onAddToCart={(item) => {
                addOrIncrementOtherItem(item);
                setIsCartOpen(true);
              }}
            />
          </motion.div>
        );
      case ViewMode.MENU:
        return (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <MenuDisplay
              proteins={menuProteins}
              otherItems={menuOthers}
              mainProducts={mainProducts}
              desserts={menuDesserts}
              coffee={menuCoffee}
              onStartBuilder={(type) => {
                setPreselectedProtein(null);
                setBuilderInitialType(type); // [NEW] Set type
                setView(ViewMode.BUILDER);
              }}
              onAddToCart={(item) => {
                addOrIncrementOtherItem(item);
                setIsCartOpen(true);
              }}
            />
          </motion.div>
        );
      case ViewMode.BUILDER:
        return (
          <motion.div
            key="builder"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <SubBuilder
              key={`${builderInitialType}-${preselectedProtein?.id || 'noprot'}`} // [FIX] Force remount on type change
              onAddToCart={addToCart}
              onFinish={handleFinishBuilding}
              onExit={handleExitBuilder}
              onRefreshMenu={async () => {
                // Refresh main products when items become unavailable
                try {
                  const products = await api.getMainProducts();
                  setMainProducts(products || []);
                } catch (e) {
                  console.error('Error refreshing menu:', e);
                }
              }}
              initialProtein={preselectedProtein}
              initialProductType={builderInitialType} // [NEW] Pass initial type
              isCombo={isComboMode}
              menu={{
                proteins: menuProteins,
                breads: menuBreads,
                extras: menuExtras,
                veggies: menuVeggies,
                sauces: menuSauces
              }}
            />
          </motion.div>
        );
      case ViewMode.CHECKOUT:
        return (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
          >
            <Checkout
              items={cart}
              onBack={() => setView(ViewMode.HOME)}
              onConfirm={(data) => handleConfirmOrder(data)}
            />
          </motion.div>
        );
      case ViewMode.PROPOSAL:
        return (
          <motion.div
            key="proposal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ProposalOverview />
          </motion.div>
        );
      case ViewMode.LOGIN:
        return (
          <Login
            onLogin={(user) => {
              setStaffUser(user);
              // Redirect based on role
              if (user.role === 'cocina') {
                window.location.hash = '#kitchen';
                setView(ViewMode.KITCHEN);
              } else {
                window.location.hash = '#admin';
                setView(ViewMode.ADMIN);
              }
            }}
          />
        );
      case ViewMode.ADMIN:
        return (
          <AdminDashboard
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdateMenu={handleUpdateMenu}
            userRole={staffUser?.role}
            onLogout={() => {
              localStorage.removeItem('subday_staff');
              setStaffUser(null);
              window.location.href = window.location.pathname; // Full redirect
            }}
          />
        );
      case ViewMode.KITCHEN:
        return (
          <KitchenDisplay
            onLogout={() => {
              localStorage.removeItem('subday_staff');
              setStaffUser(null);
              window.location.href = window.location.pathname; // Full redirect
            }}
            showBackToDashboard={staffUser?.role === 'admin' || staffUser?.role === 'caja'}
            onBackToDashboard={() => {
              window.location.hash = '#admin';
              setView(ViewMode.ADMIN);
            }}
          />
        );
      default:
        return null;
    }
  };

  const fabText = cart.length === 0 ? "¡ARMA TU SUB! 🥖" : "¡ARMA OTRO SUB! 🥖";

  return (
    <div className="bg-white min-h-screen font-sans">
      <AnimatePresence>
        {isLoading && <SplashScreen onAnimationComplete={() => { }} key="splash" />}
      </AnimatePresence>

      {!isLoading && (
        <div className="min-h-screen flex flex-col font-inter overflow-x-hidden">
          {currentView !== ViewMode.CHECKOUT &&
            currentView !== ViewMode.ADMIN &&
            currentView !== ViewMode.KITCHEN &&
            currentView !== ViewMode.LOGIN && (
              <Header
                currentView={currentView}
                setView={(view) => {
                  if (view === ViewMode.BUILDER) {
                    setPreselectedProtein(null);
                    setIsComboMode(false);
                  }
                  setView(view);
                }}
                cartCount={cart.length}
                onOpenCart={() => setIsCartOpen(true)}
              />
            )}

          <main className="flex-grow">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </main>

          {currentView !== ViewMode.BUILDER && currentView !== ViewMode.CHECKOUT && (
            <Footer />
          )}

          {/* Closed Overlay - Shows when outside business hours */}
          {!isOpen() && currentView !== ViewMode.ADMIN && currentView !== ViewMode.LOGIN && currentView !== ViewMode.KITCHEN && (
            <div className="fixed inset-0 z-[9999] bg-[#006837]/95 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl p-8 max-w-md text-center shadow-2xl">
                <img
                  src="https://tihvaojcdhcwtcoxfbyl.supabase.co/storage/v1/object/public/subd/assets/logo%20subday.png"
                  alt="Subday"
                  className="w-20 h-20 mx-auto mb-4 object-contain"
                />
                <h2 className="text-2xl font-black text-[#006837] font-brand uppercase tracking-tighter mb-2">
                  ¡Estamos Cerrados!
                </h2>
                <p className="text-gray-500 mb-6">
                  En este momento no estamos tomando pedidos. Vuelve durante nuestro horario de atención.
                </p>
                {businessHours && (
                  <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-1 text-sm">
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => {
                      const dayLabels: { [key: string]: string } = {
                        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                        thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                      };
                      const formatTime = (time: string) => {
                        const [h] = time.split(':');
                        const hour = parseInt(h);
                        if (hour === 0) return '12am';
                        if (hour === 12) return '12pm';
                        if (hour > 12) return `${hour - 12}pm`;
                        return `${hour}am`;
                      };
                      return (
                        <div key={day} className="flex justify-between">
                          <span className="text-gray-600 font-bold">{dayLabels[day]}</span>
                          <span className="text-[#006837] font-black">
                            {businessHours[day].closed ? 'Cerrado' : `${formatTime(businessHours[day].open)} - ${formatTime(businessHours[day].close)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <Cart
            isOpen={isCartOpen}
            onClose={() => { setIsCartOpen(false); setAutoScrollToBottom(false); }}
            items={cart}
            onRemove={removeFromCart}
            onCheckout={goToCheckout}
            onAddMore={handleAddMore}
            onUpdateQuantity={updateQuantity}
            onClearCart={clearCart}
            unavailableItems={unavailableItems}
            beverages={menuBeverages}
            onAddBeverage={(item) => {
              addOrIncrementOtherItem(item);
            }}
            autoShowBeverages={autoShowBeverages}
            onBeveragesShown={() => setAutoShowBeverages(false)}
            onDuplicate={handleDuplicateItem}
            autoScrollToBottom={autoScrollToBottom}
          />

          {/* FAB Button - Hidden for now
          <AnimatePresence>
            {currentView !== ViewMode.BUILDER && currentView !== ViewMode.CHECKOUT && !isCartOpen && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setPreselectedProtein(null);
                  setIsComboMode(false);
                  setBuilderInitialType('SANDWICH'); // Always go to sandwich builder
                  setView(ViewMode.BUILDER);
                }}
                className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-[#FFCC00] text-[#006837] h-16 rounded-full shadow-2xl flex items-center justify-center z-40 px-6 font-black font-brand border-4 border-[#006837] min-w-[4rem]"
              >
                <span className="text-xl md:text-lg">{fabText}</span>
              </motion.button>
            )}
          </AnimatePresence>
          */}
        </div>
      )}
    </div>
  );
};

export default App;
