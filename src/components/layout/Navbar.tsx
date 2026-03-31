import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCart } from '../cart/CartProvider';
import logo from '../../assets/logo.png';

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { href: '#menu', label: 'Menú' },
    { href: '#promos', label: 'Promos' },
    { href: '#nosotros', label: 'Nosotros' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-5 md:px-10 transition-all duration-500 ${
          scrolled
            ? 'py-2.5 bg-white/95 backdrop-blur-xl shadow-[0_2px_30px_rgba(0,0,0,0.08)] border-b border-black/5'
            : 'py-4 bg-transparent'
        }`}
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 no-underline z-10">
          <img
            src={logo}
            alt="Taco Loco"
            className={`transition-all duration-500 ${
              scrolled ? 'w-10 h-10' : 'w-12 h-12'
            } rounded-full object-contain`}
          />
          <span
            className={`font-display text-2xl tracking-[2px] leading-none transition-colors duration-300 ${
              scrolled || !menuOpen ? 'text-black' : 'text-white'
            }`}
          >
            TACO <span className="text-yellow">LOCO</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <ul className="hidden md:flex gap-8 list-none items-center">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-heading font-bold text-[0.85rem] tracking-[2px] uppercase text-gray-dark no-underline transition-all duration-300 hover:text-yellow relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-yellow after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-3 z-10">
          {/* Cart button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 text-black hover:text-yellow transition-colors duration-300"
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 bg-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
              >
                {totalItems}
              </motion.span>
            )}
          </button>

          {/* CTA desktop */}
          <a
            href="#menu"
            className="hidden md:inline-flex btn-primary text-[0.8rem] px-5 py-2.5 rounded-xl"
          >
            Pedir aquí
          </a>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden flex flex-col gap-[5px] p-2 z-10 ${
              menuOpen ? 'hamburger-active' : ''
            }`}
            aria-label="Menú de navegación"
          >
            <span className={`hamburger-line ${menuOpen ? 'bg-white' : 'bg-black'}`} />
            <span className={`hamburger-line ${menuOpen ? 'bg-white' : 'bg-black'}`} />
            <span className={`hamburger-line ${menuOpen ? 'bg-white' : 'bg-black'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 40px) 40px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 40px) 40px)' }}
            transition={{ duration: 0.6, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-0 z-[95] bg-black flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className="font-display text-5xl text-white tracking-[4px] no-underline transition-colors hover:text-yellow"
              >
                {link.label}
              </motion.a>
            ))}

            <motion.a
              href="#menu"
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="btn-primary mt-8 text-lg px-10 py-4 rounded-xl"
            >
              🌮 Pedir Ahora
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
