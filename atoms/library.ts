import { invoke } from "@tauri-apps/api/tauri";
import { atom, useAtom } from "jotai";
// maybe persist with localstorage or indexeddb or something? or with tauri? idk
import { atomWithStorage, loadable } from "jotai/utils";
import { atomEffect } from "jotai-effect";

import { queueAtom } from "./queue";

// const libraryAtom = atomWithStorage<RawSong[]>("library", []);
export const libraryAtom = atom<RawSong[]>([]);
const searchAtom = atom<string>("");
export const selectedSongAtom = atom<RawSong | null>(null);
const _loadedSongAtom = atom<RawSong | null>(null);
const loadedSongAtom = atom(null, (get, set, song: RawSong | null) => {
  get(logSongHistoryEffect);
  set(_loadedSongAtom, song);
});
const playingAtom = atom(false);

export const setLoadedSongAndUpdateQueue = atom(
  null,
  (get, set, song: RawSong) => {
    console.log(`settingloadedsongandupdatingqueue`, { song });
    // TODO: add prefs of how to handle queue-ing
    set(loadedSongAtom, song);
    const library = get(libraryAtom);
    const queue = get(queueAtom);
    // get songs in album and add to queue
    const albumSongs = library
      .filter(
        (s) =>
          s.album_title === song.album_title &&
          s.album_artist === song.album_artist &&
          s.path !== song.path &&
          !queue.includes(s) &&
          (s.track_number ?? 0) > (song.track_number ?? 0)
      )
      .sort((a, b) => {
        // sort by disc number first
        const adiscNum = a.disc_number ?? 0;
        const bdiscNum = b.disc_number ?? 0;
        if (adiscNum !== bdiscNum) return adiscNum - bdiscNum;
        // then by track number
        const atrackNum = a.track_number ?? 0;
        const btrackNum = b.track_number ?? 0;
        return atrackNum - btrackNum;
      });
    console.log({ songsToAddToQueue: albumSongs });
    set(queueAtom, albumSongs);
  }
);

export const songHistoryAtom = atom<RawSong[]>([]);

const logSongHistoryEffect = atomEffect((get, set) => {
  const song = get(_loadedSongAtom);
  if (!song) return;
  set(songHistoryAtom, (history) => [...history, song]);
});

export const playNextFromQueue = atom(null, (get, set) => {
  const queue = get(queueAtom);
  const nextSong = queue.shift();
  if (!nextSong) return;
  set(queueAtom, queue);
  set(loadedSongAtom, nextSong);
});

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

export const filteredLibraryAtom = atom((get) => {
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
  return [...useAtom(_loadedSongAtom)] as const;
}

export function usePlaying() {
  return [...useAtom(playingAtom)] as const;
}

// export function useFilteredLibrary() {
//   return [...useAtom(filteredLibraryAtom)] as const;
// }

const loadedSongAlbumArt = atom(async (get) => {
  const song = get(_loadedSongAtom);
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

export const loadableLoadedImageDataUrl = loadable(loadedImageDataUrl);

export function useLoadedImageDataUrl() {
  return [...useAtom(loadableLoadedImageDataUrl)] as const;
}

const loadableSelectedImageDataUrl = loadable(selectedImageDataUrl);

export function useSelectedImageDataUrl() {
  return [...useAtom(loadableSelectedImageDataUrl)] as const;
}
