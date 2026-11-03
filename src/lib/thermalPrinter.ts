// src/lib/thermalPrinter.ts
import { formatDA } from '../data/initialData';
import { Order, PrinterSettings, RestoBranding, ClientAccount } from '../types';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getPrinters: () => Promise<Array<{ name: string; displayName: string; isDefault?: boolean }>>;
      printSilent: (params: {
        html: string;
        printerName?: string;
        paperWidth?: '80mm' | '58mm';
        silent?: boolean;
      }) => Promise<{ success: boolean; error?: string }>;
      toggleFullscreen: () => void;
    };
  }
}

export const getSavedPrinterSettings = (): PrinterSettings => {
  try {
    const raw = localStorage.getItem('monresto_printer_settings_v1');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    caissePrinterName: '',
    cuisinePrinterName: '',
    paperWidth: '80mm',
    autoPrintCaisse: true,
    autoPrintCuisine: true,
    cutPaper: true,
    headerNote: '',
    footerNote: 'Merci de votre visite et à bientôt !',
  };
};

export const savePrinterSettings = (settings: PrinterSettings) => {
  localStorage.setItem('monresto_printer_settings_v1', JSON.stringify(settings));
};

/**
 * Builds high-density, pure POS thermal HTML (ESC/POS style) optimized for 80mm (48 chars) or 58mm (32 chars)
 */
export const generateThermalTicketHtml = (
  type: 'caisse' | 'cuisine',
  order: Order,
  branding: RestoBranding,
  activeClient: ClientAccount | null,
  settings: PrinterSettings
): string => {
  const is58mm = settings.paperWidth === '58mm';
  const widthPx = is58mm ? '58mm' : '80mm';
  const timeStr = new Date(order.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = new Date(order.createdAt).toLocaleDateString('fr-FR');

  const restoTitle = (activeClient?.restaurantName || branding.restaurantName || 'MonResto').toUpperCase();
  const phone = activeClient?.phone || '';
  const city = activeClient?.city || '';

  const modeLabel =
    order.mode === 'sur_place'
      ? order.tableName
        ? `SUR PLACE • ${order.tableName.toUpperCase()}`
        : 'SUR PLACE • COMPTOIR'
      : order.mode === 'a_emporter'
      ? 'À EMPORTER'
      : 'LIVRAISON';

  if (type === 'cuisine') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: ${widthPx} auto; margin: 0; }
          body {
            width: ${widthPx};
            margin: 0;
            padding: 2mm 3mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: ${is58mm ? '11px' : '13px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: 900; }
          .sep { border-top: 2px dashed #000; margin: 5px 0; }
          .sep-solid { border-top: 2px solid #000; margin: 5px 0; }
          .big-num { font-size: ${is58mm ? '24px' : '32px'}; font-weight: 900; }
          .banner {
            border: 2px solid #000;
            padding: 4px;
            margin: 4px 0;
            text-align: center;
            font-weight: 900;
            font-size: ${is58mm ? '13px' : '16px'};
          }
          .item-row { margin-top: 6px; }
          .item-name { font-size: ${is58mm ? '12px' : '15px'}; font-weight: 900; }
          .mod { font-size: ${is58mm ? '10px' : '12px'}; padding-left: 8px; font-weight: bold; }
          .note {
            background: #000;
            color: #fff;
            padding: 2px 4px;
            font-weight: 900;
            margin-top: 2px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 14px;">*** BON DE COMMANDE CUISINE ***</div>
        <div class="center">${dateStr} à ${timeStr}</div>
        <div class="center">Saisi par : ${order.createdByEmployeeName || 'Borne/Caisse'}</div>

        <div class="banner">
          COMMANDE #${order.orderNumber}
          <div style="font-size: 13px; margin-top: 2px;">${modeLabel}</div>
          ${order.customerName ? `<div style="font-size: 11px;">Client: ${order.customerName}</div>` : ''}
        </div>

        <div class="sep-solid"></div>

        ${order.items
          .map(
            (it) => `
          <div class="item-row">
            <div class="item-name">${it.quantity}x ${it.menuItem.name}</div>
            ${it.selectedModifiers.map((m) => `<div class="mod">➤ ${m.optionName}</div>`).join('')}
            ${it.note ? `<div><span class="note">NOTE: ${it.note.toUpperCase()}</span></div>` : ''}
          </div>
        `
          )
          .join('')}

        <div class="sep-solid"></div>
        <div class="bold center">TOTAL ARTICLES : ${order.items.reduce((s, it) => s + it.quantity, 0)}</div>
        <div class="center" style="margin-top: 8px;">.${settings.cutPaper ? '<br><br><br>--- DÉCOUPE PAPIER ---' : ''}</div>
      </body>
      </html>
    `;
  }

  // TICKET CAISSE CLIENT
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: ${widthPx} auto; margin: 0; }
        body {
          width: ${widthPx};
          margin: 0;
          padding: 2mm 3mm;
          font-family: 'Courier New', Courier, monospace;
          font-size: ${is58mm ? '10px' : '12px'};
          line-height: 1.3;
          color: #000;
          background: #fff;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 900; }
        .sep { border-top: 1px dashed #000; margin: 4px 0; }
        .sep-double { border-top: 2px dashed #000; margin: 5px 0; }
        .row { display: flex; justify-content: space-between; }
        .title { font-size: ${is58mm ? '14px' : '17px'}; font-weight: 900; }
        .num-box {
          border: 1px solid #000;
          padding: 3px;
          margin: 4px 0;
          text-align: center;
        }
        .big-total {
          font-size: ${is58mm ? '14px' : '17px'};
          font-weight: 900;
        }
        .footer { font-size: 10px; margin-top: 6px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="title">${restoTitle}</div>
        ${city || phone ? `<div>${city} ${phone ? '• Tél: ' + phone : ''}</div>` : ''}
        ${settings.headerNote ? `<div>${settings.headerNote}</div>` : ''}
        <div>${dateStr} ${timeStr}</div>
      </div>

      <div class="num-box">
        <div class="bold" style="font-size: ${is58mm ? '14px' : '18px'};">TICKET #${order.orderNumber}</div>
        <div class="bold">${modeLabel}</div>
        ${order.customerName ? `<div>Client : ${order.customerName}</div>` : ''}
      </div>

      <div class="row">
        <span>Saisi : ${order.createdByEmployeeName || 'Caisse'}</span>
        ${order.cashedByEmployeeName ? `<span>Caisse : ${order.cashedByEmployeeName}</span>` : ''}
      </div>

      <div class="sep-double"></div>

      ${order.items
        .map(
          (it) => `
        <div style="margin-top: 3px;">
          <div class="row bold">
            <span>${it.quantity}x ${it.menuItem.name}</span>
            <span>${formatDA(it.unitPrice * it.quantity)}</span>
          </div>
          ${it.selectedModifiers
            .map(
              (m) => `
            <div class="row" style="font-size: 90%; padding-left: 6px;">
              <span>+ ${m.optionName}</span>
              ${m.price > 0 ? `<span>${formatDA(m.price)}</span>` : ''}
            </div>
          `
            )
            .join('')}
          ${it.note ? `<div style="font-size: 90%; font-style: italic; padding-left: 6px;">Note: ${it.note}</div>` : ''}
        </div>
      `
        )
        .join('')}

      <div class="sep-double"></div>

      ${
        order.discount > 0
          ? `
        <div class="row"><span>Sous-total:</span><span>${formatDA(order.subtotal)}</span></div>
        <div class="row bold"><span>Remise:</span><span>-${formatDA(order.discount)}</span></div>
      `
          : ''
      }

      <div class="row big-total" style="margin: 4px 0;">
        <span>TOTAL:</span>
        <span>${formatDA(order.total)}</span>
      </div>

      <div class="sep"></div>

      ${
        order.paid
          ? `
        <div class="row bold">
          <span>RÈGLEMENT :</span>
          <span>${order.paymentMethod === 'cib_edahabia' ? 'CARTE CIB / EDAHABIA' : 'ESPÈCES'}</span>
        </div>
        ${
          order.cashReceived
            ? `
          <div class="row"><span>Espèces reçues :</span><span>${formatDA(order.cashReceived)}</span></div>
          <div class="row bold"><span>Monnaie rendue :</span><span>${formatDA(order.changeGiven || 0)}</span></div>
        `
            : ''
        }
      `
          : `
        <div class="center bold" style="padding: 3px; border: 1px solid #000; margin: 3px 0;">
          *** TICKET NON ENCAISSÉ - EN ATTENTE ***
        </div>
      `
      }

      <div class="sep"></div>
      <div class="footer">
        <div>${settings.footerNote || 'Merci de votre visite et bon appétit !'}</div>
        <div style="font-size: 8px; margin-top: 4px;">Système MonResto Pro • www.monresto.dz</div>
        ${settings.cutPaper ? '<br><br>.<br>--- DÉCOUPE ---' : ''}
      </div>
    </body>
    </html>
  `;
};

/**
 * Triggers thermal printing either silently through Electron or through dedicated browser window
 */
export const executePrintJob = async (
  type: 'caisse' | 'cuisine',
  order: Order,
  branding: RestoBranding,
  activeClient: ClientAccount | null,
  settings: PrinterSettings
): Promise<boolean> => {
  const html = generateThermalTicketHtml(type, order, branding, activeClient, settings);
  const targetPrinterName =
    type === 'caisse' ? settings.caissePrinterName : settings.cuisinePrinterName;

  // 1. If running inside Electron desktop app -> Silent hardware print directly to the specific printer!
  if (window.electronAPI?.printSilent) {
    try {
      const res = await window.electronAPI.printSilent({
        html,
        printerName: targetPrinterName || undefined,
        paperWidth: settings.paperWidth,
        silent: true,
      });
      if (res.success) return true;
    } catch {
      // fallback to browser iframe print
    }
  }

  // 2. Web browser fallback: print through hidden iframe without screenshot distortion
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        resolve(true);
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve(true);
        }, 1000);
      }, 300);
    } catch {
      window.print();
      resolve(true);
    }
  });
};

