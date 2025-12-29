
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MERCHANT = 'MERCHANT',
  DRIVER = 'DRIVER',
  USER = 'USER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

export enum ServiceType {
  FOOD = 'FOOD',
  PARCEL = 'PARCEL',
  RIDE = 'RIDE'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
  WALLET = 'WALLET',
  BOLETO = 'BOLETO'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface RegionSurcharge {
  id: string;
  name: string;
  surcharge: number;
}

export interface PricingSettings {
  baseFee: number;
  perKmRate: number;
  minFare: number;
  regions: RegionSurcharge[];
}

export interface Shop {
  id: string;
  name: string;
  category: string;
  rating: number;
  image: string;
  menu: MenuItem[];
  location: Location;
}

export interface Order {
  id: string;
  type: ServiceType;
  shopId?: string;
  shopName?: string;
  userId: string;
  userName: string;
  items?: { menuItemId: string; quantity: number; name: string; price: number }[];
  parcelDetails?: { description: string; weight: string; destination: string };
  rideDetails?: { origin: string; destination: string };
  total: number;
  status: OrderStatus;
  createdAt: string;
  driverId?: string;
  location?: Location;
  destinationLocation?: Location;
  driverLocation?: Location;
  merchantRating?: number;
  driverRating?: number;
  ratedAt?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID' | 'WAITING' | 'REFUNDED';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  orderId?: string;
}

export interface ApiSettings {
  paymentGateway: string;
  apiKey: string;
  webhookUrl: string;
  commissionRate: number;
  isSandbox: boolean;
  activeMethods: PaymentMethod[];
  prepaidEnabled: boolean;
  pricing: PricingSettings;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  document?: string; // CPF ou CNPJ
  walletBalance: number;
  needsPasswordChange?: boolean;
  // Campos específicos de Motorista
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleType?: 'CAR' | 'MOTORCYCLE';
  // Campos específicos de Lojista
  shopName?: string;
}
