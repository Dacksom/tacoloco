import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';
import plateMain from '../../assets/plate-main.webp';
import plateHerbs from '../../assets/plate-herbs.png';
import { useTypewriter } from '../../hooks/useTypewriter';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const plate1Ref = useRef<HTMLDivElement>(null);
  const plate2Ref = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const typedText = useTypewriter([
    'Fusión TexMex · Maracaibo',
    'La Comida Más Loca',
    'Sabor Auténtico',
  ], 80, 2500);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ═══ ENTRANCE TIMELINE ═══
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Badge tag
      tl.fromTo(
        '.hero-tag',
        { y: 20, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5 }
      );

      // Title lines stagger — clip reveal
      tl.fromTo(
        '.hero-line',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power4.out',
        },
        '-=0.2'
      );

      // Subtitle
      tl.fromTo(
        '.hero-subtitle',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.3'
      );

      // Buttons
      tl.fromTo(
        '.hero-btn',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 },
        '-=0.2'
      );

      // Main plate — scale + fade in
      if (plate1Ref.current) {
        tl.fromTo(
          plate1Ref.current,
          { scale: 0.6, opacity: 0, rotation: -30 },
          {
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration: 0.9,
            ease: 'back.out(1.4)',
          },
          '-=0.6'
        );
      }

      // Herbs plate — delayed
      if (plate2Ref.current) {
        tl.fromTo(
          plate2Ref.current,
          { scale: 0.5, opacity: 0, rotation: 40 },
          {
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration: 0.7,
            ease: 'back.out(1.2)',
          },
          '-=0.5'
        );
      }

      // Price badge
      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { scale: 0, rotation: -20 },
          { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' },
          '-=0.3'
        );
      }

      // Scroll indicator
      tl.fromTo(
        '.scroll-indicator',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.2'
      );

      // ═══ SCROLL-DRIVEN ROTATION ═══
      if (plate1Ref.current) {
        gsap.to(plate1Ref.current, {
          rotation: 120,
          y: -80,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      }

      if (plate2Ref.current) {
        gsap.to(plate2Ref.current, {
          rotation: -90,
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // Badge parallax
      if (badgeRef.current) {
        gsap.to(badgeRef.current, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] flex items-center overflow-hidden bg-white"
    >
      {/* Yellow accent top line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow z-20" />

      {/* ═══ CONTENT CONTAINER ═══ */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-24 pb-16 md:pt-28 md:pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">

          {/* ══ LEFT — TEXT ══ */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Tag (Typewriter) */}
            <div className="hero-tag font-heading font-black text-[0.8rem] md:text-[0.9rem] tracking-[3px] uppercase mb-6 md:mb-8 text-yellow min-h-[1.5rem] flex items-center">
              <span>{typedText}</span>
              <span className="w-1.5 h-4 bg-yellow ml-1.5 animate-pulse"></span>
            </div>

            {/* Title */}
            <h1 className="mb-6 md:mb-8 font-display">
              <span className="hero-line block leading-[0.85] tracking-[1px] text-black"
                style={{ fontSize: 'clamp(4.2rem, 11vw, 8.5rem)' }}>
                LA COMIDA
              </span>
              <span className="hero-line flex flex-wrap items-center gap-x-3 md:gap-x-5 leading-[0.85] tracking-[1px] mt-1 md:mt-2"
                style={{ fontSize: 'clamp(4.2rem, 11vw, 8.5rem)' }}>
                <span className="text-yellow">MÁS</span>
                <span className="text-stroke-yellow">LOCA</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle font-heading text-base md:text-lg text-gray-mid tracking-[0.5px] mb-8 md:mb-10 max-w-[420px] leading-relaxed">
              Tostadas, Burritos, Bowls y más — sabor real, precio justo.
              <span className="block mt-1 text-black/50 font-bold tracking-[2px] text-[0.75rem] uppercase">
                📍 Sede Sambil, Maracaibo
              </span>
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center lg:justify-start">
              <a href="#menu" className="hero-btn btn-primary rounded-xl text-[0.85rem] md:text-[0.9rem] px-6 md:px-8 py-3 md:py-3.5">
                Ver Menú 🔥
              </a>
              <a href="#promos" className="hero-btn btn-outline rounded-xl text-[0.85rem] md:text-[0.9rem] px-6 md:px-8 py-3 md:py-3.5 text-black">
                Promos del día
              </a>
            </div>
          </div>

          {/* ══ RIGHT — ROTATING PLATES ══ */}
          <div className="relative flex items-center justify-center min-h-[350px] md:min-h-[480px] lg:min-h-[550px]">
            {/* Main plate — large, centered */}
            <div
              ref={plate1Ref}
              className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] lg:w-[440px] lg:h-[440px] z-10"
              style={{ willChange: 'transform' }}
            >
              <img
                src={plateMain}
                alt="Plato principal Taco Loco"
                className="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
              />
            </div>

            {/* Herbs plate — smaller, offset top-left */}
            <div
              ref={plate2Ref}
              className="absolute w-[110px] h-[110px] md:w-[140px] md:h-[140px] lg:w-[160px] lg:h-[160px] -top-2 -left-4 md:top-6 md:left-2 lg:top-4 lg:-left-4 z-20"
              style={{ willChange: 'transform' }}
            >
              <img
                src={plateHerbs}
                alt="Ingredientes frescos"
                className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.1)]"
              />
            </div>

            {/* Price badge */}
            <div
              ref={badgeRef}
              className="absolute -bottom-2 right-4 md:bottom-8 md:right-4 lg:bottom-6 lg:right-8 z-30"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-red flex flex-col items-center justify-center font-display border-4 border-red-dark shadow-2xl shadow-red/30 animate-pulse-badge">
                <span className="text-white/80 text-[0.5rem] md:text-[0.55rem] tracking-[1px] uppercase">desde</span>
                <span className="text-white text-2xl md:text-3xl leading-none">$1.99</span>
              </div>
            </div>

            {/* Decorative ring */}
            <div className="absolute w-[320px] h-[320px] md:w-[430px] md:h-[430px] lg:w-[500px] lg:h-[500px] rounded-full border-2 border-dashed border-yellow/20 animate-spin-slow pointer-events-none" />

            {/* Decorative dots */}
            <div className="absolute w-3 h-3 bg-yellow rounded-full top-16 right-8 md:top-20 md:right-20 animate-float opacity-60" />
            <div className="absolute w-2 h-2 bg-green rounded-full bottom-20 left-10 md:bottom-28 md:left-16 animate-float opacity-40" style={{ animationDelay: '1s' }} />
            <div className="absolute w-4 h-4 bg-red/30 rounded-full top-8 left-1/3 animate-float opacity-50" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>
      </div>

      {/* ═══ SCROLL INDICATOR ═══ */}
      <div className="scroll-indicator absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-mid/50 z-10">
        <span className="font-heading text-[0.6rem] tracking-[3px] uppercase">Scroll</span>
        <ChevronDown size={16} className="animate-bounce" />
      </div>

      {/* ═══ BACKGROUND DECORATION ═══ */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-yellow/[0.04] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-green/[0.03] pointer-events-none" />
    </section>
  );
}
