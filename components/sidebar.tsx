import NavLink from "./sidebar/link";
import { Gear, MusicNotes, Queue, ListPlus } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogPortal, DialogOverlay, DialogClose, DialogFooter, DialogDescription } from "./ui/dialog"
import { Input } from "./ui/input";
import { Store } from "tauri-plugin-store-api";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { atom, useAtom } from "jotai";

const playlistsAtom = atom<Playlist[]>([]);

function usePlaylists() {
  const [playlists, _setPlaylists] = useAtom(playlistsAtom);
  const store = new Store("playlists.json");

  useEffect(() => {
    store.get<Playlist[]>("playlists").then((playlists) => {
      _setPlaylists(playlists ?? []);
    });
  }, []);

  const setPlaylists = async (playlists: Playlist[]) => {
    await store.set("playlists", playlists);
    _setPlaylists(playlists);
  }

  return [playlists, setPlaylists] as const;
}

export function Sidebar() {
  const [playlists] = usePlaylists();

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
          {playlists.length > 0 && (
            <ul className="flex flex-col gap-1.5 ml-4">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <NavLink href={`/playlist/${playlist.id}`}>
                    <span className="truncate">{playlist.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
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
        <NewPlaylist />
      </div>
    </div>
  )
}

// TODO: make atom that uses store for playlists but also is reactive and represents in memory
function NewPlaylist() {
  const [playlists, setPlaylists] = usePlaylists();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const createPlaylist = async (name: string) => {
    // const playlists = await store.get<Playlist[]>("playlists");
    const newPlaylist = {
      id: nanoid(),
      name,
      songs: [],
    };
    // await store.set("playlists", [...(playlists ?? []), newPlaylist]);
    setPlaylists([...playlists, newPlaylist]);
  };

  return (
    <Dialog open={open}>
      <DialogTrigger asChild>
        <Button onClick={() => {
          setOpen(true);
        }}>
          <Tooltip label="New playlist">
            <ListPlus className="shrink-0" />
          </Tooltip>
          <span className="sr-only">New Playlist</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="contents" onSubmit={(e) => {
          e.preventDefault();
          console.log(value, "submitteD")
          if (!value) return;
          createPlaylist(value);
          setValue("");
          setOpen(false);
        }}>
          <DialogHeader>
            <DialogTitle>New Playlist</DialogTitle>
            <DialogDescription>Enter a name for your new playlist</DialogDescription>
          </DialogHeader>
          <Input value={value} onChange={(e) => {
            setValue(e.target.value);
          }} className="p-2" name="name" />
          <DialogFooter>
            <Button type="submit" variant="accent">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
