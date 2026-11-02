import React from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Monitor,
  Share,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
}) => {
  if (!isOpen) return null;

  const openKioskWindow = () => {
    window.open(
      `${window.location.origin}/?mode=kiosk`,
      '_blank',
      'width=500,height=900'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-brand-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold">Installer MonResto (Web App)</h3>
              <p className="text-xs text-orange-100">
                Fonctionne hors-ligne sur Mobile, Tablette, Caisse & Borne Kiosk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {deferredPrompt ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">
                  Installation directe disponible !
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Ajoutez MonResto sur votre écran d’accueil ou bureau en 1 clic.
                </p>
              </div>
              <button
                onClick={onTriggerInstall}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shrink-0 shadow-md"
              >
                Installer maintenant
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-xs text-brand-900 font-medium leading-relaxed">
              💡 <strong>Application PWA prête :</strong> Vous pouvez installer MonResto comme une application native sans passer par le Play Store ou l’App Store.
            </div>
          )}

          {/* Device Instructions */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3.5">
              <Smartphone className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-stone-900">
                  Sur Mobile Android & Tablette (Serveur / Caisse)
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  Ouvrez le menu Chrome <strong>(⋮)</strong> puis appuyez sur{' '}
                  <strong>« Installer l’application »</strong> ou{' '}
                  <strong>« Ajouter à l’écran d’accueil »</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3.5">
              <Share className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-stone-900">
                  Sur iPhone / iPad (iOS Safari)
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  Touchez l’icône <strong>Partager</strong> en bas de Safari puis choisissez{' '}
                  <strong>« Sur l’écran d’accueil »</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start gap-3.5">
              <Monitor className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-stone-900">
                  Sur Borne Tactile & Caisse PC (Chrome / Edge)
                </h4>
                <p className="text-xs text-stone-600 mt-1">
                  Cliquez sur l’icône <strong>Installer</strong> à droite de la barre d’adresse, ou lancez directement l’URL dédiée Borne :{' '}
                  <code className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 font-bold">
                    /?mode=kiosk
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Multi-screen sync demo launcher */}
          <div className="p-4 rounded-2xl bg-stone-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Tablet className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm">
                  Tester la synchronisation Borne ↔ Caisse
                </h4>
                <p className="text-[11px] text-stone-300">
                  Ouvrez une fenêtre Borne Totem à côté de votre Caisse pour voir les commandes arriver en direct !
                </p>
              </div>
            </div>
            <button
              onClick={openKioskWindow}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0"
            >
              <span>Fenêtre Borne</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Service Worker & Cache Hors-Ligne Actifs
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

