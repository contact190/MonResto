import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  ChefHat,
  Crown,
  Download,
  KeyRound,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Monitor,
  MonitorSmartphone,
  Package,
  Power,
  Smartphone,
  Store,
  Tablet,
  Users,
} from 'lucide-react';
import { RestoProvider, useResto } from './context/RestoContext';
import { KioskView } from './components/KioskView';
import { POSView } from './components/POSView';
import { TablesView } from './components/TablesView';
import { MenuStockView } from './components/MenuStockView';
import { DashboardView } from './components/DashboardView';
import { StaffView } from './components/StaffView';
import { KitchenKDSView } from './components/KitchenKDSView';
import { SuperAdminView } from './components/SuperAdminView';
import { PinLockScreen } from './components/PinLockScreen';
import { PWAInstallModal } from './components/PWAInstallModal';
import { AppView, EmployeeRole } from './types';

const MainLayout: React.FC = () => {
  const {
    activeView,
    setActiveView,
    viewportSim,
    setViewportSim,
    isFullscreen,
    toggleFullscreen,
    isSuperAdminPortal,
    setIsSuperAdminPortal,
    activeClient,
    branding,
    currentEmployee,
    isKioskTerminal,
    setIsStaffTerminal,
    logoutEmployee,
    orders,
    tables,
    toastMessage,
  } = useResto();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAModalOpen, setIsPWAModalOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleTriggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsPWAModalOpen(false);
  };

  // =====================================================================
  // 0. STANDALONE SUPER ADMIN PORTAL (COMPLETELY SEPARATE INTERFACE)
  // =====================================================================
  if (isSuperAdminPortal) {
    return (
      <>
        <SuperAdminView />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs sm:text-sm font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // Check if active client is in SHUTOFF or EXPIRED
  const isClientExpired =
    activeClient !== null &&
    activeClient.expiresAt !== null &&
    new Date(activeClient.expiresAt).getTime() < Date.now();
  const isClientBlocked = activeClient !== null && (activeClient.shutoff || isClientExpired);

  // If client is in SHUTOFF/EXPIRED, show SHUTOFF screen
  if (isClientBlocked && activeClient) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-stone-900 border-2 border-red-500 rounded-3xl p-8 shadow-2xl space-y-5">
          <div className="w-20 h-20 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/40 animate-pulse">
            <Power className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-widest">
            {activeClient.shutoff ? '⛔ SHUTOFF ACTIF' : '⏳ ABONNEMENT EXPIRÉ'}
          </span>
          <h1 className="text-2xl font-black">{activeClient.restaurantName}</h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            {activeClient.shutoff
              ? 'L’accès à votre logiciel restaurant a été suspendu à distance (Shutoff Administrateur).'
              : 'Votre période d’accès est arrivée à expiration. Veuillez renouveler votre abonnement.'}
          </p>
          <button
            onClick={() => {
              setIsStaffTerminal(false);
              logoutEmployee();
            }}
            className="w-full py-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-amber-400" /> Retour à l’identification Licence Client
          </button>
        </div>
      </div>
    );
  }

  // 1. If in Dedicated Customer Kiosk Mode (no employee logged in), show ONLY KioskView
  if (isKioskTerminal && !currentEmployee) {
    return (
      <div className="min-h-screen bg-stone-950">
        <KioskView />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs sm:text-sm font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // 2. If no employee is logged in (or no active client yet), require PIN Code on Lock Screen
  if (!currentEmployee || !activeClient) {
    return (
      <>
        <PinLockScreen />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs sm:text-sm font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  const pendingUnpaidOrders = orders.filter(
    (o) => !o.paid && o.status === 'en_attente'
  ).length;
  const activeKitchenOrders = orders.filter(
    (o) =>
      o.status === 'en_attente' ||
      o.status === 'en_preparation' ||
      o.status === 'pret'
  ).length;
  const occupiedTables = tables.filter((t) => t.status !== 'libre').length;

  // Role-based navigation permissions (Restaurant Software)
  const allNavItems: {
    id: AppView;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: number;
    allowedRoles: EmployeeRole[];
  }[] = [
    {
      id: 'pos',
      label: currentEmployee.role === 'serveur' ? 'Prise de Commande' : 'Caisse POS',
      shortLabel: 'Caisse',
      icon: <Store className="w-4 h-4" />,
      badge: pendingUnpaidOrders > 0 ? pendingUnpaidOrders : undefined,
      allowedRoles: ['admin', 'caissier', 'serveur'],
    },
    {
      id: 'tables',
      label: 'Plan de Salle',
      shortLabel: 'Tables',
      icon: <LayoutGrid className="w-4 h-4" />,
      badge: occupiedTables > 0 ? occupiedTables : undefined,
      allowedRoles: ['admin', 'caissier', 'serveur'],
    },
    {
      id: 'kds',
      label: 'Cuisine (KDS)',
      shortLabel: 'Cuisine',
      icon: <ChefHat className="w-4 h-4" />,
      badge: activeKitchenOrders > 0 ? activeKitchenOrders : undefined,
      allowedRoles: ['admin', 'caissier', 'cuisinier'],
    },
    {
      id: 'kiosk',
      label: 'Borne Client',
      shortLabel: 'Borne',
      icon: <MonitorSmartphone className="w-4 h-4" />,
      allowedRoles: ['admin'],
    },
    {
      id: 'menu_stock',
      label: 'Menu, Options & Pub',
      shortLabel: 'Menu/Pub',
      icon: <Package className="w-4 h-4" />,
      allowedRoles: ['admin'],
    },
    {
      id: 'dashboard',
      label: 'Rapports & Stats',
      shortLabel: 'Stats',
      icon: <BarChart3 className="w-4 h-4" />,
      allowedRoles: ['admin'],
    },
    {
      id: 'staff',
      label: 'Équipe & Codes PIN',
      shortLabel: 'Équipe',
      icon: <Users className="w-4 h-4" />,
      allowedRoles: ['admin'],
    },
  ];

  const visibleNavItems = allNavItems.filter((item) =>
    item.allowedRoles.includes(currentEmployee.role)
  );

  // Container width simulation
  const getSimulatedFrameClass = () => {
    if (viewportSim === 'kiosk_portrait') {
      return 'max-w-[500px] mx-auto shadow-2xl border-x-4 border-stone-900 min-h-[calc(100vh-3.5rem)]';
    }
    if (viewportSim === 'pos_tablet') {
      return 'max-w-[1024px] mx-auto shadow-2xl border-x-4 border-stone-900 min-h-[calc(100vh-3.5rem)]';
    }
    if (viewportSim === 'mobile_waiter') {
      return 'max-w-[420px] mx-auto shadow-2xl border-x-4 border-stone-900 min-h-[calc(100vh-3.5rem)]';
    }
    return 'w-full';
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-200/60">
      {/* Top Unified Navigation & Adaptive Format Bar (Hidden in Fullscreen mode) */}
      {!isFullscreen && (
        <nav className="h-14 bg-white border-b border-stone-200/90 px-3 sm:px-5 flex items-center justify-between gap-2 sticky top-0 z-40 select-none">
          {/* Custom Restaurant Brand Logo + Connected Employee Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src={branding.logoUrl || '/icon.svg'}
              alt={branding.restaurantName}
              onClick={() =>
                setActiveView(currentEmployee.role === 'cuisinier' ? 'kds' : 'pos')
              }
              className="w-9 h-9 rounded-xl object-contain bg-white border border-stone-200 p-0.5 shadow-xs cursor-pointer"
            />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs sm:text-sm text-stone-900 tracking-tight leading-none">
                  {currentEmployee.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                    currentEmployee.role === 'admin'
                      ? 'bg-amber-100 text-amber-900'
                      : currentEmployee.role === 'caissier'
                      ? 'bg-emerald-100 text-emerald-900'
                      : currentEmployee.role === 'serveur'
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'bg-orange-100 text-orange-900'
                  }`}
                >
                  {currentEmployee.role}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-stone-400 block">
                {activeClient.restaurantName}
              </span>
            </div>
          </div>

          {/* Center Module Switcher (Filtered by Employee Role) */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            {visibleNavItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    if (item.id !== 'kiosk' && viewportSim === 'kiosk_portrait') {
                      setViewportSim('responsive');
                    }
                  }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition shrink-0 ${
                    active
                      ? item.id === 'kiosk' || item.id === 'staff'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="lg:hidden">{item.shortLabel}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        active
                          ? 'bg-amber-400 text-stone-950'
                          : 'bg-brand-600 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Screen Format Simulator + Lock/Switch PIN + Install PWA */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentEmployee.role === 'admin' && (
              <div className="hidden 2xl:flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/70">
                <button
                  onClick={() => setViewportSim('responsive')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                    viewportSim === 'responsive'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Adaptation automatique Plein Écran"
                >
                  <Monitor className="w-3.5 h-3.5" /> Auto
                </button>
                <button
                  onClick={() => {
                    setActiveView('pos');
                    setViewportSim('pos_tablet');
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                    viewportSim === 'pos_tablet'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Simuler Caisse Tactile 15 pouces / Tablette (1024px)"
                >
                  <Tablet className="w-3.5 h-3.5 rotate-90" /> 15"
                </button>
                <button
                  onClick={() => {
                    setActiveView('kiosk');
                    setViewportSim('kiosk_portrait');
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                    viewportSim === 'kiosk_portrait'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Simuler Totem Borne Vertical"
                >
                  <Tablet className="w-3.5 h-3.5" /> Borne
                </button>
                <button
                  onClick={() => {
                    setActiveView('pos');
                    setViewportSim('mobile_waiter');
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                    viewportSim === 'mobile_waiter'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Simuler Smartphone Serveur"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-extrabold flex items-center gap-1 transition"
              title="Mode Plein Écran (POS / Borne)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsPWAModalOpen(true)}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-extrabold flex items-center gap-1 transition"
              title="Installer la Web App Mobile & Borne"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">App</span>
            </button>

            {/* Lock / Switch Employee PIN Button (Opens Internal Staff Terminal) */}
            <button
              onClick={() => {
                setIsStaffTerminal(true);
                logoutEmployee();
              }}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-brand-600 text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-xs"
              title="Basculer sur le Terminal Interne Staff (Code PIN Employés)"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Terminal Staff</span>
            </button>

            {currentEmployee.role === 'admin' && (
              <button
                onClick={() => {
                  setIsStaffTerminal(false);
                  logoutEmployee();
                }}
                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-extrabold transition"
                title="Quitter le restaurant (Retour Page Commerciale)"
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Active Viewport Container */}
      <div className={getSimulatedFrameClass()}>
        {activeView === 'kiosk' && <KioskView />}
        {activeView === 'pos' && <POSView />}
        {activeView === 'tables' && <TablesView />}
        {activeView === 'kds' && <KitchenKDSView />}
        {activeView === 'menu_stock' && <MenuStockView />}
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'staff' && <StaffView />}
      </div>

      {/* Live Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs sm:text-sm font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PWA Install & Multi-Screen Sync Modal */}
      <PWAInstallModal
        isOpen={isPWAModalOpen}
        onClose={() => setIsPWAModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerInstall}
      />
    </div>
  );
};

export function App() {
  return (
    <RestoProvider>
      <MainLayout />
    </RestoProvider>
  );
}

export default App;
