import { EventEmitter } from 'events';
import Store from 'electron-store';
import { Song } from '../types/song';
import { BrowserWindow } from 'electron';

export class GlobalLibraryManager extends EventEmitter {
  private static instance: GlobalLibraryManager;
  private store = new Store();
  private library: Song[] = [];
  private mainWindow: BrowserWindow | null = null;

  private constructor() {
    super();
    this.loadLibraryFromStore();
  }

  static getInstance(): GlobalLibraryManager {
    if (!GlobalLibraryManager.instance) {
      GlobalLibraryManager.instance = new GlobalLibraryManager();
    }
    return GlobalLibraryManager.instance;
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private loadLibraryFromStore(): void {
    this.library = this.store.get('musicLibrary', []) as Song[];
  }

  getLibrary(): Song[] {
    return [...this.library];
  }

  updateLibrary(newLibrary: Song[]): void {
    this.library = [...newLibrary];
    this.store.set('musicLibrary', this.library);

    // Emit event for main process listeners
    this.emit('library-updated', this.library);

    // Send to React components
    if (this.mainWindow) {
      this.mainWindow.webContents.send('library-updated', this.library);
    }
  }

  addSong(song: Song): void {
    const existingIndex = this.library.findIndex(s => s.id === song.id);
    if (existingIndex >= 0) {
      this.library[existingIndex] = song;
    } else {
      this.library.push(song);
    }
    this.updateLibrary(this.library);
  }

  removeSong(songId: string): void {
    this.library = this.library.filter(song => song.id !== songId);
    this.updateLibrary(this.library);
  }

  // Initialize library from external source (like your existing flow)
  initializeLibrary(library: Song[]): void {
    this.library = [...library];
    this.store.set('musicLibrary', this.library);
    // Don't emit events during initialization to avoid loops
  }
}
