import { useSourceOpen } from "@/atoms/source";
import Link from "next/link";

export default function SourceList() {
  const [source, setSource] = useSourceOpen();

  return (
    <ul className="grow flex flex-col pointer-events-auto">
      <li>
        <Link
          className={`flex flex-row items-center justify-start h-16 w-full ${
            source === "Library" ? "bg-blue-500" : ""
          }`}
          href="/"
          onClick={() => {
            setSource("Library");
          }}
        >
          Library
        </Link>
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
