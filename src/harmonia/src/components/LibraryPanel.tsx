// src/harmonia/src/components/LibraryPanel.tsx
import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { Search, X, Play, Music } from 'lucide-react';
import { Song } from 'src/types/song';

interface Playlist {
  name: string;
  songs: Song[];
}

interface LibraryPanelProps {
  nowPlaying: Song[];
  musicLibrary: Song[];
  currentSongIndex: number | null;
  isPlaying: boolean;
  // setNowPlaying: (songs: Song[]) => void; // Keep generic setter if needed elsewhere - Removed as planned
  setCurrentSongIndex: (index: number) => void;
  playPlaylist: (playlist: { name: string, songs: Song[] }, startIndex?: number) => void; // Use this prop for playing
  playlists: Playlist[];
  selectedPlaylist: string | null;
  setSelectedPlaylist: (name: string | null) => void;
  addToPlaylist: (playlistName: string, selectedSongs: Song[]) => void;
  scanFolder: () => Promise<void>;
}

const LONG_PRESS_DURATION = 500; // milliseconds

const LibraryPanel: React.FC<LibraryPanelProps> = ({
  nowPlaying,
  currentSongIndex,
  isPlaying,
  musicLibrary,
  playPlaylist, // Use this prop
  playlists,
  selectedPlaylist,
  setSelectedPlaylist,
  addToPlaylist,
  scanFolder 
}) => {
  
  const [filteredLibrary, setFilteredLibrary] = useState<Song[]>(musicLibrary);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Song | string; direction: 'ascending' | 'descending' } | null>(null);
 

  // --- Ref for long press detection ---
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const didLongPressRef = useRef<boolean>(false); // To prevent click after long press


  const applySearchFilter = (library: Song[], query: string): Song[] => {
    const q = query.toLowerCase().trim();
    if (!q) return library;
    return library.filter(
      (song) =>
        song.title?.toLowerCase().includes(q) ||
        song.artist?.toLowerCase().includes(q) ||
        song.album?.toLowerCase().includes(q) ||
        song.genre?.toLowerCase().includes(q)
    );
  };

  const applySort = (library: Song[], config: { key: keyof Song | string; direction: 'ascending' | 'descending' }): Song[] => {
      const sortedSongs = [...library].sort((a, b) => {
          const key = config.key as keyof Song;
          const valueA = a[key];
          const valueB = b[key];

          if (valueA == null && valueB == null) return 0;
          if (valueA == null) return config.direction === 'ascending' ? -1 : 1;
          if (valueB == null) return config.direction === 'ascending' ? 1 : -1;

          let comparison = 0;
          if (typeof valueA === 'string' && typeof valueB === 'string') {
              comparison = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
          } else if (typeof valueA === 'number' && typeof valueB === 'number') {
              comparison = valueA - valueB;
          } else {
              if (valueA < valueB) comparison = -1;
              if (valueA > valueB) comparison = 1;
          }

          return config.direction === 'ascending' ? comparison : comparison * -1;
      });
      return sortedSongs;
  };

  useEffect(() => {
    let processedLibrary = [...musicLibrary];
    if (searchQuery) {
      processedLibrary = applySearchFilter(processedLibrary, searchQuery);
    }
    if (sortConfig) {
      processedLibrary = applySort(processedLibrary, sortConfig);
    }
    setFilteredLibrary(processedLibrary);
   // console.log(filteredLibrary)
  }, [searchQuery, sortConfig, musicLibrary]);

  // --- Component Functions (remain mostly the same) ---
  // const scanFolder = async () => {
  //   let library: Song[] = await window.electronAPI?.selectFolder();
  //   setMusicLibrary(library);
  //   setIsFolderWatched(true);
  //   window.electronAPI?.saveLibrary(library);
  // };

  const addToNowPlayingFromSelection = () => {
    if (selectedSongs.length > 0) {
      playPlaylist({ name: "Selection", songs: selectedSongs }, 0);
      setSelectMode(false);
      setSelectedSongs([]);
    }
  };

  const requestSort = (key: keyof Song | string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Song | string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  // --- Long Press Handlers ---
  const handlePressStart = (song: Song) => {
    didLongPressRef.current = false; // Reset flag
    longPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true; // Mark that long press occurred
      setSelectMode(true);
      // Add the song if not already selected
      setSelectedSongs((prevSelected) => {
        if (!prevSelected.some(s => s.id === song.id)) {
          return [...prevSelected, song];
        }
        return prevSelected;
      });
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // No need to reset didLongPressRef here, onClick will handle it
  };

  // --- Modified Click Handler ---
  const handleRowClick = (song: Song, index: number) => {
    // If a long press just happened, prevent the click action and reset the flag
    if (didLongPressRef.current) {
      didLongPressRef.current = false; // Reset for next interaction
      return;
    }

    // Original click logic
    if (selectMode) {
      // Toggle selection in select mode
      setSelectedSongs((prevSelected) => {
        if (prevSelected.some((s) => s.id === song.id)) {
          return prevSelected.filter((s) => s.id !== song.id);
        } else {
          return [...prevSelected, song];
        }
      });
    } else {
      // Play the filtered list starting from this song
      playPlaylist({ name: "Library Search", songs: filteredLibrary }, index);
    }
  };


  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scan Folder Button */}
      <div className="flex justify-end mb-4 flex-shrink-0">
        <button
          className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm"
          onClick={scanFolder}
        >
          Scan Music Folder
        </button>
      </div>

      {/* Search Bar & Select Button */}
      <div className="mb-4 flex gap-2 flex-shrink-0">
         <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-10 py-2 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Search Library..."
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
        <button
          className={`px-3 py-2 rounded-lg ${selectMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-800 hover:bg-gray-700'} text-sm transition-colors`}
          onClick={() => {
            setSelectMode(!selectMode);
            if (selectMode) setSelectedSongs([]); // Clear selection when exiting select mode via button
          }}
        >
          {selectMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      {/* Results Info */}
      <div className="mb-2 text-xs text-gray-400 flex-shrink-0">
        {searchQuery || (sortConfig && musicLibrary.length !== filteredLibrary.length)
          ? `${filteredLibrary.length} of ${musicLibrary.length} songs shown`
          : `${musicLibrary.length} songs in library`}
      </div>

      {/* Table Header */}
      <div className="bg-gray-800 rounded-t-lg px-4 py-2 text-xs font-medium sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-8 text-center flex-shrink-0">
            {selectMode ? (
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 rounded text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500 focus:ring-offset-0"
                checked={selectMode && filteredLibrary.length > 0 && selectedSongs.length === filteredLibrary.length}
                onChange={(e) => {
                  setSelectedSongs(e.target.checked ? [...filteredLibrary] : []);
                }}
                disabled={!selectMode || filteredLibrary.length === 0}
              />
            ) : (
               <div className="w-4 h-4"></div>
            )}
          </div>
          <div className="w-1/3 cursor-pointer hover:text-purple-400 pr-2" onClick={() => requestSort('title')}>
            Title {getSortIndicator('title')}
          </div>
          <div className="w-1/6 cursor-pointer hover:text-purple-400 pr-2" onClick={() => requestSort('genre')}>
            Genre {getSortIndicator('genre')}
          </div>
          <div className="w-1/6 cursor-pointer hover:text-purple-400 pr-2" onClick={() => requestSort('artist')}>
            Artist {getSortIndicator('artist')}
          </div>
          <div className="w-1/6 cursor-pointer hover:text-purple-400 pr-2" onClick={() => requestSort('album')}>
            Album {getSortIndicator('album')}
          </div>
          <div className="w-16 text-right flex-shrink-0">Time</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-gray-800 rounded-b-lg overflow-y-auto custom-scrollbar flex-1">
        {filteredLibrary.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Music size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">
              {musicLibrary.length === 0 ? 'Library Empty' : 'No songs match your search'}
            </p>
            <p className="text-sm">
              {musicLibrary.length === 0 ? 'Scan a folder to add music' : 'Try adjusting your search terms'}
            </p>
          </div>
        ) : (
          filteredLibrary.map((song, index) => {
            const isSelected = selectedSongs.some((s) => s.id === song.id);
            const isNowPlaying =
              currentSongIndex !== null &&
              nowPlaying[currentSongIndex]?.id === song.id;
             const isCurrentQueueThisList = nowPlaying.length === filteredLibrary.length &&
                                            nowPlaying.every((npSong, idx) => filteredLibrary[idx]?.id === npSong.id);
             const isActuallyPlayingThisSong = isNowPlaying && isCurrentQueueThisList;


            return (
              <div
                key={song.id}
                className={`group flex items-center px-4 py-2 text-xs border-b border-gray-700 transition-colors cursor-pointer ${ // Always cursor-pointer now
                   isSelected ? 'bg-purple-900 hover:bg-purple-800' : 'hover:bg-gray-700'
                } ${
                  isActuallyPlayingThisSong ? 'bg-gray-700 border-l-4 border-l-purple-500' : ''
                }`}
                // --- Add Long Press Event Handlers ---
                onMouseDown={() => handlePressStart(song)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd} // Cancel timer if mouse leaves
                onTouchStart={() => handlePressStart(song)} // Basic touch support
                onTouchEnd={handlePressEnd}
                onTouchCancel={handlePressEnd} // Cancel timer on touch cancel
                // --- Use the modified click handler ---
                onClick={() => handleRowClick(song, index)}
              >
                {/* Checkbox / Play Indicator */}
                <div className="w-8 text-center flex-shrink-0 pointer-events-none"> {/* Prevent checkbox/icon stealing events */}
                  {selectMode ? (
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 rounded text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500 focus:ring-offset-0 pointer-events-none"
                      checked={isSelected}
                      readOnly
                    />
                  ) : (
                    <div className={`flex items-center justify-center h-4 w-4 ${!isActuallyPlayingThisSong ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                      {isActuallyPlayingThisSong ? (
                        <span className="flex h-3 w-3 relative">
                          <span className={`absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 ${isPlaying ? 'animate-ping' : ''}`}></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                        </span>
                      ) : (
                        <Play size={14} className="mx-auto" />
                      )}
                    </div>
                  )}
                </div>
                {/* Song Details */}
                <div className={`w-1/3 truncate pr-2 pointer-events-none ${isActuallyPlayingThisSong ? 'text-purple-400 font-medium' : ''}`}>
                  {song.title || 'Unknown Title'}
                </div>
                <div className="w-1/6 truncate pr-2 pointer-events-none">{song.genre || '-'}</div>
                <div className="w-1/6 truncate pr-2 pointer-events-none">{song.artist || 'Unknown'}</div>
                <div className="w-1/6 truncate pr-2 pointer-events-none">{song.album || '-'}</div>
                <div className="w-16 text-right flex-shrink-0 pointer-events-none">{song.time || '-'}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Bar (remains the same) */}
      {selectMode && (
        <div className="mt-auto p-3 bg-gray-800 rounded-lg flex items-center justify-between flex-shrink-0 border-t border-gray-700">
          <div className="text-sm">
            {selectedSongs.length > 0 ? (
              <>
                <span className="font-medium">{selectedSongs.length}</span> song{selectedSongs.length !== 1 ? 's' : ''} selected
              </>
            ) : (
              'Select songs to perform actions'
            )}
          </div>
          <div className="flex gap-2">
            {selectedSongs.length > 0 && (
              <>
                <button
                  className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
                  onClick={() => setSelectedSongs([])}
                >
                  Clear Selection
                </button>
                <button
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-sm"
                  onClick={addToNowPlayingFromSelection}
                >
                  Play Selected
                </button>
                <div className="flex items-center gap-1">
                   <select
                     className="px-2 py-1 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                     value={selectedPlaylist || ''}
                     onChange={(e) => setSelectedPlaylist(e.target.value || null)}
                     disabled={playlists.length === 0}
                     title={playlists.length === 0 ? "Create a playlist first" : "Select playlist to add songs"}
                   >
                     <option value="">Add to Playlist...</option>
                     {playlists.map((playlist) => (
                       <option key={playlist.name} value={playlist.name}>
                         {playlist.name}
                       </option>
                     ))}
                   </select>
                   <button
                     className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                     onClick={() => {
                       if (selectedPlaylist) {
                         addToPlaylist(selectedPlaylist, selectedSongs);
                       }
                     }}
                     disabled={!selectedPlaylist || selectedSongs.length === 0}
                     title={!selectedPlaylist ? "Select a playlist first" : `Add ${selectedSongs.length} song(s) to ${selectedPlaylist}`}
                   >
                     Add
                   </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPanel;
