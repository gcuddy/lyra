import { AudioPlayer, useAudioPlayer } from "@/atoms/audio";
import {
  useLibrary,
  useLoadedSong,
  usePlaying,
  useSearch,
} from "@/atoms/library";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import Marquee from "react-fast-marquee";

import {
  Rewind,
  Play,
  FastForward,
  Pause,
  SearchIcon,
  Volume1,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Slider } from "./ui/slider";
import { listen } from "@tauri-apps/api/event";
import { atomWithStorage } from "jotai/utils";
import { atom, useAtom } from "jotai";

const artistOrAlbumAtom = atomWithStorage<"artist" | "album">(
  "artistOrAlbum",
  "artist"
);

function useArtistOrAlbum() {
  return [...useAtom(artistOrAlbumAtom)] as const;
}

const volumeAtom = atomWithStorage("volume", 1);

export default function TopBar() {
  const [search, setSearch] = useSearch();
  const [loadedSong] = useLoadedSong();
  const [playing, setPlaying] = usePlaying();
  const [audio, setAudio] = useAudioPlayer();
  const [library] = useLibrary();

  const [artistOrAlbum, setArtistOrAlbum] = useArtistOrAlbum();

  const [volume, setVolume] = useAtom(volumeAtom);

  function toggleArtistOrAlbum() {
    console.log("toggling artist or album");
    setArtistOrAlbum(artistOrAlbum === "artist" ? "album" : "artist");
  }

  useEffect(() => {
    if (!loadedSong) return;
    if (!audio?.audio) return;
    const src = convertFileSrc(loadedSong.path);
    audio.audio.src = src;
    audio.audio.currentTime = 0;
    play();
  }, [loadedSong]);

  //   TODO: should these move into a hook?
  function pause() {
    audio?.audio?.pause();
    setPlaying(false);
  }

  function play() {
    audio?.audio?.play();
    setPlaying(true);
  }

  //   TODO: ended
  function ended() {
    if (loadedSong && audio?.audio) {
      const idx = library.findIndex((s) => s.id === loadedSong.id);
      if (idx === -1) return;
      const nextSong = library[idx + 1];
      if (!nextSong) return;
      const src = convertFileSrc(nextSong.path);
      audio.audio.src = src;
      play();
    }
  }

  useEffect(() => {
    if (audio?.audio) return;
    const _audio = new AudioPlayer();
    setAudio(_audio);
    if (audio?.audio) {
      audio.audio.addEventListener("pause", pause);
      audio.audio.addEventListener("play", play);
      audio.audio.addEventListener("ended", ended);
    }

    return () => {
      if (audio?.audio) {
        audio.audio.removeEventListener("pause", pause);
        audio.audio.removeEventListener("play", play);
        audio.audio.removeEventListener("ended", ended);
      }
    };
  }, []);

  useEffect(() => {
    console.log("running audio listen");
    const unlisten = listen("play", (e) => {
      console.log({ e, audio });
      if (audio?.audio?.paused) {
        audio?.audio.play();
        setPlaying(true);
      } else {
        audio?.audio?.pause();
        setPlaying(false);
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [audio]);

  useEffect(() => {
    if (audio?.audio) {
      audio.audio.volume = volume;
    }
  }, [audio, volume]);

  if (!audio) return <div></div>;

  return (
    <div className="grid grid-cols-12 sticky top-0 flex-row justify-between gap-2 items-center w-full h-16 dark:bg-gray-800 px-4">
      <div className="flex col-span-3 justify-center flex-row items-center pointer-events-auto gap-2">
        <div className="flex gap-2">
          <button className="flex flex-row items-center justify-center h-10 w-10 rounded-full border border-gray-400">
            <Rewind className="relative -left-px h-5 w-5" />
          </button>
          <button
            onClick={() => {
              if (playing) {
                pause();
                return;
              } else {
                play();
              }
              //   if (loadedSong && audio.audio) {
              //     const src = convertFileSrc(loadedSong.path);
              //     audio.audio.src = src;
              //     audio.audio.play();
              //     setPlaying(true);
              //   }
            }}
            className="flex flex-row items-center justify-center h-10 w-10 rounded-full border border-gray-400"
          >
            {!playing ? (
              <Play className="relative left-px h-5 w-5" />
            ) : (
              <Pause className="relative left-px h-5 w-5" />
            )}
          </button>
          <button className="flex flex-row items-center justify-center h-10 w-10 rounded-full border border-gray-400">
            <FastForward className="relative left-px h-5 w-5" />
          </button>
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
      <div className="grow col-start-5 col-span-4 p-2 h-full">
        {/* this will hold current song */}
        <div className="flex grow h-full border border-gray-400 rounded-lg">
          {!!loadedSong && (
            // <Marquee speed={25}>
            // </Marquee>
            <div className="pointer-events-auto select-none cursor-default text-center flex flex-col text-sm items-center justify-center grow w-full">
              <span>{loadedSong.title}</span>
              <span onClick={toggleArtistOrAlbum}>
                {artistOrAlbum === "artist"
                  ? loadedSong.artist
                  : loadedSong.album_title}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-2 col-end-12 justify-center flex items-center">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            placeholder="Search…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            type="text"
            className="pointer-events-auto select-text pl-8 pr-6 appearance-none bg-transparent border outline-none border-gray-400 rounded-full p-2"
          />
        </div>
      </div>
    </div>
  );
}
