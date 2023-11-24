import { useThemePreferences } from "@/atoms/preferences";
import { Slider } from "@/components/ui/slider";
import { changeHueValue } from "@/hooks/useTheme";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Settings() {
  const router = useRouter();
  const [themePrefs, setThemePrefs] = useThemePreferences();

  useEffect(() => {
    // escape key goes back
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.back();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div>
      <h1>Settings</h1>
      <div>
        <div className="bg-app-card pointer-events-auto">
          <h2>Appearance</h2>
          <label>
            Hue: {themePrefs.hueValue}
            <Slider
              min={0}
              max={360}
              step={1}
              value={[themePrefs.hueValue]}
              onValueChange={(value) => {
                changeHueValue(themePrefs.theme, value[0]);
                setThemePrefs({ ...themePrefs, hueValue: value[0] });
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
