// src/harmonia/src/components/PlaylistView.tsx
import React from 'react';
import { Play, Trash2, Music } from 'lucide-react';
import { Song } from 'src/types/song';
import Playlist from 'src/types/playlist';

interface PlaylistViewProps {
  playlist: Playlist;
  onPlayPlaylist: (playlist: Playlist, startIndex?: number) => void;
  onPlaySong: (playlist: Playlist, index: number) => void;
  onDeleteSong: (playlistName: string, songId: string) => void;
  nowPlaying: Song[];
  currentSongIndex: number | null;
  isPlaying: boolean;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  onPlayPlaylist,
  onPlaySong,
  onDeleteSong,
  nowPlaying,
  currentSongIndex,
  isPlaying,
}) => {

  const isSongCurrentlyPlaying = (song: Song): boolean => {
    if (currentSongIndex === null || !nowPlaying || nowPlaying.length === 0) {
        return false;
    }
    // Check if the currently playing song list *originates* from this playlist view
    // This is a simple check; a more robust way might involve passing a playlist ID or context
    const isCurrentQueueThisPlaylist = nowPlaying.length === playlist.songs.length &&
                                       nowPlaying.every((npSong, idx) => playlist.songs[idx]?.id === npSong.id);

    return isCurrentQueueThisPlaylist && nowPlaying[currentSongIndex]?.id === song.id;
  };


  return (
    <div className="flex flex-col h-full">
      {/* Optional: Add a Play All button */}
      <div className="mb-4">
        <button
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onPlayPlaylist(playlist)}
          disabled={playlist.songs.length === 0}
        >
          <Play size={16} />
          <span>Play All</span>
        </button>
      </div>

      {/* Song List Header */}
      <div className="bg-gray-800 rounded-t-lg px-4 py-2 text-xs font-medium sticky top-0 z-10"> {/* Make header sticky */}
        <div className="flex items-center">
          <div className="w-10"></div> {/* Spacer for play/playing icon */}
          <div className="flex-1">Title</div>
          <div className="w-1/4">Artist</div>
          <div className="w-1/4">Album</div>
          <div className="w-16 text-right">Time</div>
          <div className="w-10 text-center"></div> {/* Spacer for delete icon */}
        </div>
      </div>

      {/* Song List Body */}
      <div className="bg-gray-800 rounded-b-lg overflow-auto custom-scrollbar flex-1"> {/* Make body scrollable */}
        {playlist.songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Music size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">Playlist is empty</p>
            <p className="text-sm">Add songs from your library.</p>
          </div>
        ) : (
          playlist.songs.map((song, index) => {
            const isCurrentlyPlaying = isSongCurrentlyPlaying(song);
            return (
              <div
                key={song.id}
                className={`group flex items-center px-4 py-2 text-xs border-b border-gray-700 hover:bg-gray-700 transition-colors ${isCurrentlyPlaying ? 'bg-gray-700 border-l-4 border-l-purple-500' : ''
                  }`}
              >
                {/* Play Button / Playing Indicator */}
                <div className="w-10 flex items-center justify-center">
                   <button
                      className={`p-1 rounded-full hover:bg-gray-600 ${!isCurrentlyPlaying ? 'opacity-0 group-hover:opacity-100' : ''}`}
                      onClick={(e) => {
                          e.stopPropagation(); // Prevent row click if needed
                          onPlaySong(playlist, index);
                      }}
                   >
                    {isCurrentlyPlaying ? (
                       <div className="w-4 h-4 mx-auto">
                         <span className="flex h-3 w-3 relative">
                           <span
                             className={
                               'absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75' +
                               (isPlaying ? ' animate-ping' : '')
                             }
                           ></span>
                           <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                         </span>
                       </div>
                     ) : (
                       <Play size={14} />
                     )}
                   </button>
                </div>

                {/* Song Details */}
                <div className={`flex-1 truncate ${isCurrentlyPlaying ? 'text-purple-400 font-medium' : ''}`}>
                  {song.title || 'Unknown Title'}
                </div>
                <div className="w-1/4 truncate">{song.artist || 'Unknown Artist'}</div>
                <div className="w-1/4 truncate">{song.album || '-'}</div>
                <div className="w-16 text-right">{song.time || '-'}</div>

                {/* Delete Button */}
                <div className="w-10 flex items-center justify-center">
                  <button
                    className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-600 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSong(playlist.name, song.id);
                    }}
                    title={`Remove ${song.title} from playlist`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlaylistView;