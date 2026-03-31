import { Promo } from '../types';

import grupo1 from '../../identidad y menu/Grupo 1.png';
import grupo22 from '../../identidad y menu/Grupo 22.png';
import grupo2 from '../../identidad y menu/Grupo 2.png';

export const PROMOS: Promo[] = [
  {
    id: 'taco-lunch',
    name: 'Taco Lunch',
    description: 'La promo ideal para compartir x2',
    includes: '4 Tostadas + 1 Chili TexMex + 2 Bebidas',
    price: 19.00,
    image: grupo22,
    highlight: true,
  },
  {
    id: 'top-2',
    name: 'El Auténtico Top 2',
    description: 'Lo mejor de dos mundos',
    includes: '1 Burrito + 1 Bowl + Pepsi 1.5L',
    price: 15.99,
    image: grupo2,
    highlight: true,
  },
  {
    id: 'combo-mix-duo',
    name: 'Combo Mix Duo',
    description: 'La combinación perfecta',
    includes: '1 Burrito (Pollo, Carnitas o Cerdo BBQ) + Servicio de Flautas',
    price: 20.00,
    image: grupo1,
  },
];
