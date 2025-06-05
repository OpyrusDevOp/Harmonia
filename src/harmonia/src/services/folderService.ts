
import { dialog } from 'electron';
import Store from 'electron-store';
import { MusicScanner } from './musicScanner';

export class FolderService {
  private store = new Store();
  private musicScanner = new MusicScanner();

  async selectFolder() {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    
    console.log("folder selection result : ", result);
    
    if (!result.canceled) {
      const folderPath = result.filePaths[0];
      this.store.set('lastFolder', folderPath);
      const lib = await this.musicScanner.scanFolder(folderPath);
      return { library: lib, folder: folderPath };
    }
    
    return null;
  }

  getLastFolder(): string | null {
    return this.store.get('lastFolder') as string || null;
  }
}
