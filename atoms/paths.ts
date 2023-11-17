import { atom, useAtom } from "jotai";

const pathsAtom = atom<string[]>([]);

export function usePaths() {
  return [...useAtom(pathsAtom)] as const;
}
