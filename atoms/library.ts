import { atom, useAtom } from "jotai";
// maybe persist with localstorage or indexeddb or something? or with tauri? idk

const libraryAtom = atom<RawSong[]>([]);
const searchAtom = atom<string>("");

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

// export function useFilteredLibrary() {
//   return [...useAtom(filteredLibraryAtom)] as const;
// }
