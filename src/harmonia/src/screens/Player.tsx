import { useState, useEffect, useRef, useMemo } from 'react';
import { Home, Library, Settings, Music, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { Song } from '../types/song';
import LibraryPanel from '../components/LibraryPanel';
import FeaturedPanel from '../components/FeaturePanel';
import PlayerPanel from '../components/PlayerPanel';
import InputModal from '../components/InputModal';
import PlaylistView from '../components/Playlist'; // Import the new component
import Playlist from 'src/types/playlist';


// Define the possible view modes
type ViewMode = 'featured' | 'library' | 'playlist';

const MusicPlayer = () => {
  const [playerView, setPlayerView] = useState<'hidden' | 'sideview' | 'fullview'>('sideview');
  // Update viewMode type
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  // Add state for the currently viewed playlist
  const [musicLibrary, setMusicLibrary] = useState<Song[]>([]);
  // const [isFolderWatched, setIsFolderWatched] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);
  const [playerLayout, setPlayerLayout] = useState<'side' | 'bottom'>('bottom');
  const [nowPlaying, setNowPlaying] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlaylistForAdding, setSelectedPlaylistForAdding] = useState<string | null>(null); // Renamed for clarity
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [originalPlaylist, setOriginalPlaylist] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [previousViewMode, setPreviousViewMode] = useState<ViewMode>('featured'); // To know where to go back to

  // --- Load/Save Effects (Keep as is) ---
  useEffect(() => {
    async function loadData() {
      const cachedPlaylists: Playlist[] = (await window.electronAPI.loadPlaylists()) || [];
      setPlaylists(cachedPlaylists);
      const cachedRecentlyPlayed: Song[] = (await window.electronAPI.loadRecentlyPlayed()) || [];
      // console.log(cachedRecentlyPlayed);
      setRecentlyPlayed(cachedRecentlyPlayed);

      const result = await window.electronAPI?.initLibrary();
      // console.log(result)
      if (result) {
        const library = result.library || [];
        setMusicLibrary(library);
        window.electronAPI?.startWatcher(result.folder, loadLibrary);
        // setIsFolderWatched(!!);
      }
    }
    loadData();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        // Check if already playing to avoid unnecessary state changes/audio calls
        if (!isPlaying && audioRef.current) {
          togglePlayPause();
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        // Check if already paused
        if (isPlaying && audioRef.current) {
          togglePlayPause();
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevSong();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextSong();
      });
      // Optional: Add handlers for seekforward, seekbackward, stop if needed
      // navigator.mediaSession.setActionHandler('seekbackward', (details) => { /* ... */ });
      // navigator.mediaSession.setActionHandler('seekforward', (details) => { /* ... */ });
      // navigator.mediaSession.setActionHandler('stop', () => { /* ... stop playback completely */ });
    }
  }, []);

  const scanFolder = async () => {
    let result = await window.electronAPI.selectFolder();
    // console.log("result : ", result);
    const library = result.library || [];
    setMusicLibrary(library);
    window.electronAPI.saveLibrary(library);
    window.electronAPI?.startWatcher(result.folder);
  };

  const loadLibrary = async () => {
    let result = await window.electronAPI.loadLibrary();
    setMusicLibrary(result);
  }

  useEffect(() => {
    window.electronAPI.savePlaylists(playlists);
  }, [playlists]);

  useEffect(() => {
    const saveRecentlyPlayed = async () => {
      if (recentlyPlayed == []) return;
      const cachedRecentlyPlayed: Song[] = (await window.electronAPI.loadRecentlyPlayed()) || [];
      if (cachedRecentlyPlayed == recentlyPlayed) return;
      await window.electronAPI.saveRecentlyPlayed(recentlyPlayed);
      // console.log("Saved Recently Played:", cachedRecentlyPlayed)
    }

    saveRecentlyPlayed();
  }, [recentlyPlayed]);

  useEffect(() => {
    if (currentSongIndex !== null && nowPlaying[currentSongIndex]) {
      const currentSong = nowPlaying[currentSongIndex];
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((song) => song.id !== currentSong.id);
        const updated = [currentSong, ...filtered].slice(0, 5);
        return updated;
      });
    }
  }, [currentSongIndex, nowPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => {
        if (!isNaN(audio.duration)) {
          setCurrentTime(formatTime(audio.currentTime));
          setDuration(formatTime(audio.duration));
        }
      };
      const handleSongEnd = () => {
        nextSong(true); // Automatically play next song when one ends
      };
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleSongEnd); // Add ended listener
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleSongEnd); // Remove listener
      };
    }
  }, [isPlaying, currentSongIndex, nowPlaying, repeatMode]); // Add dependencies

  useEffect(() => {
    if (currentSongIndex !== null && nowPlaying.length > 0) {
      playCurrentSong();
    } else if (nowPlaying.length === 0 && currentSongIndex !== null) {
      // If the playlist becomes empty, stop playback
      audioRef.current?.pause();
      audioRef.current!.src = ''; // Clear src
      setIsPlaying(false);
      setCurrentSongIndex(null);
      setCurrentTime('0:00');
      setDuration('0:00');
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    }
  }, [currentSongIndex, nowPlaying]);

  useEffect(() => {
    const setupMediaSession = async () => {
      if ('mediaSession' in navigator && currentSongIndex !== null && nowPlaying[currentSongIndex]) {
        const currentSong = nowPlaying[currentSongIndex];
        let artworkUrl = '';

        if (currentSong.coverPath) {
          try {
            // Fetch data URL from main process
            artworkUrl = await window.electronAPI?.getImageDataUrl(currentSong.coverPath);
            // console.log('Artwork URL:', artworkUrl);
          } catch (e) {
            console.error('Error fetching image data URL:', e);
          }
        }

        try {
          navigator.mediaSession.metadata = new MediaMetadata({

            title: currentSong.title || 'Unknown Title',
            artist: currentSong.artist || 'Unknown Artist',
            album: currentSong.album || '',
            artwork: artworkUrl ? [{ src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }] : [],

          });
          navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        } catch (err) {
          console.error('Failed to set MediaSession metadata:', err);
        }

        // Set action handlers
        navigator.mediaSession.setActionHandler('play', togglePlayPause);
        navigator.mediaSession.setActionHandler('pause', togglePlayPause);
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
      } else {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    };

    setupMediaSession();

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, [currentSongIndex, nowPlaying, isPlaying]);



  // --- Playback Functions (Keep mostly as is, adjust playPlaylist) ---
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const togglePlayerLayout = () => setPlayerLayout(playerLayout === 'side' ? 'bottom' : 'side');

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else if (currentSongIndex !== null && nowPlaying[currentSongIndex]) {
        // Ensure src is set if paused or stopped
        // if (audioRef.current.src !== nowPlaying[currentSongIndex].path) {
        //    audioRef.current.src = nowPlaying[currentSongIndex].path;
        // }
        audioRef.current.play().catch((err) => console.error('Playback failed:', err));
      } else if (nowPlaying.length > 0 && currentSongIndex === null) {
        // If stopped but there are songs, play the first one
        setCurrentSongIndex(0);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextSong = (isAuto = false) => {
    const audio = audioRef.current;
    // console.log('Repeat mode:', repeatMode);
    // console.log("is Auto : ", isAuto)
    if (isAuto) {
      switch (repeatMode) {
        case 'one':
          audio.currentTime = 0;
          audio.play().catch((err) => console.error('Replay failed:', err));
          break;
        case 'all':
          if (currentSongIndex !== null && nowPlaying.length > 0) {
            const nextIndex = (currentSongIndex + 1) % nowPlaying.length;
            setCurrentSongIndex(nextIndex);
          }
          break;
        default:
          if (currentSongIndex !== null && currentSongIndex < nowPlaying.length - 1) {
            setCurrentSongIndex(currentSongIndex + 1);
          } else {
            setIsPlaying(false);
          }
      }
    } else {
      switch (repeatMode) {
        case 'all':
          if (currentSongIndex !== null && nowPlaying.length > 0) {
            const nextIndex = (currentSongIndex + 1) % nowPlaying.length;
            setCurrentSongIndex(nextIndex);
          }
          break;
        default:
          if (currentSongIndex !== null && currentSongIndex < nowPlaying.length - 1) {
            setCurrentSongIndex(currentSongIndex + 1);
          } else {
            setIsPlaying(false);
          }
      }
    }
  };

  const prevSong = () => {
    if (nowPlaying.length > 0) {
      const prevIndex = currentSongIndex !== null ? (currentSongIndex - 1 + nowPlaying.length) % nowPlaying.length : nowPlaying.length - 1;
      setCurrentSongIndex(prevIndex);
    }
  };

  const togglePlayerView = () => {
    const views = ['sideview', 'fullview'] as const;
    const currentIndex = views.indexOf(playerView as 'sideview' | 'fullview');
    const nextIndex = (currentIndex + 1) % views.length;
    const currentView = views[nextIndex];
    if (currentView == 'fullview') document.body.requestFullscreen();
    else document.exitFullscreen();
    setPlayerView(currentView);
  };

  const playCurrentSong = () => {
    if (currentSongIndex !== null && nowPlaying[currentSongIndex] && audioRef.current) {
      const songToPlay = nowPlaying[currentSongIndex];
      // Only change src if it's different or empty
      console.log(songToPlay.path)
      if (audioRef.current.src !== songToPlay.path) {
        audioRef.current.src = songToPlay.path;
      }
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          if (playerView === 'hidden') setPlayerView('sideview');
        })
        .catch((err) => {
          console.error('Playback failed for:', songToPlay.path, err);
          setIsPlaying(false);
          // Optional: Try next song on error?
          // setTimeout(nextSong, 1000);
        });
    } else {
      // If no song is valid, ensure player is stopped
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  // Function to play a specific playlist, optionally starting at an index
  const playPlaylist = (playlist: Playlist, startIndex = 0) => {
    if (playlist.songs.length === 0) return;
    setNowPlaying([...playlist.songs]); // Set the full playlist as now playing
    setOriginalPlaylist([...playlist.songs]);
    setCurrentSongIndex(startIndex); // Start at the specified index (or 0)
    playCurrentSong(); // will be triggered by the useEffect hook watching currentSongIndex/nowPlaying
  };

  // --- Playlist Management ---
  const createPlaylist = (name: string) => {
    if (name && !playlists.some((p) => p.name === name)) {
      const newPlaylists = [...playlists, { name, songs: [] }];
      setPlaylists(newPlaylists);
    }
  };

  const addToPlaylist = (playlistName: string, selectedSongs: Song[]) => {
    if (selectedSongs.length > 0 && playlistName) {
      let playlistUpdated = false;
      const updatedPlaylists = playlists.map((p) => {
        if (p.name === playlistName) {
          // Avoid adding duplicates
          const songsToAdd = selectedSongs.filter(newSong => !p.songs.some(existingSong => existingSong.id === newSong.id));
          if (songsToAdd.length > 0) {
            playlistUpdated = true;
            return { ...p, songs: [...p.songs, ...songsToAdd] };
          }
        }
        return p;
      });

      if (playlistUpdated) {
        setPlaylists(updatedPlaylists);
        // Also update the viewingPlaylist if it's the one being modified
        if (viewingPlaylist?.name === playlistName) {
          setViewingPlaylist(updatedPlaylists.find(p => p.name === playlistName) || null);
        }
        // Persist change
        window.electronAPI?.updatePlaylist(
          playlistName,
          updatedPlaylists.find((p) => p.name === playlistName)?.songs || []
        );
      }
      setSelectedPlaylistForAdding(null); // Clear selection dropdown
    }
  };

  // New function to delete a song from a specific playlist
  const deleteSongFromPlaylist = (playlistName: string, songId: string) => {
    let playlistFoundAndModified = false;
    const updatedPlaylists = playlists.map(p => {
      if (p.name === playlistName) {
        const originalLength = p.songs.length;
        const updatedSongs = p.songs.filter(song => song.id !== songId);
        if (updatedSongs.length < originalLength) {
          playlistFoundAndModified = true;
          return { ...p, songs: updatedSongs };
        }
      }
      return p;
    });

    if (playlistFoundAndModified) {
      setPlaylists(updatedPlaylists);
      // If the currently viewed playlist was modified, update its state
      if (viewingPlaylist?.name === playlistName) {
        const updatedViewingPlaylist = updatedPlaylists.find(p => p.name === playlistName);
        setViewingPlaylist(updatedViewingPlaylist || null); // Update or clear if playlist becomes empty? Decide behavior.

        // If the deleted song was playing from this playlist, update nowPlaying
        const currentSong = currentSongIndex !== null ? nowPlaying[currentSongIndex] : null;
        if (currentSong?.id === songId && nowPlaying.some(s => viewingPlaylist?.songs.some(vps => vps.id === s.id))) {
          // Find the index of the deleted song in the *original* viewing playlist song list
          const deletedIndexInPlaylist = viewingPlaylist.songs.findIndex(s => s.id === songId);

          // Update nowPlaying to reflect the deletion
          const newNowPlaying = updatedViewingPlaylist?.songs || [];
          setNowPlaying(newNowPlaying);

          // Decide what to play next
          if (newNowPlaying.length === 0) {
            setCurrentSongIndex(null); // Stop if playlist empty
          } else {
            // Try to play the song that's now at the same index, or the last one if index is out of bounds
            setCurrentSongIndex(Math.min(deletedIndexInPlaylist, newNowPlaying.length - 1));
          }
        }
      }
      // Persist changes
      window.electronAPI?.updatePlaylist(playlistName, updatedPlaylists.find(p => p.name === playlistName)?.songs || []);
    }
  };


  const openCreatePlaylistModal = () => setIsModalOpen(true);

  const handleModalSubmit = (value: string) => {
    createPlaylist(value);
    setIsModalOpen(false);
  };

  // --- Navigation ---
  const navigateToPlaylistView = (playlist: Playlist) => {
    setPreviousViewMode(viewMode); // Store current view before changing
    setViewingPlaylist(playlist);
    setViewMode('playlist');
  };

  const navigateBack = () => {
    setViewMode(previousViewMode); // Go back to the stored previous view
    setViewingPlaylist(null);
  };

  // --- Memoized Panels ---
  const memoizedFeaturePanel = useMemo(() => (
    <FeaturedPanel
      playlists={playlists}
      selectedPlaylist={selectedPlaylistForAdding} // Pass the correct state
      setPlaylists={setPlaylists}
      addToPlaylist={addToPlaylist} // Keep this for the '+' button functionality
      openCreatePlaylistModal={openCreatePlaylistModal}
      setNowPlaying={setNowPlaying} // Keep for recently played clicks
      setCurrentSongIndex={setCurrentSongIndex} // Keep for recently played clicks
      recentlyPlayed={recentlyPlayed}
      onPlaylistClick={navigateToPlaylistView} // Pass navigation function
    />
  ), [playlists, selectedPlaylistForAdding, recentlyPlayed, viewMode]); // Add viewMode dependency if needed

  const memoizedLibraryPanel = (
    <LibraryPanel
      nowPlaying={nowPlaying}
      currentSongIndex={currentSongIndex}
      musicLibrary={musicLibrary}
      isPlaying={isPlaying}
      scanFolder={scanFolder}
      setCurrentSongIndex={setCurrentSongIndex}
      playPlaylist={playPlaylist} // Pass the function that sets the queue and starts playing
      playlists={playlists}
      selectedPlaylist={selectedPlaylistForAdding}
      setSelectedPlaylist={setSelectedPlaylistForAdding}
      addToPlaylist={addToPlaylist}
    />
  );

  // --- Determine Title ---
  const currentTitle = useMemo(() => {
    switch (viewMode) {
      case 'featured': return 'Home';
      case 'library': return 'Library';
      case 'playlist': return viewingPlaylist?.name || 'Playlist'; // Show playlist name
      default: return 'Harmonia';
    }
  }, [viewMode, viewingPlaylist]);

  return (
    <div className="flex h-screen bg-gray-900 text-white overscroll-none">
      {/* Sidebar */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 flex-shrink-0">
        {/* ... Sidebar buttons ... */}
        <div className="mb-8 flex flex-col items-center gap-10">
          <div className="flex flex-col gap-5 items-center">
            <button
              className={`p-3 rounded-full hover:bg-gray-800 ${viewMode === 'featured' ? 'bg-gray-700' : ''}`}
              onClick={() => setViewMode('featured')}
              disabled={viewMode === 'playlist'} // Disable while viewing playlist
            >
              <Home size={viewMode === 'featured' ? 28 : 24} color={viewMode === 'featured' ? '#a78bfa' : 'white'} />
            </button>
            <button
              className={`p-3 rounded-full hover:bg-gray-800 ${viewMode === 'library' ? 'bg-gray-700' : ''}`}
              onClick={() => setViewMode('library')}
              disabled={viewMode === 'playlist'} // Disable while viewing playlist
            >
              <Library size={viewMode === 'library' ? 28 : 24} color={viewMode === 'library' ? '#a78bfa' : 'white'} />
            </button>
          </div>
        </div>
        <div className="mt-auto">
          <button className="p-2 rounded-lg hover:bg-gray-800">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-opacity duration-300 ${playerView === 'fullview' ? 'opacity-0 pointer-events-none' : 'flex flex-col opacity-100'
          } ${playerLayout === 'bottom' ? 'pb-24' : ''} overflow-hidden`} // Added overflow-hidden
      >
        {/* Header Bar */}
        <div className="flex justify-between items-center p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            {viewMode === 'playlist' && (
              <button onClick={navigateBack} className="p-1 rounded-full hover:bg-gray-700">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-xl font-bold">{currentTitle}</h1>
          </div>
          {/* Player Toggle Button (Keep as is) */}
          <div className="flex gap-2">
            {playerView === 'hidden' && (
              <button
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
                onClick={() => setPlayerView('sideview')}
              >
                <Music size={14} />
                <span>Player</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar"> {/* Make content scrollable */}
          {viewMode === 'featured' && memoizedFeaturePanel}
          {viewMode === 'library' && memoizedLibraryPanel}
          {viewMode === 'playlist' && viewingPlaylist && (
            <PlaylistView
              playlist={viewingPlaylist}
              onPlayPlaylist={playPlaylist} // Pass the function to play the whole list
              onPlaySong={(playlist, index) => playPlaylist(playlist, index)} // Play song within playlist context
              onDeleteSong={deleteSongFromPlaylist} // Pass delete function
              nowPlaying={nowPlaying}
              currentSongIndex={currentSongIndex}
              isPlaying={isPlaying}
            />
          )}
        </div>
      </div>

      {/* Player Section (Keep as is) */}
      <PlayerPanel
        audioRef={audioRef}
        togglePlayerView={togglePlayerView}
        togglePlayerLayout={togglePlayerLayout}
        playerLayout={playerLayout}
        togglePlayPause={togglePlayPause}
        prevSong={prevSong}
        nextSong={nextSong}
        setCurrentSongIndex={setCurrentSongIndex} // Keep for seeking
        playerView={playerView}
        duration={duration}
        repeatMode={repeatMode}
        setRepeatMode={setRepeatMode}
        currentTime={currentTime}
        isPlaying={isPlaying}
        currentSongIndex={currentSongIndex}
        nowPlaying={nowPlaying}
        setNowPlaying={setNowPlaying} // Keep for queue manipulation in PlayerPanel
        setIsPlaying={setIsPlaying}
        setOriginalPlaylist={setOriginalPlaylist}
        originalPlaylist={originalPlaylist}
      />

      <audio ref={audioRef} />
      <InputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        title="Create New Playlist"
      />
    </div>
  );
};

export default MusicPlayer;
