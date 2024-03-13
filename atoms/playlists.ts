import { atom, useAtom } from "jotai";
import { splitAtom } from "jotai/utils";
import { useEffect } from "react";
import { Store } from "tauri-plugin-store-api";

const playlistsAtom = atom<Playlist[]>([]);

export function usePlaylists() {
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

export const playlistsAtomsAtom = splitAtom(playlistsAtom);
