import React, { useState } from 'react';
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  Printer,
  Receipt,
  Sparkles,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { useResto } from '../context/RestoContext';
import { formatDA } from '../data/initialData';
import { Order, RestaurantTable, TableZone } from '../types';
import { TicketPrintModal } from './TicketPrintModal';

const ZONES: TableZone[] = ['Salle Principale', 'Terrasse', 'Espace Famille'];

export const TablesView: React.FC = () => {
  const {
    tables,
    orders,
    setSelectedTableId,
    setActiveView,
    updateTableStatus,
    markOrderPaid,
    addTable,
  } = useResto();

  const [selectedZone, setSelectedZone] = useState<TableZone | 'Toutes'>('Toutes');
  const [activeTableModal, setActiveTableModal] = useState<RestaurantTable | null>(null);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState<boolean>(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // New table form
  const [newTableName, setNewTableName] = useState('');
  const [newTableZone, setNewTableZone] = useState<TableZone>('Salle Principale');
  const [newTableCapacity, setNewTableCapacity] = useState(4);

  // Reservation input inside modal
  const [resName, setResName] = useState('');
  const [guestCount, setGuestCount] = useState(2);

  const filteredTables = tables.filter(
    (t) => selectedZone === 'Toutes' || t.zone === selectedZone
  );

  const getTableOrder = (table: RestaurantTable) => {
    if (!table.currentOrderId) return undefined;
    return orders.find((o) => o.id === table.currentOrderId);
  };

  const handleOpenPOSForTable = (table: RestaurantTable) => {
    setSelectedTableId(table.id);
    setActiveTableModal(null);
    setActiveView('pos');
  };

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    addTable(newTableName.trim(), newTableZone, newTableCapacity);
    setNewTableName('');
    setIsAddTableModalOpen(false);
  };

  const countLibre = tables.filter((t) => t.status === 'libre').length;
  const countOccupee = tables.filter((t) => t.status === 'occupee').length;
  const countEncaisser = tables.filter((t) => t.status === 'a_encaisser').length;
  const countReservee = tables.filter((t) => t.status === 'reservee').length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream-50 p-4 sm:p-6 space-y-6 select-none">
      {/* Header & Status Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            Plan de Salle & Tables
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Touchez une table pour prendre une commande serveur, vérifier l’addition ou encaisser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Libres ({countLibre})
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            Occupées ({countOccupee})
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            À encaisser ({countEncaisser})
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-extrabold">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            Réservées ({countReservee})
          </div>

          <button
            onClick={() => setIsAddTableModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Ajouter Table
          </button>
        </div>
      </div>

      {/* Zone Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {(['Toutes', ...ZONES] as const).map((zone) => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition shrink-0 ${
              selectedZone === zone
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Visual Floor Plan Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const order = getTableOrder(table);
          const statusStyles = {
            libre: {
              border: 'border-emerald-200 hover:border-emerald-400',
              badge: 'bg-emerald-100 text-emerald-800',
              label: 'Libre',
              dot: 'bg-emerald-500',
            },
            occupee: {
              border: 'border-brand-300 hover:border-brand-500 bg-brand-50/20',
              badge: 'bg-brand-100 text-brand-800',
              label: 'Service en cours',
              dot: 'bg-brand-500',
            },
            a_encaisser: {
              border: 'border-amber-300 hover:border-amber-500 bg-amber-50/30',
              badge: 'bg-amber-100 text-amber-900',
              label: 'Addition / Prêt',
              dot: 'bg-amber-500',
            },
            reservee: {
              border: 'border-purple-200 hover:border-purple-400 bg-purple-50/20',
              badge: 'bg-purple-100 text-purple-800',
              label: 'Réservée',
              dot: 'bg-purple-500',
            },
          }[table.status];

          return (
            <div
              key={table.id}
              onClick={() => {
                setGuestCount(table.guests || table.capacity);
                setResName(table.reservationName || '');
                setActiveTableModal(table);
              }}
              className={`bg-white rounded-3xl border-2 ${statusStyles.border} p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[190px]`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      {table.zone}
                    </span>
                    <h3 className="text-lg font-black text-stone-900">{table.name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${statusStyles.badge}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusStyles.dot}`} />
                    {statusStyles.label}
                  </span>
                </div>

                {/* Details based on status */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-4 text-xs text-stone-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      {table.guests ? `${table.guests} / ${table.capacity} pers.` : `${table.capacity} places`}
                    </span>
                    {table.occupiedSince && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        Depuis {table.occupiedSince}
                      </span>
                    )}
                  </div>

                  {table.status === 'reservee' && table.reservationName && (
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-900 text-xs font-bold flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{table.reservationName}</span>
                    </div>
                  )}

                  {order && (
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-stone-500 block">
                          Ticket #{order.orderNumber}
                        </span>
                        <span className="text-xs font-semibold text-stone-700">
                          {order.items.reduce((a, b) => a + b.quantity, 0)} articles
                        </span>
                      </div>
                      <span className="text-base font-black text-brand-600">
                        {formatDA(order.total)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPOSForTable(table);
                  }}
                  className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  {table.status === 'libre' ? 'Ouvrir & Commander' : 'Ajouter des plats'}
                </button>

                {order && !order.paid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markOrderPaid(order.id, 'especes', order.total);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs"
                  >
                    <Banknote className="w-3.5 h-3.5" /> Encaisser
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TABLE ACTION MODAL */}
      {activeTableModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase">
                  {activeTableModal.zone}
                </span>
                <h3 className="text-xl font-extrabold">{activeTableModal.name}</h3>
              </div>
              <button
                onClick={() => setActiveTableModal(null)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Order Summary if occupied */}
              {(() => {
                const ord = getTableOrder(activeTableModal);
                if (!ord) return null;
                return (
                  <div className="p-4 rounded-2xl bg-cream-100 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="text-xs font-extrabold text-stone-700 flex items-center gap-1">
                        <Receipt className="w-4 h-4 text-brand-600" />
                        Commande #{ord.orderNumber}
                      </span>
                      <span className="text-base font-black text-brand-600">
                        {formatDA(ord.total)}
                      </span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {ord.items.map((ci) => (
                        <div key={ci.cartItemId} className="flex justify-between text-xs">
                          <span className="font-semibold text-stone-800">
                            {ci.quantity}x {ci.menuItem.name}
                          </span>
                          <span className="font-bold text-stone-600">
                            {formatDA(ci.unitPrice * ci.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTableModal(null);
                          setPrintingOrder(ord);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-extrabold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4 text-brand-600" /> Tickets Table & Cuisine
                      </button>
                      {!ord.paid && (
                        <button
                          type="button"
                          onClick={() => {
                            markOrderPaid(ord.id, 'especes', ord.total);
                            updateTableStatus(activeTableModal.id, 'libre');
                            setActiveTableModal(null);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Encaisser & Libérer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Guests Count */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-2">
                  Nombre de convives à table
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGuestCount(n)}
                      className={`flex-1 py-2 rounded-xl font-extrabold text-xs border ${
                        guestCount === n
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Table Status */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-2">
                  Changer l’état de la table
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateTableStatus(activeTableModal.id, 'libre');
                      setActiveTableModal(null);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-extrabold text-xs"
                  >
                    🟢 Marquer Libre
                  </button>
                  <button
                    onClick={() => {
                      updateTableStatus(activeTableModal.id, 'occupee', guestCount);
                      setActiveTableModal(null);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-900 font-extrabold text-xs"
                  >
                    🟠 Marquer Occupée
                  </button>
                  <button
                    onClick={() => {
                      updateTableStatus(activeTableModal.id, 'a_encaisser', guestCount);
                      setActiveTableModal(null);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 font-extrabold text-xs"
                  >
                    🟡 Addition demandée
                  </button>
                  <button
                    onClick={() => {
                      updateTableStatus(
                        activeTableModal.id,
                        'reservee',
                        guestCount,
                        resName || 'Client Réservé (20h00)'
                      );
                      setActiveTableModal(null);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 font-extrabold text-xs"
                  >
                    🟣 Réserver Table
                  </button>
                </div>
              </div>

              {/* Primary CTA: Take Order on POS/Mobile */}
              <button
                onClick={() => handleOpenPOSForTable(activeTableModal)}
                className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Prendre / Compléter la commande sur cette table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW TABLE MODAL */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddTableSubmit}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Ajouter une Table</h3>
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Nom / Numéro de la table
                </label>
                <input
                  type="text"
                  required
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Ex: Table 07, Terrasse 04..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Zone / Espace
                </label>
                <select
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value as TableZone)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Capacité (Places)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddTableModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-300 font-bold text-xs text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-extrabold text-xs"
              >
                Créer la table
              </button>
            </div>
          </form>
        </div>
      )}
      <TicketPrintModal
        order={printingOrder}
        onClose={() => setPrintingOrder(null)}
      />
    </div>
  );
};

