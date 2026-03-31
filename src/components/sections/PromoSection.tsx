import { PROMOS } from '../../data/promos';
import PromoCard from '../ui/PromoCard';
import ScrollReveal from '../ui/ScrollReveal';
import Taco3D from '../ui/Taco3D';

export default function PromoSection() {
  return (
    <section className="section-light px-5 md:px-10 py-20" id="promos">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollReveal className="text-center mb-12">
          <p className="subtitle text-yellow mb-2">Combos para todos los gustos</p>
          <h2 className="title-section text-black">
            PROMOS <span className="text-stroke-black">DEL DÍA</span>
          </h2>
        </ScrollReveal>

        {/* Promo grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {PROMOS.map((promo, i) => (
            <div key={promo.id}>
              <ScrollReveal delay={i * 0.12}>
                <PromoCard promo={promo} />
              </ScrollReveal>
            </div>
          ))}
        </div>

        {/* Tostadas packs */}
        <ScrollReveal delay={0.3} className="mt-12">
          <div className="bg-gray-light rounded-2xl p-8 md:p-10 text-center">
            <h3 className="font-display text-3xl md:text-4xl tracking-[2px] text-black mb-2">
              TOSTADAS <span className="text-yellow">PACKS</span>
            </h3>
            <p className="text-gray-mid text-sm mb-8 font-heading tracking-[1px]">
              Desde $1.99 la unidad — todos incluyen bebida
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Duo Pack', qty: '2 Tostadas + 1 Bebida', price: 9 },
                { name: 'Tri Pack', qty: '3 Tostadas + 1 Bebida', price: 12 },
                { name: '5 Pack', qty: '5 Tostadas + 2 Bebidas', price: 19 },
                { name: '8 Pack', qty: '8 Tostadas + 3 Bebidas', price: 28 },
              ].map((pack, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-black/5 transition-all duration-300 hover:border-yellow hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="font-display text-xl tracking-[1px] text-black mb-1">
                    {pack.name}
                  </div>
                  <div className="text-[0.72rem] text-gray-mid tracking-[0.5px] mb-4 leading-[1.5]">
                    {pack.qty}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-14 h-14 rounded-full bg-red flex items-center justify-center font-display text-xl text-white border-2 border-red-dark animate-pulse-badge z-10 shrink-0">
                      ${pack.price}
                    </div>
                    <Taco3D />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
