import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppView,
  CartItem,
  Category,
  ClientAccount,
  Employee,
  LicensePlan,
  MenuItem,
  ModifierGroup,
  Order,
  OrderMode,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PrinterSettings,
  RestaurantTable,
  RestoBranding,
  StockItem,
  SupabaseCloudConfig,
  ViewportSimulation,
} from '../types';
import {
  CATEGORIES,
  INITIAL_BRANDING,
  INITIAL_CLIENTS,
  INITIAL_EMPLOYEES,
  INITIAL_MENU_ITEMS,
  INITIAL_MODIFIER_GROUPS,
  INITIAL_ORDERS,
  INITIAL_STOCK_ITEMS,
  INITIAL_TABLES,
} from '../data/initialData';
import {
  fetchAllCloudLicenses,
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  upsertCloudLicense,
  verifyAdminCodeInCloud,
} from '../lib/supabaseLicenseCloud';
import {
  executePrintJob,
  getSavedPrinterSettings,
  savePrinterSettings,
} from '../lib/thermalPrinter';

interface RestoContextType {
  // Navigation & Viewport
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  viewportSim: ViewportSimulation;
  setViewportSim: (sim: ViewportSimulation) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Separate Super Admin Portal (Never visible by button; unlocked via master code on commercial login)
  isSuperAdminPortal: boolean;
  setIsSuperAdminPortal: (val: boolean) => void;
  isSuperAdminAuthenticated: boolean;
  logoutSuperAdmin: () => void;

  // Minimal Cloud Supabase Config (Only for Admin Licenses & Staff Quota)
  supabaseConfig: SupabaseCloudConfig;
  updateSupabaseConfig: (cfg: SupabaseCloudConfig) => Promise<void>;
  syncCloudLicensesNow: () => Promise<void>;

  // Super Admin SaaS Clients, Subscriptions, Staff Quota & Shutoff
  clients: ClientAccount[];
  activeClientId: string;
  setActiveClientId: (id: string) => void;
  activeClient: ClientAccount | null;
  addClientAccount: (params: {
    restaurantName: string;
    ownerName: string;
    phone: string;
    city: string;
    plan: LicensePlan;
    maxStaffQuota: number;
    customAdminPin?: string;
  }) => ClientAccount;
  changeClientPlan: (clientId: string, newPlan: LicensePlan) => boolean;
  updateClientStaffQuota: (clientId: string, maxStaffQuota: number) => void;
  toggleClientShutoff: (clientId: string, reason?: string) => void;
  regenerateClientAdminPin: (clientId: string) => string;

  // Auth: 1) Commercial Admin Login vs 2) Special Internal Restaurant Staff Interface
  employees: Employee[];
  currentEmployee: Employee | null;
  isStaffTerminal: boolean;
  setIsStaffTerminal: (val: boolean) => void;
  isKioskTerminal: boolean;
  setIsKioskTerminal: (val: boolean) => void;
  loginCommercialAdmin: (code: string) => Promise<{ success: boolean; message?: string }>;
  loginWithPin: (pin: string, cashFloatDA?: number) => { success: boolean; employee?: Employee; message?: string };
  logoutEmployee: () => void;
  addEmployee: (emp: Omit<Employee, 'id'>) => boolean;
  updateEmployee: (emp: Employee) => boolean;
  deleteEmployee: (id: string) => void;
  getStaffInternalUrl: () => string;

  // Menu, Categories, Custom Modifier Groups (Taille, Gratinage, Sauces, Suppléments), Branding & Stock
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  branding: RestoBranding;
  updateBranding: (next: RestoBranding) => void;
  menuItems: MenuItem[];
  toggleMenuItemAvailability: (id: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  modifierGroups: ModifierGroup[];
  saveModifierGroup: (group: ModifierGroup) => void;
  deleteModifierGroup: (groupId: string) => void;
  stockItems: StockItem[];
  updateStockQuantity: (id: string, delta: number) => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'lastUpdated'>) => void;

  // Tables
  tables: RestaurantTable[];
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  updateTableStatus: (tableId: string, status: RestaurantTable['status'], guests?: number, reservationName?: string) => void;
  addTable: (name: string, zone: RestaurantTable['zone'], capacity: number) => void;

  // Orders
  orders: Order[];
  createOrder: (params: {
    items: CartItem[];
    mode: OrderMode;
    source: OrderSource;
    paymentMethod: PaymentMethod;
    paid: boolean;
    discount?: number;
    tableId?: string;
    customerName?: string;
    cashReceived?: number;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  markOrderPaid: (orderId: string, paymentMethod: PaymentMethod, cashReceived?: number) => void;

  // Notification toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Thermal Printers Configuration
  printerSettings: PrinterSettings;
  updatePrinterSettings: (settings: Partial<PrinterSettings>) => void;
}

const RestoContext = createContext<RestoContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CATEGORIES: 'monresto_categories_v6_commercial',
  BRANDING: 'monresto_branding_v6_commercial',
  MENU: 'monresto_menu_v6_commercial',
  MODIFIERS: 'monresto_modifiers_v6_commercial',
  ORDERS: 'monresto_orders_v6_commercial',
  TABLES: 'monresto_tables_v6_commercial',
  STOCK: 'monresto_stock_v6_commercial',
  EMPLOYEES: 'monresto_employees_v6_commercial',
  CLIENTS: 'monresto_clients_v6_commercial',
  ACTIVE_CLIENT: 'monresto_active_client_v6_commercial',
};

export const generateRandomPin = (existingPins: string[] = []): string => {
  for (let i = 0; i < 50; i++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    if (pin !== '9999' && pin !== '0000' && !existingPins.includes(pin)) {
      return pin;
    }
  }
  return String(Math.floor(1000 + Math.random() * 8999));
};

export const computeExpirationDate = (plan: LicensePlan): string | null => {
  const now = new Date();
  if (plan === 'demo') {
    return new Date(now.getTime() + 21 * 86400000).toISOString(); // 21 jours
  }
  if (plan === 'mensuel') {
    return new Date(now.getTime() + 30 * 86400000).toISOString(); // 1 mois (30 jours)
  }
  if (plan === 'annuel') {
    return new Date(now.getTime() + 365 * 86400000).toISOString(); // 1 an (365 jours)
  }
  return null; // 'a_vie' = illimité
};

export const RestoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getUrlParams = () => new URLSearchParams(window.location.search);

  const isInitialKioskUrl = () => getUrlParams().get('mode') === 'kiosk';
  const isInitialStaffUrl = () => getUrlParams().get('terminal') === 'staff';
  const getInitialClientFromUrl = () => getUrlParams().get('resto') || '';

  const [activeView, setActiveView] = useState<AppView>(() =>
    isInitialKioskUrl() ? 'kiosk' : 'pos'
  );
  const [viewportSim, setViewportSim] = useState<ViewportSimulation>('responsive');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Separate Super Admin Portal State (Only accessible by secret master code on commercial login)
  const [isSuperAdminPortal, setIsSuperAdminPortal] = useState<boolean>(false);
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(false);

  // Special Internal Restaurant Staff Terminal Mode vs Commercial Admin Login
  const [isStaffTerminal, setIsStaffTerminal] = useState<boolean>(isInitialStaffUrl);
  const [isKioskTerminal, setIsKioskTerminal] = useState<boolean>(isInitialKioskUrl);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // Minimal Cloud Supabase Configuration
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseCloudConfig>(getSavedSupabaseConfig);

  // Thermal Printer Settings (POS Caisse & KDS Cuisine)
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(getSavedPrinterSettings);

  const updatePrinterSettings = (newSettings: Partial<PrinterSettings>) => {
    setPrinterSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      savePrinterSettings(updated);
      return updated;
    });
  };

  const [clients, setClients] = useState<ClientAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (!saved) return INITIAL_CLIENTS;
      const parsed: ClientAccount[] = JSON.parse(saved);
      return parsed.map((c) => ({
        ...c,
        maxStaffQuota: c.maxStaffQuota ?? 3,
      }));
    } catch {
      return INITIAL_CLIENTS;
    }
  });

  const [activeClientId, setActiveClientId] = useState<string>(() => {
    const fromUrl = getInitialClientFromUrl();
    if (fromUrl) return fromUrl;
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CLIENT) || '';
    } catch {
      return '';
    }
  });

  const activeClient: ClientAccount | null =
    clients.find((c) => c.id === activeClientId) || clients[0] || null;

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : CATEGORIES;
    } catch {
      return CATEGORIES;
    }
  });

  const [branding, setBranding] = useState<RestoBranding>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRANDING);
      return saved ? JSON.parse(saved) : INITIAL_BRANDING;
    } catch {
      return INITIAL_BRANDING;
    }
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MENU);
      return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  });

  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODIFIERS);
      return saved ? JSON.parse(saved) : INITIAL_MODIFIER_GROUPS;
    } catch {
      return INITIAL_MODIFIER_GROUPS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TABLES);
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  });

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => setIsFullscreen((prev) => !prev));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => setIsFullscreen(false));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLIENT, activeClientId);
  }, [activeClientId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODIFIERS, JSON.stringify(modifierGroups));
  }, [modifierGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stockItems));
  }, [stockItems]);

  // Ensure activeClient always has its corresponding Admin employee synced
  useEffect(() => {
    if (!activeClient) return;
    setEmployees((prev) => {
      const adminEmpId = `emp-admin-${activeClient.id}`;
      const existingAdmin = prev.find((e) => e.id === adminEmpId || e.role === 'admin');
      if (existingAdmin) {
        return prev.map((emp) =>
          emp.id === existingAdmin.id
            ? {
                ...emp,
                pinCode: activeClient.adminPinCode,
                name: `${activeClient.ownerName || 'Administrateur'} (${activeClient.restaurantName})`,
              }
            : emp
        );
      }
      return [
        {
          id: adminEmpId,
          name: `${activeClient.ownerName || 'Administrateur'} (${activeClient.restaurantName})`,
          role: 'admin',
          pinCode: activeClient.adminPinCode,
          active: true,
        },
        ...prev,
      ];
    });
  }, [activeClient?.id, activeClient?.adminPinCode, activeClient?.restaurantName, activeClient?.ownerName]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ORDERS && e.newValue) {
        const updatedOrders: Order[] = JSON.parse(e.newValue);
        setOrders(updatedOrders);
        if (updatedOrders.length > orders.length && updatedOrders[0]?.source === 'borne') {
          showToast(`🔔 Nouvelle commande Borne reçue : #${updatedOrders[0].orderNumber}`);
        }
      } else if (e.key === STORAGE_KEYS.MENU && e.newValue) {
        setMenuItems(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.MODIFIERS && e.newValue) {
        setModifierGroups(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.TABLES && e.newValue) {
        setTables(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.STOCK && e.newValue) {
        setStockItems(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.EMPLOYEES && e.newValue) {
        setEmployees(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.CLIENTS && e.newValue) {
        setClients(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.CATEGORIES && e.newValue) {
        setCategories(JSON.parse(e.newValue));
      } else if (e.key === STORAGE_KEYS.BRANDING && e.newValue) {
        setBranding(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [orders.length]);

  // SUPABASE CLOUD SYNC HELPERS (Minimal Cloud Consumption: Only client_licenses table)
  const updateSupabaseConfig = async (cfg: SupabaseCloudConfig) => {
    setSupabaseConfig(cfg);
    saveSupabaseConfig(cfg);
    if (cfg.enabled && cfg.url && cfg.anonKey) {
      const cloudClients = await fetchAllCloudLicenses(cfg);
      if (cloudClients) {
        setClients(cloudClients);
        showToast(`☁️ Connecté à Supabase (${cloudClients.length} licence(s) synchronisée(s))`);
      } else {
        showToast('⚠️ Connexion Supabase enregistrée (Vérifiez que la table client_licenses existe)');
      }
    } else {
      showToast('Mode stockage local activé');
    }
  };

  const syncCloudLicensesNow = async () => {
    if (!supabaseConfig.enabled) return;
    const cloudClients = await fetchAllCloudLicenses(supabaseConfig);
    if (cloudClients) {
      setClients(cloudClients);
      showToast(`☁️ Licences synchronisées depuis Supabase (${cloudClients.length})`);
    }
  };

  const logoutSuperAdmin = () => {
    setIsSuperAdminAuthenticated(false);
    setIsSuperAdminPortal(false);
  };

  // SUPER ADMIN FUNCTIONS
  const addClientAccount = (params: {
    restaurantName: string;
    ownerName: string;
    phone: string;
    city: string;
    plan: LicensePlan;
    maxStaffQuota: number;
    customAdminPin?: string;
  }): ClientAccount => {
    const existingPins = [
      ...clients.map((c) => c.adminPinCode),
      ...employees.map((e) => e.pinCode),
    ];
    const adminPinCode =
      params.customAdminPin && params.customAdminPin.length === 4
        ? params.customAdminPin
        : generateRandomPin(existingPins);

    const cityCode = (params.city || 'DZ').slice(0, 3).toUpperCase();
    const licenseKey = `MR-DZ-${adminPinCode}-${cityCode}`;

    const newClient: ClientAccount = {
      id: `cli-${Date.now()}`,
      restaurantName: params.restaurantName,
      ownerName: params.ownerName,
      phone: params.phone,
      city: params.city,
      plan: params.plan,
      planLockedForever: params.plan === 'a_vie',
      shutoff: false,
      adminPinCode,
      licenseKey,
      maxStaffQuota: Math.max(1, Number(params.maxStaffQuota) || 3),
      activatedAt: new Date().toISOString(),
      expiresAt: computeExpirationDate(params.plan),
    };

    setClients((prev) => [newClient, ...prev]);
    setActiveClientId(newClient.id);

    // Sync single row to Supabase Cloud if enabled
    if (supabaseConfig.enabled) {
      upsertCloudLicense(supabaseConfig, newClient);
    }

    if (clients.length === 0) {
      setBranding((prev) => ({
        ...prev,
        restaurantName: newClient.restaurantName,
      }));
    }

    const adminEmp: Employee = {
      id: `emp-admin-${newClient.id}`,
      name: `${newClient.ownerName || 'Administrateur'} (${newClient.restaurantName})`,
      role: 'admin',
      pinCode: adminPinCode,
      active: true,
    };
    setEmployees((prev) => [
      adminEmp,
      ...prev.filter((e) => e.role !== 'admin'),
    ]);

    showToast(
      `✅ Client "${newClient.restaurantName}" créé ! Code Admin : ${adminPinCode} (${newClient.maxStaffQuota} Staff max)`
    );
    return newClient;
  };

  const changeClientPlan = (clientId: string, newPlan: LicensePlan): boolean => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return false;

    if (target.planLockedForever || target.plan === 'a_vie') {
      showToast('🔒 Ce compte est en licence À VIE : son état est verrouillé définitivement !');
      return false;
    }

    const expiresAt = computeExpirationDate(newPlan);
    const isNowLifetime = newPlan === 'a_vie';
    const updatedClient: ClientAccount = {
      ...target,
      plan: newPlan,
      planLockedForever: isNowLifetime,
      activatedAt: new Date().toISOString(),
      expiresAt,
    };

    setClients((prev) => prev.map((c) => (c.id === clientId ? updatedClient : c)));
    if (supabaseConfig.enabled) {
      upsertCloudLicense(supabaseConfig, updatedClient);
    }

    const planLabels: Record<LicensePlan, string> = {
      demo: 'Activation Initiale (21 jours)',
      mensuel: 'Abonnement Mensuel (1 mois / 30j)',
      annuel: 'Abonnement Annuel (1 an / 365j)',
      a_vie: 'Licence À VIE (Verrouillée définitivement)',
    };

    showToast(`✅ Abonnement de "${target.restaurantName}" passé à : ${planLabels[newPlan]}`);
    return true;
  };

  const updateClientStaffQuota = (clientId: string, maxStaffQuota: number) => {
    const quota = Math.max(1, maxStaffQuota);
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const updated = { ...c, maxStaffQuota: quota };
          if (supabaseConfig.enabled) {
            upsertCloudLicense(supabaseConfig, updated);
          }
          showToast(`👥 Quota Staff de "${c.restaurantName}" fixé à ${quota} employé(s)/écran(s)`);
          return updated;
        }
        return c;
      })
    );
  };

  const toggleClientShutoff = (clientId: string, reason?: string) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const nextShutoff = !c.shutoff;
          const updated: ClientAccount = {
            ...c,
            shutoff: nextShutoff,
            shutoffReason: nextShutoff
              ? reason || 'Suspension administrative par Super Admin'
              : undefined,
          };
          if (supabaseConfig.enabled) {
            upsertCloudLicense(supabaseConfig, updated);
          }
          showToast(
            nextShutoff
              ? `⛔ SHUTOFF ACTIVÉ pour "${c.restaurantName}" (Accès coupé)`
              : `✅ Accès réactivé pour "${c.restaurantName}"`
          );
          return updated;
        }
        return c;
      })
    );
  };

  const regenerateClientAdminPin = (clientId: string): string => {
    const existingPins = [
      ...clients.map((c) => c.adminPinCode),
      ...employees.map((e) => e.pinCode),
    ];
    const newPin = generateRandomPin(existingPins);

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const updated: ClientAccount = {
            ...c,
            adminPinCode: newPin,
            licenseKey: `MR-DZ-${newPin}-${(c.city || 'DZ').slice(0, 3).toUpperCase()}`,
          };
          if (supabaseConfig.enabled) {
            upsertCloudLicense(supabaseConfig, updated);
          }
          return updated;
        }
        return c;
      })
    );
    showToast(`🔑 Nouveau code PIN Admin aléatoire généré : ${newPin}`);
    return newPin;
  };

  // =========================================================================
  // 1. MAIN COMMERCIAL LOGIN (STRICTLY FOR RESTAURANT ADMINS + HIDDEN SUPER ADMIN)
  // Staff codes CANNOT log in here!
  // =========================================================================
  const loginCommercialAdmin = async (
    code: string
  ): Promise<{ success: boolean; message?: string }> => {
    const clean = code.trim();
    if (!clean) {
      return { success: false, message: 'Veuillez saisir votre code d’accès.' };
    }

    // 1. Hidden Super Admin Master Code Check (Zero visible button in UI!)
    if (clean === '9999' || clean.toUpperCase() === 'SUPERADMIN') {
      setIsSuperAdminAuthenticated(true);
      setIsSuperAdminPortal(true);
      if (supabaseConfig.enabled) {
        const cloudList = await fetchAllCloudLicenses(supabaseConfig);
        if (cloudList) setClients(cloudList);
      }
      showToast('🔓 Console Super Admin déverrouillée');
      return { success: true };
    }

    // 2. If Supabase Cloud is enabled, perform 1 single lightweight SELECT to verify Admin license & pull maxStaffQuota
    let matchedClient: ClientAccount | undefined;
    if (supabaseConfig.enabled) {
      const cloudClient = await verifyAdminCodeInCloud(supabaseConfig, clean);
      if (cloudClient) {
        matchedClient = cloudClient;
        setClients((prev) => {
          const exists = prev.some((c) => c.id === cloudClient.id);
          return exists
            ? prev.map((c) => (c.id === cloudClient.id ? cloudClient : c))
            : [cloudClient, ...prev];
        });
      }
    }

    // 3. Fallback to local client license check
    if (!matchedClient) {
      matchedClient = clients.find(
        (c) =>
          c.adminPinCode === clean ||
          c.licenseKey.toUpperCase() === clean.toUpperCase()
      );
    }

    if (!matchedClient) {
      // Check if user accidentally entered a Staff PIN on the Commercial Admin Login page!
      const isStaffPin = employees.some(
        (e) => e.pinCode === clean && e.role !== 'admin'
      );
      if (isStaffPin) {
        return {
          success: false,
          message:
            '⛔ Ce portail principal est réservé au compte Administrateur du restaurant. Le personnel (Serveur / Caissier / Cuisine) doit utiliser le Lien Interne Staff du restaurant.',
        };
      }
      return {
        success: false,
        message: 'Code Licence / Administrateur invalide.',
      };
    }

    // 4. Verify Shutoff & Expiration
    const isExpired =
      matchedClient.expiresAt !== null &&
      new Date(matchedClient.expiresAt).getTime() < Date.now();

    if (matchedClient.shutoff || isExpired) {
      return {
        success: false,
        message: matchedClient.shutoff
          ? `⛔ Accès suspendu (SHUTOFF actif sur ${matchedClient.restaurantName}).`
          : `⏳ Abonnement expiré pour ${matchedClient.restaurantName}.`,
      };
    }

    // 5. Activate this client & log in the Restaurant Admin
    setActiveClientId(matchedClient.id);
    setBranding((prev) => ({
      ...prev,
      restaurantName: matchedClient!.restaurantName,
    }));

    const nowStr = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const adminEmp: Employee = {
      id: `emp-admin-${matchedClient.id}`,
      name: `${matchedClient.ownerName || 'Administrateur'} (${matchedClient.restaurantName})`,
      role: 'admin',
      pinCode: matchedClient.adminPinCode,
      active: true,
      lastLoginAt: `Aujourd’hui, ${nowStr}`,
    };

    setEmployees((prev) => [
      adminEmp,
      ...prev.filter((e) => e.id !== adminEmp.id && e.role !== 'admin'),
    ]);
    setCurrentEmployee(adminEmp);
    setIsKioskTerminal(false);
    setActiveView('staff'); // Open directly on Staff & Internal Link / POS
    showToast(`👋 Bienvenue dans l’espace Administrateur de ${matchedClient.restaurantName}`);
    return { success: true };
  };

  // =========================================================================
  // 2. SPECIAL INTERNAL RESTAURANT STAFF LOGIN (For Caissier, Serveur, Cuisinier & Admin)
  // =========================================================================
  const loginWithPin = (pin: string, cashFloatDA?: number) => {
    const cleanPin = pin.trim();

    if (!activeClient) {
      return {
        success: false,
        message: 'Aucun restaurant actif sur ce terminal.',
      };
    }

    const isClientExpired =
      activeClient.expiresAt !== null &&
      new Date(activeClient.expiresAt).getTime() < Date.now();

    if (activeClient.shutoff || isClientExpired) {
      return {
        success: false,
        message: activeClient.shutoff
          ? `⛔ Accès suspendu (SHUTOFF actif sur ${activeClient.restaurantName}).`
          : `⏳ Abonnement expiré pour ${activeClient.restaurantName}.`,
      };
    }

    let found = employees.find((e) => e.pinCode === cleanPin);

    if (!found && cleanPin === activeClient.adminPinCode) {
      found = {
        id: `emp-admin-${activeClient.id}`,
        name: `${activeClient.ownerName || 'Administrateur'} (${activeClient.restaurantName})`,
        role: 'admin',
        pinCode: activeClient.adminPinCode,
        active: true,
      };
      setEmployees((prev) => [found!, ...prev]);
    }

    if (!found) {
      return { success: false, message: 'Code PIN Staff invalide. Veuillez réessayer.' };
    }
    if (!found.active) {
      return {
        success: false,
        message: 'Ce compte employé est désactivé par l’administrateur.',
      };
    }

    const nowStr = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedEmp: Employee = {
      ...found,
      lastLoginAt: `Aujourd’hui, ${nowStr}`,
      cashFloatDA: cashFloatDA !== undefined ? cashFloatDA : found.cashFloatDA,
    };

    setEmployees((prev) => prev.map((e) => (e.id === found!.id ? updatedEmp : e)));
    setCurrentEmployee(updatedEmp);
    setIsKioskTerminal(false);

    if (found.role === 'admin' || found.role === 'caissier') {
      setActiveView('pos');
    } else if (found.role === 'serveur') {
      setActiveView('tables');
    } else if (found.role === 'cuisinier') {
      setActiveView('kds');
    }

    showToast(`👋 Session ouverte : ${found.name}`);
    return { success: true, employee: updatedEmp };
  };

  const logoutEmployee = () => {
    if (currentEmployee) {
      showToast(`🔒 Session fermée (${currentEmployee.name})`);
    }
    setCurrentEmployee(null);
    setIsKioskTerminal(false);
  };

  const getStaffInternalUrl = (): string => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?terminal=staff${activeClient ? `&resto=${activeClient.id}` : ''}`;
  };

  // STRICT LOCAL ENFORCEMENT OF STAFF QUOTA UNLOCKED BY SUPER ADMIN
  const addEmployee = (emp: Omit<Employee, 'id'>): boolean => {
    const currentStaffCount = employees.filter(
      (e) => e.role !== 'admin' && e.role !== 'superadmin'
    ).length;
    const maxAllowed = activeClient?.maxStaffQuota ?? 3;

    if (emp.role !== 'admin' && currentStaffCount >= maxAllowed) {
      showToast(
        `🔒 Quota Staff atteint (${currentStaffCount}/${maxAllowed} écrans/comptes). Contactez l’éditeur pour débloquer plus de comptes Staff.`
      );
      return false;
    }

    if (employees.some((e) => e.pinCode === emp.pinCode.trim())) {
      showToast('⚠️ Ce code PIN est déjà utilisé par un autre employé !');
      return false;
    }
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
      pinCode: emp.pinCode.trim(),
    };
    setEmployees((prev) => [...prev, newEmp]);
    showToast(`✅ Compte Staff "${newEmp.name}" créé (${currentStaffCount + 1}/${maxAllowed} utilisés)`);
    return true;
  };

  const updateEmployee = (updated: Employee): boolean => {
    if (
      employees.some(
        (e) => e.id !== updated.id && e.pinCode === updated.pinCode.trim()
      )
    ) {
      showToast('⚠️ Ce code PIN est déjà attribué à un autre employé !');
      return false;
    }
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (currentEmployee?.id === updated.id) {
      setCurrentEmployee(updated);
    }
    showToast(`✅ Profil de "${updated.name}" mis à jour`);
    return true;
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find((e) => e.id === id);
    if (target?.role === 'admin' && employees.filter((e) => e.role === 'admin').length <= 1) {
      showToast('⚠️ Impossible de supprimer le compte Administrateur principal !');
      return;
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    showToast('Compte employé supprimé (1 place de quota Staff libérée)');
  };

  const addCategory = (cat: Omit<Category, 'id'>) => {
    const slug = cat.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const newCat: Category = {
      ...cat,
      id: `${slug || 'cat'}_${Date.now().toString().slice(-4)}`,
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`✅ Catégorie "${newCat.name}" ajoutée`);
  };

  const updateCategory = (cat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
    showToast(`✅ Catégorie "${cat.name}" modifiée`);
  };

  const deleteCategory = (id: string) => {
    if (id === 'all') return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('Catégorie supprimée');
  };

  const updateBranding = (next: RestoBranding) => {
    setBranding(next);
    showToast('✅ Identité visuelle, Offres & Espaces Pub Borne mis à jour');
  };

  const toggleMenuItemAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.available;
          showToast(`${item.name} est maintenant ${next ? 'Disponible' : 'En rupture'}`);
          return { ...item, available: next };
        }
        return item;
      })
    );
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`,
    };
    setMenuItems((prev) => [newItem, ...prev]);
    showToast(`Article "${newItem.name}" ajouté au menu`);
  };

  const updateMenuItem = (updated: MenuItem) => {
    setMenuItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    showToast(`Article "${updated.name}" mis à jour`);
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
    showToast('Article supprimé du menu');
  };

  const saveModifierGroup = (group: ModifierGroup) => {
    setModifierGroups((prev) => {
      const exists = prev.some((g) => g.id === group.id);
      if (exists) {
        return prev.map((g) => (g.id === group.id ? group : g));
      }
      return [...prev, group];
    });

    setMenuItems((prev) =>
      prev.map((item) => {
        if (!item.modifierGroups) return item;
        const usesGroup = item.modifierGroups.some((mg) => mg.id === group.id);
        if (!usesGroup) return item;
        return {
          ...item,
          modifierGroups: item.modifierGroups.map((mg) =>
            mg.id === group.id ? group : mg
          ),
        };
      })
    );
    showToast(`✅ Groupe d’options sur mesure "${group.name}" enregistré`);
  };

  const deleteModifierGroup = (groupId: string) => {
    setModifierGroups((prev) => prev.filter((g) => g.id !== groupId));
    setMenuItems((prev) =>
      prev.map((item) => ({
        ...item,
        modifierGroups: item.modifierGroups?.filter((mg) => mg.id !== groupId),
      }))
    );
    showToast('Groupe d’options supprimé');
  };

  const updateStockQuantity = (id: string, delta: number) => {
    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setStockItems((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextQty = Math.max(0, Number((s.quantity + delta).toFixed(1)));
          return { ...s, quantity: nextQty, lastUpdated: `Aujourd’hui, ${nowStr}` };
        }
        return s;
      })
    );
  };

  const addStockItem = (item: Omit<StockItem, 'id' | 'lastUpdated'>) => {
    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const newItem: StockItem = {
      ...item,
      id: `stk-${Date.now()}`,
      lastUpdated: `Aujourd’hui, ${nowStr}`,
    };
    setStockItems((prev) => [newItem, ...prev]);
    showToast(`Stock "${newItem.name}" ajouté`);
  };

  const updateTableStatus = (
    tableId: string,
    status: RestaurantTable['status'],
    guests?: number,
    reservationName?: string
  ) => {
    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status,
            guests: status === 'libre' ? undefined : guests ?? t.guests ?? 2,
            occupiedSince: status === 'occupee' ? t.occupiedSince || nowStr : status === 'libre' ? undefined : t.occupiedSince,
            currentOrderId: status === 'libre' ? undefined : t.currentOrderId,
            reservationName: status === 'reservee' ? reservationName || 'Client Réservé' : undefined,
          };
        }
        return t;
      })
    );
  };

  const addTable = (name: string, zone: RestaurantTable['zone'], capacity: number) => {
    const newTbl: RestaurantTable = {
      id: `tbl-${Date.now()}`,
      name,
      zone,
      capacity,
      status: 'libre',
    };
    setTables((prev) => [...prev, newTbl]);
    showToast(`Table "${name}" ajoutée (${zone})`);
  };

  const createOrder = (params: {
    items: CartItem[];
    mode: OrderMode;
    source: OrderSource;
    paymentMethod: PaymentMethod;
    paid: boolean;
    discount?: number;
    tableId?: string;
    customerName?: string;
    cashReceived?: number;
  }): Order => {
    const subtotal = params.items.reduce((acc, ci) => acc + ci.unitPrice * ci.quantity, 0);
    const discount = params.discount || 0;
    const total = Math.max(0, subtotal - discount);

    const prefix = params.source === 'borne' ? 'B' : params.source === 'serveur' ? 'S' : 'C';
    const count = orders.filter((o) => o.source === params.source).length + 1;
    const orderNumber = `${prefix}-${String(count).padStart(3, '0')}`;

    const selectedTable = params.tableId ? tables.find((t) => t.id === params.tableId) : undefined;
    const existingTableOrder =
      selectedTable?.currentOrderId
        ? orders.find((o) => o.id === selectedTable.currentOrderId && !o.paid && o.status !== 'annule')
        : undefined;

    const initialStatus: OrderStatus = 'en_preparation';

    const actorId = params.source === 'borne' ? undefined : currentEmployee?.id;
    const actorName = params.source === 'borne' ? 'Borne Kiosk' : currentEmployee?.name;

    if (existingTableOrder && !params.paid) {
      const mergedItems = [...existingTableOrder.items, ...params.items];
      const mergedSubtotal = mergedItems.reduce((acc, ci) => acc + ci.unitPrice * ci.quantity, 0);
      const mergedDiscount = existingTableOrder.discount + discount;
      const mergedTotal = Math.max(0, mergedSubtotal - mergedDiscount);

      const updatedTableOrder: Order = {
        ...existingTableOrder,
        items: mergedItems,
        subtotal: mergedSubtotal,
        discount: mergedDiscount,
        total: mergedTotal,
        status: 'en_preparation',
      };

      setOrders((prev) =>
        prev.map((o) => (o.id === existingTableOrder.id ? updatedTableOrder : o))
      );
      showToast(`✅ Plats ajoutés à la ${selectedTable?.name} (Ticket #${existingTableOrder.orderNumber})`);
      return updatedTableOrder;
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      items: params.items,
      subtotal,
      discount,
      total,
      mode: params.mode,
      source: params.source,
      status: initialStatus,
      paymentMethod: params.paymentMethod,
      paid: params.paid,
      tableId: params.tableId,
      tableName: selectedTable?.name,
      customerName: params.customerName,
      createdAt: new Date().toISOString(),
      cashReceived: params.cashReceived,
      changeGiven: params.cashReceived && params.cashReceived >= total ? params.cashReceived - total : 0,
      createdByEmployeeId: actorId,
      createdByEmployeeName: actorName,
      cashedByEmployeeId: params.paid ? actorId : undefined,
      cashedByEmployeeName: params.paid ? actorName : undefined,
    };

    setOrders((prev) => [newOrder, ...prev]);

    if (params.tableId) {
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setTables((prev) =>
        prev.map((t) =>
          t.id === params.tableId
            ? {
                ...t,
                status: params.paid ? 'occupee' : 'a_encaisser',
                currentOrderId: newOrder.id,
                occupiedSince: t.occupiedSince || nowStr,
                guests: t.guests || 2,
              }
            : t
        )
      );
    }

    // Auto-print thermal tickets if enabled
    if (params.paid && printerSettings.autoPrintCaisse) {
      executePrintJob('caisse', newOrder, branding, activeClient, printerSettings).catch(() => {});
    }
    if (printerSettings.autoPrintCuisine) {
      executePrintJob('cuisine', newOrder, branding, activeClient, printerSettings).catch(() => {});
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          if (status === 'pret' && o.tableId && !o.paid) {
            setTables((tbls) =>
              tbls.map((t) => (t.id === o.tableId ? { ...t, status: 'a_encaisser' } : t))
            );
          }
          if (status === 'termine' && o.tableId && o.paid) {
            setTables((tbls) =>
              tbls.map((t) =>
                t.id === o.tableId
                  ? { ...t, status: 'libre', currentOrderId: undefined, occupiedSince: undefined, guests: undefined }
                  : t
              )
            );
          }
          return { ...o, status };
        }
        return o;
      })
    );
    showToast(`Statut de la commande #${targetOrder.orderNumber} mis à jour`);
  };

  const markOrderPaid = (orderId: string, paymentMethod: PaymentMethod, cashReceived?: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          if (o.tableId) {
            setTables((tbls) =>
              tbls.map((t) =>
                t.id === o.tableId
                  ? { ...t, status: 'occupee' }
                  : t
              )
            );
          }
          return {
            ...o,
            paid: true,
            paymentMethod,
            status: o.status === 'en_attente' ? 'en_preparation' : o.status,
            cashReceived,
            changeGiven: cashReceived && cashReceived >= o.total ? cashReceived - o.total : 0,
            cashedByEmployeeId: currentEmployee?.id || o.cashedByEmployeeId,
            cashedByEmployeeName: currentEmployee?.name || o.cashedByEmployeeName || 'Caissier',
          };
        }
        return o;
      })
    );
    const target = orders.find((o) => o.id === orderId);
    if (target && printerSettings.autoPrintCaisse) {
      const updatedOrder: Order = {
        ...target,
        paid: true,
        paymentMethod,
        cashReceived,
        changeGiven: cashReceived && cashReceived >= target.total ? cashReceived - target.total : 0,
        cashedByEmployeeName: currentEmployee?.name || 'Caissier',
      };
      executePrintJob('caisse', updatedOrder, branding, activeClient, printerSettings).catch(() => {});
    }
    showToast(`✅ Encaissé par ${currentEmployee?.name || 'Caissier'}`);
  };

  return (
    <RestoContext.Provider
      value={{
        activeView,
        setActiveView,
        viewportSim,
        setViewportSim,
        isFullscreen,
        toggleFullscreen,
        isSuperAdminPortal,
        setIsSuperAdminPortal,
        isSuperAdminAuthenticated,
        logoutSuperAdmin,
        supabaseConfig,
        updateSupabaseConfig,
        syncCloudLicensesNow,
        clients,
        activeClientId,
        setActiveClientId,
        activeClient,
        addClientAccount,
        changeClientPlan,
        updateClientStaffQuota,
        toggleClientShutoff,
        regenerateClientAdminPin,
        employees,
        currentEmployee,
        isStaffTerminal,
        setIsStaffTerminal,
        isKioskTerminal,
        setIsKioskTerminal,
        loginCommercialAdmin,
        loginWithPin,
        logoutEmployee,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        getStaffInternalUrl,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        branding,
        updateBranding,
        menuItems,
        toggleMenuItemAvailability,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        modifierGroups,
        saveModifierGroup,
        deleteModifierGroup,
        stockItems,
        updateStockQuantity,
        addStockItem,
        tables,
        selectedTableId,
        setSelectedTableId,
        updateTableStatus,
        addTable,
        orders,
        createOrder,
        updateOrderStatus,
        markOrderPaid,
        toastMessage,
        showToast,
        printerSettings,
        updatePrinterSettings,
      }}
    >
      {children}
    </RestoContext.Provider>
  );
};

export const useResto = () => {
  const ctx = useContext(RestoContext);
  if (!ctx) throw new Error('useResto must be used within a RestoProvider');
  return ctx;
};
