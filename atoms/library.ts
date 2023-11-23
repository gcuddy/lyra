import { invoke } from "@tauri-apps/api/tauri";
import { atom, useAtom } from "jotai";
// maybe persist with localstorage or indexeddb or something? or with tauri? idk
import { atomWithStorage, loadable } from "jotai/utils";

const libraryAtom = atomWithStorage<RawSong[]>("library", []);
const searchAtom = atom<string>("");
export const selectedSongAtom = atom<RawSong | null>(null);
const loadedSongAtom = atom<RawSong | null>(null);
const playingAtom = atom(false);

export function useLibrary() {
  return [...useAtom(libraryAtom)] as const;
}

export function useSearch() {
  return useAtom(searchAtom);
}

// export type Sort = {
//   key: keyof RawSong;
//   dir: "asc" | "desc";
// };

// const sortAtom = atom<Sort>({ key: "artist", dir: "asc" });

// const sort = (a: RawSong, b: RawSong, sort: Sort) => {
//   const { key, dir } = sort;
//   const akey = a[key];
//   const bkey = b[key];
//   const atrackNum = a.track_number;
//   const btrackNum = b.track_number;
//   if (typeof akey === "string" && bkey === "string") {
//     // sort by artist and then by track number

//     return (
//       akey.localeCompare(bkey) * (dir === "asc" ? 1 : -1) ||
//       (atrackNum ?? 0 - (btrackNum ?? 0))
//     );
//   }

//   if (typeof akey === "number" && typeof bkey === "number") {
//     return (akey - bkey) * (dir === "asc" ? 1 : -1);
//   }

//   return 0;
// };

// export function useSort() {
//   return [...useAtom(sortAtom)] as const;
// }

// const sortedLibraryAtom = atom((get) => {
//   const library = get(libraryAtom);
//   const sortState = get(sortAtom);
//   console.log({ sortState });
//   return library.sort((a, b) => sort(a, b, sortState));
// });

// export function useSortedLibrary() {
//   return [...useAtom(sortedLibraryAtom)] as const;
// }

const filteredLibraryAtom = atom((get) => {
  const library = get(libraryAtom);
  const search = get(searchAtom);
  if (search === "") return library;
  const filtered = library.filter((song) =>
    `${song.title} ${song.artist} ${song.album_artist} ${song.album_title}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return filtered;
});

export const libraryCountAtom = atom((get) => {
  const library = get(libraryAtom);
  return library.length;
});

export const filteredLibraryCountAtom = atom((get) => {
  const library = get(filteredLibraryAtom);
  return library.length;
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

const loadedSongAlbumArt = atom(async (get) => {
  const song = get(loadedSongAtom);
  if (!song) return;
  const cover = await invoke<Picture>("get_album_cover", {
    path: song.path,
  });
  console.log({ cover });
  return cover;
});

const selectedSongAlbumArt = atom(async (get) => {
  const song = get(selectedSongAtom);
  if (!song) return;
  const cover = await invoke<Picture>("get_album_cover", {
    path: song.path,
  });
  console.log({ cover });
  return cover;
});
const loadableSelectedSong = loadable(selectedSongAlbumArt);
const loadableLoadedSong = loadable(loadedSongAlbumArt);

export function useSelectedSongAlbumArt() {
  return [...useAtom(loadableSelectedSong)] as const;
}

const selectedImageDataUrl = atom(async (get) => {
  const song = await get(selectedSongAlbumArt);
  if (!song) return;
  const uint8Array = new Uint8Array(song.data);
  const blob = new Blob([uint8Array]);
  const dataURL = URL.createObjectURL(blob);
  return dataURL;
});

const loadedImageDataUrl = atom(async (get) => {
  const song = await get(loadedSongAlbumArt);
  if (!song) return;
  const uint8Array = new Uint8Array(song.data);
  const blob = new Blob([uint8Array]);
  const dataURL = URL.createObjectURL(blob);
  return dataURL;
});

const loadableLoadedImageDataUrl = loadable(loadedImageDataUrl);

export function useLoadedImageDataUrl() {
  return [...useAtom(loadableLoadedImageDataUrl)] as const;
}

const loadableSelectedImageDataUrl = loadable(selectedImageDataUrl);

export function useSelectedImageDataUrl() {
  return [...useAtom(loadableSelectedImageDataUrl)] as const;
}
