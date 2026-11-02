import React, { useState } from 'react';
import {
  AlertOctagon,
  Building2,
  Calendar,
  CheckCircle2,
  Cloud,
  Copy,
  Crown,
  Database,
  Infinity as InfinityIcon,
  KeyRound,
  Lock,
  LogOut,
  Minus,
  Phone,
  Plus,
  Power,
  RefreshCw,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react';
import { generateRandomPin, useResto } from '../context/RestoContext';
import { ClientAccount, LicensePlan } from '../types';

export const SuperAdminView: React.FC = () => {
  const {
    logoutSuperAdmin,
    setIsSuperAdminPortal,
    supabaseConfig,
    updateSupabaseConfig,
    syncCloudLicensesNow,
    clients,
    activeClientId,
    setActiveClientId,
    addClientAccount,
    changeClientPlan,
    updateClientStaffQuota,
    toggleClientShutoff,
    regenerateClientAdminPin,
    showToast,
  } = useResto();

  // Create new client modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Alger');
  const [initialPlan, setInitialPlan] = useState<LicensePlan>('demo');
  const [initialStaffQuota, setInitialStaffQuota] = useState<number>(3);
  const [randomPinPreview, setRandomPinPreview] = useState(() => generateRandomPin());

  // Supabase Cloud Config Modal (Minimal Cloud: Only client_licenses table)
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url);
  const [sbKey, setSbKey] = useState(supabaseConfig.anonKey);
  const [sbEnabled, setSbEnabled] = useState(supabaseConfig.enabled);

  // DOUBLE VALIDATION MODAL FOR "À VIE" (LIFETIME LICENSE - IRREVERSIBLE)
  const [lifetimeTargetClient, setLifetimeTargetClient] = useState<ClientAccount | null>(null);
  const [validationStep, setValidationStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');

  const openAddModal = () => {
    setRestaurantName('');
    setOwnerName('');
    setPhone('');
    setCity('Alger');
    setInitialPlan('demo');
    setInitialStaffQuota(3);
    setRandomPinPreview(
      generateRandomPin(clients.map((c) => c.adminPinCode))
    );
    setIsAddModalOpen(true);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) return;

    const created = addClientAccount({
      restaurantName: restaurantName.trim(),
      ownerName: ownerName.trim() || 'Gérant',
      phone: phone.trim() || '0550 00 00 00',
      city: city.trim() || 'Alger',
      plan: initialPlan === 'a_vie' ? 'demo' : initialPlan,
      maxStaffQuota: Math.max(1, Number(initialStaffQuota) || 3),
      customAdminPin: randomPinPreview,
    });
    setIsAddModalOpen(false);

    if (initialPlan === 'a_vie') {
      setLifetimeTargetClient(created);
      setValidationStep(1);
      setConfirmText('');
    }
  };

  const handleSaveCloudConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSupabaseConfig({
      url: sbUrl.trim(),
      anonKey: sbKey.trim(),
      enabled: sbEnabled && Boolean(sbUrl.trim() && sbKey.trim()),
    });
    setIsCloudModalOpen(false);
  };

  const handlePlanSelectClick = (client: ClientAccount, nextPlan: LicensePlan) => {
    if (client.planLockedForever || client.plan === 'a_vie') return;
    if (client.plan === nextPlan) return;

    if (nextPlan === 'a_vie') {
      setLifetimeTargetClient(client);
      setValidationStep(1);
      setConfirmText('');
    } else {
      changeClientPlan(client.id, nextPlan);
    }
  };

  const handleConfirmLifetimeFinal = () => {
    if (!lifetimeTargetClient) return;
    changeClientPlan(lifetimeTargetClient.id, 'a_vie');
    setLifetimeTargetClient(null);
    setValidationStep(1);
    setConfirmText('');
  };

  const getRemainingDays = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 86400000));
  };

  const planBadge = (client: ClientAccount) => {
    if (client.plan === 'a_vie' || client.planLockedForever) {
      return {
        label: '🔒 LICENCE À VIE (IRRÉVERSIBLE)',
        cls: 'bg-amber-400 text-stone-950 border-amber-500',
      };
    }
    if (client.plan === 'annuel') {
      return {
        label: '📅 ABONNEMENT ANNUEL (1 AN)',
        cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    }
    if (client.plan === 'mensuel') {
      return {
        label: '🗓️ ABONNEMENT MENSUEL (1 MOIS)',
        cls: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      };
    }
    return {
      label: '⏳ ACTIVATION INITIALE (21 JOURS)',
      cls: 'bg-brand-500/20 text-orange-300 border-brand-500/40',
    };
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col select-none">
      {/* Standalone Super Admin Top Navbar */}
      <header className="h-16 bg-stone-900 border-b border-stone-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-white">
                Console Super Admin Éditeur
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                  supabaseConfig.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                {supabaseConfig.enabled ? '☁️ Cloud Supabase Actif' : 'Stockage Local + Cloud Prêt'}
              </span>
            </div>
            <span className="text-[11px] text-stone-400 hidden sm:block">
              Gestion des comptes Admin, Quotas Staff en local, Abonnements & Shutoff
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSbUrl(supabaseConfig.url);
              setSbKey(supabaseConfig.anonKey);
              setSbEnabled(supabaseConfig.enabled);
              setIsCloudModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 border border-stone-700 transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Base Cloud Supabase</span>
          </button>

          {supabaseConfig.enabled && (
            <button
              type="button"
              onClick={syncCloudLicensesNow}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
              title="Synchroniser les licences avec Supabase"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={logoutSuperAdmin}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Quitter Super Admin</span>
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Super Admin Top Banner */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-brand-950 p-6 rounded-3xl border border-amber-500/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Crown className="w-4 h-4" /> Gestion Commerciale des Licences & Quotas Staff
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Administration des Comptes Restaurants
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 max-w-2xl">
              Créez vos comptes Admin clients avec <strong>Code aléatoire</strong>, débloquez le <strong>nombre exact de comptes Staff autorisés</strong> (gérés en local sans consommation Cloud) et contrôlez les durées (<strong>21j</strong>, <strong>1 Mois</strong>, <strong>1 An</strong>, <strong>À Vie</strong>) + <strong>Shutoff</strong>.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-brand-500 hover:from-amber-300 hover:to-brand-400 text-stone-950 font-black text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 shrink-0 transition active:scale-95"
          >
            <Plus className="w-5 h-5" /> Nouveau Client Restaurant
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <span className="text-[11px] font-bold uppercase text-stone-400">Total Clients</span>
            <div className="text-2xl font-black text-white mt-1">{clients.length}</div>
          </div>
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <span className="text-[11px] font-bold uppercase text-orange-400">Accès 21 Jours</span>
            <div className="text-2xl font-black text-orange-400 mt-1">
              {clients.filter((c) => c.plan === 'demo').length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <span className="text-[11px] font-bold uppercase text-indigo-400">Mensuel (1 mois)</span>
            <div className="text-2xl font-black text-indigo-400 mt-1">
              {clients.filter((c) => c.plan === 'mensuel').length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <span className="text-[11px] font-bold uppercase text-emerald-400">Annuel (1 an)</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {clients.filter((c) => c.plan === 'annuel').length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-stone-900 border border-amber-500/30 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase text-amber-400">À Vie / Shutoff</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {clients.filter((c) => c.plan === 'a_vie').length} À Vie •{' '}
              <span className="text-red-400">
                {clients.filter((c) => c.shutoff).length} Off
              </span>
            </div>
          </div>
        </div>

        {/* Empty State when 0 clients (Initial Commercial State) */}
        {clients.length === 0 ? (
          <div className="bg-stone-900/90 border-2 border-dashed border-stone-800 rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Aucun client enregistré dans la console
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Créez votre premier compte client restaurant pour générer son <strong>Code d’Accès Admin aléatoire</strong>, définir son <strong>Quota de Staff débloqué</strong> et sa période de validité.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="px-7 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm shadow-xl inline-flex items-center gap-2 transition"
            >
              <Plus className="w-5 h-5" /> Créer le Premier Client Restaurant
            </button>
          </div>
        ) : (
          /* Clients Cards Grid */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {clients.map((client) => {
              const badge = planBadge(client);
              const remDays = getRemainingDays(client.expiresAt);
              const isCurrentTerminal = client.id === activeClientId;
              const isLockedLifetime = client.planLockedForever || client.plan === 'a_vie';

              return (
                <div
                  key={client.id}
                  className={`rounded-3xl border-2 p-5 sm:p-6 flex flex-col justify-between gap-5 transition ${
                    client.shutoff
                      ? 'bg-red-950/25 border-red-500/60'
                      : isCurrentTerminal
                      ? 'bg-stone-900 border-amber-400/80 shadow-lg shadow-amber-500/10'
                      : 'bg-stone-900/90 border-stone-800'
                  }`}
                >
                  {/* Top Row: Client Info + Random Admin PIN */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        {client.shutoff && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase animate-pulse">
                            ⛔ SHUTOFF ACTIF
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-white flex items-center gap-2 pt-1">
                        <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>{client.restaurantName}</span>
                      </h3>

                      <p className="text-xs text-stone-400 font-semibold flex flex-wrap items-center gap-3">
                        <span>👤 {client.ownerName}</span>
                        <span>📍 {client.city}</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {client.phone}
                        </span>
                      </p>
                    </div>

                    {/* Random Admin PIN Box */}
                    <div className="flex items-center gap-2 bg-stone-950 p-3 rounded-2xl border border-stone-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-stone-400 block">
                          Code Connexion Admin
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span className="font-mono text-xl font-black text-amber-400 tracking-widest">
                            {client.adminPinCode}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono block">
                          Clé: {client.licenseKey}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(client.adminPinCode);
                          showToast(`📋 Code Admin ${client.adminPinCode} copié !`);
                        }}
                        className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
                        title="Copier le code Admin"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerateClientAdminPin(client.id)}
                        className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
                        title="Régénérer un nouveau code Admin aléatoire"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row 1: STAFF / SCREENS QUOTA CONTROL (Unlocked by Super Admin, enforced locally) */}
                  <div className="p-3.5 rounded-2xl bg-stone-950 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-white block">
                          Quota de Comptes Staff / Écrans Débloqués
                        </span>
                        <span className="text-[11px] text-stone-400">
                          Limite maximale d’employés (Caissiers, Serveurs, Cuisine) que cet Admin peut créer en local
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-stone-900 px-2.5 py-1.5 rounded-xl border border-stone-800">
                      <button
                        type="button"
                        onClick={() =>
                          updateClientStaffQuota(client.id, Math.max(1, (client.maxStaffQuota || 3) - 1))
                        }
                        className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-mono text-base font-black text-amber-400">
                        {client.maxStaffQuota || 3} Staff
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateClientStaffQuota(client.id, (client.maxStaffQuota || 3) + 1)
                        }
                        className="w-7 h-7 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center font-black"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row 2: Remaining Duration & Expiration Info */}
                  <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800/90 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {isLockedLifetime ? (
                        <InfinityIcon className="w-6 h-6 text-amber-400" />
                      ) : (
                        <Calendar className="w-5 h-5 text-brand-400" />
                      )}
                      <div>
                        <span className="text-xs font-extrabold text-white block">
                          {isLockedLifetime
                            ? 'Accès Permanent Illimité (Licence À Vie validée)'
                            : `Durée restante : ${remDays} jour(s) d’accès`}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {isLockedLifetime
                            ? 'Verrouillé après double validation — Aucune expiration'
                            : `Expire le : ${new Date(client.expiresAt!).toLocaleDateString('fr-FR')}`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveClientId(client.id);
                        setIsSuperAdminPortal(false);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-amber-400 text-stone-200 hover:text-stone-950 text-xs font-black flex items-center gap-1.5 transition"
                    >
                      <Store className="w-3.5 h-3.5" /> Tester Connexion Client
                    </button>
                  </div>

                  {/* Bottom Row: Subscription Plan Selector (Disabled forever if 'a_vie') + SHUTOFF Switch */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-stone-400">
                        État de l’abonnement :
                      </span>
                      {isLockedLifetime && (
                        <span className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Modification définitivement bloquée
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { id: 'demo', label: 'Activation 21j', sub: '21 Jours' },
                          { id: 'mensuel', label: 'Mensuel', sub: '1 Mois (30j)' },
                          { id: 'annuel', label: 'Annuel', sub: '1 An (365j)' },
                          { id: 'a_vie', label: 'À Vie 🔒', sub: 'Double Validation' },
                        ] as const
                      ).map((p) => {
                        const active = client.plan === p.id;
                        const disabled = isLockedLifetime;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => handlePlanSelectClick(client, p.id)}
                            className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                              active
                                ? p.id === 'a_vie'
                                  ? 'bg-amber-400 text-stone-950 border-amber-300 font-black'
                                  : 'bg-brand-600 text-white border-brand-500 font-black'
                                : disabled
                                ? 'bg-stone-950/40 border-stone-800/50 text-stone-600 cursor-not-allowed'
                                : 'bg-stone-950 hover:bg-stone-800 border-stone-800 text-stone-300'
                            }`}
                          >
                            <span className="text-xs font-extrabold">{p.label}</span>
                            <span
                              className={`text-[10px] ${
                                active
                                  ? p.id === 'a_vie'
                                    ? 'text-stone-800 font-bold'
                                    : 'text-orange-100'
                                  : 'text-stone-500'
                              }`}
                            >
                              {p.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* SHUTOFF KILL-SWITCH BAR */}
                    <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-3">
                      <div className="text-xs">
                        <span className="font-bold text-stone-300 block">
                          Coupe-Circuit d’Urgence (Shutoff)
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {client.shutoff
                            ? 'Le logiciel de ce client est actuellement bloqué.'
                            : 'Le client a accès normalement à son logiciel.'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleClientShutoff(client.id)}
                        className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition shadow-md shrink-0 ${
                          client.shutoff
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                        <span>
                          {client.shutoff ? 'Désactiver Shutoff (Réactiver)' : 'Activer SHUTOFF (Bloquer)'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: DOUBLE VALIDATION IRRÉVERSIBLE POUR LICENCE "À VIE"
         ===================================================================== */}
      {lifetimeTargetClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-400 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-white">
            <div className="p-5 bg-amber-400 text-stone-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    Sécurité Super Admin • Étape {validationStep} sur 2
                  </span>
                  <h3 className="text-lg font-black leading-none">
                    Double Validation — Licence À VIE
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setLifetimeTargetClient(null)}
                className="p-1.5 rounded-full bg-black/10 hover:bg-black/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationStep === 1 ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm leading-relaxed space-y-2">
                  <p className="font-black text-amber-300 text-sm">
                    ⚠️ Première Validation : Action Irréversible
                  </p>
                  <p>
                    Vous êtes sur le point de passer le compte de{' '}
                    <strong className="text-white">
                      {lifetimeTargetClient.restaurantName}
                    </strong>{' '}
                    en abonnement <strong>À VIE (Illimité)</strong>.
                  </p>
                  <p>
                    Conformément aux règles de sécurité,{' '}
                    <strong className="underline text-white">
                      vous ne pourrez plus jamais modifier cet état
                    </strong>{' '}
                    après la deuxième validation.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setLifetimeTargetClient(null)}
                    className="flex-1 py-3.5 rounded-2xl border border-stone-700 text-stone-300 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidationStep(2)}
                    className="flex-1 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs"
                  >
                    Valider Étape 1 → Passer à l’Étape 2
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs leading-relaxed">
                  🔒 <strong>Deuxième Validation Finale :</strong> Tapez{' '}
                  <code className="px-2 py-0.5 rounded bg-black text-amber-400 font-black">
                    A VIE
                  </code>{' '}
                  ci-dessous :
                </div>

                <div>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Tapez A VIE pour confirmer..."
                    className="w-full px-4 py-3.5 rounded-2xl bg-stone-950 border-2 border-amber-400/60 text-center font-mono text-lg font-black text-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setValidationStep(1)}
                    className="px-4 py-3.5 rounded-2xl border border-stone-700 text-stone-300 font-bold text-xs"
                  >
                    ← Retour
                  </button>
                  <button
                    type="button"
                    disabled={confirmText.trim() !== 'A VIE'}
                    onClick={handleConfirmLifetimeFinal}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmer Définitivement À VIE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: CREATE NEW CLIENT RESTAURANT (WITH RANDOM ADMIN PIN & STAFF QUOTA)
         ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateClient}
            className="bg-stone-900 border border-stone-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-white"
          >
            <div className="p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Nouveau Client Restaurant
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Nom du Restaurant
                </label>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Ex: Le Gourmet d'Alger"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm font-bold text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                    Nom du Gérant
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ex: Karim M."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                    Ville / Wilaya
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Alger, Oran..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm font-bold text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-sm font-bold text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                    État de l’abonnement
                  </label>
                  <select
                    value={initialPlan}
                    onChange={(e) => setInitialPlan(e.target.value as LicensePlan)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-xs font-black text-amber-400"
                  >
                    <option value="demo">Activation Initiale (21 Jours)</option>
                    <option value="mensuel">Abonnement Mensuel (1 Mois)</option>
                    <option value="annuel">Abonnement Annuel (1 An)</option>
                    <option value="a_vie">Licence À Vie (Double validation)</option>
                  </select>
                </div>
              </div>

              {/* Staff Quota Input */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-indigo-500/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-indigo-300 block">
                    Nombre de Staff / Écrans débloqués
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Comptes Caissiers, Serveurs & Cuisine autorisés en local
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={initialStaffQuota}
                  onChange={(e) => setInitialStaffQuota(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl bg-stone-900 border border-indigo-500/50 text-center font-black text-base text-white"
                />
              </div>

              {/* Auto-generated Random Admin PIN */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-amber-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-400 block">
                    Code Admin Généré Aléatoirement
                  </span>
                  <span className="font-mono text-2xl font-black text-white tracking-widest">
                    {randomPinPreview}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRandomPinPreview(
                      generateRandomPin(clients.map((c) => c.adminPinCode))
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Autre code
                </button>
              </div>
            </div>

            <div className="p-4 bg-stone-950 border-t border-stone-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-700 font-bold text-xs text-stone-300"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs"
              >
                Activer ce Client
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: SUPABASE MINIMAL CLOUD CONFIGURATION (ONLY ADMIN LICENSES)
         ===================================================================== */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCloudConfig}
            className="bg-stone-900 border border-stone-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-white"
          >
            <div className="p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-black">
                    Connexion Supabase (Consommation Cloud Minimale)
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Stocke uniquement la table `client_licenses` (Admins, Abonnements, Quotas Staff & Shutoff)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloudModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                <div className="font-black text-emerald-300">
                  💡 Architecture Zéro Surcharge Cloud :
                </div>
                <p>
                  Seule la ligne de licence de chaque Admin est stockée dans Supabase (fichier SQL fourni : <code className="text-white font-mono">supabase_schema.sql</code>). Les commandes, le menu et le pointage des employés restent 100% en local tout en respectant le <strong>Quota Staff</strong> fixé ici.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Project URL Supabase
                </label>
                <input
                  type="url"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Anon Public Key Supabase
                </label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-700 text-xs font-mono text-white"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={sbEnabled}
                  onChange={(e) => setSbEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-xs font-bold text-stone-200">
                  Activer la synchronisation Cloud Supabase des licences Admin
                </span>
              </label>
            </div>

            <div className="p-4 bg-stone-950 border-t border-stone-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsCloudModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-700 font-bold text-xs text-stone-300"
              >
                Fermer
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs"
              >
                Enregistrer & Synchroniser
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
