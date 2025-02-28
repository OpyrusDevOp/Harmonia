import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveLibrary: () => ipcRenderer.invoke('save-library'),
  loadLibrary: () => ipcRenderer.invoke('load-library'),
  savePlaylists: () => ipcRenderer.invoke('save-playlists'),
  loadPlaylists: () => ipcRenderer.invoke('load-playlists'),
  updatePlaylist: () => ipcRenderer.invoke('update-playlist'),
});

contextBridge.exposeInMainWorld('windowAPI', {
  prompt: (message, defaultValue) => dialog.showInputBox({ message, defaultValue }),
});
