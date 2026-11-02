import React, { useEffect, useState } from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  Delete,
  KeyRound,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { useResto } from '../context/RestoContext';
import { formatDA } from '../data/initialData';

export const PinLockScreen: React.FC = () => {
  const {
    activeClient,
    branding,
    isStaffTerminal,
    setIsStaffTerminal,
    loginCommercialAdmin,
    loginWithPin,
    setIsKioskTerminal,
    setActiveView,
  } = useResto();

  // State for Main Commercial Client Admin Login
  const [adminAccessCode, setAdminAccessCode] = useState<string>('');
  const [isLoadingAdmin, setIsLoadingAdmin] = useState<boolean>(false);

  // State for Internal Restaurant Staff PIN Terminal
  const [pin, setPin] = useState<string>('');
  const [cashFloat, setCashFloat] = useState<string>('10000');
  const [showFloatInput, setShowFloatInput] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // =========================================================================
  // HANDLER 1: MAIN COMMERCIAL CLIENT LOGIN (ADMIN ONLY — + HIDDEN SUPER ADMIN)
  // =========================================================================
  const handleCommercialLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!adminAccessCode.trim()) return;
    setIsLoadingAdmin(true);
    const res = await loginCommercialAdmin(adminAccessCode);
    setIsLoadingAdmin(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Code Licence / Administrateur invalide.');
    } else {
      setAdminAccessCode('');
    }
  };

  // =========================================================================
  // HANDLER 2: SPECIAL INTERNAL RESTAURANT STAFF TERMINAL (4-DIGIT PIN PAD)
  // =========================================================================
  const handleDigit = (digit: string) => {
    setErrorMsg(null);
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        attemptStaffLogin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const attemptStaffLogin = (codeToTry: string) => {
    const floatVal = showFloatInput ? Number(cashFloat) || 0 : undefined;
    const res = loginWithPin(codeToTry, floatVal);
    if (!res.success) {
      setErrorMsg(res.message || 'Code PIN Staff incorrect');
      setTimeout(() => setPin(''), 400);
    }
  };

  // Physical keyboard support ONLY when inside the Special Internal Staff Terminal
  useEffect(() => {
    if (!isStaffTerminal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        setPin('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isStaffTerminal, pin, showFloatInput, cashFloat]);

  // =========================================================================
  // VIEW A: SPECIAL INTERNAL RESTAURANT STAFF TERMINAL (`/?terminal=staff`)
  // =========================================================================
  if (isStaffTerminal && activeClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-brand-950 text-white flex flex-col lg:flex-row items-center justify-center p-4 sm:p-8 gap-8 select-none">
        {/* Left Column: Restaurant Internal Staff Terminal Identity & Kiosk Mode */}
        <div className="w-full max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
            <Users className="w-4 h-4" /> Interface Interne du Personnel • {activeClient.restaurantName}
          </div>

          <div className="flex items-center gap-4">
            <img
              src={branding.logoUrl || '/icon.svg'}
              alt={activeClient.restaurantName}
              className="w-16 h-16 rounded-2xl bg-white p-1.5 object-contain shadow-xl"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {activeClient.restaurantName}
              </h1>
              <p className="text-xs sm:text-sm text-amber-300 font-semibold mt-0.5">
                Terminal Interne Staff (Caissier • Serveur • Cuisine)
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4" /> Pointage & Ouverture de Session Staff
            </div>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Bienvenue sur le terminal interne de <strong>{activeClient.restaurantName}</strong>. Entrez le <strong>Code PIN à 4 chiffres</strong> attribué par votre administrateur pour accéder directement à votre poste (<strong>Caisse POS</strong>, <strong>Plan de Salle Serveur</strong> ou <strong>Écran Cuisine KDS</strong>).
            </p>
          </div>

          {/* Dedicated Kiosk Self-Order Mode Button (Inside the restaurant's internal terminal) */}
          <button
            type="button"
            onClick={() => {
              setIsKioskTerminal(true);
              setActiveView('kiosk');
            }}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-brand-600/25 flex items-center justify-between transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <MonitorSmartphone className="w-6 h-6" />
              <div className="text-left">
                <span className="block text-sm font-black">
                  Basculer cet écran en Borne Client (Kiosk)
                </span>
                <span className="block text-[11px] text-orange-100 font-medium">
                  Verrouille le terminal pour la prise de commande autonome client
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-white/20 text-xs font-black">
              Lancer →
            </span>
          </button>

          <div className="pt-2 flex items-center justify-between text-xs text-stone-400">
            <span>Terminal Interne #{activeClient.id.slice(-4)}</span>
            <button
              type="button"
              onClick={() => setIsStaffTerminal(false)}
              className="text-stone-400 hover:text-white font-semibold underline transition"
            >
              Portail Administrateur Principal
            </button>
          </div>
        </div>

        {/* Right Column: Tactile 4-Digit PIN Pad for Staff */}
        <div className="w-full max-w-sm bg-white text-stone-900 rounded-3xl shadow-2xl p-6 sm:p-7 border border-stone-200">
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-2.5">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-stone-900">Code PIN Employé</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Caissier, Serveur ou Cuisinier ({activeClient.restaurantName})
            </p>
          </div>

          {/* 4-Digit PIN Dots Display */}
          <div className="flex justify-center gap-4 my-5">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                    errorMsg
                      ? 'border-red-500 bg-red-50 text-red-600 animate-bounce'
                      : filled
                      ? 'border-brand-600 bg-brand-50 text-brand-600 scale-105'
                      : 'border-stone-200 bg-stone-50 text-stone-300'
                  }`}
                >
                  {filled ? '●' : ''}
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-extrabold text-center">
              {errorMsg}
            </div>
          )}

          {/* Optional Opening Cash Float for Cashiers */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowFloatInput(!showFloatInput)}
              className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-between transition"
            >
              <span className="flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Fonds de caisse à l’ouverture
              </span>
              <span className="font-extrabold text-emerald-700">
                {showFloatInput ? 'Masquer' : formatDA(Number(cashFloat) || 0)}
              </span>
            </button>

            {showFloatInput && (
              <div className="mt-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <label className="block text-[11px] font-bold uppercase text-emerald-800 mb-1">
                  Montant initial dans le tiroir-caisse (DA)
                </label>
                <input
                  type="number"
                  step={500}
                  value={cashFloat}
                  onChange={(e) => setCashFloat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 font-black text-sm text-stone-900 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-14 rounded-2xl bg-stone-100 hover:bg-brand-50 hover:text-brand-600 active:scale-95 text-stone-900 font-black text-xl border border-stone-200/80 transition"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setPin('');
              }}
              className="h-14 rounded-2xl bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-500 font-extrabold text-xs border border-stone-200/80 transition"
            >
              Effacer
            </button>

            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-14 rounded-2xl bg-stone-100 hover:bg-brand-50 hover:text-brand-600 active:scale-95 text-stone-900 font-black text-xl border border-stone-200/80 transition"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center border border-stone-200/80 transition"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: MAIN COMMERCIAL PORTAL (`/`) — STRICTLY FOR RESTAURANT ADMINS
  // (No visible Super Admin button anywhere; Super Admin logs in using master code here)
  // =========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-brand-950 text-white flex flex-col lg:flex-row items-center justify-center p-4 sm:p-8 gap-10 select-none">
      {/* Left Column: Commercial Product Presentation */}
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <img
            src="/icon.svg"
            alt="MonResto"
            className="w-16 h-16 rounded-2xl bg-white p-1.5 object-contain shadow-xl"
          />
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-400/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              Solution Tout-en-Un Restauration
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
              MonResto Pro
            </h1>
          </div>
        </div>

        <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
          Plateforme commerciale tout-en-un pour restaurants, fast-foods et grillades : <strong>Caisse Tactile POS</strong>, <strong>Borne de Commande Client (Kiosk)</strong>, <strong>Prise de Commande Serveur Mobile</strong>, <strong>Écran Cuisine (KDS)</strong> et <strong>Gestion des Stocks</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            'Caisse POS & Impression Double Ticket',
            'Borne Client Tactile & Espaces Pub',
            'Lien Interne Dédié pour votre Staff',
            'Menu, Sauces & Options Sur Mesure',
          ].map((feat) => (
            <div
              key={feat}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs font-bold text-stone-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Commercial Client Admin Login Card (Zero visible Super Admin button) */}
      <div className="w-full max-w-md bg-white text-stone-900 rounded-3xl shadow-2xl p-7 sm:p-8 border border-stone-200">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-stone-900">
            Connexion Espace Client
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Accès réservé aux gérants et administrateurs de restaurants titulaires d’une licence active
          </p>
        </div>

        <form onSubmit={handleCommercialLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase text-stone-500 mb-1.5">
              Code Administrateur ou Clé de Licence Restaurant
            </label>
            <input
              type="password"
              required
              autoFocus
              value={adminAccessCode}
              onChange={(e) => {
                setErrorMsg(null);
                setAdminAccessCode(e.target.value);
              }}
              placeholder="Saisissez votre code client..."
              className="w-full px-4 py-4 rounded-2xl bg-stone-50 border-2 border-stone-200 focus:border-brand-600 text-center text-lg font-black tracking-widest text-stone-900 focus:outline-none transition"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-extrabold text-center leading-relaxed">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoadingAdmin}
            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:bg-stone-300 text-white font-black text-sm shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Store className="w-4 h-4" />
            <span>
              {isLoadingAdmin
                ? 'Vérification de la licence...'
                : 'Ouvrir mon Restaurant (Admin)'}
            </span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-100 space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Licence vérifiée • Données d’exploitation 100% locales</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Vous êtes membre de l’équipe (Serveur, Caissier, Cuisine) ? Demandez à votre gérant le <strong>Lien Interne Staff</strong> de votre restaurant.
          </p>
        </div>
      </div>
    </div>
  );
};
