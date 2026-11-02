import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  Phone,
  Printer,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import { useResto } from '../context/RestoContext';
import { Order } from '../types';
import { TicketPrintModal } from './TicketPrintModal';

export const KitchenKDSView: React.FC = () => {
  const { orders, updateOrderStatus } = useResto();
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Kitchen sees all active orders ('en_attente', 'en_preparation', 'pret') whether Ticket de Table or Paid
  const kitchenOrders = orders.filter(
    (o) =>
      o.status === 'en_attente' ||
      o.status === 'en_preparation' ||
      o.status === 'pret'
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-stone-900 text-white p-4 sm:p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-800/90 p-5 rounded-3xl border border-stone-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">
              Écran Cuisine (KDS) & Bons de Préparation
            </h2>
            <p className="text-xs sm:text-sm text-stone-400">
              Suivi en direct des commandes Sur Place (Table), À Emporter et Livraison avec N° de commande.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
            🔥 {kitchenOrders.length} commande(s) en cours en cuisine
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="py-24 text-center text-stone-500 space-y-3">
          <ChefHat className="w-16 h-16 mx-auto stroke-[1.5] text-stone-600" />
          <p className="text-lg font-extrabold text-stone-300">
            Aucune commande en attente de préparation
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Dès qu’un serveur ou caissier valide une commande (Ticket de Table ou Encaisser), le bon de cuisine apparaît instantanément ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {kitchenOrders.map((ord) => {
            const isReady = ord.status === 'pret';
            return (
              <div
                key={ord.id}
                className={`rounded-3xl border-2 overflow-hidden flex flex-col justify-between ${isReady
                    ? 'bg-emerald-950/40 border-emerald-500/60'
                    : 'bg-stone-800 border-amber-500/70'
                  }`}
              >
                <div>
                  {/* Ticket Header with Order Number + Destination (Table / Emporter / Livraison + Client Number) */}
                  <div
                    className={`p-4 space-y-2 ${isReady ? 'bg-emerald-700' : 'bg-amber-600'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-xl bg-stone-950 text-white font-black text-xl">
                          #{ord.orderNumber}
                        </span>
                        <div>
                          {ord.mode === 'sur_place' && (
                            <span className="font-black text-sm sm:text-base flex items-center gap-1.5">
                              <Store className="w-4 h-4" />
                              {ord.tableName ? ord.tableName.toUpperCase() : 'SUR PLACE (COMPTOIR)'}
                            </span>
                          )}
                          {ord.mode === 'a_emporter' && (
                            <span className="font-black text-sm sm:text-base flex items-center gap-1.5">
                              <ShoppingBag className="w-4 h-4" />À EMPORTER (#{ord.orderNumber})
                            </span>
                          )}
                          {ord.mode === 'livraison' && (
                            <span className="font-black text-sm sm:text-base flex items-center gap-1.5">
                              <Truck className="w-4 h-4" />
                              LIVRAISON (#{ord.orderNumber})
                            </span>
                          )}
                          <span className="text-[11px] text-white/85 font-semibold block">
                            Par : {ord.createdByEmployeeName || 'Borne / Caisse'} •{' '}
                            {ord.paid ? '✅ Payé' : '🍽️ Ticket de Table'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="text-xs font-extrabold flex items-center gap-1 bg-black/25 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(ord.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <button
                          onClick={() => setPrintingOrder(ord)}
                          className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-extrabold flex items-center gap-1 transition"
                        >
                          <Printer className="w-3 h-3" /> Ticket Cuisine
                        </button>
                      </div>
                    </div>

                    {ord.customerName && (
                      <div className="px-3 py-1.5 rounded-xl bg-stone-950/40 text-white text-xs font-extrabold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>Client / N° Livraison : {ord.customerName}</span>
                      </div>
                    )}
                  </div>

                  {/* Items to cook */}
                  <div className="p-4 space-y-3">
                    {ord.items.map((ci) => (
                      <div
                        key={ci.cartItemId}
                        className="p-3 rounded-2xl bg-stone-900/90 border border-stone-700"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-brand-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {ci.quantity}x
                          </span>
                          <div>
                            <h4 className="font-extrabold text-base text-white">
                              {ci.menuItem.name}
                            </h4>
                            {ci.selectedModifiers.length > 0 && (
                              <ul className="mt-1 space-y-0.5 text-xs text-amber-300 font-bold">
                                {ci.selectedModifiers.map((m, i) => (
                                  <li key={i}>• {m.optionName}</li>
                                ))}
                              </ul>
                            )}
                            {ci.note && (
                              <p className="mt-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-extrabold">
                                ⚠️ Note : {ci.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-4 bg-stone-900/60 border-t border-stone-700/80">
                  {!isReady ? (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'pret')}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Bell className="w-4 h-4" /> Marquer PRÊT À SERVIR
                    </button>
                  ) : (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'termine')}
                      className="w-full py-3.5 rounded-2xl bg-stone-700 hover:bg-stone-600 text-white font-extrabold text-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Remis au client / Terminé
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Print Modal */}
      <TicketPrintModal
        order={printingOrder}
        onClose={() => setPrintingOrder(null)}
      />
    </div>
  );
};
