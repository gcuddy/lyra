import { isInspectorOpenAtom } from "@/atoms/inspector";
import { filteredSongsSizeAtom, filteredSongsCountAtom, songsSizeAtom, filteredSongsDurationAtom } from "@/atoms/library";
import { cn } from "@/lib/utils";
import { Info } from "@phosphor-icons/react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { Button } from "./ui/button";

export const BOTTOM_BAR_HEIGHT = 32;

export function StatusBar() {
  const [isInspectorOpen, setIsInspectorOpen] = useAtom(isInspectorOpenAtom);

  useEffect(() => {
    invoke("toggle_inspector_text", {
      show: isInspectorOpen,
    });
  }, [isInspectorOpen]);

  useEffect(() => {
    const unlisten = listen("toggle-inspector", () => {
      setIsInspectorOpen((current) => !current);
    });
    return () => {
      unlisten.then((u) => u());
    };
  }, [setIsInspectorOpen]);

  return (
    <div
      className="z-10 w-full bg-app/80 flex justify-between pointer-events-auto items-center gap-1 border-t border-t-app-line px-3.5 text-xs text-ink-dull backdrop-blur-lg"
      style={{
        height: BOTTOM_BAR_HEIGHT,
      }}
    >
      <div className="flex"> </div>
      <div className="flex gap-2">
        <SongCount />
        <SongsSize />
        <SongsTime />
      </div>
      <div>
        <Button
          onClick={() => {
            setIsInspectorOpen(!isInspectorOpen);
          }}
          variant="subtle"
          size="icon"
          className={cn(isInspectorOpen && "bg-app-selected/50")}
        >
          <Info className="shrink-0 h-4 w-4" />
        </Button>
      </div>
      {/* <div className="flex-grow">
            <span>0:00</span>
        </div>
        <div className="flex-grow">
            <span>0:00</span>
        </div> */}
    </div>
  );
}

function SongCount() {
  const [filteredSongsCount] = useAtom(filteredSongsCountAtom);
  return <span>{filteredSongsCount} songs</span>;
}

function SongsSize() {
  const [songsSize] = useAtom(filteredSongsSizeAtom);
  const formattedSize = useMemo(() => {
    const mb = (songsSize / 1024 / 1024);
    if (mb < 1) {
      return `${(songsSize / 1024).toFixed(2)} KB`;
    }
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${(mb / 1024).toFixed(2)} GB`;
  }, [songsSize])
  return <span>{formattedSize}</span>;
}

function SongsTime() {
  const songsTimeMs = useAtomValue(filteredSongsDurationAtom);

  const formattedDuration = useMemo(() => {
    const hours = Math.floor(songsTimeMs / 3600000);
    const minutes = Math.floor((songsTimeMs % 3600000) / 60000);
    const seconds = Math.floor((songsTimeMs % 60000) / 1000);
    return `${hours ? `${hours}:` : ""}${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [songsTimeMs])

  return <span>{formattedDuration}</span>;

}
