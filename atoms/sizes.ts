import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const leftSidebarWidthAtom = atomWithStorage("leftSidebar", 320);
