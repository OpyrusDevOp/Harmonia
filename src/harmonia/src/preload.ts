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
  onLibraryUpdated: (songs: Song[]) => ipcRenderer.invoke('library-updated', songs),
  removeLibraryUpdatedListener: () => {
    ipcRenderer.removeAllListeners('library-updated');
  },
  showContextMenu: (data: any) => ipcRenderer.send('show-context-menu', data),
  onContextMenuCommand: (callback: (data: any) => void) => {
    ipcRenderer.on('context-menu-command', (_, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('context-menu-command');
    };
  },
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  updateTray: (playbackState: { isPlaying: boolean, currentSong: Song | null }) => 
    ipcRenderer.send('update-tray', playbackState),
  onTrayControl: (callback: (action: string) => void) => {
    const handler = (_: any, action: any) => callback(action);
    ipcRenderer.on('tray-control', handler);
    return () => {
      ipcRenderer.removeListener('tray-control', handler);
    };
  }
});
