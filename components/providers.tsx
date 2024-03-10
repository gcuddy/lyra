import { useDirectoryPath } from "@/atoms/paths";
import { open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { Store } from "tauri-plugin-store-api";

export function Providers({ children }: { children: React.ReactNode }) {
	const [, setDirectoryPath] = useDirectoryPath();

	const store = useMemo(() => new Store(".settings.json"), []);

	useEffect(() => {
		async function getInitialDirectoryPath() {
			const store = new Store(".settings.json");
			const directoryPath = await store.get<string>("directory");
			if (directoryPath && typeof directoryPath === "string") {
				setDirectoryPath(directoryPath);
			}
		}
		getInitialDirectoryPath();
	}, [setDirectoryPath]);

	const router = useRouter();

	useEffect(() => {
		async function getAndSetDirectory() {
			console.log('open directory')
			const selected = await open({
				directory: true,
			});
			console.log('selected', selected)
			if (selected && typeof selected === "string") setDirectoryPath(selected);
			await store.set("directory", selected);
			await store.save();
		}
		const unlistener = listen("openDirectory", getAndSetDirectory);
		return () => {
			unlistener.then((unlisten) => unlisten());
		};
	}, [setDirectoryPath, store]);

	useEffect(() => {
		const unlistener = listen("preferences", () => {
			router.push("/settings");
		});

		return () => {
			unlistener.then((unlisten) => unlisten());
		};
	}, [router]);

	return children;

}
