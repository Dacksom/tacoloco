import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollAnimationOptions {
  trigger?: string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
  toggleActions?: string;
}

export function useScrollAnimation(
  animation: (el: HTMLElement, tl: gsap.core.Timeline) => void,
  options: ScrollAnimationOptions = {},
  deps: unknown[] = []
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: options.trigger ? document.querySelector(options.trigger) as Element : el,
        start: options.start || 'top 85%',
        end: options.end || 'bottom 20%',
        scrub: options.scrub || false,
        markers: options.markers || false,
        toggleActions: options.toggleActions || 'play none none none',
      },
    });

    animation(el, tl);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, deps);

  return ref;
}

export function useParallax(speed: number = 0.5) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const anim = gsap.to(el, {
      y: () => speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
      anim.kill();
    };
  }, [speed]);

  return ref;
}
