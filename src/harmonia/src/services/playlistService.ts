import Store from 'electron-store';
import Playlist from '../types/playlist';
import { Song } from '../types/song';

export class PlaylistService {
  private store = new Store();

  savePlaylists(playlists: Playlist[]): void {
    if (!Array.isArray(playlists)) {
      console.warn('Invalid playlists data, setting to empty array');
    } else {
      this.store.set('playlists', playlists);
    }
  }

  loadPlaylists(): Playlist[] {
    return this.store.get('playlists', []) as Playlist[];
  }

  updatePlaylist(playlistName: string, songs: Song[]): Playlist[] {
    if (!playlistName || !Array.isArray(songs)) {
      console.warn('Invalid playlist name or songs data');
      return this.store.get('playlists', []) as Playlist[];
    }

    const updatedPlaylists = this.store.get('playlists', []).map((p: { name: string; songs: Song[] }) =>
      p.name === playlistName ? { ...p, songs } : p
    );
    
    this.store.set('playlists', updatedPlaylists);
    return updatedPlaylists;
  }
}
