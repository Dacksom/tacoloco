
import { SubItem, OptionCategory } from './types';

// PRECIOS BASE
export const PRICES = {
  SANDWICH_15: 7.99,
  SANDWICH_30: 15.49,
  SALAD: 7.99,
  PIZZA: 7.99,
  EXTRA_PROTEIN: 4.00
};

// COSTOS DE EXTRAS
export const EXTRA_COSTS = {
  sandwich_15: {
    extras: 1.00,  // Embutidos/Quesos
    veggies: 0.50,
    sauces: 0.50
  },
  sandwich_30: {
    extras: 2.00,
    veggies: 1.00,
    sauces: 0.50
  },
  salad: {
    extras: 1.00,
    veggies: 0.50,
    sauces: 0.50
  },
  pizza: {
    extras: 1.00,  // Embutidos
    veggies: 0.50,
    sauces: 0.50   // Not used but defined
  }
};

// LIMITES INCLUIDOS (Gratis)
export const INCLUDED_LIMITS = {
  sandwich: {
    extras: 2, // Quesos/Embutidos
    veggies: 4, // 4 Vegetales incluidos
    sauces: 3
  },
  salad: {
    extras: 1, // Quesos/Embutidos (1 incluido)
    veggies: 5, // 5 Vegetales
    sauces: 3   // 3 Salsas
  },
  pizza: {
    extras: 1, // 1 Embutido incluido
    veggies: 2, // 2 Vegetales incluidos
    sauces: 0   // No sauces for pizza
  }
};

export const COLORS = {
  green: '#006837',
  yellow: '#FFCC00',
  white: '#FFFFFF',
  accent: '#004d29'
};

// --- BASE DE DATOS DEL MENÚ ---

export const PROTEINS: SubItem[] = [
  {
    id: 'rb',
    name: 'Roast beef',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/roast-beef.jpg',
    description: 'Finas lascas de roast beef premium.'
  },
  {
    id: 'at',
    name: 'Atún',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/atun.jpg',
    description: 'Nuestra clásica mezcla de atún.'
  },
  {
    id: 'pa',
    name: 'Pollo asado',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/pollo-asado.jpg',
    description: 'Pechuga de pollo a la parrilla.'
  },
  {
    id: 'ca',
    name: 'Carne asada',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/carne-teriyaki.jpg', // Usando imagen existente
    description: 'Carne asada jugosa.'
  },
  {
    id: 'pt',
    name: 'Pollo teriyaki',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/pollo-teriyaki.jpg',
    description: 'Pollo con salsa teriyaki dulce.'
  },
  {
    id: 'ct',
    name: 'Carne Teriyaki',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/carne-teriyaki.jpg',
    description: 'Carne marinada en teriyaki.'
  },
  {
    id: 'cha',
    name: 'Chuleta ahumada',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/cerdo.jpg', // Usando imagen de cerdo
    description: 'Chuleta de cerdo ahumada.'
  },
  {
    id: 'cc',
    name: 'Costilla de cerdo',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/cerdo.jpg', // Usando imagen de cerdo
    description: 'Costillas tiernas deshuesadas.'
  },
  // Solo para ensaladas (Algunas se repiten pero es para filtrar si se desea)
  {
    id: 'pp',
    name: 'Pollo a la plancha',
    image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/proteina/pollo-asado.jpg',
    description: 'Pollo ligero a la plancha.'
  }
];

export const BREADS: OptionCategory = {
  title: 'Tipos de Panes',
  items: [
    { id: 'b1', name: 'Orégano parmesano', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/pan/pan-oregano-parmesano.jpg' },
    { id: 'b4', name: 'Orégano', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/pan/pan-oregano-parmesano.jpg' },
    { id: 'b2', name: 'Holandés', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/pan/pan-blanco.jpg' }, // Placeholder visual
    { id: 'b3', name: 'Ajonjolí', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/pan/pan-ajonjoli.jpg' }
  ]
};

export const EXTRAS: OptionCategory = {
  title: 'Embutidos y Quesos',
  items: [
    { id: 'e1', name: 'Queso mozzarella', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/queso-mozarella.jpg' },
    { id: 'e2', name: 'Queso amarillo', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/queso-cheddar.jpg' }, // Visual similar
    { id: 'e3', name: 'Queso Cheddar', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/queso-cheddar.jpg' },
    { id: 'e4', name: 'Jamón ahumado', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/jamon-ahumado.jpg' },
    { id: 'e5', name: 'Jamón de pavo', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/jamon.jpg' },
    { id: 'e6', name: 'Pepperoni', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/peperoni.jpg' },
    { id: 'e7', name: 'Queso Parmesano', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/parmesano-queso.jpg', available_for: ['PIZZA'] },
    { id: 'e_toc', name: 'Tocineta', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/embutidos%20o%20quesos/tocineta.jpg' }
  ]
};

export const VEGETABLES: OptionCategory = {
  title: 'Vegetales',
  items: [
    { id: 'v1', name: 'Lechuga', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/lechuga.jpg' },
    { id: 'v2', name: 'Tomate', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/tomate.jpg' },
    { id: 'v3', name: 'Maíz', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/maiz.jpg' },
    { id: 'v4', name: 'Pepinillos', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/pepinillos.jpg' },
    { id: 'v5', name: 'Aceitunas negras', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/pepinillos.jpg' }, // Placeholder
    { id: 'v6', name: 'Cebolla caramelizada', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/cebolla.jpg' },
    { id: 'v7', name: 'Cebolla morada', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/cebolla.jpg' },
    { id: 'v8', name: 'Pimentón', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/pimenton.jpg' },
    { id: 'v9', name: 'Pepino', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/pepinillos.jpg' }, // Placeholder
    { id: 'v10', name: 'Almendras fileteadas', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/maiz.jpg' }, // Placeholder
    { id: 'v11', name: 'Pasas', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/vegetales/maiz.jpg' } // Placeholder
  ]
};

export const SAUCES: OptionCategory = {
  title: 'Salsas',
  items: [
    { id: 's1', name: 'Salsa de Tomate', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/bbq.jpg' }, // Placeholder
    { id: 's2', name: 'Mayonesa', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/mayonesa.jpg' },
    { id: 's3', name: 'Mostaza', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/mostaza.jpg' },
    { id: 's4', name: 'BBQ', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/bbq.jpg' },
    { id: 's5', name: 'Miel mostaza', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/mostaza.jpg' },
    { id: 's6', name: 'Pesto', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/ranch.jpg' },
    { id: 's7', name: 'Vinagre balsámico', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/aceite-de-oliva.jpg' },
    { id: 's8', name: 'Salsa ranch', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/ranch.jpg' },
    { id: 's9', name: 'Chipotle', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/chipotle.jpg' },
    { id: 's10', name: 'Aceite de oliva', image: 'https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/salsa/aceite-de-oliva.jpg' }
  ]
};
