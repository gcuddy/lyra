import { cn } from "@/lib/utils";
import NavLink from "./sidebar/link";
import { Button, ButtonLink } from "./ui/button";
import { Plus, Queue } from "@phosphor-icons/react";
import { useState } from "react";

export default function SourceList() {
  console.log("source list");
  // we call here because this component is not rendered on the server
  // useTheme();
  // const [source, setSource] = useSourceOpen();

  // const [sidebarWidth, setSidebarWidth] = useState(320);
  const sidebarWidth = 320

  // const [selectedSong] = useSelectedSong();
  // const [selectedImageDataUrlState] = useSelectedImageDataUrl();

  const [transparentBg] = useState(false);

  return (
    <div
      style={{
        width: sidebarWidth ?? 320,
      }}
      className={cn(
        "flex flex-col justify-between bg-sidebar pt-5 min-h-full relative gap-2.5 border-r border-sidebar-divider px-2.5 pb-2",
        transparentBg && "bg-opacity-[0.65]"
      )}
    >
      <ul className="grow flex flex-col pointer-events-auto">
        <li>
          <NavLink href="/">
            <div className="flex items-center">
              {/* <HiMiniMusicalNote */}
              {/*   size={20} */}
              {/*   className="mr-2 h-5 w-5 shrink-0 fill-accent" */}
              {/* /> */}
              <span className="truncate">Library</span>
            </div>
          </NavLink>
        </li>
      </ul>

      <div>
        <div className="text-xs overflow-auto">
        </div>
      </div>
      <div className="absolute pointer-events-auto bottom-0 inset-x-0 w-full px-3 py-2 flex items-center justify-between flex-row">
        {/* TODO: hover show next few, click show in sidebar, expand to show full page  */}
        <ButtonLink
          href="/queue"
          variant="subtle"
          size="icon"
          className="text-sidebar-inkDull"
        >
          <Queue size={20} />
        </ButtonLink>
        {/* TODO: new playlist, new smart playlist */}
        <Button variant="subtle" size="icon" className="text-sidebar-inkDull">
          <Plus size={20} />
        </Button>
      </div>
      {/* we'll have queue and add button here (add playlist, smart playlist, song) */}
    </div>
  );
}

// function NavLink() {

// }
