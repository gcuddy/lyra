import { atom, useAtom } from "jotai";
// maybe persist with localstorage or indexeddb or something? or with tauri? idk
import { atomWithStorage } from "jotai/utils";

const libraryAtom = atomWithStorage<RawSong[]>("library", []);
const searchAtom = atom<string>("");
const selectedSongAtom = atom<RawSong | null>(null);
const loadedSongAtom = atom<RawSong | null>(null);
const playingAtom = atom(false);

export function useLibrary() {
  return [...useAtom(libraryAtom)] as const;
}

export function useSearch() {
  return useAtom(searchAtom);
}

const filteredLibraryAtom = atom((get) => {
  const library = get(libraryAtom);
  const search = get(searchAtom);
  if (search === "") return library;
  return library.filter((song) =>
    song.title.toLowerCase().includes(search.toLowerCase())
  );
});

export function useFilteredLibrary() {
  return [...useAtom(filteredLibraryAtom)] as const;
}

export function useSelectedSong() {
  return [...useAtom(selectedSongAtom)] as const;
}

export function useLoadedSong() {
  return [...useAtom(loadedSongAtom)] as const;
}

export function usePlaying() {
  return [...useAtom(playingAtom)] as const;
}

// export function useFilteredLibrary() {
//   return [...useAtom(filteredLibraryAtom)] as const;
// }
