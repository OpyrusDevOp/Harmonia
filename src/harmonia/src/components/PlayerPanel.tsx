import React, { useState, useEffect } from 'react';
import { ChevronLeft, Maximize2, Minimize2, X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { Song } from 'src/types/song';

interface PlayerPanelProps {
  closePlayerView: () => void;
  togglePlayerView: () => void;
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
  currentSongIndex: number | null; // Updated to match your state type
  nowPlaying: Song[];
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  closePlayerView,
  togglePlayerView,
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
}) => {
  const [progress, setProgress] = useState(0); // Percentage of progress (0-100)

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
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
      };
    }
  }, [audioRef]);

  // Handle click on timeline to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left; // X position within the timeline
    const width = rect.width;
    const newTime = (clickX / width) * (audioRef.current?.duration || 0);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Optional: Handle dragging for more precise control (simplified)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1 && audioRef.current) { // Left mouse button held
      const timeline = e.currentTarget;
      const rect = timeline.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * (audioRef.current.duration || 0);
      audioRef.current.currentTime = Math.max(0, Math.min(newTime, audioRef.current.duration));
    }
  };

  return (
    <>
      {playerView !== 'hidden' && (
        <div
          className={`bg-gray-900 border-l border-gray-800 transition-all duration-300 ease-in-out
            ${playerView === 'sideview' ? 'w-80 translate-x-0 opacity-100' : 'fixed inset-0 z-50 w-full translate-x-0 scale-100 opacity-100'}`}
        >
          <div className={`p-4 ${playerView === 'fullview' ? 'inline h-full mx-auto' : ''}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <button onClick={closePlayerView} className="p-1 rounded-full hover:bg-gray-800">
                  <ChevronLeft size={18} />
                </button>
                <button className="p-1 rounded-full hover:bg-gray-800">•••</button>
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

            <div className={`flex ${playerView === 'fullview' ? 'flex-row items-center gap-6' : 'flex-col items-center'}`}>
              <div
                className={`${playerView === 'fullview' ? 'w-72 h-72 rounded-2xl' : 'w-full aspect-square'} mb-4 flex-shrink-0`}
                style={{
                  backgroundImage: currentSongIndex !== null && nowPlaying[currentSongIndex]?.coverPath
                    ? `url(${nowPlaying[currentSongIndex].coverPath})`
                    : null,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              ></div>
              <div className={`${playerView === 'fullview' ? 'flex-1' : 'w-full'}`}>
                <div className={`${playerView === 'fullview' ? 'text-left' : 'text-center'} mb-4`}>
                  <h3 className="text-xl font-bold">
                    {currentSongIndex !== null && nowPlaying[currentSongIndex] ? nowPlaying[currentSongIndex].title : 'No Song'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {currentSongIndex !== null && nowPlaying[currentSongIndex] ? nowPlaying[currentSongIndex].artist || 'Unknown' : ''}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4">
                    <button onClick={prevSong} className="p-2 rounded-full hover:bg-gray-800">
                      <SkipBack size={20} />
                    </button>
                    <button onClick={togglePlayPause} className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600">
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button onClick={nextSong} className="p-2 rounded-full hover:bg-gray-800">
                      <SkipForward size={20} />
                    </button>
                  </div>
                  <div className="w-full flex items-center gap-2">
                    <span className="text-xs text-gray-400">{currentTime}</span>
                    <div
                      className="w-full h-1 bg-gray-700 rounded-full overflow-hidden relative"
                      onClick={handleTimelineClick}
                      onMouseMove={handleMouseMove}
                    >
                      <div
                        className="h-full bg-blue-400 rounded-full absolute"
                        style={{ width: `${progress}%`, transition: isPlaying ? 'none' : 'width 0.3s' }}
                      >
                        <div
                          className="w-2 h-2 bg-blue-400 rounded-full absolute -right-1 top-1/2 transform -translate-y-1/2"
                          style={{ display: isPlaying || progress > 0 ? 'block' : 'none' }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{duration}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={replaySong} className="p-1 rounded-full hover:bg-gray-800">
                      <Repeat />
                    </button>
                    <button onClick={shuffleSongs} className="p-1 rounded-full hover:bg-gray-800">
                      <Shuffle />
                    </button>
                  </div>
                </div>
                {playerView === 'fullview' && (
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
                )}
              </div>
            </div>

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
                  const isNowPlaying = currentSongIndex !== null &&
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
                      <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 mr-2"></div>
                      <div className='flex-grow'>
                        <p className="text-sm font-medium">{song.title}</p>
                        <p className="text-xs text-gray-400">{song.artist || 'Unknown'}</p>
                      </div>
                      <div className={!isNowPlaying ? `opacity-0 group-hover:opacity-100` : 'relative'}>
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

                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerPanel;
