import { isInspectorOpenAtom } from "@/atoms/inspector";
import { filteredSongsCountAtom } from "@/atoms/library";
import { cn } from "@/lib/utils";
import { Info } from "@phosphor-icons/react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { Button } from "./ui/button";

export const BOTTOM_BAR_HEIGHT = 32;

export function StatusBar() {
  const [filteredSongsCount] = useAtom(filteredSongsCountAtom);
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
      className="z-10 w-full bg-app/80 flex justify-between items-center gap-1 border-t border-t-app-line px-3.5 text-xs text-ink-dull backdrop-blur-lg"
      style={{
        height: BOTTOM_BAR_HEIGHT,
      }}
    >
      <div className="flex-grow">
        <span>{filteredSongsCount} songs</span>
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
