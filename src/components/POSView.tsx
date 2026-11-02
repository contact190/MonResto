import React, { useEffect, useState } from 'react';
import {
  Banknote,
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  Percent,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
  Truck,
  Users,
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
import { CategoryIcon } from './KioskView';
import { TicketPrintModal } from './TicketPrintModal';

export const POSView: React.FC = () => {
  const {
    categories,
    menuItems,
    tables,
    selectedTableId,
    setSelectedTableId,
    orders,
    createOrder,
    updateOrderStatus,
    markOrderPaid,
    viewportSim,
    isFullscreen,
    toggleFullscreen,
    currentEmployee,
  } = useResto();
  const isWaiterRole = currentEmployee?.role === 'serveur';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderMode, setOrderMode] = useState<OrderMode>('sur_place');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');

  // Item customization modal (when item has modifiers)
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [itemNote, setItemNote] = useState<string>('');

  // Payment / Checkout modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('especes');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  // Mobile cart drawer
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Display mode for POS grid: 'visual' (with photos) or 'compact' (fast touch keypad tiles without photos)
  const [gridDensity, setGridDensity] = useState<'visual' | 'compact'>('visual');

  // Active live orders drawer/modal for quick KDS & Kiosk cashing
  const [selectedLiveOrder, setSelectedLiveOrder] = useState<Order | null>(null);

  const isMobileSim = viewportSim === 'mobile_waiter';
  const isTabletSim = viewportSim === 'pos_tablet';

  // If a table was selected from the TablesView, set mode to 'sur_place'
  useEffect(() => {
    if (selectedTableId) {
      setOrderMode('sur_place');
    }
  }, [selectedTableId]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (item: MenuItem) => {
    if (!item.available) return;

    // Fast POS behavior: if item has required modifiers, open quick modifier modal; otherwise add directly
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setCustomizingItem(item);
      setItemNote('');
      const defaults: SelectedModifier[] = [];
      item.modifierGroups.forEach((g) => {
        if (g.required && g.options.length > 0) {
          defaults.push({
            groupId: g.id,
            groupName: g.name,
            optionId: g.options[0].id,
            optionName: g.options[0].name,
            price: g.options[0].price,
          });
        }
      });
      setSelectedModifiers(defaults);
    } else {
      addDirectToCart(item, [], '');
    }
  };

  const addDirectToCart = (
    item: MenuItem,
    modifiers: SelectedModifier[],
    note: string
  ) => {
    const modPrice = modifiers.reduce((s, m) => s + m.price, 0);
    const unitPrice = item.price + modPrice;

    setCart((prev) => {
      // Check if identical item + modifiers + note already in cart
      const modKey = modifiers.map((m) => m.optionId).sort().join('|');
      const existingIndex = prev.findIndex((ci) => {
        const ciModKey = ci.selectedModifiers.map((m) => m.optionId).sort().join('|');
        return (
          ci.menuItem.id === item.id &&
          ciModKey === modKey &&
          (ci.note || '') === note.trim()
        );
      });

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      return [
        ...prev,
        {
          cartItemId: `pos-ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          menuItem: item,
          quantity: 1,
          selectedModifiers: modifiers,
          note: note.trim() || undefined,
          unitPrice,
        },
      ];
    });
  };

  const toggleModifierOption = (
    groupId: string,
    groupName: string,
    multiSelect: boolean,
    option: { id: string; name: string; price: number }
  ) => {
    setSelectedModifiers((prev) => {
      if (!multiSelect) {
        return [
          ...prev.filter((m) => m.groupId !== groupId),
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
        }
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
    });
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => (ci.cartItemId === cartItemId ? { ...ci, quantity: ci.quantity + delta } : ci))
        .filter((ci) => ci.quantity > 0)
    );
  };

  const subtotal = cart.reduce((acc, ci) => acc + ci.unitPrice * ci.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);
  const cartCount = cart.reduce((acc, ci) => acc + ci.quantity, 0);

  // Send directly to kitchen (Serveur / Table mode without immediate payment)
  const handleSendToKitchen = () => {
    if (cart.length === 0) return;
    const order = createOrder({
      items: cart,
      mode: orderMode,
      source: isMobileSim ? 'serveur' : 'caisse',
      paymentMethod: 'a_la_caisse',
      paid: false,
      discount: discountAmount,
      tableId: orderMode === 'sur_place' ? selectedTableId || undefined : undefined,
      customerName: customerName.trim() || undefined,
    });
    setCart([]);
    setDiscountPercent(0);
    setCustomerName('');
    setIsMobileCartOpen(false);
    setLastCreatedOrder(order);
  };

  // Open Cash/CIB Payment Modal
  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setCashReceived(total);
    setPaymentMethod('especes');
    setIsPaymentModalOpen(true);
  };

  const handleCompletePayment = () => {
    if (cart.length === 0) return;
    const order = createOrder({
      items: cart,
      mode: orderMode,
      source: 'caisse',
      paymentMethod,
      paid: true,
      discount: discountAmount,
      tableId: orderMode === 'sur_place' ? selectedTableId || undefined : undefined,
      customerName: customerName.trim() || undefined,
      cashReceived: paymentMethod === 'especes' ? cashReceived : total,
    });
    setCart([]);
    setDiscountPercent(0);
    setCustomerName('');
    setIsPaymentModalOpen(false);
    setIsMobileCartOpen(false);
    setLastCreatedOrder(order);
  };

  const activeOrders = orders.filter((o) => o.status !== 'termine' && o.status !== 'annule');

  // Reusable Cart Panel Content (shared between Desktop Right Column & Mobile Drawer)
  const renderOrderCartPanel = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Top Order Mode & Table Selector */}
      <div className="p-3.5 border-b border-stone-200/80 space-y-2.5 shrink-0">
        <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-2xl">
          <button
            onClick={() => setOrderMode('sur_place')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              orderMode === 'sur_place'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Sur Place
          </button>
          <button
            onClick={() => setOrderMode('a_emporter')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              orderMode === 'a_emporter'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Emporter
          </button>
          <button
            onClick={() => setOrderMode('livraison')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              orderMode === 'livraison'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Livraison
          </button>
        </div>

        {/* Table Picker or Client Input */}
        <div className="flex gap-2">
          {orderMode === 'sur_place' ? (
            <div className="flex-1 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
              <Users className="w-4 h-4 text-brand-600 shrink-0" />
              <select
                value={selectedTableId || ''}
                onChange={(e) => setSelectedTableId(e.target.value || null)}
                className="w-full bg-transparent text-xs font-bold text-stone-800 focus:outline-none"
              >
                <option value="">Comptoir (Sans table assignée)</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.zone} ({t.status === 'libre' ? 'Libre' : 'Occupée'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={
                orderMode === 'livraison'
                  ? '📞 N° Tél Client & Adresse (obligatoire livraison)...'
                  : 'Nom client / Référence À Emporter...'
              }
              className={`flex-1 border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none ${
                orderMode === 'livraison'
                  ? 'bg-orange-50/70 border-brand-400 text-stone-900 placeholder:text-brand-700/70 focus:border-brand-600'
                  : 'bg-stone-50 border-stone-200 focus:border-brand-500'
              }`}
            />
          )}

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="px-2.5 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1 shrink-0"
              title="Vider le ticket"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Line Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-stone-400">
            <Receipt className="w-11 h-11 stroke-[1.5] mb-2 text-stone-300" />
            <p className="font-bold text-stone-600 text-sm">Aucun article sélectionné</p>
            <p className="text-xs mt-0.5 max-w-[210px]">
              Touchez un produit à gauche pour l’ajouter instantanément au ticket.
            </p>
          </div>
        ) : (
          cart.map((ci) => (
            <div
              key={ci.cartItemId}
              className="p-3 rounded-2xl bg-stone-50/90 border border-stone-200/80 hover:border-stone-300 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-600">
                      {ci.menuItem.code}
                    </span>
                    <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                      {ci.menuItem.name}
                    </h4>
                  </div>
                  {ci.selectedModifiers.length > 0 && (
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                      + {ci.selectedModifiers.map((m) => m.optionName).join(', ')}
                    </p>
                  )}
                  {ci.note && (
                    <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      📝 {ci.note}
                    </p>
                  )}
                </div>

                <span className="font-extrabold text-sm text-stone-900 shrink-0">
                  {formatDA(ci.unitPrice * ci.quantity)}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200/60">
                <span className="text-[11px] text-stone-400 font-semibold">
                  {formatDA(ci.unitPrice)} / u
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateCartQty(ci.cartItemId, -1)}
                    className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-extrabold text-xs">
                    {ci.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQty(ci.cartItemId, 1)}
                    className="w-7 h-7 rounded-lg bg-brand-600 text-white hover:bg-brand-700 flex items-center justify-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Discount & Summary Footer */}
      <div className="p-3.5 bg-stone-50 border-t border-stone-200/90 space-y-3 shrink-0">
        {/* Quick Discount Pills */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> Remise :
          </span>
          <div className="flex gap-1">
            {[0, 5, 10, 15].map((pct) => (
              <button
                key={pct}
                onClick={() => setDiscountPercent(pct)}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                  discountPercent === pct
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {pct === 0 ? 'Aucune' : `-${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1 pt-1 border-t border-stone-200/80">
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 font-bold">
              <span>Remise ({discountPercent}%)</span>
              <span>-{formatDA(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-extrabold text-stone-700">
              Total ({cartCount} art.)
            </span>
            <span className="text-2xl font-black text-brand-600">{formatDA(total)}</span>
          </div>
        </div>

        {/* Two Primary Options for Serveur & Caissier: 1. Ticket de Table (Cuisine + Addition) | 2. Encaisser (Caisse + Cuisine) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={cart.length === 0}
            onClick={handleSendToKitchen}
            title="Sortir le Ticket de Table et envoyer directement le Bon de Commande à la Cuisine"
            className="py-3.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Ticket de Table</span>
          </button>

          <button
            disabled={cart.length === 0}
            onClick={openPaymentModal}
            title="Encaisser la commande et sortir le Ticket de Caisse Client + Ticket Cuisine"
            className="py-3.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span>Encaisser</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`${
        isFullscreen ? 'h-screen' : 'h-[calc(100vh-3.5rem)]'
      } flex flex-col md:flex-row bg-cream-50 overflow-hidden select-none`}
    >
      {/* Left / Main Area: Live Orders Bar + Search + Categories + Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Live Orders Strip (Shows Kiosk Borne, Serveur & Caisse active orders) */}
        <div className="bg-white border-b border-stone-200/80 px-4 py-2 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar flex-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-700 shrink-0 pr-2 border-r border-stone-200">
              <Bell className="w-4 h-4 text-brand-600" />
              <span>En cours ({activeOrders.length})</span>
            </div>

            {activeOrders.length === 0 ? (
              <span className="text-xs text-stone-400 font-medium">
                Aucune commande en attente
              </span>
            ) : (
              activeOrders.map((ord) => {
                const isKiosk = ord.source === 'borne';
                return (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedLiveOrder(ord)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition hover:shadow-sm ${
                      !ord.paid
                        ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse-subtle'
                        : ord.status === 'pret'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        isKiosk
                          ? 'bg-brand-600 text-white'
                          : ord.source === 'serveur'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-stone-800 text-white'
                      }`}
                    >
                      {ord.orderNumber}
                    </span>
                    <span>
                      {ord.tableName || (isKiosk ? 'Borne Kiosk' : 'Comptoir')}
                    </span>
                    <span className="font-extrabold text-brand-700">
                      {formatDA(ord.total)}
                    </span>
                    {!ord.paid ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px] font-extrabold">
                        <Lock className="w-2.5 h-2.5" /> À encaisser
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                        <ChefHat className="w-2.5 h-2.5" />
                        {ord.status === 'pret' ? 'Prêt' : 'En cuisine'}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Dedicated Fullscreen POS Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 border transition ${
              isFullscreen
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
            }`}
            title={isFullscreen ? 'Quitter le plein écran Caisse' : 'Passer la Caisse POS en Plein Écran'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quitter Plein Écran</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Plein Écran POS</span>
              </>
            )}
          </button>
        </div>

        {/* Search & Category Filter Header */}
        <div className="p-3 sm:px-5 sm:pt-4 sm:pb-2 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un plat ou code rapide (ex: BRG-01, Tacos, Hamoud)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200/90 text-xs sm:text-sm font-medium focus:outline-none focus:border-brand-500 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedTableId && (
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-brand-100 text-brand-800 text-xs font-extrabold shrink-0">
                <Users className="w-4 h-4" />
                <span>
                  {tables.find((t) => t.id === selectedTableId)?.name}
                </span>
                <button
                  onClick={() => setSelectedTableId(null)}
                  className="hover:text-brand-950"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Toggle Visual Cards vs Compact POS Touch Keypad */}
            <div className="flex items-center bg-white border border-stone-200/90 p-1 rounded-2xl shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setGridDensity('visual')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition ${
                  gridDensity === 'visual'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Affichage avec photos"
              >
                Photos
              </button>
              <button
                type="button"
                onClick={() => setGridDensity('compact')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition ${
                  gridDensity === 'compact'
                    ? 'bg-brand-600 text-white'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Pavé tactile compact sans photos (Idéal Caisse rapide & petits écrans)"
              >
                Pavé Rapide
              </button>
            </div>
          </div>

          {/* Horizontal Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold shrink-0 transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80'
                  }`}
                >
                  <CategoryIcon icon={cat.icon} className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 pb-24 md:pb-5 pt-1">
          <div
            className={`grid gap-2.5 sm:gap-3 ${
              isMobileSim
                ? 'grid-cols-2'
                : isTabletSim
                ? gridDensity === 'compact'
                  ? 'grid-cols-3 sm:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3'
                : gridDensity === 'compact'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
            }`}
          >
            {filteredItems.map((item) =>
              gridDensity === 'compact' ? (
                /* COMPACT TOUCH KEYPAD MODE (No Image - Fast Cashier Mode) */
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.available}
                  onClick={() => handleProductClick(item)}
                  className={`group text-left bg-white rounded-2xl border-2 border-stone-200/90 hover:border-brand-500 p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[104px] active:scale-95 border-l-4 border-l-brand-500 ${
                    !item.available ? 'opacity-45 grayscale cursor-not-allowed' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                        {item.code}
                      </span>
                      {item.modifierGroups && item.modifierGroups.length > 0 && (
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                          +Options
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-brand-600">
                      {item.name}
                    </h4>
                  </div>

                  <div className="pt-2 mt-1 border-t border-stone-100 flex items-center justify-between">
                    <span className="font-black text-sm text-brand-600">
                      {formatDA(item.price)}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ) : (
                /* VISUAL CARD MODE (With Photo) */
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.available}
                  onClick={() => handleProductClick(item)}
                  className={`group text-left bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-400 transition-all flex flex-col justify-between active:scale-[0.98] ${
                    !item.available ? 'opacity-50 grayscale cursor-not-allowed' : ''
                  }`}
                >
                  <div>
                    <div className="relative h-28 sm:h-32 w-full bg-stone-100 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/75 backdrop-blur-sm text-white text-[10px] font-bold">
                        {item.code}
                      </span>
                      {item.modifierGroups && item.modifierGroups.length > 0 && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-brand-600/90 text-white text-[10px] font-bold">
                          Options
                        </span>
                      )}
                      {!item.available && (
                        <div className="absolute inset-0 bg-stone-950/60 flex items-center justify-center">
                          <span className="px-2.5 py-1 rounded bg-red-600 text-white text-[10px] font-extrabold uppercase">
                            Rupture
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm line-clamp-1 group-hover:text-brand-600">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 flex items-center justify-between">
                    <span className="font-black text-sm sm:text-base text-brand-600">
                      {formatDA(item.price)}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-brand-50 group-hover:bg-brand-600 text-brand-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tablet & Desktop Right-Hand POS Ticket Panel (Visible from 768px+ unless in Mobile Waiter Simulator) */}
      {!isMobileSim && (
        <aside
          className={`hidden md:block ${
            isTabletSim ? 'w-72' : 'w-72 lg:w-80 xl:w-96'
          } border-l border-stone-200/90 h-full shrink-0`}
        >
          {renderOrderCartPanel()}
        </aside>
      )}

      {/* Mobile / Waiter Floating Bottom Bar */}
      <div
        className={`${
          isMobileSim ? 'flex' : 'flex md:hidden'
        } fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 p-3 shadow-2xl items-center justify-between gap-3`}
      >
        <div
          onClick={() => setIsMobileCartOpen(true)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-brand-600/25">
            {cartCount}
          </div>
          <div>
            <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-brand-600" />
              {selectedTableId
                ? tables.find((t) => t.id === selectedTableId)?.name
                : 'Ticket Serveur / Caisse'}
            </span>
            <span className="text-lg font-black text-stone-900">{formatDA(total)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="px-4 py-3 rounded-2xl bg-brand-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-brand-600/20"
          >
            Voir Ticket ({cartCount})
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Ticket Drawer */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-brand-400" />
                <span className="font-extrabold text-base">Ticket de Caisse / Serveur</span>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{renderOrderCartPanel()}</div>
          </div>
        </div>
      )}

      {/* POS Quick Modifier Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-bold">{customizingItem.code}</span>
                <h3 className="text-lg font-extrabold">{customizingItem.name}</h3>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {customizingItem.modifierGroups?.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-stone-900">{group.name}</h4>
                    <span className="text-[11px] font-bold text-stone-400">
                      {group.multiSelect ? 'Choix multiple' : '1 choix'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600'
                              : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <span>{opt.name}</span>
                          {opt.price > 0 && (
                            <span className="text-brand-600 font-extrabold">
                              +{formatDA(opt.price)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">
                  Note cuisine (Sans oignons, sauce à part...)
                </label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="Note spéciale..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-3">
              <button
                onClick={() => setCustomizingItem(null)}
                className="px-4 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  addDirectToCart(customizingItem, selectedModifiers, itemNote);
                  setCustomizingItem(null);
                }}
                className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Ajouter (
                {formatDA(
                  customizingItem.price +
                    selectedModifiers.reduce((acc, m) => acc + m.price, 0)
                )}
                )
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT & CASH CALCULATOR MODAL (IN DA) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold">Encaissement Caisse</h3>
                <p className="text-xs text-stone-400">
                  Total à encaisser : <strong className="text-amber-400">{formatDA(total)}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('especes')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 font-extrabold text-sm transition ${
                    paymentMethod === 'especes'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950'
                      : 'border-stone-200 text-stone-600'
                  }`}
                >
                  <Banknote className="w-6 h-6 text-emerald-600" />
                  <span>Espèces (DA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cib_edahabia')}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 font-extrabold text-sm transition ${
                    paymentMethod === 'cib_edahabia'
                      ? 'border-brand-600 bg-brand-50/70 text-brand-950'
                      : 'border-stone-200 text-stone-600'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-brand-600" />
                  <span>Carte CIB / Edahabia</span>
                </button>
              </div>

              {paymentMethod === 'especes' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 mb-2">
                      Billets rapides (Dinar Algérien)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[total, 500, 1000, 2000, 3000, 4000, 5000, 10000]
                        .filter((v, idx, arr) => v >= total && arr.indexOf(v) === idx)
                        .slice(0, 4)
                        .map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCashReceived(val)}
                            className={`py-2.5 px-2 rounded-xl border font-extrabold text-xs transition ${
                              cashReceived === val
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100'
                            }`}
                          >
                            {val === total ? 'Compte Exact' : formatDA(val)}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                      <label className="block text-[11px] font-bold uppercase text-stone-400">
                        Montant reçu (DA)
                      </label>
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        className="w-full mt-1 bg-transparent text-xl font-black text-stone-900 focus:outline-none"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="block text-[11px] font-bold uppercase text-emerald-700">
                        Monnaie à rendre
                      </span>
                      <span className="block mt-1 text-xl font-black text-emerald-700">
                        {formatDA(Math.max(0, cashReceived - total))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 bg-stone-50 border-t border-stone-200 flex gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-5 py-3.5 rounded-2xl border border-stone-300 font-bold text-sm text-stone-700"
              >
                Annuler
              </button>
              <button
                onClick={handleCompletePayment}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Valider Encaissement ({formatDA(total)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE ORDER DETAIL / KDS / KIOSK CASHING MODAL */}
      {selectedLiveOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-xl bg-brand-600 font-black text-base">
                  {selectedLiveOrder.orderNumber}
                </span>
                <div>
                  <h4 className="font-extrabold text-sm">
                    {selectedLiveOrder.tableName ||
                      (selectedLiveOrder.source === 'borne'
                        ? 'Commande Borne Kiosk'
                        : 'Commande Comptoir')}
                  </h4>
                  <span className="text-xs text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedLiveOrder.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLiveOrder(null)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Items */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 max-h-56 overflow-y-auto space-y-2">
                {selectedLiveOrder.items.map((ci) => (
                  <div key={ci.cartItemId} className="flex justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-extrabold text-brand-600">{ci.quantity}x </span>
                      <span className="font-bold text-stone-900">{ci.menuItem.name}</span>
                      {ci.selectedModifiers.length > 0 && (
                        <p className="text-[11px] text-stone-500 pl-4">
                          + {ci.selectedModifiers.map((m) => m.optionName).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-stone-800">
                      {formatDA(ci.unitPrice * ci.quantity)}
                    </span>
                  </div>
                ))}
                <div className="pt-2.5 mt-2 border-t border-stone-200 flex justify-between font-black text-base">
                  <span>Total</span>
                  <span className="text-brand-600">{formatDA(selectedLiveOrder.total)}</span>
                </div>
              </div>

              {/* Status Progression (Kitchen KDS style) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase text-stone-400">
                    Statut Préparation & Cuisine
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const ord = selectedLiveOrder;
                      setSelectedLiveOrder(null);
                      setLastCreatedOrder(ord);
                    }}
                    className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Voir Tickets (Caisse & Cuisine)
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'en_attente', label: 'En attente' },
                      { id: 'en_preparation', label: '🔥 En cuisine' },
                      { id: 'pret', label: '🔔 Prêt à servir' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        updateOrderStatus(selectedLiveOrder.id, st.id);
                        setSelectedLiveOrder({ ...selectedLiveOrder, status: st.id });
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition flex items-center justify-center gap-1 ${
                        selectedLiveOrder.status === st.id
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment & Archive Actions */}
              <div className="pt-2 flex flex-col gap-2">
                {!selectedLiveOrder.paid ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        markOrderPaid(selectedLiveOrder.id, 'especes', selectedLiveOrder.total);
                        setSelectedLiveOrder(null);
                      }}
                      className="py-3.5 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <Banknote className="w-4 h-4 shrink-0" /> Encaisser Espèces
                    </button>
                    <button
                      onClick={() => {
                        markOrderPaid(selectedLiveOrder.id, 'cib_edahabia', selectedLiveOrder.total);
                        setSelectedLiveOrder(null);
                      }}
                      className="py-3.5 px-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4 shrink-0" /> Encaisser CIB
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedLiveOrder.id, 'termine');
                      setSelectedLiveOrder(null);
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Marquer comme Servi & Terminé
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DUAL TICKET MODAL: TICKET DE CAISSE CLIENT + BON DE COMMANDE CUISINE */}
      <TicketPrintModal
        order={lastCreatedOrder}
        onClose={() => setLastCreatedOrder(null)}
      />
    </div>
  );
};

