import Image from "next/image";
import { Inter } from "next/font/google";
import Greet from "./greet";
import TopBar from "@/components/top-bar";
import SourceList from "@/components/source-list";
import Library from "@/components/library";
// import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/api/dialog";
import { useEffect, useState } from "react";
import type { WebviewWindow } from "@tauri-apps/api/window";
import { Store } from "tauri-plugin-store-api";
import { useDirectoryPath } from "@/atoms/paths";
import { useMainScrollRef } from "@/atoms/refs";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [directoryPath, setDirectoryPath] = useDirectoryPath();
  const [mainScrollRef] = useMainScrollRef();
  return (
    <>
      {directoryPath ? (
        <Library scrollElement={mainScrollRef} path={directoryPath} />
      ) : (
        <>
          <div>Please select a directory</div>
        </>
      )}
    </>
  );
}
