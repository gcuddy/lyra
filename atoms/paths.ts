import { atom, useAtom } from "jotai";

export const directoryPathAtom = atom<string | null>(null);

export function useDirectoryPath() {
  return [...useAtom(directoryPathAtom)] as const;
}
