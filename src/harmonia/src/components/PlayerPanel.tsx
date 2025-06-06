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
  Layout,
  ListMusic,
  ChevronLeft,
} from 'lucide-react';
import { Song } from 'src/types/song';

interface PlayerPanelProps {
  togglePlayerView: () => void;
  togglePlayerLayout: () => void;
  playerLayout: 'side' | 'bottom';
  togglePlayPause: () => void;
  prevSong: () => void;
  nextSong: () => void;
  setCurrentSongIndex: (index: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  playerView: 'hidden' | 'sideview' | 'fullview';
  repeatMode: 'none' | 'all' | 'one';
  duration: string;
  currentTime: string;
  isPlaying: boolean;
  currentSongIndex: number | null;
  nowPlaying: Song[];
  setNowPlaying: Dispatch<SetStateAction<Song[]>>;
  setIsPlaying: (isPlaying: boolean) => void;
  setOriginalPlaylist: Dispatch<SetStateAction<Song[]>>;
  setRepeatMode: Dispatch<SetStateAction<'none' | 'all' | 'one'>>;
  originalPlaylist: Song[];
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
  // setOriginalPlaylist,
  repeatMode,
  setRepeatMode,
  originalPlaylist,
}) => {
  const [progress, setProgress] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  useEffect(() => {
    if(playerView !== 'fullview' && playerLayout === 'side') setShowPlaylist(true);
  }, [playerView, playerLayout]);


  // useEffect(() => {
  //   if (!isShuffled) {
  //     setOriginalPlaylist([...nowPlaying]);
  //   }
  //   if (nowPlaying.length <= 1 && isShuffled) {
  //     setIsShuffled(false);
  //   }
  // }, [nowPlaying, isShuffled]);

  useEffect(() => {
    const currentSong = currentSongIndex !== null ? nowPlaying[currentSongIndex] : null;

    if (isShuffled) {
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

      const handleEnded = () => {
        // if (repeatMode === 'one') {
        //   audio.currentTime = 0;
        //   audio.play().catch((err) => console.error('Replay failed:', err));
        // } else if (repeatMode === 'all' && currentSongIndex !== null && nowPlaying.length > 0) {
        //   const nextIndex = (currentSongIndex + 1) % nowPlaying.length;
        //   setCurrentSongIndex(nextIndex);
        // } else if (repeatMode === 'none') {
        //   if (currentSongIndex !== null && currentSongIndex < nowPlaying.length - 1) {
        //     setCurrentSongIndex(currentSongIndex + 1);
        //   } else {
        //     setIsPlaying(false);
        //   }
        // }
      };

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', handleEnded);
      updateProgress();

      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('ended', handleEnded);
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
      const currentSong = currentSongIndex !== null ? nowPlaying[currentSongIndex] : null;

      if (!prevIsShuffled) {
        const newNowPlaying = [...nowPlaying].sort(() => Math.random() - 0.5);
        let newIndex = 0;

        setNowPlaying(newNowPlaying);
        setCurrentSongIndex(newIndex);
        return true;
      } else {
        setNowPlaying([...originalPlaylist]);
        // const newIndex = originalPlaylist.findIndex((song) => song.id === currentSong?.id);
        setCurrentSongIndex(0);
        return false;
      }
    });
  };

  const currentSong = currentSongIndex !== null ? nowPlaying[currentSongIndex] : null;

  const renderBottomView = () => (
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
              onClick={() => nextSong()}
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
                className={`w-2.5 h-2.5 bg-white rounded-full absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${(isPlaying || progress > 0) ? 'opacity-100' : ''}`}
              />
            </div>
          </div>
          <span className="text-xs text-gray-400 w-8 text-center">{duration}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mr-2">
        <button
          onClick={cycleRepeatMode}
          className={`p-1 rounded-full hover:bg-gray-800 ${repeatMode !== 'none' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
          title={`Repeat: ${repeatMode}`}
        >
          {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
        </button>
        <button
          onClick={toggleShuffle}
          className={`p-1 rounded-full hover:bg-gray-800 ${isShuffled ? 'text-purple-400' : 'text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
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
          onClick={fullscreenToggle} 
          className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );

  const renderPlaylist = () => (
    <div className="flex flex-col h-full">
     
      {showPlaylist && (
        <>
         <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-md font-bold">Up Next</h3>
      </div>
        <div className="overflow-x-hidden overscroll-x-none overflow-y-auto custom-scrollbar space-y-1 pr-1 w-full">
          {nowPlaying.length > 0 ? (
            nowPlaying.map((song, index) => {
              const isCurrent = index === currentSongIndex;
              return (
                <div
                  key={`${song.id}-${index}`}
                  className={`group flex items-center p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors w-full ${isCurrent ? 'bg-gray-700/50 border-l-2 border-l-purple-500' : ''}`}
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
                  <div className="flex-grow min-w-0 max-w-[calc(100%-60px)]">
                    <p className={`text-sm font-medium truncate ${isCurrent ? 'text-purple-300' : ''}`}>
                      {song.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{song.artist || 'Unknown'}</p>
                  </div>
                  <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${!isCurrent ? 'opacity-0 group-hover:opacity-100' : ''}`}>
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
            })
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Queue is empty
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );

  const renderSideView = () => (
    <div className="flex flex-col h-full p-4">
      <div className="flex justify-between items-center mb-2">
        <button onClick={togglePlayerLayout} className="p-1 rounded-full hover:bg-gray-800">
          <Layout size={18} />
        </button>
        <button onClick={() => {
            togglePlayerView();
            if (playerView === 'fullview') document.body.requestFullscreen();
    else document.exitFullscreen();
          }}  className="p-1 rounded-full hover:bg-gray-800">
          <Maximize2 size={18} />
        </button>
      </div>
      <div className="flex flex-col items-center flex-1 min-h-0">
        <div className="w-full flex flex-col items-center flex-shrink-0">
          <div
            className="w-full max-w-xs aspect-square rounded-lg shadow-lg mb-2 bg-purple-800"
            style={{
              backgroundImage: currentSong?.coverPath ? `url(${currentSong.coverPath})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className="w-full text-center">
            <h3 className="text-base font-bold truncate">
              {currentSong ? currentSong.title : 'No Song'}
            </h3>
            <p className="text-xs text-gray-400 truncate mb-2">
              {currentSong ? currentSong.artist || 'Unknown' : ''}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={prevSong}
                className="p-1 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={nowPlaying.length <= 1}
              >
                <SkipBack size={16} />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={nowPlaying.length === 0}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button
                onClick={() => nextSong()}
                className="p-1 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={nowPlaying.length <= 1}
              >
                <SkipForward size={16} />
              </button>
            </div>
            <div className="w-full flex items-center gap-2">
              <span className="text-[0.65rem] text-gray-400 w-6 text-center">{currentTime}</span>
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
                    className={`w-2 h-2 bg-white rounded-full absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${(isPlaying || progress > 0) ? 'opacity-100' : ''}`}
                  />
                </div>
              </div>
              <span className="text-[0.65rem] text-gray-400 w-6 text-center">{duration}</span>
            </div>
            <div className="flex gap-3 mt-1">
              <button
                onClick={cycleRepeatMode}
                className={`p-1 rounded-full hover:bg-gray-800 ${repeatMode !== 'none' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
              <button
                onClick={toggleShuffle}
                className={`p-1 rounded-full hover:bg-gray-800 ${isShuffled ? 'text-purple-400' : 'text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                disabled={nowPlaying.length <= 1}
              >
                <Shuffle size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 w-full mt-6">
          {renderPlaylist()}
        </div>
      </div>
    </div>
  );

  const renderFullView = () => (
    <div className="flex flex-col h-full px-0 sm:px-2">
      <div className="flex justify-between items-center mb-2 sm:mb-4 flex-shrink-0 px-4 sm:px-0">
        <div className="flex items-center gap-2">
          <button onClick={togglePlayerLayout} className="p-1 rounded-full hover:bg-gray-800">
            <Layout size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={fullscreenToggle} className="p-1 rounded-full hover:bg-gray-800">
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-y-auto justify-center flex-col sm:flex-row gap-2 sm:gap-8 px-2 sm:px-4 py-0 sm:py-2">
        <div className="flex flex-col flex-grow items-center justify-center sm:max-w-3xl sm:flex-shrink-0 overscroll-none overflow-hidden">
          <div
            className="aspect-square rounded-lg shadow-lg mb-2 sm:mb-4 bg-purple-800 w-full overscroll-none overflow-hidden max-w-[24rem] sm:max-w-2xl"
            style={{
              backgroundImage: currentSong?.coverPath ? `url(${currentSong.coverPath})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className="w-full text-center sm:text-left">
            <h3 className="text-base sm:text-2xl font-bold truncate">
              {currentSong ? currentSong.title : 'No Song'}
            </h3>
            <p className="text-xs sm:text-base text-gray-400 truncate mb-2 sm:mb-4">
              {currentSong ? currentSong.artist || 'Unknown' : ''}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-full max-w-[24rem] sm:max-w-2xl mx-auto">
            <div className="flex items-center gap-4 sm:gap-5">
              <button
                onClick={prevSong}
                className="p-1 sm:p-2 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={nowPlaying.length <= 1}
              >
                <SkipBack size={16} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-2 sm:p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={nowPlaying.length === 0}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" className="sm:w-8 sm:h-8" /> : <Play size={24} fill="currentColor" className="ml-0.5 sm:w-8 sm:h-8" />}
              </button>
              <button
                onClick={() => nextSong()}
                className="p-1 sm:p-2 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={nowPlaying.length <= 1}
              >
                <SkipForward size={16} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="w-full flex items-center gap-2">
              <span className="text-[0.65rem] sm:text-sm text-gray-400 w-8 sm:w-12 text-center">{currentTime}</span>
              <div
                className="flex-1 h-1 sm:h-1.5 bg-gray-700 rounded-full relative cursor-pointer group"
                onClick={handleTimelineClick}
                onMouseMove={handleMouseMove}
              >
                <div
                  className="h-full bg-purple-500 rounded-full absolute"
                  style={{ width: `${progress}%` }}
                >
                  <div
                    className={`w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${(isPlaying || progress > 0) ? 'opacity-100' : ''}`}
                  />
                </div>
              </div>
              <span className="text-[0.65rem] sm:text-sm text-gray-400 w-8 sm:w-12 text-center">{duration}</span>
            </div>
            <div className="flex gap-3 sm:gap-4 mt-1 sm:mt-2">
              <button
                onClick={cycleRepeatMode}
                className={`p-1 rounded-full hover:bg-gray-800 ${repeatMode !== 'none' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 size={16} className="sm:w-5 sm:h-5" /> : <Repeat size={16} className="sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={toggleShuffle}
                className={`p-1 rounded-full hover:bg-gray-800 ${isShuffled ? 'text-purple-400' : 'text-gray-400 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                disabled={nowPlaying.length <= 1}
              >
                <Shuffle size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className={`p-1 rounded-full hover:bg-gray-800 ${showPlaylist ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                title={`Playlist: ${showPlaylist ? 'Show' : 'Hide'}`}
              >
                <ListMusic size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className={`hidden sm:flex sm:flex-col ${showPlaylist ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out`}>
          {renderPlaylist()}
        </div>
      </div>
    </div>
  );
  function fullscreenToggle(){
    togglePlayerView();
    if (playerView === 'fullview' && document.fullscreenElement) document.body.requestFullscreen();
    else document.exitFullscreen();
  }


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
          {playerLayout === 'bottom' && playerView !== 'fullview' && renderBottomView()}
          {(playerLayout === 'side' || playerView === 'fullview') && (
            playerView === 'fullview' ? renderFullView() : renderSideView()
          )}
        </div>
      )}
    </>
  );
};

export default PlayerPanel;


