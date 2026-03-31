import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'tostada-2',
    name: '2 Tostadas Pack',
    description: 'Dúo de tostadas con proteína a elección.',
    price: 9.00,
    category: 'tostadas',
    image: 'https://picsum.photos/seed/taco2/400/400',
    promo: 'DUO'
  },
  {
    id: 'tostada-3',
    name: '3 Tostadas Pack',
    description: 'Trío de tostadas para los más hambrientos.',
    price: 12.00,
    category: 'tostadas',
    image: 'https://picsum.photos/seed/taco3/400/400',
    promo: 'TRI'
  },
  {
    id: 'tostada-5',
    name: '5 Tostadas Pack',
    description: 'Combo familiar de 5 tostadas.',
    price: 19.00,
    category: 'tostadas',
    image: 'https://picsum.photos/seed/taco5/400/400',
    promo: 'FAMILIAR'
  },
  {
    id: 'tostada-8',
    name: '8 Tostadas Pack',
    description: 'El pack definitivo: 8 tostadas para compartir.',
    price: 28.00,
    category: 'tostadas',
    image: 'https://picsum.photos/seed/taco8/400/400',
    promo: 'PARTY'
  },
  {
    id: 'burrito-1',
    name: 'Burrito Pollo/Cerdo',
    description: 'Burrito individual de pollo o cerdo BBQ.',
    price: 10.00,
    category: 'burritos',
    image: 'https://picsum.photos/seed/burrito1/400/400'
  },
  {
    id: 'burrito-2',
    name: '2 Burritos Pack',
    description: 'Pareja de burritos con proteína a elección.',
    price: 18.50,
    category: 'burritos',
    image: 'https://picsum.photos/seed/burrito2/400/400',
    promo: 'OFERTA'
  },
  {
    id: 'bowl-pollo',
    name: 'Bowl de Pollo',
    description: 'Bowl saludable con pollo, arroz texmex y vegetales.',
    price: 9.50,
    category: 'bowls',
    image: 'https://picsum.photos/seed/bowl1/400/400'
  },
  {
    id: 'bowl-cerdo',
    name: 'Bowl de Cerdo',
    description: 'Bowl con cerdo BBQ, frijoles y guacamole.',
    price: 9.50,
    category: 'bowls',
    image: 'https://picsum.photos/seed/bowl2/400/400'
  },
  {
    id: 'quesadilla-1',
    name: 'Quesadilla Simple',
    description: 'Quesadilla de carne o pollo con queso fundido.',
    price: 8.00, // Estimated price as not provided
    category: 'quesadillas',
    image: 'https://picsum.photos/seed/quesa1/400/400'
  },
  {
    id: 'quesadilla-delux',
    name: 'Quesadilla Delux',
    description: 'Carne o pollo. Incluye 16 Nachos y porción de guacamole.',
    price: 15.00, // Estimated price as not provided
    category: 'quesadillas',
    image: 'https://picsum.photos/seed/quesadelux/400/400',
    promo: 'DELUX'
  },
  {
    id: 'chili-300',
    name: 'Chili TexMex 300g',
    description: '300 gramos de nuestro chili especial con totopos.',
    price: 15.00,
    category: 'nachos',
    image: 'https://picsum.photos/seed/chili300/400/400'
  },
  {
    id: 'chili-500',
    name: 'Chili TexMex 500g',
    description: '500 gramos de puro sabor TexMex para compartir.',
    price: 20.00,
    category: 'nachos',
    image: 'https://picsum.photos/seed/chili500/400/400',
    promo: 'GRANDE'
  },
  {
    id: 'flautas',
    name: 'Flautas (Pollo/Carne)',
    description: 'Servicio de flautas crujientes de pollo o carne.',
    price: 10.00,
    category: 'flautas',
    image: 'https://picsum.photos/seed/flautas/400/400'
  }
];
