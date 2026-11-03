// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printSilent: (params) => ipcRenderer.invoke('print-silent', params),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
});

