// src/harmonia/src/components/FeaturePanel.tsx
import React, { Dispatch, SetStateAction } from 'react';
import { Play, ListMusic, Trash } from 'lucide-react'; // Changed icon
import { Song } from 'src/types/song';

interface Playlist {
  name: string;
  songs: Song[];
}

interface FeaturedPanelProps {
  playlists: Playlist[];
  selectedPlaylist: string | null; // Keep for adding songs
  setPlaylists: Dispatch<SetStateAction<Playlist[]>>;
  addToPlaylist: (playlistName: string, selectedSongs: Song[]) => void; // Keep for adding songs
  openCreatePlaylistModal: () => void;
  setNowPlaying: (songs: Song[]) => void; // Keep for recently played
  setCurrentSongIndex: (index: number) => void; // Keep for recently played
  recentlyPlayed: Song[];
  onPlaylistClick: (playlist: Playlist) => void; // New prop for navigation
}

const FeaturedPanel: React.FC<FeaturedPanelProps> = ({
  playlists,
  selectedPlaylist,
  // setSelectedPlaylist,
  // addToPlaylist, // Keep this prop, but the '+' button might need rethinking UX-wise later
  setPlaylists,
  openCreatePlaylistModal,
  setNowPlaying,
  setCurrentSongIndex,
  recentlyPlayed,
  onPlaylistClick, // Use this prop
}) => {

  // Keep playSong for Recently Played items
  const playSong = (song: Song) => {
    setNowPlaying([song]);
    setCurrentSongIndex(0);
  };

  // Keep selectPlaylistForAdding for the '+' button functionality
  // const selectPlaylistForAdding = (name: string) => {
  //   setSelectedPlaylist(name === selectedPlaylist ? null : name);
  // };
  function DeletePlaylist(playlist: Playlist) {
    setPlaylists(current => current.filter(p => p !== playlist));
  }

  return (
    <>
      {/* Recently Played Section (Keep as is) */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Recently Played</h2>
        {recentlyPlayed.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            <p>No recently played songs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"> {/* Responsive grid */}
            {recentlyPlayed.map((song) => ( // Use song.id if available and unique, otherwise index is fallback
              <div
                key={song.id || song.path} // Prefer unique ID
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => playSong(song)}
              >
                <div
                  className="relative w-full aspect-square rounded-lg mb-2 overflow-hidden group-hover:shadow-lg transition-shadow"
                  style={{
                    backgroundImage: song.coverPath ? `url(${song.coverPath})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: song.coverPath ? undefined : '#8b5cf6', // Fallback color
                  }}
                >
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                    <Play size={32} className="text-white" fill="white" />
                  </div>
                </div>
                <p className="text-sm font-medium text-center truncate w-full">{song.title}</p>
                <p className="text-xs text-gray-400 text-center truncate w-full">{song.artist || 'Unknown'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playlists Section */}
      <div>
        <h2 className="text-lg font-bold mb-3">Your Playlists</h2>
        <div className="space-y-2">
          {playlists && playlists.length > 0 ? (
            playlists.map((playlist) => (
              <div
                key={playlist.name} // Use playlist name as key
                className={`flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors ${selectedPlaylist === playlist.name ? 'bg-gray-700' : '' // Highlight if selected for adding
                  }`}
                // Main click navigates to the playlist view
                onClick={() => onPlaylistClick(playlist)}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 mr-3 flex items-center justify-center flex-shrink-0">
                  <ListMusic size={20} /> {/* Changed Icon */}
                </div>
                {/* Name and Song Count */}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{playlist.name}</p>
                  <p className="text-xs text-gray-400">{playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}</p>
                </div>
                {/* Add to this playlist button (optional, keep for now) */}
                <button
                  className={`p-1 rounded-full hover:bg-gray-600 ml-2 ${selectedPlaylist === playlist.name ? 'bg-green-600 text-white hover:bg-green-500' : 'text-gray-400'}`}
                  onClick={(e) => {
                    DeletePlaylist(playlist);
                    e.stopPropagation(); // Prevent navigation click
                    // selectPlaylistForAdding(playlist.name);
                  }}
                  title={selectedPlaylist === playlist.name ? `Selected for adding songs` : `Select '${playlist.name}' to add songs`}
                >
                  <Trash />
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-4">
              <p>No playlists created yet.</p>
            </div>
          )}
          {/* New Playlist Button */}
          <button
            className="w-full px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 mt-4 text-sm font-medium"
            onClick={openCreatePlaylistModal}
          >
            Create New Playlist
          </button>
        </div>
      </div>
    </>
  );
};

export default FeaturedPanel;

