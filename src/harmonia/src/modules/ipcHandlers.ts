import { ipcMain } from 'electron';
import { WindowManager } from './windowManager';
import { FolderService } from '../services/folderService';
import { LibraryService } from '../services/libraryService';
import { PlaylistService } from '../services/playlistService';
import { FileWatcherService } from '../services/fileWatcherService';
import { ImageService } from '../services/imageService';
import { GlobalLibraryManager } from '../services/globalLibraryManager';

export class IPCHandlers {
  private folderService: FolderService;
  private libraryService: LibraryService;
  private playlistService: PlaylistService;
  private fileWatcherService: FileWatcherService;
  private imageService: ImageService;
  private libraryManager: GlobalLibraryManager;

  constructor(private windowManager: WindowManager) {
    this.folderService = new FolderService();
    this.libraryService = new LibraryService();
    this.playlistService = new PlaylistService();
    this.fileWatcherService = new FileWatcherService();
    this.imageService = new ImageService();
    this.libraryManager = GlobalLibraryManager.getInstance();
    this.libraryManager.setMainWindow(this.windowManager.getMainWindow()!);
  }

  registerHandlers(): void {
    // Folder operations
    ipcMain.handle('select-folder', () => this.folderService.selectFolder());
    ipcMain.handle('start-watcher', (_, folderPath: string, callback?: () => any) =>
      this.fileWatcherService.startWatcher(folderPath, this.windowManager.getMainWindow()!, callback)
    );

    // Library operations
    ipcMain.handle('save-library', (_, lib) => this.libraryService.saveLibrary(lib));
    ipcMain.handle('load-library', () => this.libraryService.loadLibrary());
    ipcMain.handle('library-updated', (_, songs) => this.libraryService.handleLibraryUpdated(songs));
    ipcMain.handle('init-library', () => {
      this.libraryService.initLibrary();
      this.fileWatcherService.startWatcher(this.folderService.getLastFolder(), this.windowManager.getMainWindow());
    });

    // Recently played
    ipcMain.handle('save-recently-played', (_, recentlyPlayed) =>
      this.libraryService.saveRecentlyPlayed(recentlyPlayed)
    );
    ipcMain.handle('load-recently-played', () => this.libraryService.loadRecentlyPlayed());

    // Playlist operations
    ipcMain.handle('save-playlists', (_, playlists) => this.playlistService.savePlaylists(playlists));
    ipcMain.handle('load-playlists', () => this.playlistService.loadPlaylists());
    ipcMain.handle('update-playlist', (_, playlistName, songs) =>
      this.playlistService.updatePlaylist(playlistName, songs)
    );

    // Image operations
    ipcMain.handle('getImageDataUrl', (_, filePath) => this.imageService.getImageDataUrl(filePath));
    // New global library handlers
    ipcMain.handle('get-global-library', () => this.libraryManager.getLibrary());
    ipcMain.handle('update-global-library', (_, library) => {
      this.libraryManager.updateLibrary(library);
      return this.libraryManager.getLibrary();
    });

    // Setup library synchronization
    this.setupLibrarySynchronization();
  }

  private setupLibrarySynchronization(): void {
    // When library is updated via existing methods, sync with global manager
    ipcMain.handle('sync-library-to-global', async (_, library) => {
      this.libraryManager.initializeLibrary(library);
    });
  }
}
