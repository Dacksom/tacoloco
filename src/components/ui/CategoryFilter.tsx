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
  return (
    <div className="category-scroll no-scrollbar md:justify-center">
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
  );
}
