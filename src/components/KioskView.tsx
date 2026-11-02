import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Beef,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  CupSoda,
  Flame,
  IceCream,
  Maximize2,
  Minimize2,
  Minus,
  Pizza,
  Plus,
  Printer,
  RotateCcw,
  Sandwich,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  Utensils,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import { useResto } from '../context/RestoContext';
import { formatDA } from '../data/initialData';
import {
  CartItem,
  MenuItem,
  Order,
  OrderMode,
  PaymentMethod,
  SelectedModifier,
} from '../types';
import { TicketPrintModal } from './TicketPrintModal';

export const CategoryIcon: React.FC<{ icon: string; className?: string }> = ({
  icon,
  className = 'w-6 h-6',
}) => {
  switch (icon) {
    case 'Beef':
      return <Beef className={className} />;
    case 'Sandwich':
      return <Sandwich className={className} />;
    case 'Pizza':
      return <Pizza className={className} />;
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'CupSoda':
      return <CupSoda className={className} />;
    case 'IceCream':
      return <IceCream className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

export const KioskView: React.FC = () => {
  const {
    categories,
    branding,
    menuItems,
    createOrder,
    viewportSim,
    isFullscreen,
    toggleFullscreen,
    isKioskTerminal,
    setIsKioskTerminal,
  } = useResto();

  // Steps: 'welcome' | 'menu' | 'checkout' | 'confirmed'
  const [step, setStep] = useState<'welcome' | 'menu' | 'checkout' | 'confirmed'>('welcome');
  const [orderMode, setOrderMode] = useState<OrderMode>('sur_place');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Customization modal state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemNote, setItemNote] = useState<string>('');

  // Checkout state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('a_la_caisse');
  const [customerName, setCustomerName] = useState<string>('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(15);

  const isPortraitSim = viewportSim === 'kiosk_portrait';

  // Auto countdown after order confirmation
  useEffect(() => {
    if (step !== 'confirmed') return;
    setCountdown(15);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleResetKiosk();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleStartOrder = (mode: OrderMode) => {
    setOrderMode(mode);
    setSelectedCategory('all');
    setStep('menu');
  };

  const handleResetKiosk = () => {
    setCart([]);
    setCustomizingItem(null);
    setConfirmedOrder(null);
    setCustomerName('');
    setIsCartDrawerOpen(false);
    setStep('welcome');
  };

  const openItemModal = (item: MenuItem) => {
    if (!item.available) return;
    setCustomizingItem(item);
    setItemQuantity(1);
    setItemNote('');
    // Pre-select default required options
    const defaults: SelectedModifier[] = [];
    if (item.modifierGroups) {
      item.modifierGroups.forEach((group) => {
        if (group.required && group.options.length > 0) {
          const first = group.options[0];
          defaults.push({
            groupId: group.id,
            groupName: group.name,
            optionId: first.id,
            optionName: first.name,
            price: first.price,
          });
        }
      });
    }
    setSelectedModifiers(defaults);
  };

  const toggleModifierOption = (
    groupId: string,
    groupName: string,
    multiSelect: boolean,
    option: { id: string; name: string; price: number }
  ) => {
    setSelectedModifiers((prev) => {
      if (!multiSelect) {
        const filtered = prev.filter((m) => m.groupId !== groupId);
        return [
          ...filtered,
          {
            groupId,
            groupName,
            optionId: option.id,
            optionName: option.name,
            price: option.price,
          },
        ];
      } else {
        const exists = prev.some((m) => m.groupId === groupId && m.optionId === option.id);
        if (exists) {
          return prev.filter((m) => !(m.groupId === groupId && m.optionId === option.id));
        } else {
          return [
            ...prev,
            {
              groupId,
              groupName,
              optionId: option.id,
              optionName: option.name,
              price: option.price,
            },
          ];
        }
      }
    });
  };

  const getCustomizingUnitPrice = () => {
    if (!customizingItem) return 0;
    const modSum = selectedModifiers.reduce((acc, m) => acc + m.price, 0);
    return customizingItem.price + modSum;
  };

  const handleAddToCartFromModal = () => {
    if (!customizingItem) return;
    const unitPrice = getCustomizingUnitPrice();
    const newItem: CartItem = {
      cartItemId: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      menuItem: customizingItem,
      quantity: itemQuantity,
      selectedModifiers,
      note: itemNote.trim() || undefined,
      unitPrice,
    };
    setCart((prev) => [...prev, newItem]);
    setCustomizingItem(null);
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => (ci.cartItemId === cartItemId ? { ...ci, quantity: ci.quantity + delta } : ci))
        .filter((ci) => ci.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((acc, ci) => acc + ci.unitPrice * ci.quantity, 0);
  const cartCount = cart.reduce((acc, ci) => acc + ci.quantity, 0);

  const filteredItems = menuItems.filter(
    (item) => selectedCategory === 'all' || item.categoryId === selectedCategory
  );

  const handleConfirmOrder = () => {
    if (cart.length === 0) return;
    const order = createOrder({
      items: cart,
      mode: orderMode,
      source: 'borne',
      paymentMethod,
      paid: paymentMethod === 'cib_edahabia',
      customerName: customerName.trim() || undefined,
    });
    setConfirmedOrder(order);
    setIsCartDrawerOpen(false);
    setStep('confirmed');
  };

  const activeOffers = branding.specialOffers.filter((o) => o.active);
  const welcomeAds = branding.kioskAds.filter(
    (a) => a.active && (a.placement === 'welcome' || a.placement === 'both')
  );
  const menuAds = branding.kioskAds.filter(
    (a) => a.active && (a.placement === 'menu_banner' || a.placement === 'both')
  );

  // 1. WELCOME SCREEN (ATTRACT SCREEN)
  if (step === 'welcome') {
    return (
      <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-between bg-gradient-to-b from-stone-900 via-stone-900 to-brand-950 text-white overflow-hidden select-none">
        {/* Background Food Imagery with Warm Overlay */}
        <div
          className="absolute inset-0 opacity-35 bg-cover bg-center scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url("${
              branding.heroBackgroundUrl ||
              'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=80'
            }")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-900/40" />

        {/* Top Bar on Kiosk with Custom Restaurant Logo */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-3">
            <img
              src={branding.logoUrl || '/icon.svg'}
              alt={branding.restaurantName}
              className="w-12 h-12 rounded-2xl bg-white p-1 object-contain shadow-lg"
            />
            <div>
              <span className="text-xl font-extrabold tracking-tight block leading-none">
                {branding.restaurantName}
              </span>
              <span className="text-xs text-amber-300 font-medium tracking-wider uppercase">
                Borne de Commande Express
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/15">
              🇩🇿 Français / العربية
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition"
              title="Plein écran Borne"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            {isKioskTerminal && (
              <button
                onClick={() => setIsKioskTerminal(false)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-bold text-stone-300 transition"
                title="Retour à l'écran Code PIN Employé/Admin"
              >
                Accès Staff (PIN)
              </button>
            )}
          </div>
        </div>

        {/* Center Hero Call-To-Action */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto py-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/40 text-amber-300 text-sm font-bold mb-5">
            <Sparkles className="w-4 h-4" />
            {branding.tagline || 'Préparé à la commande • Produits 100% Frais'}
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            Commandez ici <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-brand-400 to-orange-500">
              sans faire la queue !
            </span>
          </h1>

          {/* Giant Tactile Choice Buttons: Sur Place vs À Emporter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl my-6">
            <button
              onClick={() => handleStartOrder('sur_place')}
              className="group relative flex flex-col items-center justify-center p-7 rounded-3xl bg-white text-stone-900 shadow-2xl hover:bg-brand-50 active:scale-95 transition-all duration-200 border-4 border-transparent hover:border-brand-500"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Store className="w-9 h-9" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">Sur Place</span>
              <span className="text-xs font-semibold text-stone-500 mt-1">
                Service en salle ou plateau
              </span>
              <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
                Commander <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => handleStartOrder('a_emporter')}
              className="group relative flex flex-col items-center justify-center p-7 rounded-3xl bg-brand-600 text-white shadow-2xl shadow-brand-600/30 hover:bg-brand-500 active:scale-95 transition-all duration-200 border-4 border-brand-400/30"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/15 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-9 h-9" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">À Emporter</span>
              <span className="text-xs font-semibold text-orange-100 mt-1">
                Emballage chaud prêt rapidement
              </span>
              <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-200">
                Commander <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Kiosk Advertising Spaces (Espaces Pub sur l'accueil de la Borne) */}
          {welcomeAds.length > 0 && (
            <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {welcomeAds.slice(0, 2).map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => handleStartOrder('sur_place')}
                  className="cursor-pointer group relative rounded-2xl overflow-hidden border border-white/20 bg-stone-900/80 backdrop-blur-md flex items-center gap-3 p-2.5 text-left hover:border-amber-400 transition"
                >
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition"
                  />
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 text-[9px] font-black uppercase">
                      {ad.sponsorTag}
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-white truncate mt-1">
                      {ad.title}
                    </h4>
                    <p className="text-[11px] text-stone-300 line-clamp-1">{ad.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Dynamic Special Offers Banner */}
        <div className="relative z-10 bg-stone-950/85 backdrop-blur-md border-t border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-stone-300">
          {activeOffers.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black uppercase">
                {activeOffers[0].badge}
              </span>
              <span className="font-bold text-white">{activeOffers[0].title}</span>
              {activeOffers[0].description && (
                <span className="text-stone-400 hidden md:inline">
                  • {activeOffers[0].description}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">
                BIENVENUE
              </span>
              <span>Commandez directement sur notre borne tactile</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-stone-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-400" /> Espèces au comptoir
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-400" /> Carte CIB / Edahabia
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. CONFIRMED TICKET SCREEN
  if (step === 'confirmed' && confirmedOrder) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-cream-50 flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-stone-200/80 p-8 text-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <span className="inline-block px-3.5 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-extrabold uppercase tracking-wider mb-2">
            {confirmedOrder.mode === 'sur_place' ? '🍽️ Sur Place' : '🛍️ À Emporter'}
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Merci pour votre commande !
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Votre commande a été transmise directement en cuisine.
          </p>

          {/* Giant Call Number Box */}
          <div className="my-6 py-6 px-4 rounded-2xl bg-gradient-to-br from-brand-50 to-amber-50 border-2 border-dashed border-brand-300">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700 block mb-1">
              Votre Numéro de Commande
            </span>
            <div className="text-5xl sm:text-6xl font-black text-brand-600 tracking-wider">
              {confirmedOrder.orderNumber}
            </div>
            <span className="text-xs text-stone-600 mt-2 block font-bold">
              {confirmedOrder.paid
                ? '✅ Payé par Carte CIB / Edahabia — En préparation en cuisine'
                : '🍽️ En préparation en cuisine — Réglez au comptoir avec ce numéro'}
            </span>
          </div>

          {/* Mini Receipt Summary */}
          <div className="text-left bg-stone-50 rounded-2xl p-4 mb-6 border border-stone-200/60 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase pb-2 mb-2 border-b border-stone-200">
              <span>Récapitulatif Ticket</span>
              <span>{new Date(confirmedOrder.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="space-y-2">
              {confirmedOrder.items.map((ci) => (
                <div key={ci.cartItemId} className="flex justify-between text-sm">
                  <div>
                    <span className="font-bold text-stone-800">{ci.quantity}x </span>
                    <span className="font-medium text-stone-700">{ci.menuItem.name}</span>
                    {ci.selectedModifiers.length > 0 && (
                      <p className="text-xs text-stone-400 pl-4">
                        + {ci.selectedModifiers.map((m) => m.optionName).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    {formatDA(ci.unitPrice * ci.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-stone-200 font-extrabold text-base text-stone-900">
              <span>Total à payer</span>
              <span className="text-brand-600">{formatDA(confirmedOrder.total)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowTicketModal(true)}
              className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-100 flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" /> Tickets Client & Cuisine
            </button>
            <button
              onClick={handleResetKiosk}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" /> Nouvelle commande ({countdown}s)
            </button>
          </div>
        </div>

        <TicketPrintModal
          order={showTicketModal ? confirmedOrder : null}
          onClose={() => setShowTicketModal(false)}
        />
      </div>
    );
  }

  // 3. MAIN KIOSK ORDERING INTERFACE (Adapts to Portrait Totem & Landscape Screen)
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-cream-50 select-none overflow-hidden">
      {/* Kiosk Header with Custom Logo */}
      <header className="bg-white border-b border-stone-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetKiosk}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Accueil</span>
          </button>
          <img
            src={branding.logoUrl || '/icon.svg'}
            alt={branding.restaurantName}
            className="w-9 h-9 rounded-xl object-contain border border-stone-200 bg-white p-0.5 hidden sm:block"
          />
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900 leading-tight">
              {branding.restaurantName} — Borne Client
            </h2>
            <p className="text-xs text-stone-500">
              Touchez un plat pour choisir sa taille, son gratinage, ses sauces et suppléments
            </p>
          </div>
        </div>

        {/* Mode Switch Pill: Sur Place / À Emporter */}
        <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200/70">
          <button
            onClick={() => setOrderMode('sur_place')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${orderMode === 'sur_place'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
              }`}
          >
            <Store className="w-4 h-4" /> Sur Place
          </button>
          <button
            onClick={() => setOrderMode('a_emporter')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${orderMode === 'a_emporter'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
              }`}
          >
            <ShoppingBag className="w-4 h-4" /> À Emporter
          </button>
        </div>
      </header>

      {/* Main Content Area: Portrait vs Landscape Adaptive */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Category Rail: Horizontal on Portrait/Mobile, Vertical Sidebar on Landscape/Desktop (unless Portrait Sim is active) */}
        <aside
          className={`${isPortraitSim
              ? 'w-full border-b border-stone-200/80 bg-white px-3 py-2.5 flex gap-2 overflow-x-auto no-scrollbar shrink-0'
              : 'w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-stone-200/80 bg-white px-3 py-2.5 lg:p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar shrink-0'
            }`}
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-left transition-all shrink-0 ${isPortraitSim ? 'flex-col text-center min-w-[96px] py-2.5 px-3 gap-1.5' : ''
                  } ${active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 scale-[1.01]'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/60'
                  }`}
              >
                <div
                  className={`p-2 rounded-xl ${active ? 'bg-white/20 text-white' : 'bg-white text-brand-600 shadow-sm'
                    }`}
                >
                  <CategoryIcon icon={cat.icon} className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm leading-tight">{cat.name}</span>
              </button>
            );
          })}
        </aside>

        {/* Product Grid */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 lg:pb-6 space-y-5">
          {/* Dynamic Special Offers & Kiosk Advertising Banner inside Menu */}
          {(activeOffers.length > 0 || menuAds.length > 0) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {activeOffers[0] && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-600 text-white shadow-md flex items-center justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-white text-brand-700 text-[10px] font-black uppercase">
                      {activeOffers[0].badge}
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base mt-1 leading-snug">
                      {activeOffers[0].title}
                    </h4>
                    {activeOffers[0].description && (
                      <p className="text-xs text-orange-100 mt-0.5">
                        {activeOffers[0].description}
                      </p>
                    )}
                  </div>
                  {activeOffers[0].promoPriceDA && (
                    <div className="px-3 py-2 rounded-xl bg-stone-950/30 text-right shrink-0">
                      <span className="text-[10px] text-orange-200 block font-bold">PROMO</span>
                      <span className="text-lg font-black text-white">
                        {formatDA(activeOffers[0].promoPriceDA)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {menuAds[0] && (
                <div className="p-3 rounded-2xl bg-stone-900 text-white shadow-md flex items-center gap-3.5 border border-stone-800">
                  <img
                    src={menuAds[0].imageUrl}
                    alt={menuAds[0].title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-stone-950 text-[10px] font-black uppercase">
                      {menuAds[0].sponsorTag}
                    </span>
                    <h4 className="font-extrabold text-sm text-white truncate mt-1">
                      {menuAds[0].title}
                    </h4>
                    <p className="text-xs text-stone-300 line-clamp-1">
                      {menuAds[0].subtitle}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-stone-900">
                {categories.find((c) => c.id === selectedCategory)?.name}
              </h3>
              <p className="text-xs text-stone-500">
                {categories.find((c) => c.id === selectedCategory)?.description}
              </p>
            </div>
            <span className="text-xs font-bold text-stone-400 bg-white px-3 py-1.5 rounded-full border border-stone-200">
              {filteredItems.length} produits
            </span>
          </div>

          <div
            className={`grid gap-4 ${isPortraitSim
                ? 'grid-cols-2'
                : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
              }`}
          >
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openItemModal(item)}
                className={`group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between ${item.available
                    ? 'cursor-pointer hover:border-brand-300 active:scale-[0.98]'
                    : 'opacity-55 cursor-not-allowed grayscale'
                  }`}
              >
                <div>
                  <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-stone-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {item.popular && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-400 text-stone-950 text-[11px] font-extrabold shadow">
                          ★ Populaire
                        </span>
                      )}
                      {item.isNew && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-extrabold shadow">
                          Nouveau
                        </span>
                      )}
                      {item.spicy && (
                        <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-extrabold shadow">
                          🌶️ Piquant
                        </span>
                      )}
                    </div>
                    {!item.available && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                        <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-extrabold uppercase tracking-wider">
                          En Rupture
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h4 className="font-extrabold text-stone-900 text-base sm:text-lg leading-snug group-hover:text-brand-600 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-stone-100">
                  <div>
                    <span className="text-[11px] text-stone-400 font-semibold block">À partir de</span>
                    <span className="text-lg font-black text-stone-900">
                      {formatDA(item.price)}
                    </span>
                  </div>
                  <button
                    disabled={!item.available}
                    className="px-4 py-2.5 rounded-2xl bg-brand-50 group-hover:bg-brand-600 text-brand-700 group-hover:text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Choisir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Right Sticky Order Panel (Visible on Landscape/Wide Screens when not in Portrait Simulator) */}
        {!isPortraitSim && (
          <aside className="hidden lg:flex w-80 xl:w-96 bg-white border-l border-stone-200/80 flex-col justify-between shrink-0">
            <div className="p-5 border-b border-stone-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center font-extrabold">
                  {cartCount}
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">Ma Commande</h3>
                  <span className="text-xs font-semibold text-brand-600">
                    {orderMode === 'sur_place' ? '🍽️ Sur Place' : '🛍️ À Emporter'}
                  </span>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vider
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-stone-400">
                  <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-3 text-stone-300" />
                  <p className="font-bold text-stone-600 text-sm">Votre plateau est vide</p>
                  <p className="text-xs mt-1 max-w-[200px]">
                    Touchez un plat sur l’écran pour commencer votre commande.
                  </p>
                </div>
              ) : (
                cart.map((ci) => (
                  <div
                    key={ci.cartItemId}
                    className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-sm">{ci.menuItem.name}</h4>
                        {ci.selectedModifiers.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {ci.selectedModifiers.map((m, idx) => (
                              <span
                                key={idx}
                                className="block text-[11px] text-stone-500 font-medium"
                              >
                                • {m.optionName} {m.price > 0 ? `(+${formatDA(m.price)})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-extrabold text-sm text-brand-600 shrink-0">
                        {formatDA(ci.unitPrice * ci.quantity)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                      <span className="text-[11px] text-stone-400 font-medium">
                        {formatDA(ci.unitPrice)} / unité
                      </span>
                      <div className="flex items-center gap-2 bg-white rounded-xl border border-stone-200 px-1.5 py-1">
                        <button
                          onClick={() => updateCartQty(ci.cartItemId, -1)}
                          className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-extrabold text-sm">
                          {ci.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(ci.cartItemId, 1)}
                          className="w-7 h-7 rounded-lg bg-brand-100 hover:bg-brand-200 flex items-center justify-center text-brand-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Checkout Button */}
            <div className="p-4 bg-stone-50 border-t border-stone-200/80">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-stone-600">Total à payer</span>
                <span className="text-2xl font-black text-stone-900">{formatDA(cartTotal)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => setStep('checkout')}
                className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:bg-stone-300 text-white font-extrabold text-base shadow-lg shadow-brand-600/25 flex items-center justify-between transition active:scale-[0.99]"
              >
                <span>Terminer & Payer</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Portrait / Tablet Floating Bottom Bar */}
      <div
        className={`${isPortraitSim ? 'flex' : 'flex lg:hidden'
          } fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-stone-200/90 px-4 py-3 shadow-2xl items-center justify-between gap-4`}
      >
        <div
          onClick={() => cart.length > 0 && setIsCartDrawerOpen(true)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="relative w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center font-black text-lg">
            {cartCount}
          </div>
          <div>
            <span className="text-xs text-stone-500 font-bold block">Votre plateau</span>
            <span className="text-xl font-black text-stone-900">{formatDA(cartTotal)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-4 py-3.5 rounded-2xl bg-stone-100 text-stone-800 font-bold text-xs sm:text-sm"
            >
              Détails
            </button>
          )}
          <button
            disabled={cart.length === 0}
            onClick={() => setStep('checkout')}
            className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:bg-stone-300 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand-600/30 flex items-center gap-2"
          >
            <span>Valider</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Portrait Cart Slide-Up Drawer */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-3xl max-h-[82vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-stone-900">
                Votre Plateau ({cartCount} articles)
              </h3>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-2 rounded-full bg-stone-100 text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((ci) => (
                <div
                  key={ci.cartItemId}
                  className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-extrabold text-stone-900">{ci.menuItem.name}</h4>
                    {ci.selectedModifiers.length > 0 && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        {ci.selectedModifiers.map((m) => m.optionName).join(' • ')}
                      </p>
                    )}
                    <span className="text-sm font-bold text-brand-600 mt-1 block">
                      {formatDA(ci.unitPrice * ci.quantity)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQty(ci.cartItemId, -1)}
                      className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-extrabold">{ci.quantity}</span>
                    <button
                      onClick={() => updateCartQty(ci.cartItemId, 1)}
                      className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex gap-3">
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="flex-1 py-3.5 rounded-2xl border border-stone-300 font-bold text-stone-700"
              >
                Continuer mes achats
              </button>
              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  setStep('checkout');
                }}
                className="flex-1 py-3.5 rounded-2xl bg-brand-600 text-white font-extrabold"
              >
                Payer {formatDA(cartTotal)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM CUSTOMIZATION MODAL (WIZARD) */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header with Image */}
            <div className="relative h-48 sm:h-56 bg-stone-900 shrink-0">
              <img
                src={customizingItem.image}
                alt={customizingItem.name}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent" />
              <button
                onClick={() => setCustomizingItem(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-lg hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="px-2.5 py-0.5 rounded-md bg-brand-600 text-xs font-bold">
                  Prix de base : {formatDA(customizingItem.price)}
                </span>
                <h3 className="text-2xl font-extrabold mt-1">{customizingItem.name}</h3>
                <p className="text-xs text-stone-200 line-clamp-2 mt-0.5">
                  {customizingItem.description}
                </p>
              </div>
            </div>

            {/* Modifiers Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {customizingItem.modifierGroups && customizingItem.modifierGroups.length > 0 ? (
                customizingItem.modifierGroups.map((group) => (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-base">{group.name}</h4>
                        <span className="text-xs text-stone-500">
                          {group.multiSelect ? 'Plusieurs choix possibles' : 'Sélectionnez 1 option'}
                        </span>
                      </div>
                      {group.required && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                          Obligatoire
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {group.options.map((opt) => {
                        const isSelected = selectedModifiers.some(
                          (m) => m.groupId === group.id && m.optionId === opt.id
                        );
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              toggleModifierOption(group.id, group.name, group.multiSelect, opt)
                            }
                            className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${isSelected
                                ? 'border-brand-600 bg-brand-50/70 text-stone-900 shadow-sm'
                                : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected
                                    ? 'bg-brand-600 border-brand-600 text-white'
                                    : 'border-stone-300 bg-white'
                                  }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <span className="font-bold text-sm">{opt.name}</span>
                            </div>
                            <span
                              className={`text-xs font-extrabold ${opt.price > 0 ? 'text-brand-600' : 'text-stone-400'
                                }`}
                            >
                              {opt.price > 0 ? `+${formatDA(opt.price)}` : 'Inclus'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center text-sm text-stone-600">
                  Ce produit est prêt à être commandé tel quel. Vous pouvez ajuster la quantité ci-dessous.
                </div>
              )}

              {/* Special Instruction / Note */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
                  Remarque cuisine (ex: Sans oignons, bien cuit...)
                </label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="Optionnel : tapez une préférence..."
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Modal Footer: Quantity + Add to Order */}
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-2xl p-1.5">
                <button
                  onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-800"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-black text-lg">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-xl bg-brand-100 hover:bg-brand-200 flex items-center justify-center text-brand-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCartFromModal}
                className="flex-1 py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-base shadow-lg shadow-brand-600/25 flex items-center justify-between transition active:scale-95"
              >
                <span>Ajouter à ma commande</span>
                <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">
                  {formatDA(getCustomizingUnitPrice() * itemQuantity)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KIOSK CHECKOUT MODAL */}
      {step === 'checkout' && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-stone-900">Validation & Paiement</h3>
                <p className="text-xs text-stone-500">
                  Choisissez votre mode de règlement préféré
                </p>
              </div>
              <button
                onClick={() => setStep('menu')}
                className="px-3.5 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Retour au menu
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-2">
                  Votre Prénom ou Numéro de Chevalet (Optionnel)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Amine, Chevalet N°12..."
                  className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 text-base font-semibold focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-2">
                  Mode de Paiement
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('a_la_caisse')}
                    className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-2 transition ${paymentMethod === 'a_la_caisse'
                        ? 'border-brand-600 bg-brand-50/70'
                        : 'border-stone-200 hover:border-stone-300'
                      }`}
                  >
                    <Wallet className="w-8 h-8 text-brand-600" />
                    <span className="font-extrabold text-base text-stone-900">
                      Payer au Comptoir
                    </span>
                    <span className="text-xs text-stone-500">
                      Réglez en espèces (DA) directement à la caisse avec votre ticket
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cib_edahabia')}
                    className={`p-5 rounded-2xl border-2 text-left flex flex-col gap-2 transition ${paymentMethod === 'cib_edahabia'
                        ? 'border-brand-600 bg-brand-50/70'
                        : 'border-stone-200 hover:border-stone-300'
                      }`}
                  >
                    <CreditCard className="w-8 h-8 text-brand-600" />
                    <span className="font-extrabold text-base text-stone-900">
                      Carte CIB / Edahabia
                    </span>
                    <span className="text-xs text-stone-500">
                      Paiement sans contact ou par code PIN directement sur le TPE de la borne
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cream-100 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase block">
                    Total de la commande ({cartCount} articles)
                  </span>
                  <span className="text-sm font-semibold text-stone-700">
                    {orderMode === 'sur_place' ? 'Service Sur Place' : 'Commande À Emporter'}
                  </span>
                </div>
                <span className="text-2xl font-black text-brand-600">{formatDA(cartTotal)}</span>
              </div>
            </div>

            <div className="p-5 bg-stone-50 border-t border-stone-200">
              <button
                onClick={handleConfirmOrder}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6" />
                Confirmer ma commande ({formatDA(cartTotal)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

