import { atom, useAtom } from "jotai";

const mainScrollRef = atom<HTMLElement | null>(null);

export function useMainScrollRef() {
  return [...useAtom(mainScrollRef)] as const;
}
