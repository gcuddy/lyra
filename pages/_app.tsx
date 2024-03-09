import { useDirectoryPath } from "@/atoms/paths";
import { useMainScrollRef } from "@/atoms/refs";
import TopBar from "@/components/top-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/styles/globals.css";
// import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { Store } from "tauri-plugin-store-api";
const SourceList = dynamic(() => import("@/components/source-list"), {
	ssr: false,
});

const inter = Inter({ subsets: ["latin"] });
export default function App({ Component, pageProps }: AppProps) {
	// could maybe move this logic into library component
	const [mainScrollRef, setMainScrollRef] = useMainScrollRef();

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
			const selected = await open({
				directory: true,
			});
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

	return (
		<TooltipProvider>
			<main
				className={`flex select-none pointer-events-none min-h-screen overscroll-none  h-16 flex-col items-center justify-between bg-app/90 overflow-hidden ${inter.className}`}
			>
				<TopBar />
				<div
					ref={setMainScrollRef}
					className="flex grow h-[calc(100%-80px)] w-full"
				>
					<div style={{}} className="flex flex-col">
						<SourceList />
					</div>
					<Component {...pageProps} />
				</div>
			</main>
		</TooltipProvider>
	);
}
