import ScrollReveal from '../ui/ScrollReveal';
import logo from '../../assets/logo.png';

export default function AboutSection() {
  return (
    <section className="overflow-hidden" id="nosotros">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[420px]">
        {/* Left — Green */}
        <div className="section-green p-10 md:p-16 flex flex-col justify-center">
          <ScrollReveal>
            <p className="subtitle text-white/50 mb-3">Quiénes somos</p>
            <h2 className="font-display text-[3rem] md:text-[3.5rem] tracking-[2px] leading-none text-white mb-5">
              FUSIÓN<br />TEXMEX<br />REAL
            </h2>
            <p className="text-[0.92rem] leading-[1.8] text-white/75 max-w-[380px]">
              Nacimos en 2024 con una misión clara: traer la verdadera fusión TexMex a Maracaibo.
              Sabor auténtico, ingredientes frescos y precios que no te hacen pensar dos veces.
              Somos Taco Loco — y nos lo tomamos en serio.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="w-1 h-8 bg-yellow rounded-full" />
              <span className="font-heading font-bold text-[0.8rem] tracking-[2px] uppercase text-yellow">
                Sede Sambil · Maracaibo
              </span>
            </div>
          </ScrollReveal>
        </div>

        {/* Right — Dark with logo */}
        <div className="section-dark flex items-center justify-center relative min-h-[250px] md:min-h-auto overflow-hidden">
          <ScrollReveal>
            <img
              src={logo}
              alt="Taco Loco Logo"
              className="w-40 h-40 md:w-52 md:h-52 rounded-full relative z-10 shadow-2xl"
            />
          </ScrollReveal>

          {/* Background text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-display text-[4rem] md:text-[6rem] text-white/[0.03] tracking-[10px] whitespace-nowrap">
              TACO LOCO
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
