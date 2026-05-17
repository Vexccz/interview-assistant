const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;
let isOverlayMode = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
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

  // Global shortcut: Ctrl+Shift+Space to toggle listening
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
    useDeepgram: false
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
