import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../cart/CartProvider';

export default function CartSummaryMobile() {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="cart-bar-mobile !py-4 !px-5 !bg-[#1a1a1a] !border-t-2 !border-yellow md:hidden cursor-pointer shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          onClick={() => setIsCartOpen(true)}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <ShoppingCart size={24} className="text-yellow" strokeWidth={1.5} />
              <span className="absolute -top-2 -right-2 bg-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#1a1a1a]">
                {totalItems}
              </span>
            </div>
            <span className="font-heading font-black text-white text-[0.95rem] tracking-[1px] uppercase mt-1">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <span className="font-heading font-black text-xl text-yellow tracking-[1px] mt-1">
              ${totalPrice.toFixed(2)}
            </span>
            <div className="bg-yellow hover:bg-yellow-dark transition-colors text-black px-5 py-2.5 rounded-md font-heading font-black text-[0.85rem] tracking-[1px] uppercase">
              Ver pedido
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
