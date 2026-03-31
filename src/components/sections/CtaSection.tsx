import { MessageCircle, MapPin } from 'lucide-react';
import { WHATSAPP_URL } from '../../data/menu';
import ScrollReveal from '../ui/ScrollReveal';

export default function CtaSection() {
  return (
    <section className="bg-yellow text-black text-center px-6 md:px-10 py-20 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-yellow-dark/20 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-[200px] h-[200px] rounded-full bg-yellow-dark/15 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <ScrollReveal>
          <h2 className="title-section text-black">
            ¿LISTO <span className="text-stroke-black">PARA</span> EL CAOS?
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <p className="font-heading text-lg tracking-[1px] text-black/60 mt-5 mb-10 max-w-[500px] mx-auto">
            Ordena desde casa y que corra el delivery. O visítanos en Sambil Maracaibo.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-black text-yellow font-heading font-black text-[1rem] tracking-[2px] uppercase px-8 py-4 rounded-xl no-underline transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              <MessageCircle size={20} />
              Pedir por WhatsApp
            </a>

            <a
              href="https://maps.google.com/?q=Sambil+Maracaibo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-black/70 font-heading font-bold text-[0.85rem] tracking-[1px] uppercase no-underline transition-colors hover:text-black"
            >
              <MapPin size={16} />
              Cómo llegar
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
