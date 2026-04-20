const { app, BrowserWindow } = require('electron');
const path = require('path'); // Added this for path safety

function createWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 800,
    resizable: false,
    autoHideMenuBar: true, // Clean look
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // This line is the "Fix": it tells Electron to look in the
  // exact folder where the script is running.
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
