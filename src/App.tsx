import { CartProvider } from './components/cart/CartProvider';
import Navbar from './components/layout/Navbar';
import { useCart } from './components/cart/CartProvider';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';
import CartSummaryMobile from './components/cart/CartSummary';
import Hero from './components/sections/Hero';
import Ticker from './components/sections/Ticker';
import MenuSection from './components/sections/MenuSection';
import PromoSection from './components/sections/PromoSection';
import AboutSection from './components/sections/AboutSection';
import CtaSection from './components/sections/CtaSection';
import Checkout from './components/checkout/Checkout';
import { motion, AnimatePresence } from 'motion/react';

function MainApp() {
  const { isCheckoutOpen, setIsCheckoutOpen, cart, totalPrice, clearCart } = useCart();

  return (
    <div className="bg-black min-h-screen text-white font-body overflow-x-hidden">
      <AnimatePresence mode="wait">
        {isCheckoutOpen ? (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <Checkout 
              onBack={() => setIsCheckoutOpen(false)}
              onSuccess={() => {
                clearCart();
                setIsCheckoutOpen(false);
              }}
              items={cart}
              totalCart={totalPrice}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col min-h-screen"
          >
            <Navbar />

            <main className="flex-grow">
              <Hero />
              <Ticker />
              <MenuSection />
              <PromoSection />
              <CtaSection />
              <AboutSection />
            </main>

            <Footer />

            <CartDrawer />
            <CartSummaryMobile />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}
