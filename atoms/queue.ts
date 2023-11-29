import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { _loadedSongAtom } from "./library";

export const songHistoryAtom = atom<RawSong[]>([]);

const logSongHistoryEffect = atomEffect((get, set) => {
	const song = get(_loadedSongAtom);
	if (!song) return;
	set(songHistoryAtom, (history) => [...history, song]);
});

export const queueAtom = atom<RawSong[]>([]);
