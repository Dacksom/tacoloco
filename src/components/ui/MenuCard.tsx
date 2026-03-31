import { Plus } from 'lucide-react';
import { MenuItem } from '../../types';
import { useCart } from '../cart/CartProvider';

interface MenuCardProps {
  item: MenuItem;
  index: number;
  dark?: boolean;
}

export default function MenuCard({ item, dark = false }: MenuCardProps) {
  const { addToCart } = useCart();

  return (
    <div className={`group ${dark ? 'card-menu-dark' : 'card-menu'} flex flex-col`}>
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {item.promo && (
          <div className="absolute top-3 left-3 bg-red text-white font-heading font-bold text-[0.65rem] tracking-[1.5px] uppercase px-2.5 py-1 rounded-full">
            {item.promo}
          </div>
        )}
        {item.includes && (
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[0.7rem] font-medium px-2.5 py-1 rounded-full">
            Incluye: {item.includes}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="title-card text-yellow mb-1">{item.name}</h3>
        <p className={`text-[0.82rem] leading-[1.55] mb-4 flex-1 ${
          dark ? 'text-white/60' : 'text-gray-mid'
        }`}>
          {item.description}
        </p>

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-1">
            <span className={`font-heading font-black text-2xl ${
              dark ? 'text-white' : 'text-black'
            }`}>
              ${item.price.toFixed(2)}
            </span>
            <span className={`text-[0.7rem] font-medium tracking-[1px] uppercase ${
              dark ? 'text-white/40' : 'text-gray-mid'
            }`}>
              c/u
            </span>
          </div>

          <button
            onClick={() => addToCart(item)}
            className="bg-yellow text-black p-2.5 rounded-xl hover:bg-yellow-dark hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg shadow-yellow/20"
            aria-label={`Agregar ${item.name} al carrito`}
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
