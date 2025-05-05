/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
interface ElectronAPI {
    selectFolder: () => Promise<{ library: Song[], folder: string | null }>;
    loadLibrary: () => Promise<Song[]>;
    saveLibrary: (lib: Song[]) => Promise<void>;
    loadPlaylists: () => Promise<Playlist[]>;
    savePlaylists: (playlists: Playlist[]) => Promise<void>;
    updatePlaylist: (name: string, songs: Song[]) => Promise<Playlist[]>;
    initLibrary: () => Promise<{ library: Song[], folder: string | null }>;
    onLibraryUpdated: (callback: (updatedLibrary: Song[]) => void) => void;
    removeLibraryUpdatedListener: () => void;
  }
  
  declare global {
    interface Window {
      electronAPI: ElectronAPI;
    }
  }
  