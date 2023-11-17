import { useSourceOpen } from "@/atoms/source";

export default function SourceList() {
  const [source, setSource] = useSourceOpen();

  return (
    <ul className="grow flex flex-col pointer-events-auto">
      <li>
        <button
          className={`flex flex-row items-center justify-start h-16 w-full ${
            source === "Library" ? "bg-blue-500" : ""
          }`}
          onClick={() => {
            setSource("Library");
          }}
        >
          Library
        </button>
        <button
          className={`flex flex-row items-center justify-start h-16 w-full ${
            source === "Playlist 1" ? "bg-blue-500" : ""
          }`}
          onClick={() => {
            setSource("Playlist 1");
          }}
        >
          Playlist 1
        </button>
      </li>
    </ul>
  );
}
