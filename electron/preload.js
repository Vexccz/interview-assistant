const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  setClickThrough: (value) => ipcRenderer.invoke('set-click-through', value),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  isPortable: () => ipcRenderer.invoke('is-portable'),
  onToggleListening: (callback) => {
    ipcRenderer.on('toggle-listening', callback);
    return () => ipcRenderer.removeListener('toggle-listening', callback);
  }
});
