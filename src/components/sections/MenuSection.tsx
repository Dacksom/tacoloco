import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MENU_ITEMS, CATEGORIES } from '../../data/menu';
import { MenuCategory } from '../../types';
import CategoryFilter from '../ui/CategoryFilter';
import MenuCard from '../ui/MenuCard';
import ScrollReveal from '../ui/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

export default function MenuSection() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory | 'todos'>('todos');
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredItems =
    activeCategory === 'todos'
      ? MENU_ITEMS
      : MENU_ITEMS.filter((item) => item.category === activeCategory);

  // Animate cards when category changes
  useEffect(() => {
    if (!gridRef.current) return;

    const cards = gridRef.current.querySelectorAll('.card-menu, .card-menu-dark');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power3.out',
      }
    );
  }, [activeCategory]);

  return (
    <section className="section-dark px-5 md:px-10 py-20" id="menu">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollReveal className="text-center mb-10">
          <p className="subtitle text-yellow mb-2">Conoce nuestro</p>
          <h2 className="title-section text-white">
            MENÚ <span className="text-stroke-yellow">COMPLETO</span>
          </h2>
        </ScrollReveal>

        {/* Category filter */}
        <ScrollReveal delay={0.2} className="mb-10 px-1">
          <CategoryFilter
            categories={CATEGORIES}
            active={activeCategory}
            onSelect={setActiveCategory}
            dark
          />
        </ScrollReveal>

        {/* Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
        >
          {filteredItems.map((item, index) => (
            <div key={item.id}>
              <MenuCard item={item} index={index} dark />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <p className="font-display text-3xl mb-2">🤔</p>
            <p className="font-heading font-bold text-sm tracking-[2px] uppercase">
              No hay items en esta categoría
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
