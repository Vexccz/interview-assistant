const { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Portable mode: if --portable flag is passed, store data in app directory
const isPortable = process.argv.includes('--portable');
if (isPortable) {
  const portablePath = path.join(path.dirname(process.execPath), 'data');
  app.setPath('userData', portablePath);
}

const store = new Store();
let mainWindow = null;
let splashWindow = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 300,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    center: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.on('closed', () => { splashWindow = null; });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 650,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a1a',
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    show: false,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
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

  // Show main window and close splash after ready
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
      }
      mainWindow.show();
    }, 2000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createSplashWindow();
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
    companyName: '',
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
    language: 'en',
    enableNotificationSound: true,
    activeProfileId: null
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

// Desktop capturer for system audio and meeting detection
ipcMain.handle('get-desktop-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
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

// Get app version for update checker
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Check if running in portable mode
ipcMain.handle('is-portable', () => {
  return isPortable;
});
