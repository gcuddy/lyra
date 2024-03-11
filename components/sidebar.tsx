import NavLink from "./sidebar/link";
import { Gear, MusicNotes, Queue, ListPlus } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

export function Sidebar() {
  return (
    <div style={{}} className="flex flex-col justify-between bg-sidebar w-64 pt-5 min-h-full relative gap-2.5 border-r border-sidebar-divider px-2.5 pb-2">

      <ul className="grow flex flex-col pointer-events-auto">
        <li>
          <NavLink href="/">
            <div className="flex items-center">
              <MusicNotes
                weight="fill"
                className="mr-2 h-4 w-4 shrink-0 fill-accent"
              />
              <span className="truncate">Library</span>
            </div>
          </NavLink>
        </li>
      </ul>
      <div className="flex justify-between border-t border-sidebar-divider pointer-events-auto pt-3 pb-1">
        <div className="flex items-center gap-1">
          <Button href="/settings">
            <Tooltip label="Settings">
              <Gear className="shrink-0" />
            </Tooltip>
            <span className="sr-only">Settings</span>
          </Button>
          <Button>
            <Tooltip label="Queue">
              <Queue className="shrink-0" />
            </Tooltip>
            <span className="sr-only">Queue</span>
          </Button>
        </div>

        <Button>
          <Tooltip label="New playlist">
            <ListPlus className="shrink-0" />
          </Tooltip>
          <span className="sr-only">New Playlist</span>
        </Button>

      </div>
    </div>
  )
}