import { useSelectedImageDataUrl, useSelectedSong } from "@/atoms/library";
import { transparentBgAtom } from "@/atoms/preferences";
import { useSourceOpen } from "@/atoms/source";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import Link from "next/link";
import NavLink from "./sidebar/link";
import { HiMiniMusicalNote } from "react-icons/hi2";
import { useTheme } from "@/hooks/useTheme";

export default function SourceList() {
  // we call here because this component is not rendered on the server
  useTheme();
  const [source, setSource] = useSourceOpen();

  const [selectedSong] = useSelectedSong();
  const [selectedImageDataUrlState] = useSelectedImageDataUrl();

  const [transparentBg] = useAtom(transparentBgAtom);

  return (
    <div
      className={cn(
        "flex flex-col justify-between bg-sidebar pt-5 min-h-full relative gap-2.5 border-r border-sidebar-divider px-2.5 pb-2",
        transparentBg && "bg-opacity-[0.65]"
      )}
    >
      <ul className="grow flex flex-col pointer-events-auto">
        <li>
          <NavLink href="/">
            <div className="flex items-center">
              <HiMiniMusicalNote
                size={20}
                className="mr-2 h-5 w-5 shrink-0 fill-accent"
              />
              <span className="truncate">Library</span>
            </div>
          </NavLink>
          {/* <Link
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
          </button> */}
        </li>
      </ul>

      <div>
        {/* album art */}
        <div className="text-xs overflow-auto">
          {JSON.stringify(selectedSong)}
        </div>
        {selectedImageDataUrlState.state === "hasData" && (
          <div>
            <img src={selectedImageDataUrlState.data} />
          </div>
        )}
      </div>
    </div>
  );
}

// function NavLink() {

// }
