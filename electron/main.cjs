// electron/main.cjs
// MonResto Pro Desktop — Compatible Windows 7 (SP1), Windows 10 et Windows 11
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Stabilisation pour anciens GPU sur Windows 7
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('disable-color-correct-rendering');
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'MonResto Pro — Logiciel Caisse, Borne & KDS',
    icon: path.join(__dirname, '../public/icon.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Détection du mode développement vs production
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// IPC Handlers : Imprimantes Thermiques & Mode Plein Écran
// ============================================================================

// 1. Lister les imprimantes installées sous Windows
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch (err) {
    console.error('Erreur getPrintersAsync:', err);
    return [];
  }
});

// 2. Impression thermique directe silencieuse (sans boîte de dialogue Windows)
ipcMain.handle('print-silent', async (event, { html, printerName, silent = true }) => {
  return new Promise(async (resolve) => {
    try {
      const printWindow = new BrowserWindow({
        show: false,
        width: 350,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      printWindow.webContents.on('did-finish-load', () => {
        const printOptions = {
          silent: silent !== false,
          printBackground: true,
          deviceName: printerName || '',
          margins: { marginType: 'none' },
        };

        printWindow.webContents.print(printOptions, (success, failureReason) => {
          printWindow.destroy();
          resolve({ success, error: failureReason });
        });
      });

      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
});

// 3. Bascule plein écran (pour caisses et bornes tactiles)
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

