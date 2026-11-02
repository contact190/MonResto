import React, { useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Lock,
  MonitorSmartphone,
  Plus,
  Receipt,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useResto } from '../context/RestoContext';
import { formatDA } from '../data/initialData';
import { Employee, EmployeeRole } from '../types';

export const StaffView: React.FC = () => {
  const {
    employees,
    currentEmployee,
    activeClient,
    orders,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getStaffInternalUrl,
    setIsStaffTerminal,
    logoutEmployee,
  } = useResto();

  const [showPins, setShowPins] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Quota calculation (Staff accounts excluding the main restaurant Admin)
  const staffEmployees = employees.filter((e) => e.role !== 'admin');
  const currentStaffCount = staffEmployees.length;
  const maxStaffQuota = activeClient?.maxStaffQuota ?? 5;
  const isQuotaReached = currentStaffCount >= maxStaffQuota;
  const staffInternalUrl = getStaffInternalUrl();

  const handleCopyStaffLink = () => {
    navigator.clipboard?.writeText(staffInternalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('caissier');
  const [pinCode, setPinCode] = useState('');
  const [phone, setPhone] = useState('');
  const [cashFloatDA, setCashFloatDA] = useState(10000);
  const [active, setActive] = useState(true);

  const openCreateModal = () => {
    if (isQuotaReached) return;
    setEditingEmp(null);
    setName('');
    setRole('caissier');
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setPinCode(randomPin);
    setPhone('');
    setCashFloatDA(10000);
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setRole(emp.role);
    setPinCode(emp.pinCode);
    setPhone(emp.phone || '');
    setCashFloatDA(emp.cashFloatDA || 0);
    setActive(emp.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pinCode.trim().length < 4) return;

    if (editingEmp) {
      const ok = updateEmployee({
        ...editingEmp,
        name: name.trim(),
        role,
        pinCode: pinCode.trim(),
        phone: phone.trim() || undefined,
        cashFloatDA: Number(cashFloatDA) || 0,
        active,
      });
      if (ok) setIsModalOpen(false);
    } else {
      const ok = addEmployee({
        name: name.trim(),
        role,
        pinCode: pinCode.trim(),
        phone: phone.trim() || undefined,
        cashFloatDA: Number(cashFloatDA) || 0,
        active,
        lastLoginAt: 'Jamais connecté',
      });
      if (ok) setIsModalOpen(false);
    }
  };

  // Compute detailed tracking metrics per employee
  const validOrders = orders.filter((o) => o.status !== 'annule');

  const getEmployeeStats = (emp: Employee) => {
    const cashedOrders = validOrders.filter(
      (o) => o.paid && o.cashedByEmployeeId === emp.id
    );
    const createdOrders = validOrders.filter(
      (o) => o.createdByEmployeeId === emp.id
    );
    const cashTotal = cashedOrders
      .filter((o) => o.paymentMethod === 'especes')
      .reduce((acc, o) => acc + o.total, 0);
    const cibTotal = cashedOrders
      .filter((o) => o.paymentMethod === 'cib_edahabia')
      .reduce((acc, o) => acc + o.total, 0);
    const totalEncaisse = cashTotal + cibTotal;
    const expectedDrawerCash = (emp.cashFloatDA || 0) + cashTotal;

    return {
      cashedCount: cashedOrders.length,
      createdCount: createdOrders.length,
      cashTotal,
      cibTotal,
      totalEncaisse,
      expectedDrawerCash,
    };
  };

  const roleLabel = (r: EmployeeRole) => {
    switch (r) {
      case 'superadmin':
        return { text: 'Super Admin', badge: 'bg-amber-400 text-stone-950 border-amber-500' };
      case 'admin':
        return { text: 'Administrateur (Accès Total)', badge: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'caissier':
        return { text: 'Caissier POS (Encaissement)', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'serveur':
        return { text: 'Serveur Salle / Mobile', badge: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
      case 'cuisinier':
      default:
        return { text: 'Cuisinier (Écran KDS)', badge: 'bg-orange-100 text-orange-900 border-orange-300' };
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream-50 p-4 sm:p-6 space-y-6 select-none">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold mb-1">
            <Shield className="w-3.5 h-3.5" /> Espace Administrateur Principal
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            Gestion des Employés, Codes PIN & Tracking Caissiers
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Attribuez un code PIN et une fonction à chaque employé et contrôlez la caisse de chaque caissier au dinar près.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quota Badge */}
          <div
            className={`px-3.5 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-2 ${
              isQuotaReached
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              Quota Staff débloqué : {currentStaffCount} / {maxStaffQuota}
            </span>
          </div>

          <button
            onClick={() => setShowPins(!showPins)}
            className="px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5"
          >
            {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPins ? 'Masquer Codes PIN' : 'Afficher Codes PIN'}</span>
          </button>

          <button
            onClick={openCreateModal}
            disabled={isQuotaReached}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition ${
              isQuotaReached
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20'
            }`}
          >
            {isQuotaReached ? (
              <>
                <Lock className="w-4 h-4" /> Quota Staff Atteint ({maxStaffQuota} max)
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Nouvel Employé & Code PIN
              </>
            )}
          </button>
        </div>
      </div>

      {/* INTERNAL RESTAURANT STAFF LINK & TERMINAL LAUNCHER */}
      <div className="bg-stone-900 text-white p-5 rounded-3xl border border-stone-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-600/30 border border-brand-500/40 text-amber-400 text-[11px] font-black uppercase">
            <Link2 className="w-3.5 h-3.5" /> Lien & Interface Interne Dédiée au Staff ({activeClient?.restaurantName})
          </div>
          <h3 className="text-base sm:text-lg font-black">
            Accès Interne Employés (Caissiers, Serveurs, Cuisine & Borne)
          </h3>
          <p className="text-xs text-stone-400 max-w-2xl">
            Vos employés ne passent jamais par la page commerciale principale. Partagez ce lien interne sur vos tablettes/caisses ou basculez directement cet écran en mode Terminal Staff pour qu’ils tapent leur code PIN à 4 chiffres.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2.5 rounded-2xl bg-stone-950 border border-stone-800 font-mono text-xs text-amber-300 select-all truncate max-w-xs">
            {staffInternalUrl}
          </div>

          <button
            onClick={handleCopyStaffLink}
            className="px-4 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-stone-700 transition"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Lien Copié !
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copier Lien Staff
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsStaffTerminal(true);
              logoutEmployee();
            }}
            className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <MonitorSmartphone className="w-4 h-4" /> Ouvrir Terminal Staff
          </button>
        </div>
      </div>

      {/* SECTION 1: CASHIER & STAFF TRACKING CARDS */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-brand-600" />
          Suivi des Caisses & Performance par Employé (Session du jour)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const stats = getEmployeeStats(emp);
            const rInfo = roleLabel(emp.role);
            const isCurrent = currentEmployee?.id === emp.id;

            return (
              <div
                key={emp.id}
                className={`bg-white rounded-3xl border-2 p-5 shadow-sm flex flex-col justify-between transition ${
                  isCurrent
                    ? 'border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-stone-200/80'
                } ${!emp.active ? 'opacity-60 grayscale' : ''}`}
              >
                <div>
                  {/* Card Top: Name, Role, PIN */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${rInfo.badge}`}
                        >
                          {rInfo.text}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black">
                            Connecté
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-black text-stone-900 mt-1.5">
                        {emp.name}
                      </h4>
                      <span className="text-xs text-stone-400 font-medium block">
                        Dernier accès : {emp.lastLoginAt || 'Aujourd’hui'}
                      </span>
                    </div>

                    {/* PIN Box */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase text-stone-400 block">
                        Code PIN
                      </span>
                      <div className="mt-0.5 px-3 py-1.5 rounded-xl bg-stone-900 text-amber-400 font-mono font-black text-sm flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>{showPins ? emp.pinCode : '••••'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tracking Financial Metrics */}
                  <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                      <span className="text-[11px] font-bold text-emerald-800 block">
                        Total Encaissé ({stats.cashedCount} cmd)
                      </span>
                      <span className="text-lg font-black text-emerald-700">
                        {formatDA(stats.totalEncaisse)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                        Espèces: {formatDA(stats.cashTotal)} • CIB: {formatDA(stats.cibTotal)}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                      <span className="text-[11px] font-bold text-stone-500 block">
                        Commandes Saisies
                      </span>
                      <span className="text-lg font-black text-stone-900">
                        {stats.createdCount} ticket(s)
                      </span>
                      <span className="text-[10px] text-stone-500 font-semibold block mt-0.5">
                        Fonds initial : {formatDA(emp.cashFloatDA || 0)}
                      </span>
                    </div>
                  </div>

                  {(emp.role === 'caissier' || emp.role === 'admin') && (
                    <div className="mt-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-amber-700" />
                        Espèces attendues dans le tiroir :
                      </span>
                      <span className="font-black text-sm text-amber-950">
                        {formatDA(stats.expectedDrawerCash)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() =>
                      updateEmployee({ ...emp, active: !emp.active })
                    }
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                      emp.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {emp.active ? '● Accès Actif' : '○ Accès Suspendu'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Modifier Code / Rôle
                    </button>
                    {emp.role !== 'admin' && (
                      <button
                        onClick={() => deleteEmployee(emp.id)}
                        className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: DETAILED AUDIT LOG OF ORDERS BY EMPLOYEE */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand-600" />
              Journal de Traçabilité Nominative des Tickets
            </h3>
            <p className="text-xs text-stone-500">
              Vérifiez qui a pris chaque commande et quel caissier l’a encaissée
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-extrabold uppercase text-stone-500">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Heure</th>
                <th className="py-3 px-4">Saisi par (Serveur / Canal)</th>
                <th className="py-3 px-4">Encaissé par (Caissier)</th>
                <th className="py-3 px-4">Mode Règlement</th>
                <th className="py-3 px-4">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70 text-xs sm:text-sm">
              {validOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-4 font-black text-stone-900">
                    #{ord.orderNumber}
                  </td>
                  <td className="py-3 px-4 text-stone-500 font-medium">
                    {new Date(ord.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-800">
                    {ord.createdByEmployeeName ||
                      (ord.source === 'borne' ? '🖥️ Borne Kiosk Client' : 'Caisse')}
                  </td>
                  <td className="py-3 px-4">
                    {ord.paid ? (
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {ord.cashedByEmployeeName ||
                          (ord.source === 'borne' ? 'TPE Borne CIB' : 'Caissier')}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold text-xs">
                        🔒 Non encaissé (En attente)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-stone-600">
                    {ord.paid
                      ? ord.paymentMethod === 'cib_edahabia'
                        ? 'Carte CIB / Edahabia'
                        : 'Espèces (DA)'
                      : '—'}
                  </td>
                  <td className="py-3 px-4 font-black text-brand-600">
                    {formatDA(ord.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-extrabold">
                {editingEmp ? 'Modifier Employé & Code PIN' : 'Nouvel Employé'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Nom complet de l’employé
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sofiane M. (Caissier Soir)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Fonction / Rôle
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as EmployeeRole)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-extrabold"
                  >
                    <option value="caissier">Caissier POS</option>
                    <option value="serveur">Serveur Salle / Mobile</option>
                    <option value="cuisinier">Cuisinier (Écran KDS)</option>
                    <option value="admin">Administrateur (Gérant)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Code PIN (4 chiffres)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 4455"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-brand-400 bg-brand-50/40 font-mono text-base font-black text-center tracking-widest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Fonds de caisse initial (DA)
                  </label>
                  <input
                    type="number"
                    step={500}
                    value={cashFloatDA}
                    onChange={(e) => setCashFloatDA(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                    Téléphone (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs"
              >
                Enregistrer le code d’accès
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

