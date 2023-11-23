import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function capitalize<T extends string>(string: T): Capitalize<T> {
  return (string.charAt(0).toUpperCase() + string.slice(1)) as Capitalize<T>;
}
// https://www.w3.org/TR/uievents-key/#keys-modifier
export enum ModifierKeys {
  Alt = "Alt",
  Shift = "Shift",
  AltGraph = "AltGraph",
  CapsLock = "CapsLock",
  Control = "Control",
  Fn = "Fn",
  FnLock = "FnLock",
  Meta = "Meta",
  NumLock = "NumLock",
  ScrollLock = "ScrollLock",
  Symbol = "Symbol",
  SymbolLock = "SymbolLock",
}
export type OSforKeys = "macOS" | "Windows" | "Other";
export type OperatingSystem =
  | "browser"
  | "linux"
  | "macOS"
  | "windows"
  | "unknown";

export const modifierSymbols: Record<
  ModifierKeys,
  { macOS?: string; Windows?: string; Other: string }
> = {
  Alt: { macOS: "⌥", Other: "Alt" },
  AltGraph: { macOS: "⌥", Other: "Alt" },
  CapsLock: { Other: "⇪" },
  Control: { macOS: "⌃", Other: "Ctrl" },
  Fn: { macOS: "fn", Other: "Fn" },
  FnLock: { macOS: "fn", Other: "Fn" },
  Meta: { macOS: "⌘", Windows: "⊞ Win", Other: "Meta" },
  NumLock: { macOS: "⇭", Other: "Num" },
  ScrollLock: { macOS: "⤓", Other: "ScrLk" },
  Shift: { Other: "Shift", macOS: "⇧" },
  Symbol: { macOS: "⎄", Other: "Sym" },
  SymbolLock: { macOS: "⎄", Other: "Sym" },
};

export const keySymbols: Record<
  string,
  { macOS?: string; Windows?: string; Other: string }
> = {
  " ": { Other: "␣" },
  Tab: { macOS: "⇥", Other: "⭾" },
  Enter: { macOS: "↩", Other: "↵" },
  Escape: { macOS: "⎋", Other: "Esc" },
  Backspace: { macOS: "⌫", Other: "⟵" },
  ArrowUp: { Other: "↑" },
  ArrowDown: { Other: "↓" },
  ArrowLeft: { Other: "←" },
  ArrowRight: { Other: "→" },
  Insert: { Other: "Ins" },
  Delete: { macOS: "⌦", Other: "Del" },
  Home: { macOS: "↖", Other: "Home" },
  End: { macOS: "↘", Other: "End" },
  PageUp: { macOS: "⇞", Other: "PgUp" },
  PageDown: { macOS: "⇟", Other: "PgDn" },
  Shift: { macOS: "⇧", Other: "Shift" },
  PrintScreen: { Other: "PrtSc" },
  ScrollLock: { macOS: "⤓", Other: "ScrLk" },
  Pause: { macOS: "⎉", Other: "Pause" },
};

export function keybind<T extends string>(
  modifers: ModifierKeys[],
  keys: T[],
  tauriOs: OperatingSystem
) {
  if (keys.length === 0) return "";

  const os =
    tauriOs === "macOS" ? "macOS" : tauriOs === "windows" ? "Windows" : "Other";

  const keySymbol = keys.map(capitalize).map((key) => {
    const symbol = keySymbols[key];
    return symbol ? symbol[os] ?? symbol.Other : key;
  });

  if (os === "macOS" && !modifers.includes(ModifierKeys.Meta)) {
    const index = modifers.findIndex(
      (modifier) => modifier === ModifierKeys.Control
    );
    if (index !== -1) modifers[index] = ModifierKeys.Meta;
  }

  const modifierSymbol = modifers.map((modifier) => {
    const symbol = modifierSymbols[modifier];
    return symbol[os] ?? symbol.Other;
  });

  const value = [...modifierSymbol, ...keySymbol].join(
    os === "macOS" ? "" : "+"
  );

  //we don't want modifer symbols and key symbols to be duplicated if they are the same value
  const noDuplicates = [...new Set(value.split("+"))].join("+");

  return noDuplicates;
}

export function keybindForOs(
  os: OperatingSystem
): (modifers: ModifierKeys[], keys: string[]) => string {
  return (modifers: ModifierKeys[], keys: string[]) =>
    keybind(modifers, keys, os);
}
