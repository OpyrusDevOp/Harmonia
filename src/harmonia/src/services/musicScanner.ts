import * as fs from 'fs-extra';
import * as mm from 'music-metadata';
import { app } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import crypto from 'crypto';
import Store from 'electron-store';
import { Song } from '../types/song';

export class MusicScanner {
  private store = new Store();

  private generateFileId(filePath: string): string {
    return crypto.createHash('md5').update(filePath).digest('hex');
  }

  private formatDuration(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  async scanFolder(folderPath: string): Promise<Song[]> {
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    let musicFiles: Song[] = [];
    const coverCacheDir = path.join(app.getPath('userData'), 'coverCache');

    await fs.ensureDir(coverCacheDir);

    for (const file of files) {
      const fullPath = path.join(folderPath, file.name);
      
      if (file.isDirectory()) {
        musicFiles = musicFiles.concat(await this.scanFolder(fullPath));
      } else if (file.name.match(/\.(mp3|wav|flac)$/i)) {
        try {
          const song = await this.processMusicFile(fullPath, coverCacheDir);
          if (song) musicFiles.push(song);
        } catch (error) {
          console.error(`Failed to parse metadata for ${fullPath}:`, error);
        }
      }
    }

    return musicFiles;
  }

  async processSingleFile(filePath: string): Promise<Song[]> {
    const library = this.store.get('musicLibrary', []) as Song[];
    const fileId = this.generateFileId(filePath);
    const existingIndex = library.findIndex(song => song.id === fileId);

    try {
      const coverCacheDir = path.join(app.getPath('userData'), 'coverCache');
      const newSong = await this.processMusicFile(filePath, coverCacheDir);
      
      if (newSong) {
        if (existingIndex >= 0) {
          library[existingIndex] = newSong;
        } else {
          library.push(newSong);
        }
        
        this.store.set('musicLibrary', library);
      }
      
      return library;
    } catch (error) {
      console.error(`Failed to process file ${filePath}:`, error);
      return library;
    }
  }

  private async processMusicFile(filePath: string, coverCacheDir: string): Promise<Song | null> {
    try {
      const fileId = this.generateFileId(filePath);
      const metadata = await mm.parseFile(filePath, { duration: true });
      const cover = metadata.common.picture ? mm.selectCover(metadata.common.picture) : null;

      let coverUrl = null;
      if (cover) {
        const coverPath = path.join(coverCacheDir, `${fileId}.jpg`);
        await fs.writeFile(coverPath, cover.data);
        coverUrl = pathToFileURL(coverPath).toString();
      }

      return {
        id: fileId,
        title: metadata.common.title || path.basename(filePath).replace(/\.(mp3|wav|flac)$/i, ''),
        artist: metadata.common.artist || 'Unknown',
        album: metadata.common.album || 'Unknown',
        coverPath: coverUrl,
        genre: metadata.common.genre?.[0] || 'Unknown',
        path: `file://${filePath}`,
        time: metadata.format.duration ? this.formatDuration(metadata.format.duration) : 'Unknown',
        lastModified: (await fs.stat(filePath)).mtimeMs
      };
    } catch (error) {
      console.error(`Error processing music file ${filePath}:`, error);
      return null;
    }
  }

  async checkForModifiedFiles(folderPath: string, library: Song[]): Promise<Song[]> {
    let updatedLibrary = [...library];
    let needsUpdate = false;
    const songMap = new Map(library.map(song => [song.id, song]));

    for (const song of library) {
      const filePath = song.path.replace('file://', '');

      try {
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs > (song.lastModified || 0)) {
          await this.processSingleFile(filePath);
          needsUpdate = true;
        }
      } catch (error) {
        songMap.delete(song.id);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      updatedLibrary = Array.from(songMap.values());
      this.store.set('musicLibrary', updatedLibrary);
    }

    return updatedLibrary;
  }
}
