import React, { useState } from 'react';
import { Settings, Home, Search, ChevronLeft, ChevronRight, Play, Pause, SkipForward, SkipBack, Maximize2, Minimize2, X, Volume2, Music } from 'lucide-react';

const MusicPlayer = () => {
  const [playerView, setPlayerView] = useState('sideview'); // 'hidden', 'sideview', 'fullview'
  const [viewMode, setViewMode] = useState('featured'); // 'featured' or 'library'

  const togglePlayerView = () => {
    const views = ['sideview', 'fullview'];
    const currentIndex = views.indexOf(playerView);
    const nextIndex = (currentIndex + 1) % views.length;
    setPlayerView(views[nextIndex]);
  };

  const closePlayerView = () => {
    setPlayerView('hidden');
  };

  // Sample songs data (unchanged)
  const songs = [
    { id: 1, title: "Wrecked", genre: "Alternative Rock", artist: "Imagine Dragons", album: "Mercury - Act 1", time: "3:45", current: true },
    { id: 2, title: "Dusk Till Dawn", genre: "Pop", artist: "ZAYN ft. Sia", album: "Icarus Falls", time: "4:27", current: false },
    { id: 3, title: "Believer", genre: "Pop Rock", artist: "Imagine Dragons", album: "Evolve", time: "3:24", current: false },
    { id: 4, title: "Radiohead", genre: "Alternative", artist: "Creep", album: "Pablo Honey", time: "3:56", current: false },
    { id: 5, title: "Hope Never Dies", genre: "Electronic", artist: "Odesza", album: "A Moment Apart", time: "4:12", current: false },
    { id: 6, title: "Thunder", genre: "Pop Rock", artist: "Imagine Dragons", album: "Evolve", time: "3:07", current: false },
    { id: 7, title: "Jolly Mix", genre: "Pop", artist: "Various Artists", album: "Compilation", time: "4:30", current: false },
    { id: 8, title: "I Love You", genre: "Indie Pop", artist: "Billie Eilish", album: "When We All Fall Asleep", time: "4:52", current: false },
    { id: 9, title: "A Theater", genre: "Classical", artist: "Charles Cassic", album: "Nocturnes", time: "5:18", current: false },
    { id: 10, title: "Red Mirror Master", genre: "Indie Rock", artist: "Imagination Riders", album: "Reflections", time: "3:22", current: false },
    { id: 11, title: "What What What", genre: "Alternative", artist: "Questioners", album: "Inquiries", time: "2:58", current: false },
    { id: 12, title: "Radioactive", genre: "Pop Rock", artist: "Imagine Dragons", album: "Night Visions", time: "3:07", current: false },
    { id: 13, title: "Demons", genre: "Pop Rock", artist: "Imagine Dragons", album: "Night Visions", time: "2:57", current: false },
    { id: 14, title: "On Top of the World", genre: "Pop Rock", artist: "Imagine Dragons", album: "Night Visions", time: "3:12", current: false },
    { id: 15, title: "It's Time", genre: "Pop Rock", artist: "Imagine Dragons", album: "Night Visions", time: "4:00", current: false },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Left Sidebar (unchanged) */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4">
        <div className="mb-8">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-xs font-bold">JD</span>
          </div>
        </div>
        <div className="mt-auto">
          <button className="p-2 rounded-lg hover:bg-gray-800">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${playerView === 'fullview' ? 'opacity-0 pointer-events-none' : 'flex flex-col opacity-100'}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">Home</h1>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-lg ${viewMode === 'featured' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
              onClick={() => setViewMode('featured')}
            >
              Featured
            </button>
            <button
              className={`px-3 py-1 rounded-lg ${viewMode === 'library' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
              onClick={() => setViewMode('library')}
            >
              Library
            </button>
            {playerView === 'hidden' && (
              <button
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
                onClick={() => setPlayerView('sideview')}
              >
                <Music size={14} />
                <span>Player</span>
              </button>
            )}
            <button className="p-1 rounded-full hover:bg-gray-800">
              <ChevronLeft size={18} />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-800">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Content Area (unchanged) */}
        <div className="p-4 flex-1 overflow-hidden">
          {viewMode === 'featured' ? (
            <>
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600">
                    <p className="text-sm">The Best of</p>
                    <h2 className="text-xl font-bold">Mercury: Act 1</h2>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-400 to-yellow-400">
                    <p className="text-sm">Playlist</p>
                    <h2 className="text-xl font-bold">Music of the Spheres</h2>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                    <p className="text-sm">This Week</p>
                    <h2 className="text-xl font-bold">The Blaze</h2>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3">Recently Played</h2>
                <div className="grid grid-cols-5 gap-4">
                  {['Wrecked', 'Dusk', 'Believer', 'Radiohead', 'Hope Never Dies'].map((title, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 mb-2"></div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-gray-400">Imagine Dragons</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3">Your Lovely Playlist</h2>
                <div className="space-y-2">
                  {[
                    { title: 'Jolly Mix', artist: 'Various Artists', cover: 'bg-blue-500' },
                    { title: 'I love You', artist: 'Billie Eilish', cover: 'bg-purple-500' },
                    { title: 'A Theater', artist: 'Charles Cassic', cover: 'bg-red-500' },
                    { title: 'Red Mirror Master', artist: 'Imagination Riders', cover: 'bg-orange-500' },
                    { title: 'What What what', artist: 'Questioners', cover: 'bg-green-500' },
                  ].map((song, index) => (
                    <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-800">
                      <div className={`w-10 h-10 rounded-md ${song.cover} mr-3 flex items-center justify-center`}>
                        <Play size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{song.title}</p>
                        <p className="text-xs text-gray-400">{song.artist}</p>
                      </div>
                      <div className="text-xs text-gray-400">3:45</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs">
              <div className="flex bg-gray-700 px-2 py-1 text-xs font-medium">
                <div className="w-8 text-center">
                  <Volume2 size={12} />
                </div>
                <div className="w-8">Track</div>
                <div className="w-1/3">Title</div>
                <div className="w-1/6">Genre</div>
                <div className="w-1/6">Artist</div>
                <div className="w-1/6">Album</div>
                <div className="w-16">Time</div>
              </div>
              <div className="overflow-auto" style={{ height: 'calc(100vh - 220px)' }}>
                {songs.map((song, index) => (
                  <div
                    key={index}
                    className={`flex px-2 py-1 text-xs hover:bg-gray-700 ${song.current ? 'bg-gray-700' : ''}`}
                  >
                    <div className="w-8 text-center">
                      {song.current && <Play size={12} />}
                    </div>
                    <div className="w-8">{song.id}</div>
                    <div className="w-1/3">{song.title}</div>
                    <div className="w-1/6">{song.genre}</div>
                    <div className="w-1/6">{song.artist}</div>
                    <div className="w-1/6">{song.album}</div>
                    <div className="w-16">{song.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player Section with Transitions */}
      {playerView !== 'hidden' && (
        <div
          className={`bg-gray-900 border-l border-gray-800 transition-all duration-300 ease-in-out
            ${playerView === 'sideview' ? 'w-80 translate-x-0 opacity-100' : 'fixed inset-0 z-50 w-full translate-x-0 scale-100 opacity-100'}
            ${playerView === 'hidden' ? 'translate-x-full opacity-0' : ''}`}
        >
          <div className={`p-4 ${playerView === 'fullview' ? ' mx-auto' : ''}`}>
            <div className={`flex justify-between items-center mb-4`}>
              <h2 className="text-lg font-bold">Now Playing</h2>
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

            <div className={`flex ${playerView === 'fullview' ? 'flex-row gap-8 items-start' : 'flex-col items-center'}`}>
              <div className={`${playerView === 'fullview' ? 'w-64 h-64' : 'w-full aspect-square'} rounded-lg bg-gradient-to-br from-red-500 to-purple-600 mb-4 flex-shrink-0`}></div>
              <div className={`${playerView === 'fullview' ? 'flex-1' : 'w-full'}`}>
                <h3 className="text-lg font-bold">Wrecked</h3>
                <p className="text-sm text-gray-400 mb-4">Imagine Dragons</p>
                <div className="w-full mt-2">
                  <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-white rounded-full"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1:15</span>
                    <span>3:45</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button className="p-2 rounded-full hover:bg-gray-800">
                    <SkipBack size={20} />
                  </button>
                  <button className="p-3 rounded-full bg-white text-gray-900 hover:bg-gray-200">
                    <Pause size={24} />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-800">
                    <SkipForward size={20} />
                  </button>
                </div>
                {playerView === 'fullview' && (
                  <div className="mt-8">
                    <h3 className="text-md font-bold mb-2">Album: Mercury - Act 1</h3>
                    <p className="text-sm text-gray-400">Released: September 3, 2021</p>
                    <p className="text-sm text-gray-300 mt-4">
                      Mercury – Act 1 is the fifth studio album by American pop rock band Imagine Dragons,
                      released on September 3, 2021, through Kidinakorner and Interscope Records.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-md font-bold mb-2">Your Queue</h3>
              <div className={`space-y-2 overflow-auto`}>
                {['Dusk', 'Believer', 'Thunder', 'Demons'].map((title, index) => (
                  <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-800">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 mr-2"></div>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-gray-400">Imagine Dragons</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MusicPlayer;
