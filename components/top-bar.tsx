import { useSearch } from "@/atoms/library";
import { Rewind, Play, FastForward } from "lucide-react";

export default function TopBar() {
  const [search, setSearch] = useSearch();
  return (
    <div className="flex flex-row justify-between gap-2 items-center w-full h-16 bg-gray-800">
      <div className="flex flex-row items-center">
        <button className="flex flex-row items-center justify-center h-16 w-16">
          <Rewind />
        </button>
        <button className="flex flex-row items-center justify-center h-16 w-16">
          <Play />
        </button>
        <button className="flex flex-row items-center justify-center h-16 w-16">
          <FastForward />
        </button>
      </div>
      <div className="grow p-2 h-full">
        {/* this will hold current song */}
        <div className="flex grow h-full border"></div>
      </div>
      <div>
        {/* serach bar */}
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          type="text"
          className="pointer-events-auto select-text appearance-none bg-transparent border outline-none"
        />
      </div>
    </div>
  );
}
