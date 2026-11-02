import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit3,
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Megaphone,
  Package,
  Plus,
  Search,
  Sliders,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useResto } from '../context/RestoContext';
import { formatDA } from '../data/initialData';
import {
  Category,
  KioskAd,
  MenuItem,
  ModifierGroup,
  ModifierOption,
  SpecialOffer,
  StockItem,
} from '../types';

const ICON_OPTIONS = [
  { id: 'Beef', label: '🍔 Burger / Viande' },
  { id: 'Sandwich', label: '🌮 Tacos / Sandwich' },
  { id: 'Pizza', label: '🍕 Pizza' },
  { id: 'UtensilsCrossed', label: '🍽️ Assiette / Plat' },
  { id: 'Flame', label: '🍟 Frites / Grill' },
  { id: 'CupSoda', label: '🥤 Boisson' },
  { id: 'IceCream', label: '🍨 Dessert' },
  { id: 'Sparkles', label: '✨ Spécialité' },
];

export const MenuStockView: React.FC = () => {
  const {
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
  } = useResto();

  const [subTab, setSubTab] = useState<'menu' | 'modifiers' | 'branding' | 'stock'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // --- 1. ADD / EDIT CATEGORY MODAL ---
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Beef');
  const [catDesc, setCatDesc] = useState('');

  // --- 2. ADD / EDIT DISH (MENU ITEM) MODAL WITH OPTION GROUPS ---
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPrice, setFormPrice] = useState(650);
  const [formCategory, setFormCategory] = useState('burgers');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // --- 3. ADD / EDIT MODIFIER GROUP (Sauces, Suppléments, Taille, Gratinage...) ---
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupRequired, setGroupRequired] = useState(false);
  const [groupMultiSelect, setGroupMultiSelect] = useState(true);
  const [groupOptions, setGroupOptions] = useState<ModifierOption[]>([]);
  const [newOptName, setNewOptName] = useState('');
  const [newOptPrice, setNewOptPrice] = useState(0);

  // --- 4. BRANDING, OFFERS & ADS STATES ---
  const [restoName, setRestoName] = useState(branding.restaurantName);
  const [restoTagline, setRestoTagline] = useState(branding.tagline);
  const [restoLogo, setRestoLogo] = useState(branding.logoUrl);
  const [restoHeroBg, setRestoHeroBg] = useState(branding.heroBackgroundUrl);

  // New Offer Form
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerBadge, setOfferBadge] = useState('OFFRE SPÉCIALE');
  const [offerPrice, setOfferPrice] = useState(1000);

  // New Kiosk Ad Form
  const [adTitle, setAdTitle] = useState('');
  const [adSubtitle, setAdSubtitle] = useState('');
  const [adImage, setAdImage] = useState(
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80'
  );
  const [adTag, setAdTag] = useState('ESPACE PUB');
  const [adPlacement, setAdPlacement] = useState<KioskAd['placement']>('both');

  // --- 5. STOCK MODAL ---
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stkName, setStkName] = useState('');
  const [stkCategory, setStkCategory] = useState<StockItem['category']>('Viandes & Volailles');
  const [stkQty, setStkQty] = useState(10);
  const [stkUnit, setStkUnit] = useState('kg');
  const [stkMin, setStkMin] = useState(5);
  const [stkCost, setStkCost] = useState(1000);

  // Category Handlers
  const openAddCatModal = () => {
    setEditingCat(null);
    setCatName('');
    setCatIcon('Beef');
    setCatDesc('');
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (c: Category) => {
    setEditingCat(c);
    setCatName(c.name);
    setCatIcon(c.icon);
    setCatDesc(c.description || '');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    if (editingCat) {
      updateCategory({
        ...editingCat,
        name: catName.trim(),
        icon: catIcon,
        description: catDesc.trim(),
      });
    } else {
      addCategory({
        name: catName.trim(),
        icon: catIcon,
        description: catDesc.trim(),
      });
    }
    setIsCatModalOpen(false);
  };

  // Dish Handlers
  const openAddMenuModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCode(`PRD-${menuItems.length + 1}`);
    setFormPrice(700);
    setFormCategory(categories.find((c) => c.id !== 'all')?.id || 'burgers');
    setFormDesc('');
    setFormImage(
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
    );
    // Default attach Sauces & Suppléments if available
    setSelectedGroupIds(
      modifierGroups
        .filter((g) => g.id === 'sauces' || g.id === 'supplements')
        .map((g) => g.id)
    );
    setIsItemModalOpen(true);
  };

  const openEditMenuModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCode(item.code);
    setFormPrice(item.price);
    setFormCategory(item.categoryId);
    setFormDesc(item.description);
    setFormImage(item.image);
    setSelectedGroupIds(item.modifierGroups?.map((g) => g.id) || []);
    setIsItemModalOpen(true);
  };

  const toggleDishGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const attachedGroups = modifierGroups.filter((g) =>
      selectedGroupIds.includes(g.id)
    );

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: formName.trim(),
        code: formCode.trim(),
        price: Number(formPrice),
        categoryId: formCategory,
        description: formDesc.trim(),
        image: formImage.trim(),
        modifierGroups: attachedGroups,
      });
    } else {
      addMenuItem({
        name: formName.trim(),
        code: formCode.trim() || 'NEW-01',
        price: Number(formPrice),
        categoryId: formCategory,
        description: formDesc.trim() || 'Préparé minute avec ingrédients frais.',
        image:
          formImage.trim() ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        available: true,
        modifierGroups: attachedGroups,
      });
    }
    setIsItemModalOpen(false);
  };

  // Modifier Group Handlers (Sauces, Suppléments, Taille, Gratinage sur mesure...)
  const openCreateGroupModal = (
    presetTitle = '',
    presetRequired = false,
    presetMultiSelect = true
  ) => {
    setEditingGroupId(null);
    setGroupName(presetTitle);
    setGroupRequired(presetRequired);
    setGroupMultiSelect(presetMultiSelect);
    setGroupOptions([]);
    setNewOptName('');
    setNewOptPrice(0);
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (group: ModifierGroup) => {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupRequired(group.required);
    setGroupMultiSelect(group.multiSelect);
    setGroupOptions([...group.options]);
    setNewOptName('');
    setNewOptPrice(0);
    setIsGroupModalOpen(true);
  };

  const handleAddOptionToGroup = () => {
    if (!newOptName.trim()) return;
    setGroupOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: newOptName.trim(),
        price: Number(newOptPrice) || 0,
      },
    ]);
    setNewOptName('');
    setNewOptPrice(0);
  };

  const handleSaveModifierGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const finalOptions = [...groupOptions];
    if (newOptName.trim()) {
      finalOptions.push({
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: newOptName.trim(),
        price: Number(newOptPrice) || 0,
      });
    }
    if (finalOptions.length === 0) return;

    const newGroupId = editingGroupId || `grp_${Date.now()}`;
    const group: ModifierGroup = {
      id: newGroupId,
      name: groupName.trim(),
      required: groupRequired,
      multiSelect: groupMultiSelect,
      options: finalOptions,
    };
    saveModifierGroup(group);

    // If the Dish creation/edit modal is currently open, auto-attach this newly created custom group to the dish!
    if (isItemModalOpen && !selectedGroupIds.includes(newGroupId)) {
      setSelectedGroupIds((prev) => [...prev, newGroupId]);
    }

    setNewOptName('');
    setNewOptPrice(0);
    setIsGroupModalOpen(false);
  };

  // Branding & Logo Upload Handlers
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRestoLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrandingIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding({
      ...branding,
      restaurantName: restoName.trim() || 'MonResto',
      tagline: restoTagline.trim(),
      logoUrl: restoLogo.trim() || '/icon.svg',
      heroBackgroundUrl: restoHeroBg.trim(),
    });
  };

  const handleAddSpecialOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) return;
    const newOffer: SpecialOffer = {
      id: `off-${Date.now()}`,
      title: offerTitle.trim(),
      description: offerDesc.trim(),
      badge: offerBadge.trim() || 'PROMO',
      promoPriceDA: Number(offerPrice) || undefined,
      active: true,
    };
    updateBranding({
      ...branding,
      specialOffers: [newOffer, ...branding.specialOffers],
    });
    setOfferTitle('');
    setOfferDesc('');
  };

  const toggleOfferActive = (id: string) => {
    updateBranding({
      ...branding,
      specialOffers: branding.specialOffers.map((o) =>
        o.id === id ? { ...o, active: !o.active } : o
      ),
    });
  };

  const deleteOffer = (id: string) => {
    updateBranding({
      ...branding,
      specialOffers: branding.specialOffers.filter((o) => o.id !== id),
    });
  };

  const handleAddKioskAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim()) return;
    const newAd: KioskAd = {
      id: `ad-${Date.now()}`,
      title: adTitle.trim(),
      subtitle: adSubtitle.trim(),
      imageUrl:
        adImage.trim() ||
        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
      sponsorTag: adTag.trim() || 'ESPACE PUB',
      placement: adPlacement,
      active: true,
    };
    updateBranding({
      ...branding,
      kioskAds: [newAd, ...branding.kioskAds],
    });
    setAdTitle('');
    setAdSubtitle('');
  };

  const toggleAdActive = (id: string) => {
    updateBranding({
      ...branding,
      kioskAds: branding.kioskAds.map((a) =>
        a.id === id ? { ...a, active: !a.active } : a
      ),
    });
  };

  const deleteAd = (id: string) => {
    updateBranding({
      ...branding,
      kioskAds: branding.kioskAds.filter((a) => a.id !== id),
    });
  };

  // Stock Handler
  const handleSaveStockItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkName.trim()) return;
    addStockItem({
      name: stkName.trim(),
      category: stkCategory,
      quantity: Number(stkQty),
      unit: stkUnit.trim() || 'kg',
      minThreshold: Number(stkMin),
      costPerUnit: Number(stkCost),
    });
    setStkName('');
    setIsStockModalOpen(false);
  };

  const filteredMenu = menuItems.filter((m) => {
    const matchCat = selectedCat === 'all' || m.categoryId === selectedCat;
    const matchSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowStockCount = stockItems.filter((s) => s.quantity <= s.minThreshold).length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream-50 p-4 sm:p-6 space-y-6 select-none">
      {/* Top Header & 4-Tab Navigation */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            Configuration Menu, Options Plats, Borne Pub & Stocks
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Gérez vos catégories, vos plats, leurs options (Sauces, Suppléments, Tailles, Gratinages) et l’habillage publicitaire de vos Bornes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setSubTab('menu')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              subTab === 'menu'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Plats & Catégories ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setSubTab('modifiers')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              subTab === 'modifiers'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Sauces, Suppléments, Tailles & Gratinage ({modifierGroups.length})</span>
          </button>

          <button
            onClick={() => setSubTab('branding')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              subTab === 'branding'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Logo, Offres & Pub Borne</span>
          </button>

          <button
            onClick={() => setSubTab('stock')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              subTab === 'stock'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stocks</span>
            {lowStockCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: PLATS & CATÉGORIES DE PLATS
         ===================================================================== */}
      {subTab === 'menu' && (
        <div className="space-y-5">
          {/* Categories Management Strip */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-600" />
                  Catégories de Plats ({categories.length - 1})
                </h3>
                <p className="text-xs text-stone-400">
                  Cliquez sur une catégorie pour filtrer, ou ajoutez/modifiez vos catégories de plats
                </p>
              </div>
              <button
                onClick={openAddCatModal}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-extrabold flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" /> Nouvelle Catégorie
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-1.5 pl-3.5 pr-2 py-2 rounded-xl text-xs font-extrabold shrink-0 border transition ${
                    selectedCat === c.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <button onClick={() => setSelectedCat(c.id)} className="pr-1">
                    {c.name}
                  </button>
                  {c.id !== 'all' && (
                    <div className="flex items-center gap-0.5 pl-1 border-l border-current/20">
                      <button
                        onClick={() => openEditCatModal(c)}
                        className="p-1 rounded hover:bg-black/10"
                        title="Modifier la catégorie"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteCategory(c.id)}
                        className="p-1 rounded hover:bg-black/10"
                        title="Supprimer la catégorie"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Search + Add Dish Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un plat dans le menu..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              onClick={openAddMenuModal}
              className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Ajouter un Plat (avec Sauces / Options)
            </button>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-stone-200/80 p-4 flex flex-col justify-between gap-3 shadow-sm"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className={`w-20 h-20 rounded-2xl object-cover shrink-0 bg-stone-100 ${
                      !item.available ? 'grayscale opacity-60' : ''
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                        {item.code}
                      </span>
                      <span className="text-sm font-black text-brand-600">
                        {formatDA(item.price)}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-stone-900 text-sm sm:text-base truncate mt-0.5">
                      {item.name}
                    </h4>
                    <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>

                    {/* Attached Option Groups Badges (Taille, Gratinage, Sauces, Suppléments...) */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.modifierGroups && item.modifierGroups.length > 0 ? (
                        item.modifierGroups.map((mg) => (
                          <span
                            key={mg.id}
                            className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 text-[10px] font-extrabold"
                          >
                            + {mg.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">
                          Aucune option attachée
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleMenuItemAvailability(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${
                      item.available
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {item.available ? '● Disponible Borne/POS' : '○ En Rupture'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditMenuModal(item)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Options & Prix
                    </button>
                    <button
                      onClick={() => deleteMenuItem(item.id)}
                      className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: SAUCES, SUPPLÉMENTS, TAILLES, GRATINAGES & OPTIONS DE PLAT
         ===================================================================== */}
      {subTab === 'modifiers' && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  Création Sur Mesure : Sauces, Suppléments, Tailles & Gratinages
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Créez vos propres sauces et options sur mesure avec leurs tarifs en DA. Elles s’attachent directement aux plats sans encombrer le menu.
                </p>
              </div>

              <button
                onClick={() => openCreateGroupModal('', false, true)}
                className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" /> + Créer sur mesure (Libre)
              </button>
            </div>

            {/* Quick Custom Templates Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100">
              <span className="text-[11px] font-extrabold uppercase text-stone-400 mr-1">
                Création rapide sur mesure :
              </span>
              <button
                type="button"
                onClick={() => openCreateGroupModal('Sauces Maison au choix', false, true)}
                className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-700 border border-orange-200 text-xs font-extrabold transition"
              >
                + Créer des Sauces sur mesure
              </button>
              <button
                type="button"
                onClick={() => openCreateGroupModal('Taille / Format du Plat', true, false)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-extrabold transition"
              >
                + Créer des Tailles sur mesure
              </button>
              <button
                type="button"
                onClick={() => openCreateGroupModal('Gratinage au Four', false, false)}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold transition"
              >
                + Créer un Gratinage sur mesure
              </button>
              <button
                type="button"
                onClick={() => openCreateGroupModal('Suppléments & Extras', false, true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold transition"
              >
                + Créer des Suppléments sur mesure
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {modifierGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-3xl border border-stone-200/80 p-5 flex flex-col justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            group.required
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {group.required ? 'Obligatoire' : 'Optionnel'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-extrabold">
                          {group.multiSelect ? 'Choix Multiple' : '1 Seul Choix'}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-stone-900 mt-1.5">
                        {group.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGroupModal(group)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700"
                        title="Modifier les options"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteModifierGroup(group.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600"
                        title="Supprimer ce groupe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3">
                    {group.options.map((opt) => (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-stone-50"
                      >
                        <span className="font-bold text-stone-800">{opt.name}</span>
                        <span
                          className={`font-extrabold ${
                            opt.price > 0 ? 'text-brand-600' : 'text-emerald-700'
                          }`}
                        >
                          {opt.price > 0 ? `+${formatDA(opt.price)}` : 'Gratuit (0 DA)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => openEditGroupModal(group)}
                  className="w-full py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-extrabold text-stone-700"
                >
                  + Ajouter / Modifier les choix ({group.options.length})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: PERSONNALISATION LOGO, OFFRES SPÉCIALES & ESPACES PUB BORNE
         ===================================================================== */}
      {subTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Restaurant Identity & Logo */}
          <form
            onSubmit={handleSaveBrandingIdentity}
            className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-4 self-start"
          >
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <ImageIcon className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  Logo & Identité du Restaurant
                </h3>
                <p className="text-xs text-stone-500">
                  Affiché sur la Borne, le Menu et les Tickets
                </p>
              </div>
            </div>

            {/* Logo Preview + File Upload */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-4">
              <img
                src={restoLogo || '/icon.svg'}
                alt="Logo Restaurant"
                className="w-16 h-16 rounded-2xl object-contain bg-white border border-stone-200 p-1 shrink-0"
              />
              <div className="space-y-1.5 flex-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-extrabold transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importer un Logo (PC/Mobile)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-stone-400">
                  PNG, JPG ou SVG — ou collez un lien ci-dessous
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Nom de l’enseigne
              </label>
              <input
                type="text"
                value={restoName}
                onChange={(e) => setRestoName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-extrabold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Slogan Accueil Borne
              </label>
              <input
                type="text"
                value={restoTagline}
                onChange={(e) => setRestoTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                URL du Logo (ou Base64 importé)
              </label>
              <input
                type="text"
                value={restoLogo}
                onChange={(e) => setRestoLogo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Image de Fond d’Accueil Borne
              </label>
              <input
                type="text"
                value={restoHeroBg}
                onChange={(e) => setRestoHeroBg(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md"
            >
              Enregistrer le Logo & l’Identité
            </button>
          </form>

          {/* Column 2: Offres Spéciales sur la Borne */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-4 self-start">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <Tag className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  Offres Spéciales de la Borne
                </h3>
                <p className="text-xs text-stone-500">
                  Promotions mises en avant sur l’écran d’accueil et le menu Borne
                </p>
              </div>
            </div>

            {/* Add New Offer Form */}
            <form
              onSubmit={handleAddSpecialOffer}
              className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5"
            >
              <span className="text-xs font-extrabold text-stone-700 block">
                + Nouvelle Offre Spéciale
              </span>
              <input
                type="text"
                required
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="Titre (ex: Menu Midi Burger + Boisson = 850 DA)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
              />
              <input
                type="text"
                value={offerDesc}
                onChange={(e) => setOfferDesc(e.target.value)}
                placeholder="Détails de l'offre..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={offerBadge}
                  onChange={(e) => setOfferBadge(e.target.value)}
                  placeholder="Badge (ex: OFFRE DU JOUR)"
                  className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                />
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  placeholder="Prix DA"
                  className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs"
              >
                Ajouter l’Offre sur la Borne
              </button>
            </form>

            {/* Existing Offers List */}
            <div className="space-y-2.5">
              {branding.specialOffers.map((off) => (
                <div
                  key={off.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-2 ${
                    off.active
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-stone-50 border-stone-200 opacity-60'
                  }`}
                >
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black uppercase">
                      {off.badge}
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-stone-900 mt-1">
                      {off.title}
                    </h4>
                    {off.description && (
                      <p className="text-[11px] text-stone-500 mt-0.5">{off.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleOfferActive(off.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${
                        off.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {off.active ? 'Active' : 'Masquée'}
                    </button>
                    <button
                      onClick={() => deleteOffer(off.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Espaces Publicitaires (Espaces Pub Borne) */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-4 self-start">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-extrabold text-base text-stone-900">
                  Espaces Pub sur les Bornes
                </h3>
                <p className="text-xs text-stone-500">
                  Créez des bannières publicitaires / partenaires sur vos bornes
                </p>
              </div>
            </div>

            {/* Add New Kiosk Ad Form */}
            <form
              onSubmit={handleAddKioskAd}
              className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2.5"
            >
              <span className="text-xs font-extrabold text-amber-950 block">
                + Créer un Espace Pub sur la Borne
              </span>
              <input
                type="text"
                required
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="Titre de la pub (ex: Découvrez Hamoud La Blanche)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
              />
              <input
                type="text"
                value={adSubtitle}
                onChange={(e) => setAdSubtitle(e.target.value)}
                placeholder="Sous-titre / Message..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
              />
              <input
                type="text"
                value={adImage}
                onChange={(e) => setAdImage(e.target.value)}
                placeholder="URL de l'image / affiche publicitaire"
                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={adTag}
                  onChange={(e) => setAdTag(e.target.value)}
                  placeholder="Badge (ex: ESPACE PUB)"
                  className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                />
                <select
                  value={adPlacement}
                  onChange={(e) => setAdPlacement(e.target.value as KioskAd['placement'])}
                  className="px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                >
                  <option value="both">Accueil + Menu Borne</option>
                  <option value="welcome">Accueil Borne seul</option>
                  <option value="menu_banner">Bannière Menu seul</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-extrabold text-xs"
              >
                Publier l’Espace Pub sur la Borne
              </button>
            </form>

            {/* Existing Ads List */}
            <div className="space-y-2.5">
              {branding.kioskAds.map((ad) => (
                <div
                  key={ad.id}
                  className={`p-3 rounded-2xl border flex items-center gap-3 justify-between ${
                    ad.active
                      ? 'bg-white border-stone-200'
                      : 'bg-stone-50 border-stone-200 opacity-55'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 bg-stone-100"
                    />
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                        {ad.sponsorTag}
                      </span>
                      <h4 className="font-extrabold text-xs text-stone-900 truncate mt-0.5">
                        {ad.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 truncate">{ad.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleAdActive(ad.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${
                        ad.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {ad.active ? 'Publiée' : 'Off'}
                    </button>
                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: STOCKS & INGRÉDIENTS
         ===================================================================== */}
      {subTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {lowStockCount > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-extrabold">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>
                    {lowStockCount} ingrédient(s) sous le seuil minimum de réapprovisionnement
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-extrabold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Tous les niveaux de stock sont optimaux</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsStockModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nouvel Ingrédient / Stock
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-extrabold uppercase text-stone-500">
                    <th className="py-3.5 px-4">Article / Ingrédient</th>
                    <th className="py-3.5 px-4">Catégorie</th>
                    <th className="py-3.5 px-4">Niveau Actuel</th>
                    <th className="py-3.5 px-4">Seuil Alerte</th>
                    <th className="py-3.5 px-4">Coût Unitaire</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Ajustement Rapide</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 text-xs sm:text-sm">
                  {stockItems.map((stk) => {
                    const isLow = stk.quantity <= stk.minThreshold;
                    return (
                      <tr key={stk.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3.5 px-4 font-extrabold text-stone-900">
                          {stk.name}
                          <span className="block text-[11px] text-stone-400 font-medium">
                            Màj : {stk.lastUpdated}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs">
                            {stk.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-base text-stone-900">
                          {stk.quantity}{' '}
                          <span className="text-xs font-semibold text-stone-500">{stk.unit}</span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-500 font-semibold">
                          {stk.minThreshold} {stk.unit}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-700">
                          {formatDA(stk.costPerUnit)} / {stk.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Stock Faible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                              Stock OK
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => updateStockQuantity(stk.id, -1)}
                              className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 font-extrabold text-stone-700"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => updateStockQuantity(stk.id, 1)}
                              className="px-2.5 py-1.5 rounded-xl bg-brand-100 hover:bg-brand-200 font-extrabold text-brand-700"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => updateStockQuantity(stk.id, 10)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white text-xs"
                            >
                              +10 Réappro
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: ADD / EDIT CATEGORY
         ===================================================================== */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-extrabold">
                {editingCat ? 'Modifier la Catégorie' : 'Nouvelle Catégorie de Plats'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Nom de la Catégorie
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Sandwichs Chauds, Crêpes Salées..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-extrabold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Icône sur la Borne & POS
                </label>
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
                >
                  {ICON_OPTIONS.map((ic) => (
                    <option key={ic.id} value={ic.id}>
                      {ic.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Courte description
                </label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Ex: Préparés au four..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-extrabold text-xs"
              >
                Enregistrer la catégorie
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: ADD / EDIT DISH + SELECT ATTACHED OPTION GROUPS
         ===================================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMenuItem}
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between shrink-0">
              <h3 className="text-lg font-extrabold">
                {editingItem ? 'Modifier le Plat & ses Options' : 'Ajouter un Plat à la Carte'}
              </h3>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Nom du plat
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Burger Le Casbah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Code Caisse
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="BRG-05"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Prix de base (DA)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-black text-brand-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Catégorie de Plat
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                  >
                    {categories
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* CHECKBOXES + CUSTOM CREATION FOR ATTACHED OPTIONS (Sauces, Suppléments, Taille, Gratinage sur mesure...) */}
              <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-extrabold uppercase text-brand-900">
                    Sauces & Options sur mesure pour ce plat
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openCreateGroupModal(`Sauces (${formName || 'Plat'})`, false, true)}
                      className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3 h-3" /> Créer Sauces sur mesure
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateGroupModal(`Options (${formName || 'Plat'})`, false, false)}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3 h-3" /> Créer Taille / Gratinage sur mesure
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modifierGroups.map((grp) => {
                    const checked = selectedGroupIds.includes(grp.id);
                    return (
                      <div
                        key={grp.id}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition ${
                          checked
                            ? 'bg-brand-600 text-white border-brand-600 font-extrabold shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 font-semibold'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleDishGroup(grp.id)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              checked
                                ? 'bg-white text-brand-600 border-white'
                                : 'border-stone-300'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs block truncate">{grp.name}</span>
                            <span
                              className={`text-[10px] block truncate ${
                                checked ? 'text-orange-100' : 'text-stone-400'
                              }`}
                            >
                              {grp.options.map((o) => o.name).join(', ')}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditGroupModal(grp)}
                          className={`p-1.5 rounded-lg text-[10px] font-bold shrink-0 ${
                            checked
                              ? 'bg-white/20 hover:bg-white/30 text-white'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                          }`}
                          title="Personnaliser sur mesure les choix et prix"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Description / Ingrédients
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ingrédients détaillés affichés sur la Borne Kiosk..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  URL Photo du produit
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-extrabold text-xs"
              >
                Enregistrer le plat & ses options
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: CREATE / EDIT MODIFIER GROUP (SAUCES, SUPPLÉMENTS, TAILLE, GRATINAGE)
         ===================================================================== */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModifierGroup}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between shrink-0">
              <h3 className="text-lg font-extrabold">
                {editingGroupId
                  ? 'Modifier le Groupe d’Options'
                  : 'Nouveau Groupe d’Options (Taille, Gratinage, Sauces...)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Titre du Groupe d’Options
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Sauces au choix, Gratinage au Four, Taille du Tacos..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-extrabold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGroupRequired(!groupRequired)}
                  className={`p-3 rounded-xl border text-xs font-extrabold transition ${
                    groupRequired
                      ? 'bg-amber-100 border-amber-400 text-amber-950'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {groupRequired ? '✓ Choix Obligatoire' : 'Choix Optionnel'}
                </button>

                <button
                  type="button"
                  onClick={() => setGroupMultiSelect(!groupMultiSelect)}
                  className={`p-3 rounded-xl border text-xs font-extrabold transition ${
                    groupMultiSelect
                      ? 'bg-brand-100 border-brand-400 text-brand-950'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  {groupMultiSelect
                    ? '✓ Plusieurs choix possibles'
                    : '1 Seul choix unique'}
                </button>
              </div>

              {/* Add Option Row */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="text-xs font-extrabold text-stone-700 block">
                  Ajouter un choix (Sauce, Supplément, Taille, Gratinage...)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOptName}
                    onChange={(e) => setNewOptName(e.target.value)}
                    placeholder="Nom (ex: Gratiné Boursin, Sauce Algérienne...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold"
                  />
                  <input
                    type="number"
                    step={10}
                    value={newOptPrice}
                    onChange={(e) => setNewOptPrice(Number(e.target.value))}
                    placeholder="Prix DA"
                    className="w-24 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-black text-brand-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddOptionToGroup}
                    className="px-3.5 py-2 rounded-xl bg-stone-900 text-white text-xs font-extrabold shrink-0"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-2">
                {groupOptions.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200"
                  >
                    <input
                      type="text"
                      value={opt.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGroupOptions((prev) =>
                          prev.map((o, i) => (i === idx ? { ...o, name: val } : o))
                        );
                      }}
                      className="flex-1 text-xs font-bold text-stone-900 bg-transparent focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-stone-400 font-bold">+</span>
                      <input
                        type="number"
                        step={10}
                        value={opt.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setGroupOptions((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, price: val } : o))
                          );
                        }}
                        className="w-20 px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 text-xs font-black text-brand-600 text-right"
                      />
                      <span className="text-[11px] text-stone-500 font-bold">DA</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setGroupOptions((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-extrabold text-xs"
              >
                Enregistrer ce groupe d’options
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: ADD STOCK ITEM
         ===================================================================== */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStockItem}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Ajouter un Ingrédient au Stock</h3>
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Désignation
                </label>
                <input
                  type="text"
                  required
                  value={stkName}
                  onChange={(e) => setStkName(e.target.value)}
                  placeholder="Ex: Fromage Cheddar Tranches..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Quantité Initiale
                  </label>
                  <input
                    type="number"
                    required
                    value={stkQty}
                    onChange={(e) => setStkQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Unité (kg, L, pièces)
                  </label>
                  <input
                    type="text"
                    required
                    value={stkUnit}
                    onChange={(e) => setStkUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Seuil d’alerte min.
                  </label>
                  <input
                    type="number"
                    required
                    value={stkMin}
                    onChange={(e) => setStkMin(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Coût unitaire (DA)
                  </label>
                  <input
                    type="number"
                    required
                    value={stkCost}
                    onChange={(e) => setStkCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-extrabold text-xs"
              >
                Ajouter au stock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
