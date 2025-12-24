
import { Shop, Order, OrderStatus, UserRole } from './types';

export const MOCK_SHOPS: Shop[] = [
  {
    id: 's1',
    name: 'Burger Galaxy',
    category: 'Hambúrgueres',
    rating: 4.8,
    image: 'https://picsum.photos/seed/burger/400/300',
    menu: [
      { id: 'm1', name: 'Supernova Burger', description: 'Carne 200g, queijo cheddar, bacon crocante.', price: 35.90, image: 'https://picsum.photos/seed/m1/200/200' },
      { id: 'm2', name: 'Meteor Fries', description: 'Batatas com páprica e molho especial.', price: 18.00, image: 'https://picsum.photos/seed/m2/200/200' },
    ]
  },
  {
    id: 's2',
    name: 'Pizza Planet',
    category: 'Pizzas',
    rating: 4.5,
    image: 'https://picsum.photos/seed/pizza/400/300',
    menu: [
      { id: 'm3', name: 'Margherita Clássica', description: 'Molho de tomate, mussarela e manjericão.', price: 45.00, image: 'https://picsum.photos/seed/m3/200/200' },
      { id: 'm4', name: 'Pepperoni Blast', description: 'Pepperoni, mussarela e orégano.', price: 52.00, image: 'https://picsum.photos/seed/m4/200/200' },
    ]
  },
  {
    id: 's3',
    name: 'Sushi Zen',
    category: 'Japonesa',
    rating: 4.9,
    image: 'https://picsum.photos/seed/sushi/400/300',
    menu: [
      { id: 'm5', name: 'Combo Salmão 20 pçs', description: 'Sashimis, nigiris e uramakis de salmão.', price: 89.90, image: 'https://picsum.photos/seed/m5/200/200' },
    ]
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    shopId: 's1',
    shopName: 'Burger Galaxy',
    userId: 'u1',
    userName: 'Carlos Silva',
    items: [{ menuItemId: 'm1', quantity: 2, name: 'Supernova Burger', price: 35.90 }],
    total: 71.80,
    status: OrderStatus.PREPARING,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD-002',
    shopId: 's2',
    shopName: 'Pizza Planet',
    userId: 'u2',
    userName: 'Maria Souza',
    items: [{ menuItemId: 'm3', quantity: 1, name: 'Margherita Clássica', price: 45.00 }],
    total: 45.00,
    status: OrderStatus.PENDING,
    createdAt: new Date().toISOString(),
  }
];
