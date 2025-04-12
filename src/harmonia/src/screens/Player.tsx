import React, { useState, useEffect, useRef, Dispatch, SetStateAction, useMemo } from 'react';
import { Home, Library, Settings, Music } from 'lucide-react';
import { Song } from '../types/song';
import LibraryPanel from '../components/LibraryPanel';
import FeaturedPanel from '../components/FeaturePanel';
import PlayerPanel from '../components/PlayerPanel';
import InputModal from '../components/InputModal';

interface Playlist {
  name: string;
  songs: Song[];
}

const MusicPlayer = () => {
  const [playerView, setPlayerView] = useState<'hidden' | 'sideview' | 'fullview'>('sideview');
  const [viewMode, setViewMode] = useState<'featured' | 'library'>('featured');
  const [playerLayout, setPlayerLayout] = useState<'side' | 'bottom'>('bottom');
  const [nowPlaying, setNowPlaying] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load playlists and recently played on mount
  useEffect(() => {
    async function loadData() {
      const cachedPlaylists: Playlist[] = (await window.electronAPI?.loadPlaylists()) || [];
      setPlaylists(cachedPlaylists);

      const cachedRecentlyPlayed: Song[] = (await window.electronAPI?.loadRecentlyPlayed()) || [];
      setRecentlyPlayed(cachedRecentlyPlayed.slice(0, 5));
    }
    loadData();
  }, []);

  // Save playlists when updated
  useEffect(() => {
    if (playlists.length !== 0) window.electronAPI?.savePlaylists(playlists);
  }, [playlists]);

  // Save recently played when updated
  useEffect(() => {
    if (recentlyPlayed.length !== 0) window.electronAPI?.saveRecentlyPlayed(recentlyPlayed);
  }, [recentlyPlayed]);

  // Update recently played when a new song plays
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
      //audio.addEventListener('ended', nextSong);
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        //audio.removeEventListener('ended', nextSong);
      };
    }
  }, [isPlaying]);

  // Play current song when index or nowPlaying changes
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

  const togglePlayerLayout = () => {
    setPlayerLayout(playerLayout === 'side' ? 'bottom' : 'side');
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
    if (nowPlaying.length === 0) return;
    const shuffled = [...nowPlaying].sort(() => Math.random() - 0.5);
    setNowPlaying(shuffled);
    setCurrentSongIndex(0);
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
    if (name && !playlists.some((p) => p.name === name)) {
      const newPlaylists = [...playlists, { name, songs: [] }];
      setPlaylists(newPlaylists);
    }
  };

  const addToPlaylist = (playlistName: string, selectedSongs: Song[]) => {
    if (selectedSongs.length > 0 && playlistName) {
      const updatedPlaylists = playlists.map((p) =>
        p.name === playlistName ? { ...p, songs: [...p.songs, ...selectedSongs] } : p
      );
      setPlaylists(updatedPlaylists);
      window.electronAPI?.updatePlaylist(
        playlistName,
        updatedPlaylists.find((p) => p.name === playlistName)?.songs || []
      );
      setSelectedPlaylist(null);
    }
  };

  const openCreatePlaylistModal = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (value: string) => {
    createPlaylist(value);
    setIsModalOpen(false);
  };

  const memoizedFeaturePanel = useMemo(() => (
    <FeaturedPanel
      playlists={playlists}
      selectedPlaylist={selectedPlaylist}
      setSelectedPlaylist={setSelectedPlaylist}
      addToPlaylist={addToPlaylist}
      openCreatePlaylistModal={openCreatePlaylistModal}
      setNowPlaying={setNowPlaying}
      setCurrentSongIndex={setCurrentSongIndex}
      recentlyPlayed={recentlyPlayed}
    />
  ), [playlists, selectedPlaylist, recentlyPlayed]);

  // Memoize the LibraryPanel component
  const memoizedLibraryPanel = useMemo(() => (
    <LibraryPanel
      nowPlaying={nowPlaying}
      currentSongIndex={currentSongIndex}
      isPlaying={isPlaying}
      setNowPlaying={setNowPlaying}
      setCurrentSongIndex={setCurrentSongIndex}
      playlists={playlists}
      selectedPlaylist={selectedPlaylist}
      setSelectedPlaylist={setSelectedPlaylist}
      addToPlaylist={addToPlaylist}
    />
  ), [nowPlaying, currentSongIndex, isPlaying, playlists, selectedPlaylist]);

  return (
    <div className="flex h-screen bg-gray-900 text-white overscroll-none">
      {/* Sidebar */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4">
        <div className="mb-8 flex flex-col items-center gap-10">
          <div className="flex flex-col gap-5 items-center">
            <button className="p-3 rounded-full hover:bg-gray-800" onClick={() => setViewMode('featured')}>
              <Home size={viewMode === 'featured' ? 30 : 25} color={viewMode === 'featured' ? 'purple' : 'white'} />
            </button>
            <button className="p-3 rounded-full hover:bg-gray-800" onClick={() => setViewMode('library')}>
              <Library size={viewMode === 'library' ? 30 : 25} color={viewMode === 'library' ? 'purple' : 'white'} />
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
        className={`flex-1 transition-all duration-300 ${playerView === 'fullview' ? 'opacity-0 pointer-events-none' : 'flex flex-col opacity-100'
          } ${playerLayout === 'bottom' ? 'pb-24' : ''}`} // Add padding-bottom when in bottom mode
      >
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">{viewMode === 'featured' ? 'Home' : 'Library'}</h1>
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
        <div className="p-4 flex-1 overflow-hidden">
        {viewMode === 'featured' ? memoizedFeaturePanel : memoizedLibraryPanel}
        </div>
      </div>

      {/* Player Section */}
      <PlayerPanel
        audioRef={audioRef}
        closePlayerView={closePlayerView}
        togglePlayerView={togglePlayerView}
        togglePlayerLayout={togglePlayerLayout} // New prop
        playerLayout={playerLayout} // New prop
        togglePlayPause={togglePlayPause}
        prevSong={prevSong}
        nextSong={nextSong}
        replaySong={replaySong}
        shuffleSongs={shuffleSongs}
        setCurrentSongIndex={setCurrentSongIndex}
        playerView={playerView}
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        currentSongIndex={currentSongIndex}
        nowPlaying={nowPlaying}
        setNowPlaying={setNowPlaying}
        setIsPlaying={setIsPlaying}
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
