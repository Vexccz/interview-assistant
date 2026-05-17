const { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 650,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load from Vite dev server or built files
  const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Make window draggable
  mainWindow.setMovable(true);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Global shortcut: Ctrl+Shift+Space to cycle modes
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow) {
      mainWindow.webContents.send('toggle-listening');
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for settings
ipcMain.handle('get-settings', () => {
  return store.get('settings', {
    resume: '',
    jobDescription: '',
    companyInfo: '',
    llmApiKey: '',
    llmBaseUrl: 'https://api.openai.com/v1',
    llmModel: 'gpt-4',
    deepgramApiKey: '',
    useDeepgram: false,
    audioMode: 'mic',
    enableNoiseGate: true,
    responseMode: 'detailed',
    useStar: true,
    bulletMode: false,
    fontSize: 14,
    opacity: 0.85,
    theme: 'dark',
    language: 'en'
  });
});

ipcMain.handle('save-settings', (event, settings) => {
  store.set('settings', settings);
  return true;
});

ipcMain.handle('set-click-through', (event, clickThrough) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
  }
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// Desktop capturer for system audio
ipcMain.handle('get-desktop-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 0, height: 0 }
    });
    return sources.map(source => ({
      id: source.id,
      name: source.name
    }));
  } catch (err) {
    console.error('Failed to get desktop sources:', err);
    return [];
  }
});
