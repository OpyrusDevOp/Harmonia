import { contextBridge, ipcRenderer } from 'electron';
import Playlist from './types/playlist';
import { Song } from './types/song';

contextBridge.exposeInMainWorld('electronAPI', {
  // Méthodes existantes
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  loadLibrary: () => ipcRenderer.invoke('load-library'),
  saveLibrary: (lib: Song[]) => ipcRenderer.invoke('save-library', lib),
  loadPlaylists: () => ipcRenderer.invoke('load-playlists'),
  savePlaylists: (playlists: Playlist[]) => ipcRenderer.invoke('save-playlists', playlists),
  updatePlaylist: (name: string, songs: Song[]) => ipcRenderer.invoke('update-playlist', name, songs),
  saveRecentlyPlayed: (recentlyPlayed: Song[]) => ipcRenderer.invoke('save-recently-played', recentlyPlayed),
  loadRecentlyPlayed: () => ipcRenderer.invoke('load-recently-played'),
  getImageDataUrl: (filePath: string) => ipcRenderer.invoke('getImageDataUrl', filePath),
  // Nouvelles méthodes
  initLibrary: () => ipcRenderer.invoke('init-library'),
  startWatcher: (folderPath: string, callback?: () => void) => ipcRenderer.invoke('start-watcher', folderPath, callback),

  // New global library methods
  getGlobalLibrary: () => ipcRenderer.invoke('get-global-library'),
  updateGlobalLibrary: (library: Song[]) => ipcRenderer.invoke('update-global-library', library),

  // Event listeners
  onLibraryUpdated: (callback: (lib: Song[]) => any) => {
    ipcRenderer.on('library-updated', (_, library: Song[]) => callback(library));
  },
  removeLibraryUpdatedListener: () => {
    ipcRenderer.removeAllListeners('library-updated');
  }
});
