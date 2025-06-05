import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types/song';

export const useGlobalLibrary = (initialLibrary: Song[] = []) => {
  const [library, setLibrary] = useState<Song[]>(initialLibrary);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize with existing library if provided
  useEffect(() => {
    if (initialLibrary.length > 0 && !isInitialized) {
      setLibrary(initialLibrary);
      // Sync to global manager
      window.electronAPI?.updateGlobalLibrary(initialLibrary);
      setIsInitialized(true);
    }
  }, [initialLibrary, isInitialized]);

  // Listen for global library updates
  useEffect(() => {
    const handleLibraryUpdate = (updatedLibrary: Song[]) => {
      setLibrary(updatedLibrary);
    };

    window.electronAPI?.onLibraryUpdated(handleLibraryUpdate);

    return () => {
      window.electronAPI?.removeLibraryUpdatedListener();
    };
  }, []);

  // Update library and sync to global
  const updateLibrary = useCallback(async (newLibrary: Song[]) => {
    setLibrary(newLibrary);
    await window.electronAPI?.updateGlobalLibrary(newLibrary);
  }, []);

  // Get current global library
  const refreshLibrary = useCallback(async () => {
    const globalLibrary = await window.electronAPI?.getGlobalLibrary();
    if (globalLibrary) {
      setLibrary(globalLibrary);
    }
  }, []);

  return {
    library,
    updateLibrary,
    refreshLibrary,
    setLibrary: updateLibrary // For backward compatibility
  };
};
