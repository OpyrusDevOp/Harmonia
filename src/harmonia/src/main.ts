import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import chokidar, { FSWatcher } from 'chokidar';
import started from 'electron-squirrel-startup';
import * as fs from 'fs-extra';
import { Song } from './types/song';
import * as mm from 'music-metadata'; // Import music-metadata
import Store from 'electron-store';
import crypto from 'crypto';
import path from 'path';
import Playlist from './types/playlist';
import { pathToFileURL } from 'url';
import mime from 'mime-types';

const store = new Store();
if (started) {
  app.quit();
}
var mainWindow: BrowserWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({

    width: 800,
    height: 600,
    minHeight: 350,
    minWidth: 350,
    title: 'Harmonia',
    icon: 'assets/Harmonia.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
    fullscreenable: true,
    thickFrame: true
  });
  mainWindow.setMenu(null);
  mainWindow.webContents
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

};

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.on('ready', () => {
    app.setName('Harmonia'); // Ensure this matches the productName
    // Rest of your main process code
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
    return scanFolder(folderPath);
  }
  return null;
});


function generateFileId(filePath: string): string {
  return crypto.createHash('md5').update(filePath).digest('hex');
}

async function scanFolder(folderPath: string): Promise<Song[]> {
  const files = await fs.readdir(folderPath, { withFileTypes: true });
  let musicFiles: Song[] = [];
  const coverCacheDir = path.join(app.getPath('userData'), 'coverCache');

  // Assurer que le dossier de cache existe
  await fs.ensureDir(coverCacheDir);

  for (const file of files) {
    const fullPath = path.join(folderPath, file.name);
    if (file.isDirectory()) {
      musicFiles = musicFiles.concat(await scanFolder(fullPath));
    } else if (file.name.match(/\.(mp3|wav|flac)$/i)) {
      try {
        const fileId = generateFileId(fullPath);
        const metadata = await mm.parseFile(fullPath, { duration: true });
        const cover = metadata.common.picture ? mm.selectCover(metadata.common.picture) : null;

        // Store the cover separately
        let coverUrl = null;
        if (cover) {
          const coverPath = path.join(coverCacheDir, `${fileId}.jpg`);
          await fs.writeFile(coverPath, cover.data);
          coverUrl = pathToFileURL(coverPath).toString(); // Use pathToFileURL
        }

        musicFiles.push({
          id: fileId,
          title: metadata.common.title || file.name.replace(/\.(mp3|wav|flac)$/i, ''),
          artist: metadata.common.artist || 'Unknown',
          album: metadata.common.album || 'Unknown',
          coverPath: coverUrl,
          path: `file://${fullPath}`,
          time: metadata.format.duration ? formatDuration(metadata.format.duration) : 'Unknown',
          lastModified: (await fs.stat(fullPath)).mtimeMs
        });
      } catch (error) {
        console.error(`Failed to parse metadata for ${fullPath}:`, error);
        // Fallback pour les fichiers avec métadonnées corrompues
      }
    }
  }
  console.log(musicFiles)
  return musicFiles;
}


function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

let watcher: FSWatcher | null = null;

function startFolderWatch(folderPath: string, mainWindow: BrowserWindow) {
  // Arrêter toute surveillance précédente
  if (watcher) {
    watcher.close();
  }

  // Configurer le watcher
  watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\../, // Ignorer les fichiers cachés
    persistent: true,
    ignoreInitial: true
  });

  // Événements de fichier
  watcher
    .on('add', async (path) => {
      if (path.match(/\.(mp3|wav|flac)$/i)) {
        const updatedSongs = await processSingleFile(path);
        mainWindow.webContents.send('library-updated', updatedSongs);
      }
    })
    .on('unlink', (path) => {
      if (path.match(/\.(mp3|wav|flac)$/i)) {
        // Supprimer de la bibliothèque
        const fileId = generateFileId(path);
        const library = store.get('musicLibrary', []) as Song[];
        const updatedLibrary = library.filter(song => song.id !== fileId);
        store.set('musicLibrary', updatedLibrary);
        mainWindow.webContents.send('library-updated', updatedLibrary);
      }
    })
    .on('change', async (path) => {
      if (path.match(/\.(mp3|wav|flac)$/i)) {
        const updatedSongs = await processSingleFile(path);
        mainWindow.webContents.send('library-updated', updatedSongs);
      }
    });
}

// Fonction pour traiter un seul fichier ajouté ou modifié
async function processSingleFile(filePath: string): Promise<Song[]> {
  const library = store.get('musicLibrary', []) as Song[];
  const fileId = generateFileId(filePath);

  // Vérifier si le fichier existe déjà dans la bibliothèque
  const existingIndex = library.findIndex(song => song.id === fileId);

  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    const cover = metadata.common.picture ? mm.selectCover(metadata.common.picture) : null;

    const coverCacheDir = path.join(app.getPath('userData'), 'coverCache');
    let coverPath = null;

    if (cover) {
      coverPath = path.join(coverCacheDir, `${fileId}.jpg`);
      await fs.writeFile(coverPath, cover.data);
    }

    const newSong: Song = {
      id: fileId,
      title: metadata.common.title || path.basename(filePath).replace(/\.(mp3|wav|flac)$/i, ''),
      artist: metadata.common.artist || 'Unknown',
      album: metadata.common.album || 'Unknown',
      coverPath: coverPath ? `file://${coverPath}` : null,
      genre: metadata.common.genre?.[0] || 'Unknown',
      path: `file://${filePath}`,
      time: metadata.format.duration ? formatDuration(metadata.format.duration) : 'Unknown',
      lastModified: (await fs.stat(filePath)).mtimeMs
    };

    // Mettre à jour ou ajouter la chanson
    if (existingIndex >= 0) {
      library[existingIndex] = newSong;
    } else {
      library.push(newSong);
    }

    store.set('musicLibrary', library);
    return library;
  } catch (error) {
    console.error(`Failed to process file ${filePath}:`, error);
    return library;
  }
}


ipcMain.handle('save-library', (event, lib) => {
  store.set('musicLibrary', lib);
});

ipcMain.handle('load-library', () => {
  return store.get('musicLibrary');
});

ipcMain.handle('save-recently-played', (event, recentlyPlayed: Song[]) => {
  store.set('recentlyPlayed', recentlyPlayed);
});

ipcMain.handle('load-recently-played', () => {
  return store.get('recentlyPlayed', []);
});

ipcMain.handle('save-playlists', (event, playlists: Playlist[]) => {
  if (!Array.isArray(playlists)) {
    console.warn('Invalid playlists data, setting to empty array');
  } else {
    store.set('playlists', playlists);
  }
});

ipcMain.handle('load-playlists', () => {
  return store.get('playlists');
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

// Dans createWindow ou au démarrage de l'application
ipcMain.handle('init-library', async () => {
  const lastFolder = store.get('lastFolder') as string;
  console.log("Last folder : ", lastFolder)
  if (!lastFolder || lastFolder === '')
    return {
      library: [],
      folder: null
    };
  const library = store.get('musicLibrary', []) as Song[];

  if (lastFolder && library.length > 0) {
    // Démarrer la surveillance
    startFolderWatch(lastFolder, mainWindow);

    // Vérifier si des fichiers ont été modifiés pendant que l'app était fermée
    const updatedLibrary = await checkForModifiedFiles(lastFolder, library);
    return {
      library: updatedLibrary,
      folder: lastFolder
    };
  }

  return {
    library: [],
    folder: null
  };
});

ipcMain.handle('getImageDataUrl', async (event, filePath: string) => {
  try {
    const platform = process.platform;
    console.log('Reading image file: ', filePath)
    let correctPath: string;
    if (platform === 'win32') {
      correctPath = filePath.replace('file:///', '');
    } else if (platform === 'darwin') {
      console.log('Running on macOS');
    } else if (platform === 'linux') {
      correctPath = filePath.replace('file://', '');
    }
    const buffer = await fs.readFile(correctPath);
    const mimeType = mime.lookup(filePath) || 'image/jpeg';
    const base64 = buffer.toString('base64');
    const url = `data:${mimeType};base64,${base64}`;
    //console.log('Image URL:', url);
    return url;
  } catch (err) {
    console.error('Error reading image file:', err);
    return '';
  }
});

async function checkForModifiedFiles(folderPath: string, library: Song[]): Promise<Song[]> {
  let updatedLibrary = [...library];
  let needsUpdate = false;

  // Créer un Map pour un accès rapide
  const songMap = new Map(library.map(song => [song.id, song]));

  for (const song of library) {
    // Extraire le chemin du fichier sans le préfixe file://
    const filePath = song.path.replace('file://', '');

    try {
      const stats = await fs.stat(filePath);
      // Vérifier si le fichier a été modifié
      if (stats.mtimeMs > (song.lastModified || 0)) {
        const updatedSong = await processSingleFile(filePath);
        needsUpdate = true;
      }
    } catch (error) {
      // Le fichier n'existe plus, le supprimer de la bibliothèque
      songMap.delete(song.id);
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    updatedLibrary = Array.from(songMap.values());
    store.set('musicLibrary', updatedLibrary);
  }

  return updatedLibrary;
}
