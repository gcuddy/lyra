import { atom, useAtom } from "jotai";

export class AudioPlayer {
  audio?: HTMLAudioElement;
  initialized = false;

  constructor() {
    this.initialize();
  }

  initialize() {
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.initialized = true;
    }
  }

  play() {
    if (this.audio) {
      this.audio.play();
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  get playing() {
    return this.audio?.paused ?? false;
  }

  set playing(value: boolean) {
    if (this.audio) {
      if (value) {
        this.audio.play();
      } else {
        this.audio.pause();
      }
    }
  }
}

// export const audioPlayer = atom<AudioPlayer>(new AudioPlayer());

const audioAtom = atom<AudioPlayer | null>(null);

export function useAudioPlayer() {
  //   useHydrateAtoms(audioPlayer);
  return [...useAtom(audioAtom)] as const;
}

const _playingAtom = atom(false);
// read-only version of above
export const playingAtom = atom((get) => get(_playingAtom));
const playAtom = atom(null, (get, set, arg: HTMLAudioElement) => {
  set(_playingAtom, true);
  arg.play();
});
const pauseAtom = atom(null, (get, set, arg: HTMLAudioElement) => {
  set(_playingAtom, false);
  arg.pause();
});
const toggleAtom = atom(null, (get, set, arg: HTMLAudioElement) => {
  const playing = get(_playingAtom);
  if (playing) {
    set(pauseAtom, arg);
  } else {
    set(playAtom, arg);
  }
});
