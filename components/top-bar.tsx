import { AudioPlayer } from "@/atoms/audio";
import { useLoadedSong, usePlaying, useSearch } from "@/atoms/library";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { useAtom } from "jotai";
import { Rewind, Play, FastForward, Pause } from "lucide-react";
import { useEffect, useState } from "react";

export default function TopBar() {
  const [search, setSearch] = useSearch();
  const [loadedSong] = useLoadedSong();
  const [playing, setPlaying] = usePlaying();
  const [audio, setAudio] = useState<AudioPlayer | null>(null);

  useEffect(() => {
    const audio = new AudioPlayer();
    setAudio(audio);
  }, []);

  if (!audio) return <div></div>;

  return (
    <div className="flex sticky top-0 flex-row justify-between gap-2 items-center w-full h-16 bg-gray-800">
      <div className="flex flex-row items-center pointer-events-auto">
        <button className="flex flex-row items-center justify-center h-16 w-16">
          <Rewind />
        </button>
        <button
          onClick={() => {
            if (playing) {
              audio.audio.pause();
              setPlaying(false);
              return;
            }
            if (loadedSong) {
              const src = convertFileSrc(loadedSong.path);
              console.log({ src });
              audio.audio.src = src;
              audio.audio.play();
              setPlaying(true);
            }
          }}
          className="flex flex-row items-center justify-center h-16 w-16"
        >
          {!playing ? <Play /> : <Pause />}
        </button>
        <button className="flex flex-row items-center justify-center h-16 w-16">
          <FastForward />
        </button>
      </div>
      <div className="grow p-2 h-full">
        {/* this will hold current song */}
        <div className="flex grow h-full border">
          {!!loadedSong && (
            <div className="text-center flex items-center justify-center grow w-full">
              {loadedSong.title} — {loadedSong.album_title} —{" "}
              {loadedSong.artist}
            </div>
          )}
        </div>
      </div>
      <div>
        {/* serach bar */}
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          type="text"
          className="pointer-events-auto select-text appearance-none bg-transparent border outline-none"
        />
      </div>
    </div>
  );
}
