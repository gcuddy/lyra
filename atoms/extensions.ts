import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { Store } from "tauri-plugin-store-api";

export type LastFmData = {
	name: string;
	key: string;
}

export const lastFmAtom = atom<LastFmData | null>(null);

export function useLastfm() {
	const store = new Store('extensions.json')
	const [lastfm, _setLastfm] = useAtom(lastFmAtom);

	useEffect(() => {
		store.get<LastFmData>('lastfm').then((data) => {
			_setLastfm(data)
		})
	}, [_setLastfm])

	function setLastfm(data: LastFmData | null) {
		if (data === null) {
			store.delete('lastfm')
			_setLastfm(null)
			return
		}
		store.set('lastfm', data)
		_setLastfm(data)
	}

	return [lastfm, setLastfm] as const
}
