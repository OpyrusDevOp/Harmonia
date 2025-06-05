import { BrowserWindow, app } from 'electron';
import path from 'path';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMainWindow(): BrowserWindow {
    this.mainWindow = new BrowserWindow({
      minHeight: 350,
      minWidth: 350,
      title: 'Harmonia',
      icon: 'assets/Harmonia.png',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: false,
        devTools: true
      },
      fullscreenable: true,
      thickFrame: true
    });

    this.mainWindow.setMenu(null);

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  handleActivate(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }
}
