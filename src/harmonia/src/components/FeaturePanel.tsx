import React from 'react';
import { Play } from 'lucide-react';
import { Song } from 'src/types/song';

interface Playlist {
  name: string;
  songs: Song[];
}

interface FeaturedPanelProps {
  playlists: Playlist[];
  selectedPlaylist: string | null;
  setSelectedPlaylist: (name: string | null) => void;
  addToPlaylist: (playlistName: string, selectedSongs: Song[]) => void;
  openCreatePlaylistModal: () => void;
  setNowPlaying: (songs: Song[]) => void;
  setCurrentSongIndex: (index: number) => void;
  recentlyPlayed: Song[];
}

const FeaturedPanel: React.FC<FeaturedPanelProps> = ({
  playlists,
  selectedPlaylist,
  setSelectedPlaylist,
  openCreatePlaylistModal,
  setNowPlaying,
  setCurrentSongIndex,
  recentlyPlayed,
}) => {
  const playPlaylist = (playlist: Playlist) => {
    if(playlist.songs.length === 0) return;
    
    setNowPlaying(playlist.songs);
    setCurrentSongIndex(0);
  };

  const playSong = (song: Song) => {
    setNowPlaying([song]);
    setCurrentSongIndex(0);
  };

  const selectPlaylistForAdding = (name: string) => {
    setSelectedPlaylist(name === selectedPlaylist ? null : name);
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">Recently Played</h2>
        {recentlyPlayed.length === 0 ? (
          <div className="text-gray-400 text-center">
            <p>No recently played songs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {recentlyPlayed.map((song, index) => (
              <div
                key={index}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => playSong(song)}
              >
                <div
                  className="w-full aspect-square rounded-lg mb-2"
                  style={{
                    backgroundImage: song.coverPath ? `url(${song.coverPath})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: song.coverPath ? undefined : '#8b5cf6', // Fallback gradient if no cover
                  }}
                ></div>
                <p className="text-sm font-medium">{song.title}</p>
                <p className="text-xs text-gray-400">{song.artist || 'Unknown'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-bold mb-3">Your Playlists</h2>
        <div className="space-y-2">
          {playlists &&
            playlists.map((playlist, index) => (
              <div
                key={index}
                className={`flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer ${selectedPlaylist === playlist.name ? 'bg-gray-700' : ''
                  }`}
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
        </div>
      </div>
    </>
  );
};

export default FeaturedPanel;
