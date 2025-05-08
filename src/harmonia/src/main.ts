import { app, BrowserWindow, ipcMain, dialog, Tray, Menu,globalShortcut,
  powerMonitor,
  Notification, 
  MenuItemConstructorOptions, nativeImage, MenuItem } from 'electron';
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
let tray: Tray | null = null;
let forceQuit = false;
let isQuitting = false;
let currentPlaybackState = {
  isPlaying: false,
  currentSong: null as Song | null
};
// Register media key handlers
function registerMediaKeys(mainWindow: BrowserWindow) {
  // Register media key shortcuts
  const registerKeys = () => {
    try {
      // Play/Pause key
      globalShortcut.register('MediaPlayPause', () => {
        mainWindow.webContents.send('tray-control', 
          currentPlaybackState.isPlaying ? 'pause' : 'play');
      });
      
      // Next track key
      globalShortcut.register('MediaNextTrack', () => {
        mainWindow.webContents.send('tray-control', 'next');
      });
      
      // Previous track key
      globalShortcut.register('MediaPreviousTrack', () => {
        mainWindow.webContents.send('tray-control', 'previous');
      });
      
      // Stop key
      globalShortcut.register('MediaStop', () => {
        mainWindow.webContents.send('tray-control', 'pause');
      });
    } catch (error) {
      console.error('Failed to register media keys:', error);
    }
  };
 // Register keys initially
 registerKeys();
  
 // Re-register keys when computer wakes from sleep
 powerMonitor.on('resume', () => {
   // Unregister first to prevent duplicates
   globalShortcut.unregisterAll();
   // Wait a bit for the system to fully wake up
   setTimeout(registerKeys, 1000);
 });
}

  // Create a notification for song changes
function showSongNotification(song: Song) {
  if (!song || !song.title) return;
  
  let notificationOptions = {
    title: 'Now Playing',
    body: `${song.title} - ${song.artist || 'Unknown Artist'}`,
    silent: true // Don't play notification sound for song changes
  };
  
  // If the song has a cover image, try to use it in the notification
  // if (song.coverPath) {
  //   try {
  //     const iconPath = song.coverPath.replace('file://', '');
  //     notificationOptions['icon'] = iconPath;
  //   } catch (error) {
  //     console.error('Failed to load cover for notification:', error);
  //   }
  // }
  
  const notification = new Notification(notificationOptions);
  notification.show();
  
  // When the notification is clicked, show the app
  notification.on('click', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createTray(mainWindow: BrowserWindow) {
   // Create tray icon - use your app icon or create a smaller version for the tray
   const iconPath = path.join(__dirname, '../assets/Harmonia.png'); // Using main app icon
   const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
   
   tray = new Tray(trayIcon);
   tray.setToolTip('Harmonia Music Player');
   
   // Set up tray menu
   updateTrayMenu(mainWindow, false, null);
   
   // Handle tray clicks (different behavior based on platform)
   if (process.platform === 'darwin') {
     // On macOS, make click toggle play/pause
     tray.on('click', () => {
       mainWindow.webContents.send('tray-control', 
         currentPlaybackState.isPlaying ? 'pause' : 'play');
     });
     
     // Double click shows the app
     tray.on('double-click', () => {
       mainWindow.show();
       mainWindow.focus();
     });
   } else {
     // On Windows/Linux, click shows the app
     tray.on('click', () => {
       if (!mainWindow.isVisible()) {
         mainWindow.show();
         mainWindow.focus();
       } else {
         mainWindow.focus();
       }
     });
   }
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minHeight: 350,
    minWidth: 350,
    title: 'Harmonia',
    icon: 'assets/Harmonia.png',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      devTools: true
    },
    fullscreenable: true,
    thickFrame: true
  });
  
  // Create the tray icon
  createTray(mainWindow);
  
  // Register media key handlers
  registerMediaKeys(mainWindow);
  
  // Handle the window close event to minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Show notification that app is still running (first time only)
      if (process.platform === 'darwin') {
        const firstClose = store.get('firstClose', true);
        if (firstClose) {
          new Notification({
            title: 'Harmonia is still running',
            body: 'The app will continue to play in the background. Click the tray icon to show it again.',
          }).show();
          store.set('firstClose', false);
        }
      }
      return false;
    }
    return true;
  });
  
  // Prevent the app from exiting when all windows are closed
  // app.on('window-all-closed', () => {
  //   if (process.platform !== 'darwin' && !isQuitting) {
  //     e.preventDefault();
  //   }
  // });
  
  // Reset the force quit flag when the app is activated
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });


  mainWindow.setMenu(null);
   mainWindow.webContents.openDevTools()
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

};

// Function to update the tray menu based on playback state
function updateTrayMenu(mainWindow: BrowserWindow, isPlaying: boolean, currentSong: Song | null) {
  if (!tray) return;
  
  // Save current state for media key handlers
  currentPlaybackState = { isPlaying, currentSong };
  
  // Create template with platform-specific enhancements
  const template: (MenuItemConstructorOptions | MenuItem)[] = [
    {
      label: currentSong 
        ? `Now Playing: ${currentSong.title || 'Unknown'} - ${currentSong.artist || 'Unknown'}` 
        : 'Harmonia Music Player',
      enabled: false
    },
    { type: 'separator' },
    {
      label: isPlaying ? 'Pause' : 'Play',
      accelerator: 'Space', // Show keyboard shortcut hint
      click: () => {
        mainWindow.webContents.send('tray-control', isPlaying ? 'pause' : 'play');
      }
    },
    {
      label: 'Next',
      accelerator: 'Right',
      click: () => {
        mainWindow.webContents.send('tray-control', 'next');
      }
    },
    {
      label: 'Previous',
      accelerator: 'Left',
      click: () => {
        mainWindow.webContents.send('tray-control', 'previous');
      }
    }
  ];
  
  // Add volume controls
  template.push(
    { type: 'separator' },
    {
      label: 'Volume',
      submenu: [
        {
          label: 'Increase',
          click: () => {
            mainWindow.webContents.send('tray-control', 'volume-up');
          }
        },
        {
          label: 'Decrease',
          click: () => {
            mainWindow.webContents.send('tray-control', 'volume-down');
          }
        },
        {
          label: 'Mute/Unmute',
          click: () => {
            mainWindow.webContents.send('tray-control', 'mute-toggle');
          }
        }
      ]
    }
  );
  
  // Add window controls
  template.push(
    { type: 'separator' },
    {
      label: 'Show App',
      click: () => {
        if (!mainWindow.isVisible()) mainWindow.show();
        mainWindow.focus();
      }
    }
  );
  
  // Add quit control
  template.push({
    label: 'Quit',
    accelerator: 'CommandOrControl+Q',
    click: () => {
      isQuitting = true;
      app.quit();
    }
  });
  
  const contextMenu = Menu.buildFromTemplate(template);
  tray.setContextMenu(contextMenu);
  
  // Update the tray tooltip with song info
  if (currentSong) {
    tray.setToolTip(`Harmonia - ${currentSong.title || 'Unknown'} - ${currentSong.artist || 'Unknown'}`);
  } else {
    tray.setToolTip('Harmonia Music Player');
  }
}

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

// Now let's add some IPC handlers for tray communication
ipcMain.on('update-tray', (_, playbackState: { isPlaying: boolean, currentSong: Song | null }) => {
  if (mainWindow && tray) {
    // Store previous state to detect song changes
    const prevSong = currentPlaybackState.currentSong;
    const newSong = playbackState.currentSong;
    
    // Update tray menu
    updateTrayMenu(mainWindow, playbackState.isPlaying, playbackState.currentSong);
    
    // Show notification when song changes
    if (newSong && (!prevSong || prevSong.id !== newSong.id)) {
      showSongNotification(newSong);
    }
  }
});

// Add minimize to tray handler
ipcMain.on('minimize-to-tray', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
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

ipcMain.on('show-context-menu', (event, data) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  const template: (MenuItemConstructorOptions | MenuItem)[] = [
    { 
      label: 'Play Now', 
      click: () => { 
        event.reply('context-menu-command', { command: 'play', data });
      } 
    },
    { 
      label: 'Add to Queue', 
      click: () => {
        event.reply('context-menu-command', { command: 'add-to-queue', data });
      }
    },
    { type: 'separator' },
    { 
      label: 'Add to Playlist',
      submenu: data.playlists.map((playlist: string) => ({
        label: playlist,
        click: () => {
          event.reply('context-menu-command', { 
            command: 'add-to-playlist', 
            data: { ...data, playlist } 
          });
        }
      }))
    },
    { type: 'separator' },
    { 
      label: 'Song Info', 
      click: () => {
        event.reply('context-menu-command', { command: 'info', data });
      }
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window });
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

async function startFolderWatch(folderPath: string, mainWindow: BrowserWindow) {
  // Arrêter toute surveillance précédente
  if (watcher) {
    await watcher.close();
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
      console.log('File added:', path)
      if (path.match(/\.(mp3|wav|flac)$/i)) {
        const updatedSongs = await processSingleFile(path);
        mainWindow.webContents.send('library-updated', updatedSongs);
      }
    })
    .on('unlink', (path) => {
      console.log('File removed:', path)
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
      console.log('File changed:', path)
      if (path.match(/\.(mp3|wav|flac)$/i)) {
        const updatedSongs = await processSingleFile(path);
        mainWindow.webContents.send('library-updated', updatedSongs);
      }
    });

    console.log('Watching folder:', folderPath)
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


ipcMain.handle('save-library', (_, lib) => {
  store.set('musicLibrary', lib);
});
var onLibraryUpdated: () => void | null;
ipcMain.handle('library-updated', (_, songs: Song[]) => {
  store.set('musicLibrary', songs);
  if(onLibraryUpdated) onLibraryUpdated();
})

ipcMain.handle('load-library', () => {
  return store.get('musicLibrary');
});

ipcMain.handle('save-recently-played', (_, recentlyPlayed: Song[]) => {
  store.set('recentlyPlayed', recentlyPlayed);
});

ipcMain.handle('load-recently-played', () => {
  return store.get('recentlyPlayed', []);
});

ipcMain.handle('save-playlists', (_, playlists: Playlist[]) => {
  if (!Array.isArray(playlists)) {
    console.warn('Invalid playlists data, setting to empty array');
  } else {
    store.set('playlists', playlists);
  }
});

ipcMain.handle('load-playlists', () => {
  return store.get('playlists');
});

ipcMain.handle('update-playlist', (_, playlistName: string, songs: Song[]) => {
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

ipcMain.handle('start-watcher', (_, folderPath: string, callback?: () => any) => {
  startFolderWatch(folderPath, mainWindow);
  if(callback) onLibraryUpdated = callback;
})

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

  // Démarrer la surveillance
  // startFolderWatch(lastFolder, mainWindow);
  if (lastFolder && library.length > 0) {

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

ipcMain.handle('getImageDataUrl', async (_, filePath: string) => {
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

async function checkForModifiedFiles(_: string, library: Song[]): Promise<Song[]> {
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
  startWatcher: (folderPath: string, callback?: () => any) => Promise<void>;
  getImageDataUrl: (filePath: string) => Promise<string>;
  saveRecentlyPlayed: (recentlyPlayed: Song[]) => Promise<void>;
  loadRecentlyPlayed: () => Promise<Song[]>;
  onContextMenuCommand: (callback: (data: any) => void) => () => void;
  showContextMenu: (data: any) => void;
  minimizeToTray: () => void;
  updateTray: (playbackState: { isPlaying: boolean, currentSong: Song | null }) => void;
  onTrayControl: (callback: (action: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
