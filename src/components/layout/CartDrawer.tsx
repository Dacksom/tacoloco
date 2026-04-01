import { ShoppingCart, Plus, Minus, X, Trash2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../cart/CartProvider';
import { WHATSAPP_NUMBER } from '../../data/menu';

export default function CartDrawer() {
  const {
    cart,
    addToCart,
    removeFromCart,
    deleteFromCart,
    totalItems,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
  } = useCart();

  const generateWhatsAppMessage = () => {
    if (cart.length === 0) return '';

    let message = '🌮 *Pedido Taco Loco*\n\n';
    cart.forEach((item) => {
      message += `• ${item.quantity}x ${item.name} — $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    message += `\n💰 *Total: $${totalPrice.toFixed(2)}*`;
    message += '\n\n📍 Retirar en Sambil Maracaibo';

    return encodeURIComponent(message);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[120] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between">
              <h2 className="font-display text-2xl tracking-[2px] text-black flex items-center gap-2.5">
                <ShoppingCart size={22} className="text-yellow" />
                Tu Pedido
                {totalItems > 0 && (
                  <span className="bg-yellow text-black text-[0.7rem] font-heading font-black px-2 py-0.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Cerrar carrito"
              >
                <X size={22} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-mid">
                  <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center">
                    <ShoppingCart size={36} strokeWidth={1.5} />
                  </div>
                  <p className="font-heading font-black uppercase tracking-[1px] text-sm">
                    ¡Tu carrito está vacío, loco!
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-yellow font-bold text-sm underline underline-offset-4"
                  >
                    Ir al menú
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="flex gap-4 bg-gray-light rounded-2xl p-4"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-display text-lg tracking-[1px] text-black truncate pr-2">
                            {item.name}
                          </h4>
                          <button
                            onClick={() => deleteFromCart(item.id)}
                            className="text-gray-mid hover:text-red transition-colors p-1 shrink-0"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <span className="font-heading font-black text-yellow text-lg">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center bg-white rounded-lg border border-black/10 overflow-hidden">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 hover:bg-black/5 transition-colors"
                              aria-label="Reducir cantidad"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="p-1.5 hover:bg-black/5 transition-colors"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
              <div className="p-6 bg-black border-t-4 border-yellow space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-heading font-black uppercase text-white/60 tracking-[1px] text-sm">
                    Total a pagar:
                  </span>
                  <span className="font-display text-3xl text-yellow tracking-[2px]">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-yellow hover:bg-yellow-dark text-black py-4 rounded-xl font-heading font-black uppercase text-base flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                >
                  Continuar al Checkout
                </button>

                <p className="text-[0.65rem] text-center text-white/40 uppercase font-bold tracking-[1px]">
                  Configura tu delivery y pago en el siguiente paso
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
