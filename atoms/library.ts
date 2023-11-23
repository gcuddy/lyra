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

const filteredLibraryAtom = atom((get) => {
  const library = get(libraryAtom);
  const search = get(searchAtom);
  if (search === "") return library;
  console.log({ search });
  return library.filter((song) =>
    `${song.title} ${song.artist} ${song.album_artist} ${song.album_title}`
      .toLowerCase()
      .includes(search.toLowerCase())
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

const loadableSelectedImageDataUrl = loadable(selectedImageDataUrl);

export function useSelectedImageDataUrl() {
  return [...useAtom(loadableSelectedImageDataUrl)] as const;
}
