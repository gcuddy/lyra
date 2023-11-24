import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Image from "next/image";
import { Inter } from "next/font/google";
import Greet from "./greet";
import TopBar from "@/components/top-bar";
import Library from "@/components/library";
// import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/api/dialog";
import { useEffect, useState } from "react";
import type { WebviewWindow } from "@tauri-apps/api/window";
import { Store } from "tauri-plugin-store-api";
import { useDirectoryPath } from "@/atoms/paths";
import { useMainScrollRef } from "@/atoms/refs";
import dynamic from "next/dynamic";
import { listen } from "@tauri-apps/api/event";
import { useRouter } from "next/router";
const SourceList = dynamic(() => import("@/components/source-list"), {
  ssr: false,
});

const inter = Inter({ subsets: ["latin"] });
export default function App({ Component, pageProps }: AppProps) {
  // could maybe move this logic into library component
  const [appWindow, setAppWindow] = useState<WebviewWindow>();
  const [isAppWindowSetup, setIsAppWindowSetup] = useState<boolean>(false);
  const [mainScrollRef, setMainScrollRef] = useMainScrollRef();

  const [directoryListener, setDirectoryListener] =
    useState<Promise<() => void>>();
  const [, setDirectoryPath] = useDirectoryPath();

  async function setupAppWindow() {
    if (typeof window === "undefined") return;
    const appWindow = (await import("@tauri-apps/api/window")).appWindow;
    setAppWindow(appWindow);
  }

  async function getInitialDirectoryPath() {
    const store = new Store(".settings.json");
    const directoryPath = await store.get<string>("directory");
    if (directoryPath && typeof directoryPath === "string") {
      setDirectoryPath(directoryPath);
    }
  }

  async function getAndSetDirectory() {
    const selected = await open({
      directory: true,
    });
    if (selected && typeof selected === "string") setDirectoryPath(selected);
    await store.set("directory", selected);
    await store.save();
  }

  const store = new Store(".settings.json");

  useEffect(() => {
    if (isAppWindowSetup) return;
    setupAppWindow();
    setIsAppWindowSetup(true);
    getInitialDirectoryPath();
  }, []);

  const router = useRouter();

  useEffect(() => {
    const unlistener = listen("openDirectory", getAndSetDirectory);
    return () => {
      unlistener.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    const unlistener = listen("preferences", () => {
      router.push("/settings");
    });

    return () => {
      unlistener.then((unlisten) => unlisten());
    };
  }, [router]);

  return (
    <main
      className={`flex select-none pointer-events-none min-h-screen overscroll-none  h-16 flex-col items-center justify-between ${inter.className}`}
    >
      <TopBar />
      <div
        ref={setMainScrollRef}
        className="grid grid-cols-5 grow h-[calc(100%-64px)] w-full"
      >
        <div style={{}} className="flex flex-col basis-1/4 max-w-xs">
          <SourceList />
        </div>
        <Component {...pageProps} />
        {/* <div
          ref={setMainScrollRef}
          className="flex col-span-3 lg:col-span-4 flex-col pointer-events-auto"
        >
        </div> */}
      </div>
    </main>
  );
}
