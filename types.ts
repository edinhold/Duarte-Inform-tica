
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

export interface TopUpProduct {
  id: string;
  name: string;
  amount: number;
  description: string;
  purchaseLink: string;
}

export interface ActivationCode {
  id: string;
  code: string;
  value: number;
  isUsed: boolean;
  usedBy?: string;
  multiUse?: boolean;
  usedByEmails?: string[];
  createdAt: string;
}

export interface PricingSettings {
  baseFee: number;
  perKmRate: number;
  minFare: number;
  regions: RegionSurcharge[];
  topUpProducts: TopUpProduct[];
}

export interface Shop {
  id: string;
  name: string;
  category: string;
  rating: number;
  image: string;
  menu: MenuItem[];
  location: Location;
  address?: string;
  phone?: string;
}

export interface Order {
  id: string;
  type: ServiceType;
  shopId?: string;
  shopName?: string;
  userId: string;
  userName: string;
  items?: { menuItemId: string; quantity: number; name: string; price: number }[];
  parcelDetails?: { 
    description: string; 
    weight?: string; 
    destination: string;
    senderName: string;
    senderPhone: string;
    recipientName: string;
    recipientPhone: string;
  };
  rideDetails?: { 
    origin: string; 
    destination: string;
  };
  total: number;
  distance?: number;
  status: OrderStatus;
  createdAt: string;
  driverId?: string;
  location: Location; 
  destinationLocation?: Location; 
  driverLocation?: Location;
  merchantRating?: number;
  driverRating?: number;
  ratedAt?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID' | 'WAITING' | 'REFUNDED';
}

export interface TopUpRecord {
  id: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  fee: number;
  netAmount: number;
  pixKey: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  isEarly: boolean;
}

export interface ApiSettings {
  paymentGateway: string;
  apiKey: string;
  webhookUrl: string;
  webhookSecret: string;
  commissionRate: number;
  earlyWithdrawalFee: number;
  defaultWithdrawalDay?: string;
  isSandbox: boolean;
  activeMethods: PaymentMethod[];
  prepaidEnabled: boolean;
  pricing: PricingSettings;
  activationCodes: ActivationCode[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  document?: string;
  pixKey?: string;
  walletBalance: number;
  topUpHistory?: TopUpRecord[];
  needsPasswordChange?: boolean;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleType?: 'CAR' | 'MOTORCYCLE';
  shopName?: string;
  withdrawalDay?: string;
}

export interface Message {
  id: string;
  text: string;
  senderRole: UserRole;
  senderName: string;
  timestamp: string;
}
