import { useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const transparentBgAtom = atomWithStorage("transparentBg", true);

export type Themes = "light" | "dark";

export const themeAtom = atomWithStorage("theme", {
  theme: "light" as Themes,
  system: true,
  hueValue: 235,
});

export function isDarkTheme() {
  return useAtomValue(themeAtom).theme === "dark";
}

export function useThemePreferences() {
  return [...useAtom(themeAtom)] as const;
}
