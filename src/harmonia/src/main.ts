import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { uint8ArrayToBase64 } from 'uint8array-extras';
import started from 'electron-squirrel-startup';
import * as path from 'path';
import * as fs from 'fs-extra';
import Song from './types/song';
import * as mm from 'music-metadata'; // Import music-metadata
import Store from 'electron-store';
import Playlist from './types/playlist';

const store = new Store();
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Folder scanning
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!result.canceled) {
    const folderPath = result.filePaths[0];
    store.set('lastFolder', folderPath);
    return await scanFolder(folderPath);
  }
  return null;
});


async function scanFolder(folderPath: string): Promise<Song[]> {
  const files = await fs.readdir(folderPath, { withFileTypes: true });
  let musicFiles: Song[] = [];

  for (const file of files) {
    const fullPath = path.join(folderPath, file.name);
    if (file.isDirectory()) {
      musicFiles = musicFiles.concat(await scanFolder(fullPath));
    } else if (file.name.match(/\.(mp3|wav|flac)$/i)) {
      try {
        const metadata = await mm.parseFile(fullPath, { duration: true, });
        const cover = metadata.common.picture ? mm.selectCover(metadata.common.picture) : null;
        musicFiles.push({
          id: musicFiles.length + 1,
          title: metadata.common.title || file.name.replace(/\.(mp3|wav|flac)$/i, ''),
          artist: metadata.common.artist || 'Unknown',
          album: metadata.common.album || 'Unknown',
          cover: cover ? `data:${cover.format};base64,${uint8ArrayToBase64(cover.data)}` : null,
          path: `file://${fullPath}`,
          time: metadata.format.duration ? formatDuration(metadata.format.duration) : 'Unknown',
        });
      } catch (error) {
        console.error(`Failed to parse metadata for ${fullPath}:`, error);
        musicFiles.push({
          id: musicFiles.length + 1,
          title: file.name.replace(/\.(mp3|wav|flac)$/i, ''),
          artist: 'Unknown',
          album: 'Unknown',
          cover: null,
          path: `file://${fullPath}`,
          time: 'Unknown',
        });
      }
    }
  }

  store.set('musicLibrary', musicFiles);


  return musicFiles;
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}


ipcMain.handle('save-library', (event, lib) => {
  store.set('musicLibrary', lib);
});

ipcMain.handle('load-library', () => {
  return store.get('musicLibrary');
});

ipcMain.handle('save-playlists', (event, playlists: { name: string; songs: Song[] }[]) => {
  if (!Array.isArray(playlists)) {
    console.warn('Invalid playlists data, setting to empty array');
    store.set('playlists', []);
  } else {
    store.set('playlists', playlists);
  }
});

ipcMain.handle('load-playlists', () => {
  return store.get('playlists', []);
});

ipcMain.handle('update-playlist', (event, playlistName: string, songs: Song[]) => {
  if (!playlistName || !Array.isArray(songs)) {
    console.warn('Invalid playlist name or songs data');
    return store.get('playlists', []);
  }
  const updatedPlaylists = store.get('playlists', []).map((p: { name: string; songs: Song[] }) =>
    p.name === playlistName ? { ...p, songs } : p
  );
  store.set('playlists', updatedPlaylists);
  return updatedPlaylists;
});
