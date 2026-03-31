export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'tostadas' | 'nachos' | 'burritos' | 'flautas' | 'bowls' | 'bebidas' | 'quesadillas';
  image: string;
  promo?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}
