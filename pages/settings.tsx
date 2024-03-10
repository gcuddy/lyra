import { Themes, useThemePreferences } from "@/atoms/preferences";
import { Heading } from "@/components/settings/heading";
import { HuePicker } from "@/components/settings/hue-picker";
import Setting from "@/components/settings/setting";
import { Select, SelectOption } from "@/components/ui/select";
import { changeHueValue } from "@/hooks/useTheme";
import { useRouter } from "next/router";
import { useEffect } from "react";

// million-ignore
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
	}, [router]);

	return (
		<div className="bg-app relative w-full flex">
			<div className="relative flex h-full max-h-screen w-full grow-0 pt-6">
				<div className="flex w-full max-w-4xl flex-col te space-y-6 px-12 pb-5 pt-2">
					<Heading title="Settings" description="Change the look and feel." />
					<div className="flex flex-col gap-4 pointer-events-auto">
						{/* TODO: when we have more than one section lol */}
						{/* <span className="mb-3 text-lg font-bold text-ink tracking-tight">
							Appearance
						</span> */}
						<Setting title="Theme" mini description="Change the current theme.">
							<Select
								onChange={(value) => {
									if (value === "system") {
										setThemePrefs({ ...themePrefs, system: true });
									} else {
										setThemePrefs({
											...themePrefs,
											system: false,
											theme: value as Themes,
										});
									}
								}}
								value={themePrefs.system ? "system" : themePrefs.theme}
							>
								<SelectOption value="light">Light</SelectOption>
								<SelectOption value="dark">Dark</SelectOption>
								<SelectOption value="system">System</SelectOption>
							</Select>
						</Setting>
						<Setting
							title="Hue"
							mini
							description="Change the color scheme for the current theme."
						>
							<HuePicker
								className="max-w-md pointer-events-auto"
								value={[themePrefs.hueValue]}
								onValueChange={(value) => {
									changeHueValue(themePrefs.theme, value[0]);
									setThemePrefs({ ...themePrefs, hueValue: value[0] });
								}}
							/>
						</Setting>
					</div>
					<div className="block h-4 shrink-0" />
				</div>
			</div>
		</div>
	);
}
