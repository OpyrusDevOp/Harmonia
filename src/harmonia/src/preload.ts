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

  // Nouvelles méthodes
  initLibrary: () => ipcRenderer.invoke('init-library'),
  onLibraryUpdated: (callback: any) => {
    ipcRenderer.on('library-updated', (_, data) => callback(data));
  },
  removeLibraryUpdatedListener: () => {
    ipcRenderer.removeAllListeners('library-updated');
  }
});
