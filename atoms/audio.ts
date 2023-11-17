import { atom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

export class AudioPlayer {
  audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio();
  }
}

// export const audioPlayer = atom<AudioPlayer>(new AudioPlayer());
