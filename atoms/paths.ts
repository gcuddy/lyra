import { atom, useAtom } from "jotai";

const pathsAtom = atom<string[]>([]);

export function usePaths() {
  return [...useAtom(pathsAtom)] as const;
}

const directoryPathAtom = atom<string | null>(null);

export function useDirectoryPath() {
  return [...useAtom(directoryPathAtom)] as const;
}
