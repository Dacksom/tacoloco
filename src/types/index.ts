export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  promo?: string;
  protein?: string[];
  includes?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type MenuCategory =
  | 'tostadas'
  | 'burritos'
  | 'bowls'
  | 'nachos'
  | 'flautas'
  | 'quesadillas';

export interface Promo {
  id: string;
  name: string;
  description: string;
  includes: string;
  price: number;
  image: string;
  highlight?: boolean;
}

export interface CategoryOption {
  id: MenuCategory | 'todos';
  label: string;
  emoji: string;
}
