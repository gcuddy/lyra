import { Themes, useThemePreferences } from "@/atoms/preferences";
import { NoSSR } from "@/components/no-ssr";
import { Heading } from "@/components/settings/heading";
import { HuePicker } from "@/components/settings/hue-picker";
import Setting from "@/components/settings/setting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { changeHueValue } from "@/hooks/useTheme";
import { Spinner } from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/tauri";
import { atom, useAtom } from "jotai";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Store } from "tauri-plugin-store-api";

// million-ignore
export default function Page() {
	return (
		<NoSSR>
			<SettingsInner />
		</NoSSR>
	)
}

function SettingsInner() {
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

					<Heading title="Extras" description="Connect to outside sources." />
					<div className="flex flex-col gap-4 pointer-events-auto">
						<LastFm />
					</div>
				</div>
			</div>
		</div>
	);
}


type LastFmData = {
	name: string;
	key: string;
}

const lastFmAtom = atom<LastFmData | null>(null);

function useLastfm() {
	const store = new Store('extensions.json')
	const [lastfm, _setLastfm] = useAtom(lastFmAtom);

	useEffect(() => {
		store.get<LastFmData>('lastfm').then((data) => {
			_setLastfm(data)
		})
	}, [_setLastfm])

	function setLastfm(data: LastFmData | null) {
		if (data === null) {
			store.delete('lastfm')
			_setLastfm(null)
			return
		}
		store.set('lastfm', data)
		_setLastfm(data)
	}

	return [lastfm, setLastfm] as const
}

function LastFm() {


	const [lastFm, setLastFm] = useLastfm();
	const [loading, setLoading] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	async function handleSubmit() {
		setError("")
		setLoading(true)
		try {
			const response = await invoke<LastFmData>("lastfm_authenticate", { username, password })
			setLastFm(response)
		} catch {
			console.error("Failed to authenticate with Last.fm")
			setError("Failed to authenticate with Last.fm")
		}
		setLoading(false)
	}

	return (
		<Setting
			title="Last.fm"
			mini
			description="Connect your Last.fm account."
		>
			{lastFm ? (
				<>
					<p>Connected as {lastFm.name}</p>
					<Button onClick={() => setLastFm(null)}>Disconnect</Button>
				</>
			) : (
				<form onSubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}>
					<label>Username
						<Input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
					</label>
					<label>Password
						<Input type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</label>
					{error && <p className="text-red-500">{error}</p>}
					<Button type="submit">Connect
						<Spinner className={`ml-2 ${loading ? "animate-spin" : "hidden"}`} />
					</Button>
				</form>
			)}
		</Setting>
	)
}
