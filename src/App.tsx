import { CartProvider } from './components/cart/CartProvider';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';
import CartSummaryMobile from './components/cart/CartSummary';
import Hero from './components/sections/Hero';
import Ticker from './components/sections/Ticker';
import MenuSection from './components/sections/MenuSection';
import PromoSection from './components/sections/PromoSection';
import AboutSection from './components/sections/AboutSection';
import CtaSection from './components/sections/CtaSection';

export default function App() {
  return (
    <CartProvider>
      <div className="min-h-screen">
        <Navbar />

        <main>
          <Hero />
          <Ticker />
          <MenuSection />
          <PromoSection />
          <CtaSection />
          <AboutSection />
        </main>

        <Footer />

        {/* Cart UI */}
        <CartDrawer />
        <CartSummaryMobile />
      </div>
    </CartProvider>
  );
}
