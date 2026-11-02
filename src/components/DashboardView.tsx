import React, { useState } from 'react';
import {
  Award,
  Banknote,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  MonitorSmartphone,
  Printer,
  RotateCcw,
  ShoppingBag,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { useResto } from '../context/RestoContext';
import { formatDA } from '../data/initialData';
import { Order, OrderSource } from '../types';
import { TicketPrintModal } from './TicketPrintModal';

export const DashboardView: React.FC = () => {
  const { orders, updateOrderStatus, markOrderPaid } = useResto();
  const [filterSource, setFilterSource] = useState<'all' | OrderSource>('all');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const validOrders = orders.filter((o) => o.status !== 'annule');
  const totalRevenue = validOrders.reduce((acc, o) => acc + o.total, 0);
  const paidRevenue = validOrders
    .filter((o) => o.paid)
    .reduce((acc, o) => acc + o.total, 0);
  const pendingRevenue = totalRevenue - paidRevenue;
  const avgBasket =
    validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

  // Breakdown by source (Borne Kiosk vs Caisse vs Serveur Mobile)
  const borneOrders = validOrders.filter((o) => o.source === 'borne');
  const caisseOrders = validOrders.filter((o) => o.source === 'caisse');
  const serveurOrders = validOrders.filter((o) => o.source === 'serveur');

  const borneRevenue = borneOrders.reduce((a, b) => a + b.total, 0);
  const caisseRevenue = caisseOrders.reduce((a, b) => a + b.total, 0);
  const serveurRevenue = serveurOrders.reduce((a, b) => a + b.total, 0);

  // Top Selling Products
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  validOrders.forEach((o) => {
    o.items.forEach((ci) => {
      const prev = productMap.get(ci.menuItem.id) || {
        name: ci.menuItem.name,
        qty: 0,
        revenue: 0,
      };
      productMap.set(ci.menuItem.id, {
        name: ci.menuItem.name,
        qty: prev.qty + ci.quantity,
        revenue: prev.revenue + ci.unitPrice * ci.quantity,
      });
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const filteredOrders = orders.filter(
    (o) => filterSource === 'all' || o.source === filterSource
  );

  const handleExportCSV = () => {
    const headers = ['Numero', 'Source', 'Mode', 'Statut', 'Paye', 'Total_DA', 'Heure'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.source,
      o.mode,
      o.status,
      o.paid ? 'OUI' : 'NON',
      o.total,
      new Date(o.createdAt).toLocaleTimeString('fr-FR'),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport_monresto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-cream-50 p-4 sm:p-6 space-y-6 select-none">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            Tableau de Bord & Rapports Financiers
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Suivi en temps réel du Chiffre d’Affaires (DA), des ventes Borne Kiosk, Caisse POS et Serveur Mobile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Imprimer Z-Ticket
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Chiffre d’Affaires Global
            </span>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
              {formatDA(totalRevenue)}
            </div>
            <span className="text-xs font-bold text-emerald-600 mt-1 block">
              Encaissé : {formatDA(paidRevenue)} • En cours : {formatDA(pendingRevenue)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Commandes du Jour
            </span>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
              {validOrders.length}
            </div>
            <span className="text-xs font-semibold text-stone-500 mt-1 block">
              Panier moyen : <strong className="text-stone-800">{formatDA(avgBasket)}</strong>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Ventes Borne Kiosk
            </span>
            <div className="text-2xl sm:text-3xl font-black text-brand-600 mt-1">
              {formatDA(borneRevenue)}
            </div>
            <span className="text-xs font-semibold text-stone-500 mt-1 block">
              {borneOrders.length} commande(s) autonome(s)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-600 flex items-center justify-center">
            <MonitorSmartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Caisse & Serveur Mobile
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
              {formatDA(caisseRevenue + serveurRevenue)}
            </div>
            <span className="text-xs font-semibold text-stone-500 mt-1 block">
              {caisseOrders.length} Caisse • {serveurOrders.length} Serveur Mobile
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Analytics Grid: Channel Breakdown + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-600" />
              Répartition par Canal de Prise de Commande
            </h3>
          </div>

          <div className="space-y-4 pt-2">
            {[
              {
                label: 'Borne de Commande Client (Kiosk)',
                amount: borneRevenue,
                count: borneOrders.length,
                color: 'bg-brand-600',
              },
              {
                label: 'Caisse Principale (POS Écran Normal)',
                amount: caisseRevenue,
                count: caisseOrders.length,
                color: 'bg-emerald-600',
              },
              {
                label: 'Prise de Commande Serveur (Mobile PWA)',
                amount: serveurRevenue,
                count: serveurOrders.length,
                color: 'bg-indigo-600',
              },
            ].map((ch) => {
              const pct =
                totalRevenue > 0 ? Math.round((ch.amount / totalRevenue) * 100) : 0;
              return (
                <div key={ch.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs sm:text-sm font-bold">
                    <span className="text-stone-700">
                      {ch.label} ({ch.count} cmd)
                    </span>
                    <span className="text-stone-900 font-black">
                      {formatDA(ch.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${ch.color} transition-all duration-500`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Best Sellers */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Meilleures Ventes du Jour
          </h3>

          <div className="space-y-2.5">
            {topProducts.map((prod, index) => (
              <div
                key={prod.name}
                className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/60"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-brand-100 text-brand-700 font-black text-xs flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
                      {prod.name}
                    </h4>
                    <span className="text-[11px] font-semibold text-stone-500">
                      {prod.qty} unités vendues
                    </span>
                  </div>
                </div>
                <span className="font-black text-sm text-brand-600">
                  {formatDA(prod.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders History & Live Control Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-extrabold text-base text-stone-900">
            Journal des Commandes ({filteredOrders.length})
          </h3>

          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: 'Toutes' },
                { id: 'borne', label: 'Borne Kiosk' },
                { id: 'caisse', label: 'Caisse POS' },
                { id: 'serveur', label: 'Serveur Mobile' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterSource(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  filterSource === f.id
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-extrabold uppercase text-stone-500">
                <th className="py-3.5 px-4">N° Ticket</th>
                <th className="py-3.5 px-4">Origine & Table</th>
                <th className="py-3.5 px-4">Articles</th>
                <th className="py-3.5 px-4">Montant</th>
                <th className="py-3.5 px-4">Paiement</th>
                <th className="py-3.5 px-4">Statut Cuisine</th>
                <th className="py-3.5 px-4 text-right">Actions Rapides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70 text-xs sm:text-sm">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50/70">
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-black text-xs">
                      {ord.orderNumber}
                    </span>
                    <span className="block text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ord.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        ord.source === 'borne'
                          ? 'bg-brand-100 text-brand-800'
                          : ord.source === 'serveur'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {ord.source === 'borne'
                        ? '🖥️ Borne Kiosk'
                        : ord.source === 'serveur'
                        ? '📱 Serveur'
                        : '💻 Caisse'}
                    </span>
                    <div className="font-bold text-stone-800 mt-0.5">
                      {ord.tableName ||
                        (ord.mode === 'sur_place' ? 'Sur Place' : 'À Emporter')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      {ord.items.map((ci) => (
                        <div
                          key={ci.cartItemId}
                          className="text-xs font-semibold text-stone-700 truncate"
                        >
                          <strong>{ci.quantity}x</strong> {ci.menuItem.name}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-black text-base text-stone-900">
                    {formatDA(ord.total)}
                  </td>

                  <td className="py-3.5 px-4">
                    {ord.paid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {ord.paymentMethod === 'cib_edahabia' ? 'CIB / Edahabia' : 'Espèces'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                        À encaisser
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) =>
                        updateOrderStatus(ord.id, e.target.value as typeof ord.status)
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-extrabold text-stone-800"
                    >
                      <option value="en_attente">⏳ En attente</option>
                      <option value="en_preparation">🔥 En cuisine</option>
                      <option value="pret">🔔 Prêt à servir</option>
                      <option value="termine">✅ Terminé</option>
                      <option value="annule">❌ Annulé</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setPrintingOrder(ord)}
                        className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs flex items-center gap-1"
                        title="Imprimer Ticket de Caisse & Ticket Cuisine"
                      >
                        <Printer className="w-3.5 h-3.5" /> Tickets
                      </button>
                      {!ord.paid && (
                        <>
                          <button
                            onClick={() => markOrderPaid(ord.id, 'especes', ord.total)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1"
                            title="Encaisser en espèces"
                          >
                            <Banknote className="w-3.5 h-3.5" /> Espèces
                          </button>
                          <button
                            onClick={() => markOrderPaid(ord.id, 'cib_edahabia', ord.total)}
                            className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs flex items-center gap-1"
                            title="Encaisser par CIB"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> CIB
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Ticket Print Modal */}
      <TicketPrintModal
        order={printingOrder}
        onClose={() => setPrintingOrder(null)}
      />
    </div>
  );
};

