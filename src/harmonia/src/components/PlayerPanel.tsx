// src/harmonia/src/components/PlayerPanel.tsx
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import {
  Maximize2,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  X,
  Layout,
  MinimizeIcon,
} from 'lucide-react';
import { Song } from 'src/types/song';

interface PlayerPanelProps {
  playerLayout: 'side' | 'bottom';
  playerView: 'hidden' | 'sideview' | 'fullview';
  repeatMode: 'none' | 'all' | 'one';
  duration: string;
  currentTime: string;
  isPlaying: boolean;
  currentSongIndex: number | null;
  nowPlaying: Song[];
  originalPlaylist: Song[];
  audioRef: React.RefObject<HTMLAudioElement>;
  isShuffled: boolean;
  togglePlayerView: () => void;
  togglePlayerLayout: () => void;
  togglePlayPause: () => void;
  prevSong: () => void;
  nextSong: () => void;
  minimizeToTray: () => void;
  setCurrentSongIndex: (index: number) => void;
  setNowPlaying: Dispatch<SetStateAction<Song[]>>;
  setIsPlaying: (isPlaying: boolean) => void;
  setOriginalPlaylist: Dispatch<SetStateAction<Song[]>>;
  setIsShuffled: Dispatch<SetStateAction<boolean>>;
  setRepeatMode: Dispatch<SetStateAction<'none' | 'all' | 'one'>>;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  togglePlayerView,
  togglePlayerLayout,
  playerLayout,
  togglePlayPause,
  prevSong,
  nextSong,
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
  minimizeToTray,
  repeatMode,
  setRepeatMode,
  originalPlaylist,
  isShuffled, 
  setIsShuffled
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
      const currentSong = currentSongIndex !== null ? nowPlaying[currentSongIndex] : null;

      if(isShuffled)  {
        const otherSongs = nowPlaying.filter((_, index) => index !== currentSongIndex);
        const shuffledOthers = [...otherSongs].sort(() => Math.random() - 0.5);
        let newNowPlaying: Song[];
        let newIndex: number | null;

        if (currentSong) {
          newNowPlaying = [currentSong, ...shuffledOthers];
          newIndex = 0;
        } else {
          newNowPlaying = shuffledOthers;
          newIndex = newNowPlaying.length > 0 ? 0 : null;
        }

        setNowPlaying(newNowPlaying);
        setCurrentSongIndex(newIndex);
      } else {
        setNowPlaying([...originalPlaylist]);
        const newIndex = originalPlaylist.findIndex((song) => song.id === currentSong?.id);
        setCurrentSongIndex(newIndex !== -1 ? newIndex : (originalPlaylist.length > 0 ? 0 : null));
      }
  }, [originalPlaylist]);

  useEffect(() => {
    const audio = audioRef.current;
    console.log(currentSong)
    if (audio) {
      const updateProgress = () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          setProgress((audio.currentTime / audio.duration) * 100);
        } else {
          setProgress(0);
        }
      };

      audio.addEventListener('timeupdate', updateProgress);
      updateProgress();

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
      };
    }
  }, [audioRef, currentSongIndex, nowPlaying.length, repeatMode, setCurrentSongIndex, setIsPlaying]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || isNaN(audio.duration) || audio.duration <= 0) return;

    const timeline = e.currentTarget;
    const rect = timeline.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * audio.duration;
    audio.currentTime = Math.max(0, Math.min(newTime, audio.duration));
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (e.buttons === 1 && audio && !isNaN(audio.duration) && audio.duration > 0) {
      const timeline = e.currentTarget;
      const rect = timeline.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const width = rect.width;
      const newTime = (clickX / width) * audio.duration;
      audio.currentTime = newTime;
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      switch (prev) {
        case 'none': return 'all';
        case 'all': return 'one';
        case 'one': return 'none';
      }
    });
  };

  const toggleShuffle = () => {
    if (nowPlaying.length <= 1) return;

    setIsShuffled((prevIsShuffled) => {
      if (!prevIsShuffled) {
        const newNowPlaying = [...nowPlaying].sort(() => Math.random() - 0.5);
         let  newIndex = 0;

        setNowPlaying(newNowPlaying);
        setCurrentSongIndex(newIndex);
        return true;
      } else {
        setNowPlaying([...originalPlaylist]);
        setCurrentSongIndex(0);
        return false;
      }
    });
  };

  const currentSong = currentSongIndex !== null ? nowPlaying[currentSongIndex] : null;

  return (
    <>
      {playerView !== 'hidden' && (
        <div
          className={`bg-gray-900 transition-all duration-300 ease-in-out flex ${
            playerView === 'fullview'
              ? 'fixed inset-0 z-50 w-full h-full p-4 sm:p-6 flex-col overscroll-none'
              : playerLayout === 'side'
              ? 'w-80 border-l border-gray-800 flex-col'
              : 'fixed bottom-0 left-0 right-0 h-20 border-t border-gray-800 z-40 items-center'
          }`}
        >
          {playerLayout === 'bottom' && playerView !== 'fullview' && (
            <div className="flex items-center h-full px-4 w-full">
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 mr-3 shadow-lg bg-purple-800"
                onClick={togglePlayerView}
                style={{
                  backgroundImage: currentSong?.coverPath ? `url(${currentSong.coverPath})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              ></div>
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 mr-4">
                    <h3 className="text-sm font-bold truncate">
                      {currentSong ? currentSong.title : 'No Song'}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {currentSong ? currentSong.artist || 'Unknown' : ''}
                    </p>
                  </div>
                  <div className="flex flex-1 justify-center items-center gap-3">
                    <button
                      onClick={prevSong}
                      className="p-1 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={nowPlaying.length <= 1}
                    >
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={nowPlaying.length === 0}
                    >
                      {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button
                      onClick={nextSong}
                      className="p-1 rounded-full hover:bg-gray-800 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={nowPlaying.length <= 1}
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 w-8 text-center">{currentTime}</span>
                  <div
                    className="flex-1 h-1 bg-gray-700 rounded-full relative cursor-pointer group"
                    onClick={handleTimelineClick}
                    onMouseMove={handleMouseMove}
                  >
                    <div
                      className="h-full bg-purple-500 rounded-full absolute"
                      style={{ width: `${progress}%` }}
                    >
                      <div
                        className={`w-2.5 h-2.5 bg-white rounded-full absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                          (isPlaying || progress > 0) ? 'opacity-100' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-center">{duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mr-2">
                <button
                  onClick={cycleRepeatMode}
                  className={`p-1 rounded-full hover:bg-gray-800 ${
                    repeatMode !== 'none' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
                <button
                  onClick={toggleShuffle}
                  className={`p-1 rounded-full hover:bg-gray-800 ${
                    isShuffled ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                  disabled={nowPlaying.length <= 1}
                >
                  <Shuffle size={16} />
                </button>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={togglePlayerLayout}
                  className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <Layout size={16} />
                </button>
                <button
                  onClick={togglePlayerView}
                  title='Toggle View mode'
                  className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <Maximize2 size={16} />
                </button>
                <button 
                  onClick={minimizeToTray}
                  className="p-2 rounded-full hover:bg-gray-700"
                  title="Minimize to Tray"
                >
                  <MinimizeIcon size={18} />
                </button>
              </div>
            </div>
          )}

          {(playerLayout === 'side' || playerView === 'fullview') && (
            <div className={`flex flex-col h-full overscroll-none ${playerLayout === 'side' ? 'p-4' : 'px-0 sm:px-2'}`}>
              <div className="flex justify-between items-center mb-2 sm:mb-4 flex-shrink-0 px-4 sm:px-0">
                <div className="flex items-center gap-2">
                  {playerView !== 'fullview' && (
                    <button onClick={togglePlayerLayout} className="p-1 rounded-full hover:bg-gray-800">
                      <Layout size={18} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={togglePlayerView} title='Toggle View mode' className="p-1 rounded-full hover:bg-gray-800">
                    {playerView === 'fullview' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                  <button 
                    onClick={minimizeToTray}
                    className="p-2 rounded-full hover:bg-gray-700"
                    title="Minimize to Tray"
                  >
                    <MinimizeIcon size={18} />
                  </button>
                </div>
              </div>

              <div
                className={`flex flex-1 min-h-0 overflow-y-auto justify-center ${
                  playerView === 'fullview'
                    ? 'flex-col sm:flex-row gap-2 sm:gap-8 px-2 sm:px-4 py-0 sm:py-2'
                    : 'flex-col items-center'
                }`}
              >
                <div
                  className={`${
                    playerView === 'fullview'
                      ? 'flex flex-col items-center justify-center flex-1 sm:w-1/2 sm:max-w-lg sm:flex-shrink-0 overscroll-none overflow-hidden'
                      : 'w-full flex flex-col items-center flex-shrink-0'
                  }`}
                >
                  <div
                    className={`aspect-square rounded-lg shadow-lg mb-2 sm:mb-4 bg-purple-800 ${
                      playerView === 'fullview' ? 'w-full overscroll-none overflow-hidden max-w-[16rem] sm:max-w-md' : 'w-full max-w-xs'
                    }`}
                    style={{
                      backgroundImage: currentSong?.coverPath ? `url(${currentSong.coverPath})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  ></div>
                  <div className={`w-full ${playerView === 'fullview' ? 'text-center sm:text-left' : 'text-center'}`}>
                    <h3 className="text-base sm:text-xl font-bold truncate">
                      {currentSong ? currentSong.title : 'No Song'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate mb-2 sm:mb-4">
                      {currentSong ? currentSong.artist || 'Unknown' : ''}
                    </p>
                  </div>
                  <div className={`flex flex-col items-center gap-2 sm:gap-3 w-full ${playerView === 'fullview' ? 'max-w-[16rem] sm:max-w-sm mx-auto' : ''}`}>
                    <div className="flex items-center gap-4 sm:gap-5">
                      <button
                        onClick={prevSong}
                        className="p-1 sm:p-2 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={nowPlaying.length <= 1}
                      >
                        <SkipBack size={16} className="sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={togglePlayPause}
                        className="p-2 sm:p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={nowPlaying.length === 0}
                      >
                        {isPlaying ? <Pause size={20} fill="currentColor" className="sm:w-6 sm:h-6" /> : <Play size={20} fill="currentColor" className="ml-0.5 sm:w-6 sm:h-6" />}
                      </button>
                      <button
                        onClick={nextSong}
                        className="p-1 sm:p-2 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={nowPlaying.length <= 1}
                      >
                        <SkipForward size={16} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                    <div className="w-full flex items-center gap-2">
                      <span className="text-[0.65rem] sm:text-xs text-gray-400 w-6 sm:w-8 text-center">{currentTime}</span>
                      <div
                        className="flex-1 h-1 bg-gray-700 rounded-full relative cursor-pointer group"
                        onClick={handleTimelineClick}
                        onMouseMove={handleMouseMove}
                      >
                        <div
                          className="h-full bg-purple-500 rounded-full absolute"
                          style={{ width: `${progress}%` }}
                        >
                          <div
                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                              (isPlaying || progress > 0) ? 'opacity-100' : ''
                            }`}
                          />
                        </div>
                      </div>
                      <span className="text-[0.65rem] sm:text-xs text-gray-400 w-6 sm:w-8 text-center">{duration}</span>
                    </div>
                    <div className="flex gap-3 sm:gap-4 mt-1 sm:mt-2">
                      <button
                        onClick={cycleRepeatMode}
                        className={`p-1 rounded-full hover:bg-gray-800 ${
                          repeatMode !== 'none' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                        }`}
                        title={`Repeat: ${repeatMode}`}
                      >
                        {repeatMode === 'one' ? <Repeat1 size={16} className="sm:w-5 sm:h-5" /> : <Repeat size={16} className="sm:w-5 sm:h-5" />}
                      </button>
                      <button
                        onClick={toggleShuffle}
                        className={`p-1 rounded-full hover:bg-gray-800 ${
                          isShuffled ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                        disabled={nowPlaying.length <= 1}
                      >
                        <Shuffle size={16} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={`flex-1 min-h-0 overflow-hidden ${
                    playerView === 'fullview'
                      ? 'hidden sm:flex sm:flex-col'
                      : 'flex flex-col mt-6'
                  }`}
                >
                  <h3 className="text-md font-bold mb-2 flex-shrink-0 px-1">
                    {playerView === 'fullview' ? 'Up Next' : 'Your Queue'}
                  </h3>
                  {nowPlaying.length > 0 ? (
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                      {nowPlaying.map((song, index) => {
                        const isCurrent = index === currentSongIndex;
                        return (
                          <div
                            key={`${song.id}-${index}`}
                            className={`group flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors ${
                              isCurrent ? 'bg-gray-700/50 border-l-2 border-l-purple-500' : ''
                            }`}
                            onClick={() => setCurrentSongIndex(index)}
                          >
                            <div
                              className="w-8 h-8 rounded-md mr-2 flex-shrink-0 bg-purple-900/50"
                              style={{
                                backgroundImage: song.coverPath ? `url(${song.coverPath})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            ></div>
                            <div className="flex-grow min-w-0">
                              <p className={`text-sm font-medium truncate ${isCurrent ? 'text-purple-300' : ''}`}>
                                {song.title}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{song.artist || 'Unknown'}</p>
                            </div>
                            <div className={`w-5 h-5 flex items-center justify-center ${!isCurrent ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                              {isCurrent ? (
                                <span className="flex h-3 w-3 relative">
                                  <span className={`absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 ${isPlaying ? 'animate-ping' : ''}`}></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                </span>
                              ) : (
                                <Play size={14} className="text-gray-400" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                      Queue is empty
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PlayerPanel;