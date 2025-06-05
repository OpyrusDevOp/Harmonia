import Store from 'electron-store';
import { Song } from '../types/song';
import { MusicScanner } from './musicScanner';

export class LibraryService {
  private store = new Store();
  private musicScanner = new MusicScanner();
  private onLibraryUpdated: (() => void) | null = null;

  saveLibrary(lib: Song[]): void {
    console.log("saving : ", lib);
    this.store.set('musicLibrary', lib);
  }

  loadLibrary(): Song[] {
    return this.store.get('musicLibrary', []) as Song[];
  }

  handleLibraryUpdated(songs: Song[]): void {
    this.store.set('musicLibrary', songs);
    if (this.onLibraryUpdated) {
      this.onLibraryUpdated();
    }
  }

  saveRecentlyPlayed(recentlyPlayed: Song[]): void {
    this.store.set('recentlyPlayed', recentlyPlayed);
  }

  loadRecentlyPlayed(): Song[] {
    return this.store.get('recentlyPlayed', []) as Song[];
  }

  async initLibrary() {
    const lastFolder = this.store.get('lastFolder') as string;
    console.log("Last folder : ", lastFolder);
    
    if (!lastFolder || lastFolder === '') {
      return { library: [], folder: null };
    }

    const library = this.store.get('musicLibrary', []) as Song[];

    if (lastFolder && library.length > 0) {
      const updatedLibrary = await this.musicScanner.checkForModifiedFiles(lastFolder, library);
      return { library: updatedLibrary, folder: lastFolder };
    }

    return { library: [], folder: null };
  }

  setOnLibraryUpdated(callback: () => void): void {
    this.onLibraryUpdated = callback;
  }
}
