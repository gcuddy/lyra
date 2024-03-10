import {
	isPlayingAtom,
	playNextFromQueue,
	setPlaying,
	songHistoryAtom,
	useLoadedSong,
} from "@/atoms/library";
import { Pause, Play, SkipBack, SkipForward } from "@phosphor-icons/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { Button } from "./ui/button";

import { queueAtom } from "@/atoms/queue";
import { atomWithStorage } from "jotai/utils";
import { Volume1, Volume2 } from "lucide-react";
import { Slider } from "./ui/slider";

const volumeAtom = atomWithStorage("volume", 1);

export default function AudioPlayer() {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying] = useAtom(isPlayingAtom);
	const [, playNext] = useAtom(playNextFromQueue);
	const [volume, setVolume] = useAtom(volumeAtom);
	const songHistory = useAtomValue(songHistoryAtom);
	const queue = useAtomValue(queueAtom);
	const [loadedSong, setLoadedSong] = useLoadedSong();
	const setPlayingState = useSetAtom(setPlaying);

	useEffect(() => {
		if (isPlaying) {
			audioRef.current?.play();
		} else {
			audioRef.current?.pause();
		}
	}, [isPlaying]);

	return (
		<div>
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
					disabled={!loadedSong}
					onClick={() => {
						setPlayingState(!isPlaying);
					}}
					size="icon"
					variant="subtle"
					className="text-ink-dull h-10 w-10 flex justify-center"
				>
					{!isPlaying ? (
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

			<audio
				onEnded={() => {
					console.log("ended");
					playNext();
					// play next
				}}
				ref={audioRef}
			/>
		</div>
	);
}
