export type OrderMode = 'sur_place' | 'a_emporter' | 'livraison';
export type OrderSource = 'borne' | 'caisse' | 'serveur';
export type OrderStatus = 'en_attente' | 'en_preparation' | 'pret' | 'termine' | 'annule';
export type PaymentMethod = 'especes' | 'cib_edahabia' | 'a_la_caisse';

export interface ModifierOption {
  id: string;
  name: string;
  price: number; // in DA
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  badge: string;
  promoPriceDA?: number;
  active: boolean;
}

export interface KioskAd {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  sponsorTag: string; // ex: "Espace Pub", "Partenaire", "Nouveauté"
  placement: 'welcome' | 'menu_banner' | 'both';
  active: boolean;
}

export interface RestoBranding {
  restaurantName: string;
  tagline: string;
  logoUrl: string;
  heroBackgroundUrl: string;
  specialOffers: SpecialOffer[];
  kioskAds: KioskAd[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number; // in DA
  categoryId: string;
  image: string;
  available: boolean;
  popular?: boolean;
  spicy?: boolean;
  isNew?: boolean;
  prepTimeMin?: number;
  modifierGroups?: ModifierGroup[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  note?: string;
  unitPrice: number; // base + modifiers
}

export type EmployeeRole = 'superadmin' | 'admin' | 'caissier' | 'serveur' | 'cuisinier';

export type LicensePlan = 'demo' | 'mensuel' | 'annuel' | 'a_vie';

export interface ClientAccount {
  id: string;
  restaurantName: string;
  ownerName: string;
  phone: string;
  city: string;
  plan: LicensePlan;
  planLockedForever: boolean; // True once double-validated to 'a_vie'
  shutoff: boolean; // Emergency kill-switch
  shutoffReason?: string;
  adminPinCode: string; // Randomly generated 4-digit PIN for client admin
  licenseKey: string; // e.g., MR-DZ-4829
  maxStaffQuota: number; // Maximum number of staff/screens unlocked by Super Admin
  activatedAt: string; // ISO date
  expiresAt: string | null; // ISO date or null if 'a_vie'
}

export interface SupabaseCloudConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  pinCode: string; // 4-digit PIN code
  active: boolean;
  phone?: string;
  cashFloatDA?: number; // Fonds de caisse initial (pour caissier)
  lastLoginAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g., B-014 or C-102
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  mode: OrderMode;
  source: OrderSource;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paid: boolean;
  tableId?: string;
  tableName?: string;
  customerName?: string;
  createdAt: string; // ISO string
  cashReceived?: number;
  changeGiven?: number;
  // Employee Tracking
  createdByEmployeeId?: string;
  createdByEmployeeName?: string;
  cashedByEmployeeId?: string;
  cashedByEmployeeName?: string;
}

export type TableStatus = 'libre' | 'occupee' | 'a_encaisser' | 'reservee';
export type TableZone = 'Salle Principale' | 'Terrasse' | 'Espace Famille';

export interface RestaurantTable {
  id: string;
  name: string;
  zone: TableZone;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  guests?: number;
  occupiedSince?: string;
  reservationName?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: 'Viandes & Volailles' | 'Pains & Pâtes' | 'Fromages & Sauces' | 'Boissons' | 'Emballages';
  quantity: number;
  unit: string;
  minThreshold: number;
  costPerUnit: number; // in DA
  lastUpdated: string;
}

export type AppView =
  | 'pos'
  | 'kiosk'
  | 'tables'
  | 'orders'
  | 'menu_stock'
  | 'dashboard'
  | 'staff'
  | 'kds'
  | 'superadmin';
export type ViewportSimulation =
  | 'responsive'
  | 'pos_tablet'
  | 'kiosk_portrait'
  | 'kiosk_landscape'
  | 'mobile_waiter';


