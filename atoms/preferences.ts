import { createStore, useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const transparentBgAtom = atomWithStorage("transparentBg", true);

export type Themes = "light" | "dark";

const defaultThemeStore = {
	theme: "light" as Themes,
	system: true,
	hueValue: 235,
};

export const themeAtom = atomWithStorage("theme", defaultThemeStore);

export function isDarkTheme() {
	return useAtomValue(themeAtom).theme === "dark";
}

export function useThemePreferences() {
	return [...useAtom(themeAtom)] as const;
}

export const themeStore = createStore();

themeStore.set(themeAtom, defaultThemeStore);
