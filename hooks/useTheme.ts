import { themeAtom } from "@/atoms/preferences";
import { useAtom } from "jotai";
import { useEffect, useMemo } from "react";

// import { usePlatform } from '..';

export function changeHueValue(mode: "light" | "dark", hueValue: number) {
  document.documentElement.style.setProperty(
    `--${mode}-hue`,
    hueValue.toString()
  );
}

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  // const { lockAppTheme } = usePlatform();
  const systemTheme = useMemo<MediaQueryList>(
    () => window.matchMedia("(prefers-color-scheme: dark)"),
    []
  );

  useEffect(() => {
    const handleThemeChange = () => {
      if (theme.system) {
        if (systemTheme.matches) {
          document.documentElement.classList.remove("light");
          document.documentElement.style.setProperty(
            "--dark-hue",
            theme.hueValue.toString()
          );
          setTheme({ ...theme, theme: "dark" });
        } else {
          document.documentElement.classList.add("light");
          document.documentElement.style.setProperty(
            "--light-hue",
            theme.hueValue.toString()
          );
          setTheme({ ...theme, theme: "light" });
        }
      } else {
        if (theme.theme === "dark") {
          document.documentElement.classList.remove("light");
          document.documentElement.style.setProperty(
            "--dark-hue",
            theme.hueValue.toString()
          );
        } else if (theme.theme === "light") {
          document.documentElement.classList.add("light");
          document.documentElement.style.setProperty(
            "--light-hue",
            theme.hueValue.toString()
          );
        }
      }
    };

    handleThemeChange();

    systemTheme.addEventListener("change", handleThemeChange);

    return () => {
      systemTheme.removeEventListener("change", handleThemeChange);
    };
  }, [systemTheme]);
}
