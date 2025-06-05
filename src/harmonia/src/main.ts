import { app } from 'electron';
import started from 'electron-squirrel-startup';
import { WindowManager } from './modules/windowManager';
import { IPCHandlers } from './modules/ipcHandlers';
import Playlist from './types/playlist';
import { Song } from './types/song';

if (started) {
  app.quit();
}

const windowManager = new WindowManager();
const ipcHandlers = new IPCHandlers(windowManager);

app.whenReady().then(() => {
  windowManager.createMainWindow();
  ipcHandlers.registerHandlers();

  app.on('activate', () => {
    windowManager.handleActivate();
  });

  app.on('ready', () => {
    app.setName('Harmonia');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

interface ElectronAPI {
  selectFolder: () => Promise<{ library: Song[], folder: string | null }>;
  loadLibrary: () => Promise<Song[]>;
  saveLibrary: (lib: Song[]) => Promise<void>;
  loadPlaylists: () => Promise<Playlist[]>;
  savePlaylists: (playlists: Playlist[]) => Promise<void>;
  updatePlaylist: (name: string, songs: Song[]) => Promise<Playlist[]>;
  initLibrary: () => Promise<{ library: Song[], folder: string | null }>;
  startWatcher: (folderPath: string, callback?: () => any) => Promise<void>;
  getImageDataUrl: (filePath: string) => Promise<string>;
  saveRecentlyPlayed: (recentlyPlayed: Song[]) => Promise<void>;
  loadRecentlyPlayed: () => Promise<Song[]>;
  updateGlobalLibrary: (library: Song[]) => Promise<void>;
  getGlobalLibrary: () => Promise<Song[]>;
  onLibraryUpdated: (callback: (lib: Song[]) => any) => Promise<void>;
  removeLibraryUpdatedListener: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
