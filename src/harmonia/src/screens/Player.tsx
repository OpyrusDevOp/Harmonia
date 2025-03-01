import { useState, useRef, useEffect } from 'react';
import { Settings, Library, Play, X, Music, Search, Home } from 'lucide-react';
import { Song } from '../types/song';
import Playlist from 'src/types/playlist';
import PlayerPanel from '../components/PlayerPanel';


interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
}

// Input Modal Component
const InputModal: React.FC<InputModalProps> = ({ isOpen, onClose, onSubmit, title }) => {
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <input
          type="text"
          className="w-full p-2 mb-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              onSubmit(value);
              onClose();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};


const MusicPlayer = () => {
  const [playerView, setPlayerView] = useState<'hidden' | 'sideview' | 'fullview'>('sideview');
  const [viewMode, setViewMode] = useState<'featured' | 'library'>('featured');
  const [musicLibrary, setMusicLibrary] = useState<Song[]>([]);
  const [filteredLibrary, setFilteredLibrary] = useState<Song[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<{ name: string; songs: Song[] }[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null); // Track selected playlist for adding songs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderWatched, setIsFolderWatched] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load cached library and playlists on mount
  useEffect(() => {
    async function loadData() {
      // Nouveau gestionnaire pour charger la bibliothèque initiale
      const result = await window.electronAPI.initLibrary();
      console.log(result);
      if (result) {
        setMusicLibrary(result.library || []);
        setFilteredLibrary(result.library || []);
        setIsFolderWatched(!!result.folder);
      }

      const cachedPlaylists: Playlist[] = await window.electronAPI.loadPlaylists();
      console.log(cachedPlaylists);
      setPlaylists(cachedPlaylists);

      // Écouter les mises à jour de la bibliothèque (avec les fichiers ajoutés/modifiés/supprimés)
      window.electronAPI.onLibraryUpdated((updatedLibrary: Song[]) => {
        setMusicLibrary(updatedLibrary);
        setFilteredLibrary(prev => {
          // Préserver le filtrage et le tri actuels
          if (searchQuery) {
            return applySearchFilter(updatedLibrary, searchQuery);
          }
          return updatedLibrary;
        });
      });
    }

    loadData();

    // Cleanup listener
    return () => {
      window.electronAPI.removeLibraryUpdatedListener();
    };
  }, []);

  // Fonction d'aide pour filtrage
  const applySearchFilter = (library: Song[], query: string) => {
    const q = query.toLowerCase();
    return library.filter(song =>
      song.title?.toLowerCase().includes(q) ||
      song.artist?.toLowerCase().includes(q) ||
      song.album?.toLowerCase().includes(q) ||
      song.genre?.toLowerCase().includes(q)
    );
  };

  // Save playlists when updated
  useEffect(() => {
    if (playlists.length !== 0) window.electronAPI?.savePlaylists(playlists);
  }, [playlists]);

  // Handle filtering library based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLibrary(musicLibrary);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = musicLibrary.filter(song =>
      song.title?.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query) ||
      song.genre?.toLowerCase().includes(query)
    );
    setFilteredLibrary(filtered);
  }, [searchQuery, musicLibrary]);

  // Handle sorting
  useEffect(() => {
    if (!sortConfig) {
      setFilteredLibrary([...musicLibrary]);
      return;
    }
    const sortedSongs = [...filteredLibrary].sort((a, b) => {
      if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
      if (!a[sortConfig.key]) return 1;
      if (!b[sortConfig.key]) return -1;
      const valueA = typeof a[sortConfig.key] === 'string' ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
      const valueB = typeof b[sortConfig.key] === 'string' ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];
      if (valueA < valueB) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (valueA > valueB) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    setFilteredLibrary(sortedSongs);
  }, [sortConfig, musicLibrary]);

  // Handle audio time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => {
        if (!isNaN(audio.duration)) {
          setCurrentTime(formatTime(audio.currentTime));
          setDuration(formatTime(audio.duration));
        }
      };
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', nextSong);
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', nextSong);
      };
    }
  }, [isPlaying]);

  useEffect(() => {
    if (currentSongIndex !== null && nowPlaying.length > 0) {
      playCurrentSong();
    }
  }, [currentSongIndex, nowPlaying]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const scanFolder = async () => {
    const result = await window.electronAPI.selectFolder();
    if (result) {
      setMusicLibrary(result);
      setFilteredLibrary(result);
      window.electronAPI.saveLibrary(result);
    }
  };

  const addToNowPlaying = () => {
    if (selectedSongs.length > 0) {
      setNowPlaying(selectedSongs);
      setCurrentSongIndex(0);
      setSelectMode(false);
      setSelectedSongs([]);
    }
  };

  const requestSort = (key) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const playPlaylist = (playlist: { name: string; songs: Song[] }) => {
    setNowPlaying(playlist.songs);
    setCurrentSongIndex(0);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else if (currentSongIndex !== null && nowPlaying[currentSongIndex]) {
        if (audioRef.current.src === '') audioRef.current.src = nowPlaying[currentSongIndex].path;
        audioRef.current.play().catch((err) => console.error('Playback failed:', err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextSong = () => {
    if (currentSongIndex !== null && nowPlaying.length > 0) {
      const nextIndex = (currentSongIndex + 1) % nowPlaying.length;
      setCurrentSongIndex(nextIndex);
    }
  };

  const prevSong = () => {
    if (currentSongIndex !== null && nowPlaying.length > 0) {
      const prevIndex = (currentSongIndex - 1 + nowPlaying.length) % nowPlaying.length;
      setCurrentSongIndex(prevIndex);
    }
  };

  const replaySong = () => {
    playCurrentSong();
  };

  const shuffleSongs = () => {
    if (nowPlaying.length === 0) {
      setNowPlaying(filteredLibrary);
      if (nowPlaying.length === 0) return;
    }
    const shuffled = [...nowPlaying].sort(() => Math.random() - 0.5);
    setCurrentSongIndex(0);
    setNowPlaying(shuffled);
    playCurrentSong();
  };

  const togglePlayerView = () => {
    const views = ['sideview', 'fullview'] as const;
    const currentIndex = views.indexOf(playerView as 'sideview' | 'fullview');
    const nextIndex = (currentIndex + 1) % views.length;
    setPlayerView(views[nextIndex]);
  };

  const closePlayerView = () => {
    setPlayerView('hidden');
  };

  const playSong = (song: Song) => {
    console.log('Playing song:', song);
    setNowPlaying([song]);
    setCurrentSongIndex(0);
    playCurrentSong();
  };

  const playCurrentSong = () => {
    if (currentSongIndex !== null && nowPlaying[currentSongIndex] && audioRef.current) {
      audioRef.current.src = nowPlaying[currentSongIndex].path;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          if (playerView === 'hidden') setPlayerView('sideview');
        })
        .catch((err) => {
          console.error('Playback failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const createPlaylist = (name: string) => {
    if (name && !playlists.some(p => p.name === name)) {
      const newPlaylists = [...playlists, { name, songs: [] }];
      setPlaylists(newPlaylists);
      window.electronAPI?.savePlaylists(newPlaylists);
    }
  };

  const addToPlaylist = (playlistName: string) => {
    if (selectedSongs.length > 0 && selectedPlaylist) {
      const updatedPlaylists = playlists.map(p =>
        p.name === playlistName ? { ...p, songs: [...p.songs, ...selectedSongs] } : p
      );
      setPlaylists(updatedPlaylists);
      window.electronAPI?.updatePlaylist(selectedPlaylist, updatedPlaylists.find(p => p.name === selectedPlaylist)?.songs || []);
      setSelectedSongs([]);
      setSelectMode(false);
      setSelectedPlaylist(null);
    }
  };

  const selectPlaylistForAdding = (name: string) => {
    setSelectedPlaylist(name === selectedPlaylist ? null : name);
  };

  const openCreatePlaylistModal = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (value: string) => {
    createPlaylist(value);
  };


  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4">
        <div className="mb-8 flex flex-col items-center gap-10">

          <div className="flex flex-col gap-5 items-center">
            <button className="p-3 rounded-full hover:bg-gray-800" onClick={() => setViewMode("featured")}>
              <Home size={viewMode === "featured" ? 30 : 25} color={viewMode === "featured" ? "purple" : "white"} />
            </button>
            <button className="p-3 rounded-full hover:bg-gray-800" onClick={() => setViewMode("library")}>
              <Library size={viewMode === "library" ? 30 : 25} color={viewMode === "library" ? "purple" : "white"} />
            </button>
          </div>
        </div>
        <div className="mt-auto">
          <button className="p-2 rounded-lg hover:bg-gray-800">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className={`flex-1 transition-all duration-300 ${playerView === 'fullview' ? 'opacity-0 pointer-events-none' : 'flex flex-col opacity-100'}`}>
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">{viewMode === 'featured' ? 'Home' : 'Library'}</h1>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700"
              onClick={scanFolder}
            >
              Scan Folder
            </button>
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
        <div className="p-4 flex-1 overflow-hidden">
          {viewMode === 'featured' ? (
            <>
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600">
                    <p className="text-sm">The Best of</p>
                    <h2 className="text-xl font-bold">Mercury: Act 1</h2>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-400 to-yellow-400">
                    <p className="text-sm">Playlist</p>
                    <h2 className="text-xl font-bold">Music of the Spheres</h2>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                    <p className="text-sm">This Week</p>
                    <h2 className="text-xl font-bold">The Blaze</h2>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3">Recently Played</h2>
                <div className="grid grid-cols-5 gap-4">
                  {['Wrecked', 'Dusk', 'Believer', 'Radiohead', 'Hope Never Dies'].map((title, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 mb-2"></div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-gray-400">Imagine Dragons</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3">Your Playlists</h2>
                <div className="space-y-2">
                  {playlists.map((playlist, index) => (
                    <div
                      key={index}
                      className={`flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer ${selectedPlaylist === playlist.name ? 'bg-gray-700' : ''}`}
                      onClick={() => playPlaylist(playlist)}
                    >
                      <div className="w-10 h-10 rounded-md bg-purple-500 mr-3 flex items-center justify-center">
                        <Play size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{playlist.name}</p>
                      </div>
                      <button
                        className="p-1 rounded-full hover:bg-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectPlaylistForAdding(playlist.name);
                        }}
                      >
                        <span>+</span>
                      </button>
                    </div>
                  ))}
                  <button
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 mt-2 w-full"
                    onClick={openCreatePlaylistModal}
                  >
                    New Playlist
                  </button>
                  {selectedPlaylist && selectedSongs.length > 0 && (
                    <button
                      className="px-3 py-1 mt-2 rounded-lg bg-green-600 hover:bg-green-700 w-full"
                      onClick={() => addToPlaylist(selectedPlaylist)}
                    >
                      Add {selectedSongs.length} Song(s) to {selectedPlaylist}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              {/* Search Bar */}
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Search by title, artist, album..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={16} className="text-gray-400 hover:text-white" />
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  <button
                    className={`px-3 py-2 rounded-lg ${selectMode ? 'bg-purple-600' : 'bg-gray-800'} text-sm`}
                    onClick={() => {
                      setSelectMode(!selectMode);
                      if (selectMode) setSelectedSongs([]);
                    }}
                  >
                    {selectMode ? 'Cancel Selection' : 'Select Songs'}
                  </button>
                </div>
              </div>

              {/* Results Info */}
              <div className="mb-2 text-xs text-gray-400">
                {filteredLibrary.length === musicLibrary.length
                  ? `${musicLibrary.length} songs in your library`
                  : `${filteredLibrary.length} songs found`}
              </div>

              {/* Table Header */}
              <div className="bg-gray-800 rounded-t-lg px-4 py-2 text-xs font-medium">
                <div className="flex items-center">
                  <div className="w-8 text-center">
                    {selectMode ?
                      <input
                        type="checkbox"
                        className="rounded text-purple-600 focus:ring-purple-500"
                        checked={selectMode && selectedSongs.length === filteredLibrary.length && filteredLibrary.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSongs([...filteredLibrary]);
                          } else {
                            setSelectedSongs([]);
                          }
                        }}
                        disabled={!selectMode}
                      />
                      :
                      <button
                        className="rounded w-8 text-purple-600 focus:ring-purple-500"
                        onClick={() => setSelectMode(true)} />
                    }

                  </div>
                  <div
                    className="w-1/3 cursor-pointer hover:text-purple-400"
                    onClick={() => requestSort('title')}
                  >
                    Title
                    {getSortIndicator('title')}
                  </div>
                  <div
                    className="w-1/6 cursor-pointer hover:text-purple-400"
                    onClick={() => requestSort('genre')}
                  >
                    Genre
                    {getSortIndicator('genre')}
                  </div>
                  <div
                    className="w-1/6 cursor-pointer hover:text-purple-400"
                    onClick={() => requestSort('artist')}
                  >
                    Artist
                    {getSortIndicator('artist')}
                  </div>
                  <div
                    className="w-1/6 cursor-pointer hover:text-purple-400"
                    onClick={() => requestSort('album')}
                  >
                    Album
                    {getSortIndicator('album')}
                  </div>
                  <div className="w-16 text-center">Time</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="bg-gray-800 rounded-b-lg overflow-auto flex-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                {filteredLibrary.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Music size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-1">No songs found</p>
                    <p className="text-sm">
                      {musicLibrary.length === 0
                        ? "Scan a folder to add music to your library"
                        : "Try a different search"}
                    </p>
                  </div>
                ) : (
                  filteredLibrary.map((song, index) => {
                    const isNowPlaying = currentSongIndex !== null &&
                      nowPlaying.length > 0 &&
                      currentSongIndex < nowPlaying.length &&
                      nowPlaying[currentSongIndex]?.id === song.id;

                    return (
                      <div
                        key={song.id}
                        className={`group flex items-center px-4 py-2 text-xs border-b border-gray-700 hover:bg-gray-700 transition-colors ${isNowPlaying ? 'bg-gray-700 border-l-4 border-l-purple-500' : ''
                          }`}
                        onClick={() => {
                          if (!selectMode) playPlaylist({ name: "", songs: filteredLibrary })
                        }}
                      >
                        <div className="w-8 text-center">
                          {selectMode ? (
                            <input
                              type="checkbox"
                              className="rounded text-purple-600 focus:ring-purple-500"
                              checked={selectedSongs.some((s) => s.id === song.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSongs([...selectedSongs, song]);
                                } else {
                                  setSelectedSongs(selectedSongs.filter((s) => s.id !== song.id));
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className={!isNowPlaying ? `opacity-0 group-hover:opacity-100` : ''}>
                              {isNowPlaying ? (
                                <div className="w-4 h-4 mx-auto">
                                  <span className="flex h-3 w-3">
                                    <span className={"absolute h-3 w-3 rounded-full bg-purple-400 opacity-75" + (isPlaying ? " animate-ping" : "")}></span>
                                    <span className="relative rounded-full h-3 w-3 bg-purple-500"></span>
                                  </span>
                                </div>
                              ) : (
                                <Play size={14} className="mx-auto" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="w-1/3 truncate">
                          <span className={isNowPlaying ? "text-purple-400 font-medium" : ""}>{song.title}</span>
                        </div>
                        <div className="w-1/6 truncate">{song.genre || '-'}</div>
                        <div className="w-1/6 truncate">{song.artist || 'Unknown'}</div>
                        <div className="w-1/6 truncate">{song.album || '-'}</div>
                        <div className="w-16 text-right">{song.time || '-'}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Bar */}
              {selectMode && selectedSongs.length > 0 && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{selectedSongs.length}</span> songs selected
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
                      onClick={() => setSelectedSongs([])}
                    >
                      Clear
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm"
                      onClick={addToNowPlaying}
                    >
                      Add to Now Playing
                    </button>
                    <select
                      className="px-2 py-1 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={selectedPlaylist || ''}
                      onChange={(e) => selectPlaylistForAdding(e.target.value)}
                    >
                      <option value="">Select Playlist</option>
                      {playlists.map((playlist) => (
                        <option key={playlist.name} value={playlist.name}>
                          {playlist.name}
                        </option>
                      ))}
                    </select>
                    {selectedPlaylist && (
                      <button
                        className="px-3 py-1 mt-2 rounded-lg bg-green-600 hover:bg-green-700"
                        onClick={() => addToPlaylist(selectedPlaylist)}
                      >
                        Add {selectedSongs.length} Song(s) to {selectedPlaylist}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Player Section */}
      <PlayerPanel audioRef={audioRef} closePlayerView={closePlayerView} togglePlayerView={togglePlayerView} togglePlayPause={togglePlayPause}
        prevSong={prevSong} nextSong={nextSong} replaySong={replaySong} shuffleSongs={shuffleSongs} setCurrentSongIndex={setCurrentSongIndex}
        playerView={playerView} duration={duration} currentTime={currentTime} isPlaying={isPlaying} currentSongIndex={currentSongIndex} nowPlaying={nowPlaying} />

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
