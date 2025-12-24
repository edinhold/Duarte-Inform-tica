
export enum UserRole {
  ADMIN = 'ADMIN',
  MERCHANT = 'MERCHANT',
  DRIVER = 'DRIVER',
  USER = 'USER'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface Shop {
  id: string;
  name: string;
  category: string;
  rating: number;
  image: string;
  menu: MenuItem[];
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  userId: string;
  userName: string;
  items: { menuItemId: string; quantity: number; name: string; price: number }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  driverId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}
