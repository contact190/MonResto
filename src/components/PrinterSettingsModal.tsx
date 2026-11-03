import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  Monitor,
  Printer,
  Receipt,
  RefreshCw,
  Save,
  Scissors,
  Settings2,
  Sliders,
  X,
} from 'lucide-react';
import { useResto } from '../context/RestoContext';
import { executePrintJob } from '../lib/thermalPrinter';
import { PrinterDevice, PrinterSettings, Order } from '../types';

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    printerSettings,
    updatePrinterSettings,
    branding,
    activeClient,
    currentEmployee,
    showToast,
  } = useResto();

  const [form, setForm] = useState<PrinterSettings>(printerSettings);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [isElectron, setIsElectron] = useState<boolean>(false);
  const [loadingPrinters, setLoadingPrinters] = useState<boolean>(false);

  useEffect(() => {
    setForm(printerSettings);
  }, [printerSettings]);

  useEffect(() => {
    if (!isOpen) return;
    const checkElectron = Boolean(window.electronAPI?.isElectron);
    setIsElectron(checkElectron);

    if (window.electronAPI?.getPrinters) {
      setLoadingPrinters(true);
      window.electronAPI
        .getPrinters()
        .then((list) => {
          setPrinters(list);
          setLoadingPrinters(false);
        })
        .catch(() => setLoadingPrinters(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePrinterSettings(form);
    showToast('Paramètres imprimantes enregistrés');
    onClose();
  };

  const handleTestPrint = async (type: 'caisse' | 'cuisine') => {
    const dummyOrder: Order = {
      id: 'test-print-ord',
      orderNumber: 'TEST-01',
      items: [
        {
          cartItemId: 'item-t1',
          menuItem: {
            id: 'b1',
            code: 'TEST',
            name: 'Menu Test Imprimante Thermique',
            description: 'Test d alignement',
            price: 1200,
            categoryId: 'burgers',
            image: '',
            available: true,
          },
          quantity: 1,
          selectedModifiers: [
            {
              groupId: 'g1',
              groupName: 'Sauce',
              optionId: 's1',
              optionName: 'Sauce Algérienne',
              price: 0,
            },
            {
              groupId: 'g2',
              groupName: 'Supplément',
              optionId: 'sup1',
              optionName: 'Double Fromage',
              price: 150,
            },
          ],
          note: 'Sans oignons (Test)',
          unitPrice: 1350,
        },
      ],
      subtotal: 1350,
      discount: 0,
      total: 1350,
      mode: 'sur_place',
      source: 'pos',
      status: 'en_attente',
      paymentMethod: 'especes',
      paid: true,
      tableName: 'Table Test 01',
      customerName: 'Client Essai',
      createdAt: new Date().toISOString(),
      cashReceived: 2000,
      changeGiven: 650,
      createdByEmployeeName: currentEmployee?.name || 'Administrateur',
      cashedByEmployeeName: currentEmployee?.name || 'Caissier Principal',
    };

    showToast(`Envoi du ticket test ${type === 'caisse' ? 'Caisse' : 'Cuisine'}...`);
    await executePrintJob(type, dummyOrder, branding, activeClient, form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <form
        onSubmit={handleSave}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black">Configuration des Imprimantes Tickets</h3>
              <p className="text-xs text-stone-400">
                Réglez quelle imprimante thermique imprime le ticket caisse et le bon cuisine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Mode Indicator */}
          <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isElectron ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-bold text-stone-800">
                {isElectron
                  ? 'Application Windows Desktop Active (Impression Silencieuse Directe)'
                  : 'Mode Navigateur Web (Impression via pilote Windows)'}
              </span>
            </div>
            {isElectron && (
              <button
                type="button"
                onClick={() => {
                  if (window.electronAPI?.getPrinters) {
                    setLoadingPrinters(true);
                    window.electronAPI.getPrinters().then((l) => {
                      setPrinters(l);
                      setLoadingPrinters(false);
                    });
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 font-bold flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className={`w-3 h-3 ${loadingPrinters ? 'animate-spin' : ''}`} />
                Actualiser la liste
              </button>
            )}
          </div>

          {/* Section 1: Imprimante Caisse (Client) */}
          <div className="p-5 rounded-2xl bg-brand-50/40 border border-brand-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-600" />
                Imprimante Ticket Caisse (Client)
              </label>
              <button
                type="button"
                onClick={() => handleTestPrint('caisse')}
                className="text-xs font-extrabold text-brand-700 hover:text-brand-900 underline"
              >
                Imprimer un test
              </button>
            </div>

            {printers.length > 0 ? (
              <select
                value={form.caissePrinterName}
                onChange={(e) => setForm({ ...form, caissePrinterName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-bold text-stone-900"
              >
                <option value="">-- Imprimante par défaut Windows --</option>
                {printers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.displayName || p.name} {p.isDefault ? '(Défaut)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.caissePrinterName}
                onChange={(e) => setForm({ ...form, caissePrinterName: e.target.value })}
                placeholder="Ex: EPSON TM-T20 ou Xprinter XP-80 (ou laisser vide pour défaut)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-bold text-stone-900"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 pt-1">
              <input
                type="checkbox"
                checked={form.autoPrintCaisse}
                onChange={(e) => setForm({ ...form, autoPrintCaisse: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600"
              />
              <span>Imprimer automatiquement dès qu'un encaissement est validé</span>
            </label>
          </div>

          {/* Section 2: Imprimante Cuisine (KDS / Préparation) */}
          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-stone-900 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-600" />
                Imprimante Bon de Cuisine (KDS)
              </label>
              <button
                type="button"
                onClick={() => handleTestPrint('cuisine')}
                className="text-xs font-extrabold text-amber-800 hover:text-amber-950 underline"
              >
                Imprimer un test
              </button>
            </div>

            {printers.length > 0 ? (
              <select
                value={form.cuisinePrinterName}
                onChange={(e) => setForm({ ...form, cuisinePrinterName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-bold text-stone-900"
              >
                <option value="">-- Même imprimante que la caisse --</option>
                {printers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.displayName || p.name} {p.isDefault ? '(Défaut)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.cuisinePrinterName}
                onChange={(e) => setForm({ ...form, cuisinePrinterName: e.target.value })}
                placeholder="Ex: Imprimante Cuisine Thermique 80mm (ou laisser vide)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-bold text-stone-900"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700 pt-1">
              <input
                type="checkbox"
                checked={form.autoPrintCuisine}
                onChange={(e) => setForm({ ...form, autoPrintCuisine: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600"
              />
              <span>Imprimer automatiquement dès qu'une commande est envoyée en cuisine</span>
            </label>
          </div>

          {/* Section 3: Largeur Papier & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Format de Papier Thermique
              </label>
              <select
                value={form.paperWidth}
                onChange={(e) => setForm({ ...form, paperWidth: e.target.value as '80mm' | '58mm' })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 font-extrabold text-sm"
              >
                <option value="80mm">80 mm (Standard Restaurant & Caisse)</option>
                <option value="58mm">58 mm (Mini Imprimante / Mobile)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                <input
                  type="checkbox"
                  checked={form.cutPaper}
                  onChange={(e) => setForm({ ...form, cutPaper: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <Scissors className="w-4 h-4 text-stone-500" />
                <span>Activer l'ordre de découpe massicot (Auto-cut)</span>
              </label>
            </div>
          </div>

          {/* Section 4: Textes personnalisés pied de ticket */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
              Message de remerciement en bas de ticket client
            </label>
            <input
              type="text"
              value={form.footerNote || ''}
              onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
              placeholder="Ex: Merci de votre visite et à très bientôt !"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-semibold"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-100 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-brand-600/20 transition"
          >
            <Save className="w-4 h-4" /> Enregistrer la Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

