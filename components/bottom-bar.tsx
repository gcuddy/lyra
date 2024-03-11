import { isInspectorOpenAtom } from "@/atoms/inspector";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Info } from "@phosphor-icons/react";

export const BOTTOM_BAR_HEIGHT = 32;

export function BottomBar() {
  const [filteredLibraryCount] = [0]
  // const [filteredLibraryCount] = useAtom(filteredLibraryCountAtom);
  const leftSidebarWidth = 256;
  // const leftSidebarWidth = useAtomValue(leftSidebarWidthAtom);
  const [isInspectorOpen, setIsInspectorOpen] = useAtom(isInspectorOpenAtom);

  // bizarre to handle this logic here, but whatever

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
      className="fixed bottom-0 z-10 bg-app/80 flex justify-between items-center gap-1 border-t border-t-app-line px-3.5 text-xs text-ink-dull backdrop-blur-lg"
      style={{
        height: BOTTOM_BAR_HEIGHT,
        width: `calc(100% - ${leftSidebarWidth}px`,
      }}
    >
      <div className="flex-grow">
        <span>{filteredLibraryCount} songs</span>
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
