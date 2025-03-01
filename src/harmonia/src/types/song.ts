// Define Song interface
export interface Song {
  id: string;           // Maintenant un hash MD5 du chemin
  title: string;
  artist: string;
  album: string;
  coverPath: string | null;  // Remplace 'cover' (qui était en base64)
  path: string;
  time: string;
  lastModified: number;  // Nouveau champ pour le suivi des modifications
  genre?: string;        // Garde les champs optionnels que tu utilises
}
