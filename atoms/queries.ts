import { atomWithQuery } from "jotai-tanstack-query";
import { directoryPathAtom } from "./paths";
import { FileEntry, readDir } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { searchAtom } from "./library";
import { keepPreviousData } from "@tanstack/query-core";


function isAudioFile(filename: string): boolean {
	return filename.match(/\.(mp3|ogg|aac|flac|wav|m4a)$/) !== null;
}

function parseMusicFiles(dir: FileEntry[], acc: string[] = []) {
	console.log('parsing music files')
	for (let i = 0; i < dir.length; ++i) {
		const file = dir[i];
		if (file.children) {
			parseMusicFiles(file.children, acc);
		} else if (
			file.name?.startsWith(".") === false &&
			isAudioFile(file.name)
		) {
			acc.push(file.path);
		}
	}
	return acc;
}

export const musicFilesQueryAtom = atomWithQuery((get) => ({
	queryKey: ["musicFiles", get(directoryPathAtom)],
	enabled: !!get(directoryPathAtom),
	queryFn: async () => {
		const path = get(directoryPathAtom);
		if (!path) return [];
		console.log('reading dir', path)
		const dir = await readDir(path, {
			recursive: true,
		});
		const files = parseMusicFiles(dir);
		return files
	},
	placeholderData: keepPreviousData,
}))

export const libraryQueryAtom = atomWithQuery((get) => ({
	queryKey: ["library"],
	queryFn: async () => {
		const { data } = get(musicFilesQueryAtom);
		if (!data) return [];
		return await invoke<RawSong[]>("process_music_files", {
			paths: data,
		})
	},
	// NOTE: if this line is uncommented out we get TypeError: WeakMap keys must be objects or non-registered symbols
	// enabled: !!get(musicFilesQueryAtom).data,
	select: (data: RawSong[]) => {
		const search = get(searchAtom);
		if (search === "") return data;
		const filtered = data.filter((song) =>
			`${song.title} ${song.artist} ${song.album_artist} ${song.album_title}`
				.toLowerCase()
				.includes(search.toLowerCase()),
		);
		return filtered;
	},
	placeholderData: keepPreviousData
}))

