import chokidar, { FSWatcher } from 'chokidar';
import { BrowserWindow } from 'electron';
import { MusicScanner } from './musicScanner';
import Store from 'electron-store';
import { Song } from '../types/song';
import crypto from 'crypto';
import { GlobalLibraryManager } from './globalLibraryManager';

export class FileWatcherService {
  private watcher: FSWatcher | null = null;
  private musicScanner = new MusicScanner();
  private store = new Store();
  private libraryManager = GlobalLibraryManager.getInstance();

  private generateFileId(filePath: string): string {
    return crypto.createHash('md5').update(filePath).digest('hex');
  }

  async startWatcher(folderPath: string, mainWindow: BrowserWindow, callback?: () => any): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
    }

    this.watcher = chokidar.watch(folderPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('add', async (path) => {
        console.log('File added:', path);
        if (path.match(/\.(mp3|wav|flac)$/i)) {
          const updatedSongs = await this.musicScanner.processSingleFile(path);
          this.libraryManager.updateLibrary(updatedSongs);
          mainWindow.webContents.send('library-updated', updatedSongs);
        }
      })
      .on('unlink', (path) => {
        console.log('File removed:', path);
        if (path.match(/\.(mp3|wav|flac)$/i)) {
          this.handleFileRemoval(path, mainWindow);
        }
      })
      .on('change', async (path) => {
        console.log('File changed:', path);
        if (path.match(/\.(mp3|wav|flac)$/i)) {
          const updatedSongs = await this.musicScanner.processSingleFile(path);
          this.libraryManager.updateLibrary(updatedSongs);
          mainWindow.webContents.send('library-updated', updatedSongs);
        }
      });

    if (callback) {
      callback()
    }

    console.log('Watching folder:', folderPath);
  }

  private handleFileRemoval(filePath: string, mainWindow: BrowserWindow): void {
    const fileId = this.generateFileId(filePath);
    const library = this.store.get('musicLibrary', []) as Song[];
    const updatedLibrary = library.filter(song => song.id !== fileId);
    this.libraryManager.updateLibrary(updatedLibrary);
    mainWindow.webContents.send('library-updated', updatedLibrary);
  }

  async stopWatcher(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
}
