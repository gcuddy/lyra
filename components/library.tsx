import {
	CaretDown,
	CaretUp,
	Guitar,
	type Icon as PhosphorIcon,
	Info,
	MicrophoneStage,
	MusicNoteSimple,
	VinylRecord,
} from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/tauri";
import { produce } from "immer";
import {
	ReactNode,
	RefObject,
	memo,
	useEffect,
	useRef,
} from "react";
import BasicSticky from "react-sticky-el";

import { isInspectorOpenAtom } from "@/atoms/inspector";
import {
	filteredLibraryCountAtom,
	selectedSongAtom,
	setLoadedSongAndUpdateQueue,
	useSelectedImageDataUrl,
} from "@/atoms/library";
import { leftSidebarWidthAtom } from "@/atoms/sizes";
import { tw } from "@/lib/tailwind";
import { cn } from "@/lib/utils";
import { Row, flexRender } from "@tanstack/react-table";
import { listen } from "@tauri-apps/api/event";
import clsx from "clsx";
import { format } from "date-fns";
import { useAtom, useAtomValue } from "jotai";
import { For } from "million/react";
import { useOutsideClick } from "rooks";
import { Button } from "./ui/button";
import { ContextMenu } from "./ui/context-menu";
import { Tooltip } from "./ui/tooltip";
import List from "./list";
import { libraryQueryAtom, musicFilesQueryAtom } from "@/atoms/queries";
import { BrowserContextProvider, useBrowser } from "@/context/browser";

interface LibraryProps {
	path: string;
	scrollElement?: Element | null;
}


export default function Library({ path, scrollElement }: LibraryProps) {
	console.log("rendering library", path);
	const parentRef = useRef<HTMLDivElement>(null);
	const browser = useBrowser();
	const { data: musicFiles } = useAtomValue(musicFilesQueryAtom);
	console.log({ musicFiles })
	const { data: library, isLoading } = useAtomValue(libraryQueryAtom);
	console.log({ library });

	// TODO: this shouldn't be everything
	// useOutsideClick(parentRef, () => {
	// 	// console.log('clicked outside');
	// 	setSelectedSong(null);
	// });

	if (isLoading || !library) return <div>Loading...</div>;


	return (
		// TODO: put in its own component, since this should wrap list
		// TODO: figure out overscroll
		<div className="flex flex-1 relative">
			<div className="h-full w-full">
				<List
					path={path}
					songs={library}
				/>
			</div>
		</div>
	)


}
