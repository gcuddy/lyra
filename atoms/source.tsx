import { atom, useAtom } from "jotai";

const sourceAtom = atom("Library");

export function useSourceOpen() {
  return [...useAtom(sourceAtom)] as const;
}
