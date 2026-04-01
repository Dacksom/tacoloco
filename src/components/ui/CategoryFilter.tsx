import { useState, useRef, useEffect, useCallback } from 'react';
import { CategoryOption, MenuCategory } from '../../types';

interface CategoryFilterProps {
  categories: CategoryOption[];
  active: MenuCategory | 'todos';
  onSelect: (id: MenuCategory | 'todos') => void;
  dark?: boolean;
}

export default function CategoryFilter({
  categories,
  active,
  onSelect,
  dark = false,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    setCanScrollLeft(el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  return (
    <div className="relative">
      {/* Left fade indicator */}
      {canScrollLeft && (
        <div className={`absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none ${dark ? 'bg-gradient-to-r from-[#262626] to-transparent' : 'bg-gradient-to-r from-white to-transparent'}`} />
      )}

      <div ref={scrollRef} className="category-scroll no-scrollbar md:justify-center">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`category-pill ${active === cat.id ? 'active' : ''} ${
              dark ? 'border-white/15 text-white/60' : ''
            }`}
          >
            <span className="mr-1.5">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Right fade + arrow indicator */}
      {canScrollRight && (
        <div className={`absolute right-0 top-0 bottom-0 w-14 z-10 pointer-events-none flex items-center justify-end pr-1 ${dark ? 'bg-gradient-to-l from-[#262626] to-transparent' : 'bg-gradient-to-l from-white to-transparent'}`}>
          <span className="text-yellow animate-pulse text-lg font-black">›</span>
        </div>
      )}
    </div>
  );
}
