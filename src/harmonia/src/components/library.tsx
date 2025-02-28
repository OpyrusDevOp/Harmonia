import { ChangeEvent, useState } from "react";
import Song from "../types/song";
import { ArrowUpDown, Search } from "lucide-react";

interface LibraryProps {
  songs: Song[];
  playSong: (song: Song) => void;
}

const Library: React.FC<LibraryProps> = ({ songs, playSong }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (column: keyof Song) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column.toString());
      setSortOrder("asc");
    }
  };

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    return sortOrder === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Search className="text-gray-400" />
        <Input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 text-white border-none rounded p-2 focus:outline-none"
        />
      </div>
      <Table>
        <thead>
          <tr>
            <th onClick={() => handleSort("title")} className="cursor-pointer">
              Title <ArrowUpDown className="inline w-4 h-4" />
            </th>
            <th onClick={() => handleSort("artist")} className="cursor-pointer">
              Artist <ArrowUpDown className="inline w-4 h-4" />
            </th>
            <th onClick={() => handleSort("album")} className="cursor-pointer">
              Album <ArrowUpDown className="inline w-4 h-4" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSongs.map((song) => (
            <tr key={song.id} onClick={() => playSong(song)} className="hover:bg-gray-700 cursor-pointer">
              <td>{song.title}</td>
              <td>{song.artist}</td>
              <td>{song.album}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Library;

