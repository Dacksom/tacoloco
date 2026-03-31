import { Instagram, MapPin, Phone } from 'lucide-react';
import { INSTAGRAM_URL, WHATSAPP_URL, LOCATION } from '../../data/menu';
import logo from '../../assets/logo.png';

export default function Footer() {
  return (
    <footer className="section-dark border-t-4 border-yellow">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Taco Loco" className="w-14 h-14 rounded-full" />
              <div>
                <div className="font-display text-3xl text-yellow tracking-[3px]">
                  TACO LOCO
                </div>
                <div className="font-heading text-[0.75rem] tracking-[3px] uppercase text-white/50">
                  Fusión TexMex · Desde 2024
                </div>
              </div>
            </div>
            <p className="text-[0.82rem] text-white/40 leading-[1.7] max-w-[280px]">
              La comida callejera más irreverente y loca de Maracaibo. Sabor auténtico, ingredientes frescos, precios justos.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-bold text-[0.8rem] tracking-[3px] uppercase text-yellow mb-5">
              Navegación
            </h4>
            <div className="flex flex-col gap-3">
              <a href="#menu" className="font-heading text-[0.85rem] tracking-[1px] uppercase text-white/60 no-underline transition-colors hover:text-yellow">
                Menú
              </a>
              <a href="#promos" className="font-heading text-[0.85rem] tracking-[1px] uppercase text-white/60 no-underline transition-colors hover:text-yellow">
                Promos
              </a>
              <a href="#nosotros" className="font-heading text-[0.85rem] tracking-[1px] uppercase text-white/60 no-underline transition-colors hover:text-yellow">
                Nosotros
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-[0.8rem] tracking-[3px] uppercase text-yellow mb-5">
              Contacto
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-white/60 text-[0.85rem] no-underline transition-colors hover:text-yellow"
              >
                <Phone size={16} /> +58 424 1735404
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-white/60 text-[0.85rem] no-underline transition-colors hover:text-yellow"
              >
                <Instagram size={16} /> @tacoloco_mcbo
              </a>
              <div className="flex items-start gap-2.5 text-white/60 text-[0.85rem]">
                <MapPin size={16} className="mt-0.5 shrink-0" /> {LOCATION}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[0.75rem] text-white/25">
            © {new Date().getFullYear()} Taco Loco. Todos los derechos reservados.
          </p>
          <p className="text-[0.7rem] text-white/20 font-heading tracking-[1px]">
            HECHO CON 🔥 EN MARACAIBO
          </p>
        </div>
      </div>
    </footer>
  );
}
