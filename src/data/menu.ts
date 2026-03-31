import { MenuItem, CategoryOption } from '../types';

// Images from identidad y menu folder (using the design images)
import grupo33 from '../../identidad y menu/Grupo 33.png';
import grupo1 from '../../identidad y menu/Grupo 1.png';
import grupo6 from '../../identidad y menu/Grupo 6.png';
import grupo11 from '../../identidad y menu/Grupo 11.png';
import grupo44 from '../../identidad y menu/Grupo 44.png';

export const CATEGORIES: CategoryOption[] = [
  { id: 'todos', label: 'Todos', emoji: '🔥' },
  { id: 'tostadas', label: 'Tostadas', emoji: '🌮' },
  { id: 'burritos', label: 'Burritos', emoji: '🌯' },
  { id: 'bowls', label: 'Bowls', emoji: '🥣' },
  { id: 'nachos', label: 'Chili TexMex', emoji: '🍟' },
  { id: 'quesadillas', label: 'Quesadillas', emoji: '🧀' },
  { id: 'flautas', label: 'Flautas', emoji: '🫔' },
];

export const MENU_ITEMS: MenuItem[] = [
  // ═══ TOSTADAS ═══
  {
    id: 'tostada-individual',
    name: 'Tostada Individual',
    description: 'Carne o pollo con crema agria, guacamole rústico, crema de caraotas, queso texmex y salsa Taco Loco.',
    price: 1.99,
    category: 'tostadas',
    image: grupo44,
    protein: ['Carne', 'Pollo'],
  },
  {
    id: 'tostada-2',
    name: 'Duo Pack',
    description: '2 tostadas con proteína a elección + 1 bebida.',
    price: 9.00,
    category: 'tostadas',
    image: grupo44,
    promo: 'DUO',
    protein: ['Carne', 'Pollo'],
    includes: '1 bebida',
  },
  {
    id: 'tostada-3',
    name: 'Tri Pack',
    description: '3 tostadas para los más hambrientos + 1 bebida.',
    price: 12.00,
    category: 'tostadas',
    image: grupo44,
    promo: 'TRI',
    protein: ['Carne', 'Pollo'],
    includes: '1 bebida',
  },
  {
    id: 'tostada-5',
    name: '5 Pack',
    description: 'Combo familiar de 5 tostadas + 2 bebidas.',
    price: 19.00,
    category: 'tostadas',
    image: grupo44,
    promo: 'FAMILIAR',
    protein: ['Carne', 'Pollo'],
    includes: '2 bebidas',
  },
  {
    id: 'tostada-8',
    name: '8 Pack',
    description: 'El pack definitivo: 8 tostadas para compartir + 3 bebidas.',
    price: 28.00,
    category: 'tostadas',
    image: grupo44,
    promo: 'PARTY',
    protein: ['Carne', 'Pollo'],
    includes: '3 bebidas',
  },

  // ═══ BURRITOS ═══
  {
    id: 'burrito-1',
    name: 'Burrito Individual',
    description: 'Relleno de arroz especial, caraotas, crema agria, guacamole, salsa Taco Loco y queso texmex + proteína a elección.',
    price: 10.00,
    category: 'burritos',
    image: grupo1,
    protein: ['Pollo', 'Carnitas', 'Cerdo BBQ'],
  },
  {
    id: 'burrito-2',
    name: 'Burrito Duo',
    description: '2 burritos con proteína a elección.',
    price: 18.50,
    category: 'burritos',
    image: grupo1,
    promo: 'OFERTA',
    protein: ['Pollo', 'Carnitas', 'Cerdo BBQ'],
  },

  // ═══ BOWLS ═══
  {
    id: 'bowl-pollo',
    name: 'Bowl de Pollo',
    description: 'Arroz especial, caraotas, crema agria, guacamole, salsa Taco Loco y queso texmex con pollo. Incluye 1 bebida.',
    price: 11.00,
    category: 'bowls',
    image: grupo11,
    protein: ['Pollo TexMex'],
    includes: '1 bebida',
  },
  {
    id: 'bowl-carnitas',
    name: 'Bowl de Carnitas',
    description: 'Arroz especial, caraotas, crema agria, guacamole, salsa Taco Loco y queso texmex con carnitas. Incluye 1 bebida.',
    price: 11.00,
    category: 'bowls',
    image: grupo11,
    protein: ['Carnitas'],
    includes: '1 bebida',
  },
  {
    id: 'bowl-cerdo',
    name: 'Bowl de Cerdo BBQ',
    description: 'Arroz especial, caraotas, crema agria, guacamole, salsa Taco Loco y queso texmex con cerdo BBQ. Incluye 1 bebida.',
    price: 11.00,
    category: 'bowls',
    image: grupo11,
    protein: ['Cerdo BBQ'],
    includes: '1 bebida',
  },

  // ═══ CHILI TEXMEX (NACHOS) ═══
  {
    id: 'chili-300',
    name: 'Chili TexMex 300g',
    description: '300 gramos de chili especial de la casa con 34 totopos crocantes.',
    price: 15.00,
    category: 'nachos',
    image: grupo6,
    includes: '34 totopos',
  },
  {
    id: 'chili-500',
    name: 'Chili TexMex 500g',
    description: '500 gramos de puro sabor TexMex para compartir con 54 totopos crocantes.',
    price: 20.00,
    category: 'nachos',
    image: grupo6,
    promo: 'GRANDE',
    includes: '54 totopos',
  },

  // ═══ QUESADILLAS ═══
  {
    id: 'quesadilla-simple',
    name: 'Quesadilla Simple',
    description: 'Quesadilla de carne o pollo con queso fundido.',
    price: 8.00,
    category: 'quesadillas',
    image: grupo33,
    protein: ['Carne', 'Pollo'],
  },
  {
    id: 'quesadilla-delux',
    name: 'Quesadilla Delux',
    description: 'Carne o pollo con queso fundido. Incluye 16 nachos y porción de guacamole.',
    price: 15.00,
    category: 'quesadillas',
    image: grupo33,
    promo: 'DELUX',
    protein: ['Carne', 'Pollo'],
    includes: '16 nachos + guacamole',
  },

  // ═══ FLAUTAS ═══
  {
    id: 'flautas',
    name: 'Flautas Doradas',
    description: 'Servicio de 4 flautas crujientes de pollo o carne.',
    price: 10.00,
    category: 'flautas',
    image: grupo33,
    protein: ['Pollo', 'Carne'],
    includes: '4 unidades',
  },
];

export const WHATSAPP_NUMBER = '584241735404';
export const WHATSAPP_URL = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`;
export const INSTAGRAM_URL = 'https://instagram.com/tacoloco_mcbo';
export const LOCATION = 'Sambil Maracaibo, Edo. Zulia, Venezuela';
