import {
	playNextFromQueue,
	songHistoryAtom,
	useLoadedImageDataUrl,
	useLoadedSong,
	usePlaying,
	useSearch,
} from "@/atoms/library";
import {
	Pause,
	Play,
	SkipBack,
	SkipForward,
	XCircle,
} from "@phosphor-icons/react";
import { convertFileSrc } from "@tauri-apps/api/tauri";

import { queueAtom } from "@/atoms/queue";
import { useOperatingSystem } from "@/hooks/useOperatingSystem";
import { ModifierKeys, keybindForOs } from "@/lib/utils";
import { listen } from "@tauri-apps/api/event";
import { format } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { SearchIcon, Volume1, Volume2 } from "lucide-react";
import { RefObject, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Seeker } from "../ui/seeker";
import { Shortcut } from "../ui/shortcut";
import { Slider } from "../ui/slider";

const artistOrAlbumAtom = atomWithStorage<"artist" | "album">(
	"artistOrAlbum",
	"artist",
);

function useArtistOrAlbum() {
	return [...useAtom(artistOrAlbumAtom)] as const;
}

const volumeAtom = atomWithStorage("volume", 1);

export default function TopBar() {
	const [loadedSong, setLoadedSong] = useLoadedSong();
	const [playing, setPlaying] = usePlaying();
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const songHistory = useAtomValue(songHistoryAtom);
	const queue = useAtomValue(queueAtom);
	const playNext = useSetAtom(playNextFromQueue);

	const [artistOrAlbum, setArtistOrAlbum] = useArtistOrAlbum();

	const [volume, setVolume] = useAtom(volumeAtom);

	function toggleArtistOrAlbum() {
		console.log("toggling artist or album");
		setArtistOrAlbum(artistOrAlbum === "artist" ? "album" : "artist");
	}

	useEffect(() => {
		console.log("playing changed", playing);
		console.log({ audioRef });
		if (playing) {
			audioRef.current?.play();
		} else {
			audioRef.current?.pause();
		}
	}, [playing]);

	useEffect(() => {
		console.log("loaded song changed", loadedSong);
		if (!loadedSong) return;
		const src = convertFileSrc(loadedSong.path);
		if (audioRef.current) {
			console.log("setting src", src);
			audioRef.current.pause();
			audioRef.current.src = src;
			audioRef.current.currentTime = 0;
			audioRef.current.load();
			console.log("loaded", audioRef.current.currentTime);
			audioRef.current.play();
		}
		setPlaying(true);
	}, [loadedSong, setPlaying]);

	console.log({ playing });

	useEffect(() => {
		console.log("making new audio");
		if (audioRef.current) return;
		const audio = new Audio();
		audioRef.current = audio;

		audio.addEventListener("ended", playNext);
		// TODO: raf for timeupdate

		return () => {
			audio.removeEventListener("ended", playNext);
		};
	}, [playNext]);

	useEffect(() => {
		console.log("running audio listen");
		const unlisten = listen("play", (e) => {
			setPlaying((currentPlaying) => !currentPlaying);
		});

		return () => {
			unlisten.then((f) => f());
		};
	}, [setPlaying]);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
	}, [volume]);

	if (!audioRef.current) return <div />;

	return (
		<div
			data-tauri-drag-region
			className="grid grid-cols-12 sticky top-0 flex-row justify-between gap-2 border-b border-app-line items-center w-full h-20 px-4"
		>
			<div
				data-tauri-drag-region
				className="flex col-span-3 justify-center flex-row items-center pointer-events-auto gap-2"
			>
				<div className="flex gap-2">
					<Button
						disabled={!songHistory?.length}
						onClick={() => {
							const lastSong = songHistory.at(-1);
							if (!lastSong) return;
							setLoadedSong(lastSong);
						}}
						className="text-ink-dull h-10 w-10 flex-justify-between"
					>
						<SkipBack className="relative h-5 w-5" />
					</Button>
					<Button
						onClick={() => {
							setPlaying(!playing);
						}}
						size="icon"
						variant="subtle"
						className="text-ink-dull h-10 w-10 flex justify-center"
					>
						{!playing ? (
							<Play className="relative h-5 w-5" />
						) : (
							<Pause className="relative h-5 w-5" />
						)}
					</Button>
					<Button
						disabled={!queue.length}
						onClick={playNext}
						className="text-ink-dull h-10 w-10 flex-justify-between"
					>
						<SkipForward className="relative h-5 w-5" />
					</Button>
				</div>
				<div className="flex grow">
					<Volume1 className="h-4 w-4" />
					<Slider
						min={0}
						max={1}
						step={0.0625}
						value={[volume]}
						onValueChange={(value) => {
							setVolume(value[0]);
						}}
						className="grow"
					/>
					<Volume2 className="h-4 w-4" />
				</div>
			</div>
			<div
				data-tauri-drag-region
				className="grow col-start-5 col-span-4 p-2 h-full"
			>
				{/* this will hold current song */}
				<div className="flex grow h-14 border border-app-line bg-app-box/50 rounded-lg overflow-hidden self-center">
					<CovertArt />
					{!!loadedSong && (
						// <Marquee speed={25}>
						// </Marquee>
						<div className="pointer-events-auto leading-3 select-none cursor-default text-center flex flex-col text-sm items-center justify-center grow w-full p-1">
							<span className=" text-xs font-semibold">{loadedSong.title}</span>
							<button
								type="button"
								className="text-xs"
								onClick={toggleArtistOrAlbum}
							>
								{artistOrAlbum === "artist"
									? loadedSong.artist
									: loadedSong.album_title}
							</button>
							<TimeDisplay audioRef={audioRef} />
						</div>
					)}
				</div>
			</div>
			<div
				data-tauri-drag-region
				className="col-span-2 col-end-12 justify-center flex items-center"
			>
				<SearchBar />
			</div>
		</div>
	);
}

function CovertArt() {
	const [loadedImageDataUrlState] = useLoadedImageDataUrl();

	return (
		<div className="flex h-14 rounded-[inherit] aspect-square object-cover flex-col items-center justify-center">
			{loadedImageDataUrlState.state === "hasData" ? (
				<img alt="" src={loadedImageDataUrlState.data} />
			) : (
				<div className="h-full w-full bg-app-box" />
			)}
		</div>
	);
}

function SearchBar() {
	const os = useOperatingSystem();
	const keybind = keybindForOs(os);
	const [search, setSearch] = useSearch();

	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const unlisten = listen("find", (e) => {
			inputRef.current?.focus();
		});

		return () => {
			unlisten.then((f) => f());
		};
	}, []);

	return (
		<div className="relative group">
			<SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
			<Input
				ref={inputRef}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						if (search) {
							setSearch("");
						} else {
							inputRef.current?.blur();
						}
					}
				}}
				placeholder="Search…"
				value={search}
				onChange={(event) => {
					setSearch(event.target.value);
				}}
				type="text"
				className="pointer-events-auto select-text pl-8 pr-6"
			/>
			<div className="absolute flex flex-col items-center justify-center right-2 top-1/2 -translate-y-1/2  opacity-70 ">
				{search ? (
					<button
						type="reset"
						className="pointer-events-auto"
						onClick={() => {
							setSearch("");
						}}
					>
						<XCircle />
					</button>
				) : (
					<Shortcut
						className="group-focus-within:hidden pointer-events-none"
						chars={keybind([ModifierKeys.Control], ["F"])}
					/>
				)}
			</div>
		</div>
	);
}

function TimeDisplay({
	audioRef,
}: {
	audioRef: RefObject<HTMLAudioElement>;
}) {
	const [time, setTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [showTimeRemaining, setShowTimeRemaining] = useState(false);

	useEffect(() => {
		if (!audioRef.current) return;
		const audio = audioRef.current;
		console.log({ audio });
		audio.addEventListener("timeupdate", (e) => {
			setTime(audio.currentTime);
		});
		audio.addEventListener("loadedmetadata", (e) => {
			setDuration(audio.duration);
		});

		return () => {
			audio.removeEventListener("timeupdate", (e) => {
				setTime(audio.currentTime);
			});
			audio.removeEventListener("loadedmetadata", (e) => {
				setDuration(audio.duration);
			});
		};
	}, [audioRef]);

	return (
		<div className="flex grow w-full items-center gap-2 px-4">
			<span className="text-xs tabular-nums">
				{format(time * 1000, "mm:ss")}
			</span>
			<Seeker
				className="w-max grow"
				min={0}
				step={1}
				value={[time]}
				onValueChange={(value) => {
					if (audioRef.current) {
						audioRef.current.currentTime = value[0];
					}
				}}
				max={duration}
			/>
			<button
				type="button"
				onClick={() => {
					setShowTimeRemaining(!showTimeRemaining);
				}}
				className="text-xs tabular-nums"
			>
				{showTimeRemaining
					? format((duration - time) * 1000, "-mm:ss")
					: format(duration * 1000, "mm:ss")}
			</button>
		</div>
	);
}
