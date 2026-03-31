import { Promo } from '../../types';

interface PromoCardProps {
  promo: Promo;
}

export default function PromoCard({ promo }: PromoCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl ${
      promo.highlight ? 'md:col-span-1' : ''
    } transition-all duration-500 hover:-translate-y-2`}>
      {/* Background image */}
      <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden">
        <img
          src={promo.image}
          alt={promo.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <h3 className="font-display text-3xl md:text-4xl tracking-[2px] text-white mb-1">
            {promo.name}
          </h3>
          <p className="text-white/70 text-sm mb-2">{promo.description}</p>
          <p className="text-white/90 text-[0.8rem] font-heading font-bold tracking-[1px] mb-4">
            {promo.includes}
          </p>

          {/* Price badge */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-red flex items-center justify-center font-display text-2xl text-white border-2 border-red-dark animate-pulse-badge shadow-lg shadow-red/40">
              ${promo.price}
            </div>
            <span className="text-yellow font-heading font-black text-sm tracking-[2px] uppercase">
              ¡Aprovecha!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
