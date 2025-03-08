import React, { useState, useEffect } from 'react';
import { Search, X, Play, Music } from 'lucide-react';
import { Song } from 'src/types/song';

interface Playlist {
  name: string;
  songs: Song[];
}

interface LibraryPanelProps {
  nowPlaying: Song[];
  currentSongIndex: number | null;
  isPlaying: boolean;
  setNowPlaying: (songs: Song[]) => void;
  setCurrentSongIndex: (index: number) => void;
  playlists: Playlist[];
  selectedPlaylist: string | null;
  setSelectedPlaylist: (name: string | null) => void;
  addToPlaylist: (playlistName: string, selectedSongs: Song[]) => void;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({
  nowPlaying,
  currentSongIndex,
  isPlaying,
  setNowPlaying,
  setCurrentSongIndex,
  playlists,
  selectedPlaylist,
  setSelectedPlaylist,
  addToPlaylist,
}) => {
  const [musicLibrary, setMusicLibrary] = useState<Song[]>([]);
  const [filteredLibrary, setFilteredLibrary] = useState<Song[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [isFolderWatched, setIsFolderWatched] = useState(false);

  // Load library on mount
  useEffect(() => {
    async function loadData() {
      const result = await window.electronAPI.initLibrary();
      if (result) {
        setMusicLibrary(result.library || []);
        setFilteredLibrary(result.library || []);
        setIsFolderWatched(!!result.folder);
      }

      // Listen for library updates
      window.electronAPI.onLibraryUpdated((updatedLibrary: Song[]) => {
        setMusicLibrary(updatedLibrary);
        setFilteredLibrary((prev) => {
          if (searchQuery) {
            return applySearchFilter(updatedLibrary, searchQuery);
          }
          return updatedLibrary;
        });
      });
    }

    loadData();

    return () => {
      window.electronAPI.removeLibraryUpdatedListener();
    };
  }, []);

  // Handle filtering library based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLibrary(musicLibrary);
      return;
    }
    setFilteredLibrary(applySearchFilter(musicLibrary, searchQuery));
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

  const applySearchFilter = (library: Song[], query: string) => {
    const q = query.toLowerCase();
    return library.filter(
      (song) =>
        song.title?.toLowerCase().includes(q) ||
        song.artist?.toLowerCase().includes(q) ||
        song.album?.toLowerCase().includes(q) ||
        song.genre?.toLowerCase().includes(q)
    );
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

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const playPlaylist = (playlist: Playlist, selectedSong = 0) => {
    setNowPlaying(playlist.songs);
    setCurrentSongIndex(selectedSong);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden overscroll-none">
      {/* Scan Folder Button */}
      <div className="flex justify-end mb-4">
        <button
          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700"
          onClick={scanFolder}
        >
          Scan Folder
        </button>
      </div>

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
            {selectMode ? (
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
            ) : (
              <button
                className="rounded w-8 text-purple-600 focus:ring-purple-500"
                onClick={() => setSelectMode(true)}
              />
            )}
          </div>
          <div className="w-1/3 cursor-pointer hover:text-purple-400" onClick={() => requestSort('title')}>
            Title {getSortIndicator('title')}
          </div>
          <div className="w-1/6 cursor-pointer hover:text-purple-400" onClick={() => requestSort('genre')}>
            Genre {getSortIndicator('genre')}
          </div>
          <div className="w-1/6 cursor-pointer hover:text-purple-400" onClick={() => requestSort('artist')}>
            Artist {getSortIndicator('artist')}
          </div>
          <div className="w-1/6 cursor-pointer hover:text-purple-400" onClick={() => requestSort('album')}>
            Album {getSortIndicator('album')}
          </div>
          <div className="w-16 text-center">Time</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-gray-800 rounded-b-lg overflow-auto custom-scrollbar flex-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {filteredLibrary.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Music size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No songs found</p>
            <p className="text-sm">
              {musicLibrary.length === 0 ? 'Scan a folder to add music to your library' : 'Try a different search'}
            </p>
          </div>
        ) : (
          filteredLibrary.map((song, index) => {
            const isNowPlaying =
              currentSongIndex !== null &&
              nowPlaying.length > 0 &&
              currentSongIndex < nowPlaying.length &&
              nowPlaying[currentSongIndex]?.id === song.id;

            return (
              <div
                key={song.id}
                className={`group flex items-center px-4 py-2 text-xs border-b border-gray-700 hover:bg-gray-700 transition-colors ${isNowPlaying ? 'bg-gray-700 border-l-4 border-l-purple-500' : ''
                  }`}
                onClick={() => {
                  if (!selectMode) playPlaylist({ name: '', songs: filteredLibrary }, index);
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
                            <span
                              className={
                                'absolute h-3 w-3 rounded-full bg-purple-400 opacity-75' +
                                (isPlaying ? ' animate-ping' : '')
                              }
                            ></span>
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
                  <span className={isNowPlaying ? 'text-purple-400 font-medium' : ''}>{song.title}</span>
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
              onChange={(e) => setSelectedPlaylist(e.target.value)}
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
                className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-sm"
                onClick={() => {
                  addToPlaylist(selectedPlaylist, selectedSongs);
                  setSelectMode(false);
                  setSelectedSongs([]);
                }}
              >
                Add {selectedSongs.length} Song(s) to {selectedPlaylist}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPanel;
