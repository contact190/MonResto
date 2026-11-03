import React, { useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  Phone,
  Printer,
  Receipt,
  ShoppingBag,
  Store,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { formatDA } from '../data/initialData';
import { useResto } from '../context/RestoContext';
import { executePrintJob } from '../lib/thermalPrinter';
import { Order } from '../types';

interface TicketPrintModalProps {
  order: Order | null;
  onClose: () => void;
}

export const TicketPrintModal: React.FC<TicketPrintModalProps> = ({ order, onClose }) => {
  const { branding, activeClient, printerSettings, showToast } = useResto();
  const [viewMode, setViewMode] = useState<'both' | 'caisse' | 'cuisine'>('both');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  if (!order) return null;

  const timeStr = new Date(order.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = new Date(order.createdAt).toLocaleDateString('fr-FR');

  const getModeLabel = () => {
    if (order.mode === 'sur_place') {
      return order.tableName ? `SUR PLACE • ${order.tableName.toUpperCase()}` : 'SUR PLACE • COMPTOIR';
    }
    if (order.mode === 'a_emporter') {
      return 'À EMPORTER';
    }
    return 'LIVRAISON CLIENT';
  };

  const handlePrint = async (target: 'both' | 'caisse' | 'cuisine') => {
    setIsPrinting(true);
    setViewMode(target);

    try {
      if (target === 'caisse' || target === 'both') {
        await executePrintJob('caisse', order, branding, activeClient, printerSettings);
      }
      if (target === 'cuisine' || target === 'both') {
        await executePrintJob('cuisine', order, branding, activeClient, printerSettings);
      }
      showToast('Impression thermique envoyée !');
    } catch {
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <div className="bg-stone-100 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-300">
        {/* Modal Top Controls (Hidden when printing) */}
        <div className="p-4 sm:px-6 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                Commande #{order.orderNumber} validée & envoyée en cuisine !
              </h3>
              <p className="text-xs text-stone-400">
                {order.paid
                  ? `Encaissé (${formatDA(order.total)}) • Ticket Caisse + Ticket Cuisine générés`
                  : `Ticket de Table (${formatDA(order.total)}) • Envoyé en cuisine`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter View Tabs */}
            <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-700 text-xs font-bold">
              <button
                onClick={() => setViewMode('both')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'both' ? 'bg-brand-600 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                Les 2 Tickets
              </button>
              <button
                onClick={() => setViewMode('caisse')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'caisse' ? 'bg-brand-600 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                Ticket Client
              </button>
              <button
                onClick={() => setViewMode('cuisine')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'cuisine' ? 'bg-brand-600 text-white' : 'text-stone-400 hover:text-white'
                }`}
              >
                Ticket Cuisine
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tickets Preview Area */}
        <div
          id="printable-tickets-area"
          className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
        >
          {/* =========================================================
              TICKET 1: TICKET DE CAISSE / TICKET DE TABLE (CLIENT)
             ========================================================= */}
          {(viewMode === 'both' || viewMode === 'caisse') && (
            <div className="bg-white rounded-2xl shadow-md border border-stone-200 p-6 font-mono text-stone-900 mx-auto w-full max-w-sm">
              {/* Ticket Header with Custom Restaurant Logo & Name */}
              <div className="text-center border-b-2 border-dashed border-stone-300 pb-4">
                {branding.logoUrl && (
                  <img
                    src={branding.logoUrl}
                    alt={branding.restaurantName}
                    className="w-12 h-12 rounded-xl object-contain mx-auto mb-1.5"
                  />
                )}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 text-xs font-sans font-extrabold uppercase mb-1">
                  <Receipt className="w-3.5 h-3.5 text-brand-600" />
                  {order.paid ? 'Ticket de Caisse Client' : 'Ticket de Table / Addition'}
                </div>
                <h2 className="text-xl font-black tracking-tight font-sans mt-1 uppercase">
                  {activeClient?.restaurantName || branding.restaurantName}
                </h2>
                <p className="text-[11px] text-stone-500">
                  {branding.tagline || 'Restauration & Grillades'}
                </p>
                {activeClient && (
                  <p className="text-[11px] text-stone-500">
                    {activeClient.city} • Tél : {activeClient.phone}
                  </p>
                )}
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {dateStr} à {timeStr}
                </p>
              </div>

              {/* Order Call Number & Mode Box */}
              <div className="my-3 py-3 px-3 rounded-xl bg-stone-100 border border-stone-300 text-center">
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-500 block">
                  N° DE COMMANDE
                </span>
                <div className="text-3xl font-black font-sans text-stone-950 tracking-wider">
                  #{order.orderNumber}
                </div>
                <div className="mt-1 inline-block px-2.5 py-0.5 rounded bg-stone-900 text-white text-xs font-sans font-extrabold">
                  {getModeLabel()}
                </div>
                {order.customerName && (
                  <div className="mt-1.5 text-xs font-sans font-bold text-stone-800 flex items-center justify-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-brand-600" />
                    <span>Client : {order.customerName}</span>
                  </div>
                )}
              </div>

              {/* Staff Meta */}
              <div className="text-[11px] text-stone-600 border-b border-dashed border-stone-300 pb-2 mb-3 space-y-0.5">
                <div className="flex justify-between">
                  <span>Servi par :</span>
                  <span className="font-bold text-stone-900">
                    {order.createdByEmployeeName || 'Caisse / Borne'}
                  </span>
                </div>
                {order.paid && order.cashedByEmployeeName && (
                  <div className="flex justify-between">
                    <span>Encaissé par :</span>
                    <span className="font-bold text-stone-900">
                      {order.cashedByEmployeeName}
                    </span>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="space-y-2.5 text-xs border-b-2 border-dashed border-stone-300 pb-3">
                {order.items.map((ci) => (
                  <div key={ci.cartItemId}>
                    <div className="flex justify-between font-bold text-stone-900">
                      <span>
                        {ci.quantity}x {ci.menuItem.name}
                      </span>
                      <span>{formatDA(ci.unitPrice * ci.quantity)}</span>
                    </div>
                    {ci.selectedModifiers.length > 0 && (
                      <div className="pl-3 text-[11px] text-stone-500">
                        {ci.selectedModifiers.map((m, i) => (
                          <div key={i} className="flex justify-between">
                            <span>+ {m.optionName}</span>
                            {m.price > 0 && <span>{formatDA(m.price)}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {ci.note && (
                      <div className="pl-3 text-[11px] italic text-stone-600">
                        Note: {ci.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-3 space-y-1 text-xs">
                {order.discount > 0 && (
                  <>
                    <div className="flex justify-between text-stone-600">
                      <span>Sous-total</span>
                      <span>{formatDA(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Remise</span>
                      <span>-{formatDA(order.discount)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-base font-black font-sans text-stone-950 pt-1">
                  <span>TOTAL À PAYER</span>
                  <span>{formatDA(order.total)}</span>
                </div>

                {order.paid ? (
                  <div className="pt-2 mt-2 border-t border-dashed border-stone-300 space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>STATUT :</span>
                      <span>
                        PAYÉ ({order.paymentMethod === 'cib_edahabia' ? 'CIB / EDAHABIA' : 'ESPÈCES'})
                      </span>
                    </div>
                    {order.cashReceived && order.cashReceived > 0 && (
                      <>
                        <div className="flex justify-between text-stone-600">
                          <span>Espèces reçues :</span>
                          <span>{formatDA(order.cashReceived)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-stone-900">
                          <span>Monnaie rendue :</span>
                          <span>{formatDA(order.changeGiven || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-300 text-center font-sans font-extrabold text-xs text-amber-900">
                    TICKET DE TABLE — À RÉGLER EN CAISSE
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-dashed border-stone-300 text-center text-[11px] text-stone-500">
                Merci de votre visite et bon appétit !
              </div>
            </div>
          )}

          {/* =========================================================
              TICKET 2: BON DE PRÉPARATION CUISINE (SANS PRIX, GROS TEXTE)
             ========================================================= */}
          {(viewMode === 'both' || viewMode === 'cuisine') && (
            <div className="bg-white rounded-2xl shadow-md border-2 border-stone-900 p-6 font-mono text-stone-950 mx-auto w-full max-w-sm">
              {/* Kitchen Header */}
              <div className="text-center border-b-2 border-stone-900 pb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 text-amber-400 text-xs font-sans font-black uppercase mb-1">
                  <ChefHat className="w-4 h-4" /> BON DE COMMANDE CUISINE
                </div>
                <p className="text-xs font-bold text-stone-600 mt-1">
                  Envoyé à {timeStr} • Par {order.createdByEmployeeName || 'Borne / Caisse'}
                </p>
              </div>

              {/* Giant Order Number + Table / Takeaway / Delivery Client Info */}
              <div className="my-3 p-3.5 rounded-xl bg-stone-900 text-white text-center space-y-1.5">
                <div className="text-xs font-sans font-bold uppercase text-amber-300 tracking-widest">
                  COMMANDE N°
                </div>
                <div className="text-4xl font-black font-sans tracking-wider text-white">
                  #{order.orderNumber}
                </div>

                {/* Destination Banner (Table OR Emporter OR Livraison + Num Client) */}
                <div className="pt-2 border-t border-white/20">
                  {order.mode === 'sur_place' && (
                    <div className="text-lg font-black font-sans text-amber-400 flex items-center justify-center gap-1.5">
                      <Store className="w-5 h-5" />
                      <span>
                        SUR PLACE : {order.tableName ? order.tableName.toUpperCase() : 'COMPTOIR'}
                      </span>
                    </div>
                  )}

                  {order.mode === 'a_emporter' && (
                    <div className="text-lg font-black font-sans text-emerald-400 flex items-center justify-center gap-1.5">
                      <ShoppingBag className="w-5 h-5" />
                      <span>À EMPORTER (#{order.orderNumber})</span>
                    </div>
                  )}

                  {order.mode === 'livraison' && (
                    <div className="text-lg font-black font-sans text-orange-400 flex items-center justify-center gap-1.5">
                      <Truck className="w-5 h-5" />
                      <span>LIVRAISON (#{order.orderNumber})</span>
                    </div>
                  )}

                  {order.customerName && (
                    <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-white font-sans font-extrabold text-xs sm:text-sm">
                      📞 Client / N° : {order.customerName}
                    </div>
                  )}
                </div>
              </div>

              {/* Kitchen Items List (Large, High-Contrast, No Prices) */}
              <div className="space-y-3 divide-y-2 divide-dashed divide-stone-300">
                {order.items.map((ci) => (
                  <div key={ci.cartItemId} className="pt-3 first:pt-1">
                    <div className="flex items-start gap-2.5 font-sans">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-black text-base shrink-0">
                        {ci.quantity}x
                      </span>
                      <div className="flex-1">
                        <h4 className="font-black text-base text-stone-950 leading-snug">
                          {ci.menuItem.name}
                        </h4>

                        {ci.selectedModifiers.length > 0 && (
                          <ul className="mt-1.5 space-y-1">
                            {ci.selectedModifiers.map((m, idx) => (
                              <li
                                key={idx}
                                className="text-xs font-extrabold text-stone-800 bg-stone-100 px-2 py-0.5 rounded border-l-4 border-brand-600"
                              >
                                ➤ {m.optionName}
                              </li>
                            ))}
                          </ul>
                        )}

                        {ci.note && (
                          <div className="mt-1.5 p-2 rounded-lg bg-amber-100 border-2 border-amber-500 text-stone-950 font-sans font-black text-xs">
                            ⚠️ REMARQUE : {ci.note.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3 border-t-2 border-stone-900 flex justify-between items-center text-xs font-sans font-extrabold">
                <span>
                  TOTAL ARTICLES : {order.items.reduce((a, b) => a + b.quantity, 0)}
                </span>
                <span>
                  {order.paid ? '✅ DÉJÀ ENCAISSÉ' : '🍽️ TICKET DE TABLE'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Print Buttons */}
        <div className="p-4 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePrint('caisse')}
              className="px-4 py-3 rounded-2xl border-2 border-stone-200 hover:bg-stone-100 text-stone-800 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition"
            >
              <Receipt className="w-4 h-4 text-brand-600" />
              Imprimer Ticket Client seul
            </button>
            <button
              onClick={() => handlePrint('cuisine')}
              className="px-4 py-3 rounded-2xl border-2 border-stone-900 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 transition"
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              Imprimer Ticket Cuisine seul
            </button>
            <button
              onClick={() => handlePrint('both')}
              className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-600/25 transition"
            >
              <Printer className="w-4 h-4" />
              Imprimer les 2 (Client + Cuisine)
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm transition"
          >
            Terminer / Nouvelle Commande
          </button>
        </div>
      </div>
    </div>
  );
};

