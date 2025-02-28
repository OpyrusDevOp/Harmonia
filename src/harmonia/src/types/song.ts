// Define Song interface
export default interface Song {
  genre: any;
  id: number;
  title: string;
  artist?: string;
  album?: string;
  path: string;
  cover: string | null;
  time?: string;
}
