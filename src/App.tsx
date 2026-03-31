/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  Flame, 
  Skull,
  Instagram,
  MapPin,
  Phone
} from 'lucide-react';
import { MENU_ITEMS } from './constants';
import { MenuItem, CartItem } from './types';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const menuItemsByCategory = useMemo(() => {
    const categories = ['tostadas', 'nachos', 'burritos', 'flautas', 'bowls', 'quesadillas'];
    return categories.map(cat => ({
      category: cat,
      items: MENU_ITEMS.filter(item => item.category === cat)
    }));
  }, []);

  return (
    <div className="min-h-screen bg-brand-black text-brand-white font-barlow overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-10 py-4 bg-brand-black/92 backdrop-blur-md border-b border-brand-yellow/20">
        <a href="#" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center text-xl">
            💀
          </div>
          <span className="font-bebas text-3xl tracking-[2px] leading-none text-brand-white">
            Taco <span className="text-brand-yellow">Loco</span>
          </span>
        </a>
        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="#menu" className="font-barlow-cond font-bold text-[0.95rem] tracking-[2px] uppercase text-brand-gray-mid no-underline transition-colors hover:text-brand-yellow">Menú</a></li>
          <li><a href="#promos" className="font-barlow-cond font-bold text-[0.95rem] tracking-[2px] uppercase text-brand-gray-mid no-underline transition-colors hover:text-brand-yellow">Promos</a></li>
          <li><a href="#nosotros" className="font-barlow-cond font-bold text-[0.95rem] tracking-[2px] uppercase text-brand-gray-mid no-underline transition-colors hover:text-brand-yellow">Nosotros</a></li>
        </ul>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-brand-yellow hover:scale-110 transition-transform"
          >
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-red text-brand-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-brand-black">
                {totalItems}
              </span>
            )}
          </button>
          <a href="#promos" className="bg-brand-yellow text-brand-black font-barlow-cond font-black text-[0.9rem] tracking-[2px] uppercase px-6 py-2.5 no-underline transition-all hover:bg-[#FFB800] hover:scale-105 active:scale-95">
            Pedir ahora
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen grid grid-cols-1 md:grid-cols-2 items-center px-6 md:px-10 pt-24 pb-12 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-brand-yellow"></div>
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-brand-yellow rounded-full opacity-[0.04] pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-center md:text-left flex flex-col items-center md:items-start"
        >
          <div className="inline-block bg-brand-yellow text-brand-black font-barlow-cond font-black text-[0.8rem] tracking-[3px] uppercase px-4 py-1.5 mb-5">
            🌮 Fusión TexMex · Maracaibo
          </div>
          <h1 className="hero-title mb-6">
            LA COMIDA<br />
            <span className="text-brand-yellow">MÁS</span><br />
            <span className="text-stroke-yellow">LOCA</span>
          </h1>
          <p className="font-barlow-cond text-xl text-brand-gray-mid tracking-[1px] mb-10 max-w-[380px]">
            Tostadas, Burritos, Bowls y más — sabor real, precio justo. Sede Sambil, Maracaibo.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <a href="#promos" className="bg-brand-yellow text-brand-black font-barlow-cond font-black text-[1.05rem] tracking-[2px] uppercase px-8 py-3.5 no-underline transition-all hover:bg-[#FFB800] hover:-translate-y-0.5">
              Ver promos
            </a>
            <a href="#menu" className="bg-transparent text-brand-white font-barlow-cond font-bold text-[1.05rem] tracking-[2px] uppercase px-8 py-3.5 border-2 border-brand-white/30 no-underline transition-all hover:border-brand-yellow hover:text-brand-yellow">
              Nuestro menú
            </a>
          </div>
        </motion.div>

        <div className="hidden md:flex items-center justify-center relative mt-12 md:mt-0">
          <div className="w-[280px] h-[280px] md:w-[420px] md:h-[420px] rounded-full bg-brand-green-dark flex items-center justify-center relative overflow-hidden after:absolute after:inset-0 after:rounded-full after:border-4 after:border-brand-yellow/40">
            <span className="text-7xl md:text-[9rem] drop-shadow-[0_0_30px_rgba(245,168,0,0.3)] animate-float">🌮</span>
          </div>
          <div className="absolute bottom-5 -right-2 md:bottom-5 md:-right-2 bg-brand-red text-brand-white rounded-full w-24 h-24 flex flex-col items-center justify-center font-bebas animate-pulse-badge">
            <span className="text-[0.55rem] tracking-[1px] opacity-[0.85] uppercase">desde</span>
            <span className="text-3xl leading-none">$1.99</span>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="bg-brand-yellow text-brand-black py-3 overflow-hidden whitespace-nowrap" aria-hidden="true">
        <div className="inline-flex gap-12 animate-ticker">
          {Array.from({ length: 4 }).map((_, i) => (
            <React.Fragment key={i}>
              <span className="font-bebas text-xl tracking-[3px]">TOSTADAS</span>
              <span className="font-bebas text-xl tracking-[3px]">·</span>
              <span className="font-bebas text-xl tracking-[3px]">BURRITOS</span>
              <span className="font-bebas text-xl tracking-[3px]">·</span>
              <span className="font-bebas text-xl tracking-[3px]">BOWLS</span>
              <span className="font-bebas text-xl tracking-[3px]">·</span>
              <span className="font-bebas text-xl tracking-[3px]">NACHOS</span>
              <span className="font-bebas text-xl tracking-[3px]">·</span>
              <span className="font-bebas text-xl tracking-[3px]">QUESADILLAS</span>
              <span className="font-bebas text-xl tracking-[3px]">·</span>
              <span className="font-bebas text-xl tracking-[3px]">FLAUTAS</span>
              <span className="font-bebas text-xl tracking-[3px]">·</span>
              <span className="font-bebas text-xl tracking-[3px]">CHILI TEXMEX</span>
              <span className="font-bebas text-xl tracking-[3px]">·</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* MENU SECTION */}
      <section className="px-6 md:px-10 py-20" id="menu">
        <div className="text-center mb-14">
          <p className="font-barlow-cond font-bold text-[0.8rem] tracking-[4px] uppercase text-brand-yellow mb-2">Conoce nuestro</p>
          <h2 className="section-title">MENÚ <span className="text-stroke-white">COMPLETO</span></h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1100px] mx-auto">
          {MENU_ITEMS.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#111111] border border-brand-yellow/15 p-8 pb-6 relative transition-all hover:border-brand-yellow hover:-translate-y-1 group"
            >
              {item.promo && (
                <div className="absolute top-4 right-4 bg-brand-red text-brand-white font-barlow-cond font-bold text-[0.65rem] tracking-[1.5px] uppercase px-2 py-1">
                  {item.promo}
                </div>
              )}
              <span className="text-5xl mb-4 block">
                {item.category === 'tostadas' ? '🥙' : 
                 item.category === 'burritos' ? '🌯' : 
                 item.category === 'bowls' ? '🥣' : 
                 item.category === 'nachos' ? '🍟' : 
                 item.category === 'flautas' ? '🌮' : 
                 item.category === 'quesadillas' ? '🍕' : '🍲'}
              </span>
              <div className="font-bebas text-3xl tracking-[2px] text-brand-yellow mb-1">{item.name}</div>
              <p className="text-[0.88rem] text-brand-gray-mid leading-[1.55] mb-5">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="font-barlow-cond font-black text-2xl text-brand-white">
                  ${item.price.toFixed(2)} <span className="text-[0.75rem] font-normal text-brand-gray-mid tracking-[1px] uppercase ml-1">c/u</span>
                </div>
                <button 
                  onClick={() => addToCart(item)}
                  className="bg-brand-yellow text-brand-black p-2 rounded-lg hover:scale-110 transition-transform"
                >
                  <Plus size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PROMOS */}
      <section className="px-6 md:px-10 py-20 bg-[#0d0d0d] border-y-[3px] border-brand-yellow" id="promos">
        <div className="text-center mb-14">
          <p className="font-barlow-cond font-bold text-[0.8rem] tracking-[4px] uppercase text-brand-yellow mb-2">Combos para todos los gustos</p>
          <h2 className="section-title">TOSTADAS <span className="text-stroke-white">PACKS</span></h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[960px] mx-auto">
          {[
            { name: 'Duo Pack', includes: '2 Tostadas', price: 9 },
            { name: 'Tri Pack', includes: '3 Tostadas', price: 12 },
            { name: '5 Pack', includes: '5 Tostadas', price: 19 },
            { name: '8 Pack', includes: '8 Tostadas', price: 28 },
          ].map((promo, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-brand-black border border-brand-white/10 p-8 text-center relative transition-transform hover:scale-105"
            >
              <div className="font-bebas text-3xl tracking-[2px] text-brand-white mb-2">{promo.name}</div>
              <div className="text-[0.82rem] text-brand-gray-mid tracking-[0.5px] mb-6 leading-[1.6]">{promo.includes}</div>
              <div className="w-[90px] h-[90px] rounded-full bg-brand-red flex items-center justify-center mx-auto font-bebas text-3xl text-brand-white border-[3px] border-[#FF4444]">
                ${promo.price}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="max-w-[960px] mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-brand-black border border-brand-yellow/30 p-8 text-center relative transition-transform hover:scale-105">
            <div className="font-bebas text-3xl tracking-[2px] text-brand-yellow mb-2">Burrito Duo</div>
            <div className="text-[0.82rem] text-brand-gray-mid tracking-[0.5px] mb-6 leading-[1.6]">2 Burritos de Pollo o Cerdo BBQ</div>
            <div className="w-[90px] h-[90px] rounded-full bg-brand-red flex items-center justify-center mx-auto font-bebas text-3xl text-brand-white border-[3px] border-[#FF4444]">
              $18.5
            </div>
          </div>
          <div className="bg-brand-black border border-brand-yellow/30 p-8 text-center relative transition-transform hover:scale-105">
            <div className="font-bebas text-3xl tracking-[2px] text-brand-yellow mb-2">Chili XL</div>
            <div className="text-[0.82rem] text-brand-gray-mid tracking-[0.5px] mb-6 leading-[1.6]">500 Gramos de Chili TexMex con Totopos</div>
            <div className="w-[90px] h-[90px] rounded-full bg-brand-red flex items-center justify-center mx-auto font-bebas text-3xl text-brand-white border-[3px] border-[#FF4444]">
              $20
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-yellow text-brand-black text-center px-6 md:px-10 py-20">
        <h2 className="section-title">¿LISTO <span className="text-stroke-black">PARA</span> EL CAOS?</h2>
        <p className="font-barlow-cond text-lg tracking-[1px] text-brand-black/65 mt-4 mb-10 max-w-[500px] mx-auto">
          Ordena desde casa y que corra el delivery. O visítanos en Sambil Maracaibo.
        </p>
        <a href="https://wa.me/584000000000" className="bg-brand-black text-brand-yellow font-barlow-cond font-black text-[1.1rem] tracking-[2px] uppercase px-10 py-4 no-underline transition-transform hover:-translate-y-0.5 inline-block">
          Pedir por WhatsApp 📲
        </a>
      </section>

      {/* ABOUT */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[380px] overflow-hidden" id="nosotros">
        <div className="bg-brand-green-dark p-16 flex flex-col justify-center">
          <p className="font-barlow-cond font-bold text-[0.8rem] tracking-[4px] uppercase text-brand-white/60 mb-2">Quiénes somos</p>
          <h2 className="font-bebas text-[3.2rem] tracking-[2px] leading-none mb-4">FUSIÓN<br />TEXMEX<br />REAL</h2>
          <p className="text-[0.95rem] leading-[1.7] text-brand-white/80 max-w-[380px]">
            Nacimos en 2024 con una misión clara: traer la verdadera fusión TexMex a Maracaibo. Sabor auténtico, ingredientes frescos y precios que no te hacen pensar dos veces. Somos Taco Loco — y nos lo tomamos en serio.
          </p>
        </div>
        <div className="bg-brand-black flex items-center justify-center text-[10rem] relative overflow-hidden min-h-[200px]">
          <span className="relative z-10">💀</span>
          <span className="absolute font-bebas text-[5rem] text-brand-yellow/5 tracking-[10px] whitespace-nowrap">TACO LOCO</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050505] border-t border-brand-yellow/15 px-6 md:px-10 py-12 grid grid-cols-1 md:grid-cols-2 items-start gap-8">
        <div>
          <div className="font-bebas text-4xl text-brand-yellow tracking-[3px] mb-1">Taco Loco</div>
          <div className="font-barlow-cond text-[0.85rem] tracking-[3px] uppercase text-brand-gray-mid mb-4">Fusión TexMex · Desde 2024</div>
          <p className="text-[0.8rem] text-brand-white/30">
            © 2025 Taco Loco. Maracaibo, Edo. Zulia, Venezuela.<br />Todos los derechos reservados.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:text-right">
          <a href="#menu" className="font-barlow-cond text-[0.85rem] tracking-[2px] uppercase text-brand-gray-mid no-underline transition-colors hover:text-brand-yellow">Menú</a>
          <a href="#promos" className="font-barlow-cond text-[0.85rem] tracking-[2px] uppercase text-brand-gray-mid no-underline transition-colors hover:text-brand-yellow">Promos</a>
          <a href="#nosotros" className="font-barlow-cond text-[0.85rem] tracking-[2px] uppercase text-brand-gray-mid no-underline transition-colors hover:text-brand-yellow">Nosotros</a>
          <a href="https://instagram.com/tacoloco_mcbo" className="font-barlow-cond text-[0.85rem] tracking-[2px] uppercase text-brand-gray-mid no-underline transition-colors hover:text-brand-yellow">Instagram</a>
        </div>
      </footer>

      {/* CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-brand-black/80 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-brand-black border-l-4 border-brand-yellow z-[120] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-bebas text-3xl tracking-[2px] text-brand-yellow flex items-center gap-3">
                  <ShoppingCart /> Tu Pedido
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                      <ShoppingCart size={48} />
                    </div>
                    <p className="font-barlow-cond font-black uppercase tracking-[1px]">¡Tu carrito está vacío loco!</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-brand-yellow underline font-bold"
                    >
                      Ir a ver el menú
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <div className="w-20 h-20 rounded-xl bg-brand-green-dark flex items-center justify-center text-4xl">
                        {item.category === 'tostadas' ? '🥙' : 
                         item.category === 'burritos' ? '🌯' : 
                         item.category === 'bowls' ? '🥣' : 
                         item.category === 'nachos' ? '🍟' : 
                         item.category === 'flautas' ? '🌮' : 
                         item.category === 'quesadillas' ? '🍕' : '🍲'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-bebas text-xl tracking-[1px] text-brand-white">{item.name}</h4>
                          <span className="font-barlow-cond font-black text-brand-red text-lg">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center bg-brand-black rounded-lg border border-white/10">
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 hover:text-brand-yellow"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-8 text-center font-black">{item.quantity}</span>
                            <button 
                              onClick={() => addToCart(item)}
                              className="p-1 hover:text-brand-yellow"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <button 
                            onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                            className="text-xs text-brand-white/40 hover:text-brand-red uppercase font-bold"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-white/5 border-t-4 border-brand-yellow space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-barlow-cond font-black uppercase text-brand-white/60 tracking-[1px]">Total a pagar:</span>
                    <span className="font-bebas text-4xl text-brand-yellow tracking-[2px]">${totalPrice.toFixed(2)}</span>
                  </div>
                  <button className="w-full bg-brand-red text-brand-white py-5 rounded-xl font-barlow-cond font-black uppercase text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-xl">
                    ¡¡ PEDIR AHORA !! <Flame fill="currentColor" />
                  </button>
                  <p className="text-[10px] text-center text-brand-white/40 uppercase font-bold tracking-[1px]">
                    Al confirmar, Calavero empezará a preparar tu pedido.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
