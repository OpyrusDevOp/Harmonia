import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import {
  ChevronLeft,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  X,
  Layout
} from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  coverPath?: string;
}

interface PlayerPanelProps {
  closePlayerView: () => void;
  togglePlayerView: () => void;
  togglePlayerLayout: () => void;
  playerLayout: 'side' | 'bottom';
  togglePlayPause: () => void;
  prevSong: () => void;
  nextSong: () => void;
  replaySong: () => void;
  shuffleSongs: () => void;
  setCurrentSongIndex: (index: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  playerView: 'hidden' | 'sideview' | 'fullview';
  duration: string;
  currentTime: string;
  isPlaying: boolean;
  currentSongIndex: number | null;
  nowPlaying: Song[];
  setNowPlaying: Dispatch<SetStateAction<Song[]>>;
  setIsPlaying: (isPlaying: boolean) => void;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  closePlayerView,
  togglePlayerView,
  togglePlayerLayout,
  playerLayout,
  togglePlayPause,
  prevSong,
  nextSong,
  replaySong,
  shuffleSongs,
  setCurrentSongIndex,
  audioRef,
  playerView,
  duration,
  currentTime,
  isPlaying,
  currentSongIndex,
  nowPlaying,
  setNowPlaying,
  setIsPlaying,
}) => {
  const [progress, setProgress] = useState(0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [isShuffled, setIsShuffled] = useState(false);
  const [originalPlaylist, setOriginalPlaylist] = useState<Song[]>([]);

  // Update progress based on audio currentTime
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateProgress = () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          const progressPercent = (audio.currentTime / audio.duration) * 100;
          setProgress(progressPercent);
        }
      };
      audio.addEventListener('timeupdate', updateProgress);

      // Handle song end based on repeat mode
      const handleEnded = () => {
        if (repeatMode === 'one') {
          audio.currentTime = 0;
          audio.play().catch((err) => console.error('Replay failed:', err));
        } else if (repeatMode === 'all' && currentSongIndex !== null && nowPlaying.length > 0) {
          const nextIndex = (currentSongIndex + 1) % nowPlaying.length;
          setCurrentSongIndex(nextIndex);
        } else if (repeatMode === 'none' && currentSongIndex !== null && currentSongIndex === nowPlaying.length - 1) {
          setIsPlaying(false);
          audio.pause();
        }
      };
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioRef, currentSongIndex, nowPlaying, repeatMode, setCurrentSongIndex, setIsPlaying]);

  // Handle click on timeline to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * (audioRef.current?.duration || 0);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Handle dragging for more precise control
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1 && audioRef.current) {
      const timeline = e.currentTarget;
      const rect = timeline.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * (audioRef.current.duration || 0);
      audioRef.current.currentTime = Math.max(0, Math.min(newTime, audioRef.current.duration));
    }
  };

  // Cycle repeat mode
  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      switch (prev) {
        case 'none':
          return 'all';
        case 'all':
          return 'one';
        case 'one':
          return 'none';
        default:
          return 'none';
      }
    });
  };

  // Toggle shuffle and manage playlist order
  const toggleShuffle = () => {
    if (!isShuffled) {
      setOriginalPlaylist([...nowPlaying]);
      const shuffled = [...nowPlaying].sort(() => Math.random() - 0.5);
      if (currentSongIndex !== null && nowPlaying[currentSongIndex]) {
        const currentSong = nowPlaying[currentSongIndex];
        shuffled.sort((a) => (a.id === currentSong.id ? -1 : 0));
      }
      setNowPlaying(shuffled);
      if (currentSongIndex !== null) {
        const newIndex = shuffled.findIndex((song) => song.id === nowPlaying[currentSongIndex]?.id);
        setCurrentSongIndex(newIndex !== -1 ? newIndex : 0);
      } else {
        setCurrentSongIndex(0);
      }
      setIsShuffled(true);
    } else {
      setNowPlaying([...originalPlaylist]);
      if (currentSongIndex !== null) {
        const newIndex = originalPlaylist.findIndex((song) => song.id === nowPlaying[currentSongIndex]?.id);
        setCurrentSongIndex(newIndex !== -1 ? newIndex : 0);
      }
      setIsShuffled(false);
    }
  };

  return (
    <>
      {playerView !== 'hidden' && (
        <div
          className={`bg-gray-900 transition-all duration-300 ease-in-out ${playerView === 'fullview'
            ? 'fixed inset-0 z-50 w-full translate-x-0 scale-100 opacity-100  p-7 overflow-hidden overscroll-none'
            : playerLayout === 'side'
              ? 'w-80 border-l border-gray-800'
              : 'fixed bottom-0 left-0 right-0 h-20 border-t border-gray-800 z-40'
            }`}
        >
          {playerLayout === 'bottom' && playerView !== 'fullview' && (
            // Improved Bottom layout with controls accessible on hover
            <div className="flex items-center h-full px-4">
              {/* Album Artwork */}
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 mr-3 shadow-lg"
                style={{
                  backgroundImage:
                    currentSongIndex !== null && nowPlaying[currentSongIndex]?.coverPath
                      ? `url(${nowPlaying[currentSongIndex].coverPath})`
                      : null,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: currentSongIndex === null || !nowPlaying[currentSongIndex]?.coverPath
                    ? 'rgb(109, 40, 217)'
                    : undefined,
                }}
              ></div>

              {/* Song Info and Controls */}
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center justify-between">
                  {/* Song Title and Artist */}
                  <div className="min-w-0 mr-4">
                    <h3 className="text-sm font-bold truncate">
                      {currentSongIndex !== null && nowPlaying[currentSongIndex]
                        ? nowPlaying[currentSongIndex].title
                        : 'No Song'}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {currentSongIndex !== null && nowPlaying[currentSongIndex]
                        ? nowPlaying[currentSongIndex].artist || 'Unknown'
                        : ''}
                    </p>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex flex-1 justify-center items-center gap-3">
                    <button onClick={prevSong} className="p-1 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white">
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                    <button onClick={nextSong} className="p-1 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white">
                      <SkipForward size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{currentTime}</span>
                  <div
                    className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden relative cursor-pointer"
                    onClick={handleTimelineClick}
                    onMouseMove={handleMouseMove}
                  >
                    <div
                      className="h-full bg-purple-500 rounded-full absolute"
                      style={{ width: `${progress}%`, transition: isPlaying ? 'none' : 'width 0.3s' }}
                    >
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full absolute -right-1 top-1/2 transform -translate-y-1/2"
                        style={{ display: isPlaying || progress > 0 ? 'block' : 'none' }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{duration}</span>
                </div>
              </div>

              {/* Additional Controls */}
              <div className="flex items-center gap-2 mr-2">
                <button
                  onClick={cycleRepeatMode}
                  className={`p-1 rounded-full hover:bg-gray-800 ${repeatMode !== 'none' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                  title={`Repeat: ${repeatMode === 'none' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'}`}
                >
                  <Repeat size={16} />
                </button>
                <button
                  onClick={toggleShuffle}
                  className={`p-1 rounded-full hover:bg-gray-800 ${isShuffled ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                  title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                >
                  <Shuffle size={16} />
                </button>
              </div>

              {/* Layout Controls */}
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={togglePlayerLayout} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white">
                  <Layout size={16} />
                </button>
                <button onClick={togglePlayerView} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white">
                  <Maximize2 size={16} />
                </button>
                <button onClick={closePlayerView} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white">
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {(playerLayout === 'side' || playerView === 'fullview') && (
            <div className={`p-4 ${playerView === 'fullview' ? 'inline h-full mx-auto' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">

                  {playerView !== 'fullview' && (
                    <button onClick={togglePlayerLayout} className="p-1 rounded-full hover:bg-gray-800">
                      <Layout size={18} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={togglePlayerView} className="p-1 rounded-full hover:bg-gray-800">
                    {playerView === 'fullview' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  {playerView === 'fullview' && (
                    <button onClick={closePlayerView} className="p-1 rounded-full hover:bg-gray-800">
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {playerView === 'fullview' ? (
                // Fullview layout (updated with purple theme)
                <div className="flex flex-row items-center gap-6">
                  <div
                    className="w-72 h-72 rounded-2xl mb-4 flex-shrink-0 shadow-lg"
                    style={{
                      backgroundImage:
                        currentSongIndex !== null && nowPlaying[currentSongIndex]?.coverPath
                          ? `url(${nowPlaying[currentSongIndex].coverPath})`
                          : null,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: currentSongIndex === null || !nowPlaying[currentSongIndex]?.coverPath
                        ? 'rgb(109, 40, 217)'
                        : undefined,
                    }}
                  ></div>
                  <div className="flex-1">
                    <div className="text-left mb-4">
                      <h3 className="text-xl font-bold">
                        {currentSongIndex !== null && nowPlaying[currentSongIndex]
                          ? nowPlaying[currentSongIndex].title
                          : 'No Song'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {currentSongIndex !== null && nowPlaying[currentSongIndex]
                          ? nowPlaying[currentSongIndex].artist || 'Unknown'
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4">
                        <button onClick={prevSong} className="p-2 rounded-full hover:bg-gray-800">
                          <SkipBack size={20} />
                        </button>
                        <button
                          onClick={togglePlayPause}
                          className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                        >
                          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                        </button>
                        <button onClick={nextSong} className="p-2 rounded-full hover:bg-gray-800">
                          <SkipForward size={20} />
                        </button>
                      </div>
                      <div className="w-full flex items-center gap-2">
                        <span className="text-xs text-gray-400">{currentTime}</span>
                        <div
                          className="w-full h-1 bg-gray-700 rounded-full overflow-hidden relative cursor-pointer"
                          onClick={handleTimelineClick}
                          onMouseMove={handleMouseMove}
                        >
                          <div
                            className="h-full bg-purple-500 rounded-full absolute"
                            style={{ width: `${progress}%`, transition: isPlaying ? 'none' : 'width 0.3s' }}
                          >
                            <div
                              className="w-3 h-3 bg-purple-400 rounded-full absolute -right-1.5 top-1/2 transform -translate-y-1/2 shadow-md"
                              style={{ display: isPlaying || progress > 0 ? 'block' : 'none' }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{duration}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={cycleRepeatMode}
                          className={`p-1 rounded-full hover:bg-gray-800 ${repeatMode !== 'none' ? 'text-blue-400' : ''}`}
                          title={`Repeat: ${repeatMode === 'none' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'}`}
                        >
                          <Repeat size={18} />
                        </button>
                        <button
                          onClick={toggleShuffle}
                          className={`p-1 rounded-full hover:bg-gray-800 ${isShuffled ? 'text-purple-400' : ''}`}
                          title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                        >
                          <Shuffle size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-md font-bold mb-2">
                        {currentSongIndex !== null && nowPlaying[currentSongIndex]
                          ? `Album: ${nowPlaying[currentSongIndex].album || 'Unknown'}`
                          : ''}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {currentSongIndex !== null && nowPlaying[currentSongIndex] ? `Released: Unknown` : ''}
                      </p>
                      <p className="text-sm text-gray-300 mt-4">
                        {currentSongIndex !== null && nowPlaying[currentSongIndex]
                          ? `Details about ${nowPlaying[currentSongIndex].title}...`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ) : playerLayout === 'side' ? (
                // Side layout (updated with purple theme)
                <div className="flex flex-col items-center">
                  <div
                    className="w-full aspect-square mb-4 flex-shrink-0 rounded-lg shadow-lg"
                    style={{
                      backgroundImage:
                        currentSongIndex !== null && nowPlaying[currentSongIndex]?.coverPath
                          ? `url(${nowPlaying[currentSongIndex].coverPath})`
                          : null,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: currentSongIndex === null || !nowPlaying[currentSongIndex]?.coverPath
                        ? 'rgb(109, 40, 217)'
                        : undefined,
                    }}
                  ></div>
                  <div className="w-full">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">
                        {currentSongIndex !== null && nowPlaying[currentSongIndex]
                          ? nowPlaying[currentSongIndex].title
                          : 'No Song'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {currentSongIndex !== null && nowPlaying[currentSongIndex]
                          ? nowPlaying[currentSongIndex].artist || 'Unknown'
                          : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4">
                        <button onClick={prevSong} className="p-2 rounded-full hover:bg-gray-800">
                          <SkipBack size={20} />
                        </button>
                        <button
                          onClick={togglePlayPause}
                          className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                        >
                          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                        </button>
                        <button onClick={nextSong} className="p-2 rounded-full hover:bg-gray-800">
                          <SkipForward size={20} />
                        </button>
                      </div>
                      <div className="w-full flex items-center gap-2">
                        <span className="text-xs text-gray-400">{currentTime}</span>
                        <div
                          className="w-full h-1 bg-gray-700 rounded-full overflow-hidden relative cursor-pointer"
                          onClick={handleTimelineClick}
                          onMouseMove={handleMouseMove}
                        >
                          <div
                            className="h-full bg-purple-500 rounded-full absolute"
                            style={{ width: `${progress}%`, transition: isPlaying ? 'none' : 'width 0.3s' }}
                          >
                            <div
                              className="w-3 h-3 bg-purple-400 rounded-full absolute -right-1.5 top-1/2 transform -translate-y-1/2 shadow-md"
                              style={{ display: isPlaying || progress > 0 ? 'block' : 'none' }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{duration}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={cycleRepeatMode}
                          className={`p-1 rounded-full hover:bg-gray-800 ${repeatMode !== 'none' ? 'text-blue-400' : ''}`}
                          title={`Repeat: ${repeatMode === 'none' ? 'Off' : repeatMode === 'all' ? 'All' : 'One'}`}
                        >
                          <Repeat size={18} />
                        </button>
                        <button
                          onClick={toggleShuffle}
                          className={`p-1 rounded-full hover:bg-gray-800 ${isShuffled ? 'text-purple-400' : ''}`}
                          title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                        >
                          <Shuffle size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Queue Section (hidden in bottom mode) */}
              {(playerView === 'fullview' || playerLayout === 'side') && (
                <div className="block mt-8 overflow-auto">
                  <h3 className="text-md font-bold mb-2">Your Queue</h3>
                  <div
                    className={`space-y-2 ${playerView === 'fullview' ? 'grid grid-cols-2 gap-2 space-y-0' : ''} overflow-y-scroll no-scrollbar`}
                    style={{
                      maxHeight: playerView === 'fullview' ? '300px' : '200px',
                      overflowX: 'hidden',
                    }}
                  >
                    {nowPlaying.map((song, index) => {
                      const isNowPlaying =
                        currentSongIndex !== null &&
                        nowPlaying.length > 0 &&
                        currentSongIndex < nowPlaying.length &&
                        nowPlaying[currentSongIndex]?.id === song.id;
                      return (
                        <div
                          key={index}
                          className={`flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer ${isNowPlaying ? 'bg-gray-700 border-l-4 border-l-purple-500' : ''
                            }`}
                          onClick={() => {
                            setCurrentSongIndex(index);
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-md mr-2"
                            style={{
                              backgroundImage: song.coverPath ? `url(${song.coverPath})` : null,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: !song.coverPath ? 'rgb(109, 40, 217)' : undefined,
                            }}
                          ></div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium">{song.title}</p>
                            <p className="text-xs text-gray-400">{song.artist || 'Unknown'}</p>
                          </div>
                          <div className={!isNowPlaying ? `opacity-0 group-hover:opacity-100` : 'relative'}>
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PlayerPanel;
