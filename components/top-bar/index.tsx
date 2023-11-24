import {
  XCircle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from "@phosphor-icons/react";
import { AudioPlayer, useAudioPlayer } from "@/atoms/audio";
import {
  playNextFromQueue,
  songHistoryAtom,
  useLibrary,
  useLoadedImageDataUrl,
  useLoadedSong,
  usePlaying,
  useSearch,
  useSelectedImageDataUrl,
} from "@/atoms/library";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import Marquee from "react-fast-marquee";

import {
  Rewind,
  FastForward,
  SearchIcon,
  Volume1,
  Volume2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Slider } from "../ui/slider";
import { listen } from "@tauri-apps/api/event";
import { atomWithStorage } from "jotai/utils";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { format } from "date-fns";
import { Seeker } from "../ui/seeker";
import { Input } from "../ui/input";
import { Shortcut } from "../ui/shortcut";
import { ModifierKeys, keybind, keybindForOs } from "@/lib/utils";
import { useOperatingSystem } from "@/hooks/useOperatingSystem";
import { Button } from "../ui/button";
import { queueAtom } from "@/atoms/queue";

const artistOrAlbumAtom = atomWithStorage<"artist" | "album">(
  "artistOrAlbum",
  "artist"
);

function useArtistOrAlbum() {
  return [...useAtom(artistOrAlbumAtom)] as const;
}

const volumeAtom = atomWithStorage("volume", 1);

export default function TopBar() {
  const [loadedSong, setLoadedSong] = useLoadedSong();
  const [playing, setPlaying] = usePlaying();
  const [audio, setAudio] = useAudioPlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [library] = useLibrary();
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
    if (!loadedSong) return;
    if (!audio?.audio) return;
    const src = convertFileSrc(loadedSong.path);
    audio.audio.src = src;
    audio.audio.currentTime = 0;
    play();
  }, [loadedSong, audio, play]);

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
    playNext();
    if (loadedSong && audio?.audio) {
      //   const idx = library.findIndex((s) => s.id === loadedSong.id);
      //   console.log({ idx });
      //   if (idx === -1) return;
      //   const nextSong = library[idx + 1];
      //   if (!nextSong) return;
      //   setLoadedSong(nextSong);
      //   const src = convertFileSrc(nextSong.path);
      //   audio.audio.src = src;
      //   play();
    }
  }

  function loadmetadata() {
    if (!audio?.audio) return;
    setDuration(audio.audio.duration);
  }

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("ended", playNext);
    audio.addEventListener("loadedmetadata", loadmetadata);
    // TODO: raf for timeupdate
    audio.addEventListener("timeupdate", (e) => {
      setTime(audio.currentTime ?? 0);
    });

    return () => {
      audio.removeEventListener("ended", playNext);
      audio.removeEventListener("loadedmetadata", loadmetadata);
      audio.removeEventListener("timeupdate", (e) => {
        setTime(audio.currentTime ?? 0);
      });
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
  }, [audio, setPlaying]);

  useEffect(() => {
    if (audio?.audio) {
      audio.audio.volume = volume;
    }
  }, [audio, volume]);

  if (!audio) return <div></div>;

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
              if (playing) {
                pause();
              } else {
                play();
              }
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
              <span className="text-xs" onClick={toggleArtistOrAlbum}>
                {artistOrAlbum === "artist"
                  ? loadedSong.artist
                  : loadedSong.album_title}
              </span>
              {audio.audio ? (
                <TimeDisplay
                  time={time}
                  duration={duration}
                  audioEl={audio.audio}
                />
              ) : null}
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
        <img src={loadedImageDataUrlState.data} />
      ) : (
        <div className="h-full w-full bg-app-box"></div>
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
    console.log("running audio listen");
    const unlisten = listen("find", (e) => {
      inputRef.current?.focus();
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [inputRef]);

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
        {!!search ? (
          <button
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
  time,
  duration,
  audioEl,
}: {
  time: number;
  duration: number;
  audioEl: HTMLAudioElement;
}) {
  const [showTimeRemaining, setShowTimeRemaining] = useState(false);

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
          if (audioEl) {
            console.log({ value });
            console.log({
              currenttime: audioEl.currentTime,
              duration: audioEl.duration,
            });
            audioEl.currentTime = value[0];
          }
        }}
        max={duration}
      />
      <span
        onClick={() => {
          setShowTimeRemaining(!showTimeRemaining);
        }}
        className="text-xs tabular-nums"
      >
        {showTimeRemaining
          ? format((duration - time) * 1000, "-mm:ss")
          : format(duration * 1000, "mm:ss")}
      </span>
    </div>
  );
}
