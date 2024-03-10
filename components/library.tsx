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

interface LibraryProps {
	path: string;
	scrollElement?: Element | null;
}

export const BOTTOM_BAR_HEIGHT = 32;

export default function Library({ path, scrollElement }: LibraryProps) {
	console.log("rendering library", path);
	// read directory
	const parentRef = useRef<HTMLDivElement>(null);
	// const [listOffset, setListOffset] = useState(0);
	const [selectedSong, setSelectedSong] = useAtom(selectedSongAtom);
	const isInspectorOpen = useAtomValue(isInspectorOpenAtom);
	const [, setLoadedSong] = useAtom(setLoadedSongAndUpdateQueue);

	// useEffect(() => {
	// 	emitf:q("selectionchange", !!selectedSong);
	// }, [selectedSong]);
	//


	const { data: musicFiles } = useAtomValue(musicFilesQueryAtom);
	//
	// const { data: musicFiles } = useQuery({
	// 	queryKey: ["musicFiles", path],
	// 	queryFn: async () => {
	// 		function parseMusicFiles(dir: FileEntry[], acc: string[] = []) {
	// 			for (let i = 0; i < dir.length; ++i) {
	// 				const file = dir[i];
	// 				if (file.children) {
	// 					parseMusicFiles(file.children, acc);
	// 				} else if (
	// 					file.name?.startsWith(".") === false &&
	// 					isAudioFile(file.name)
	// 				) {
	// 					acc.push(file.path);
	// 				}
	// 			}
	// 			return acc;
	// 		}
	// 		const dir = await readDir(path, {
	// 			recursive: true,
	// 		});
	// 		const files = parseMusicFiles(dir);
	// 		return files
	// 	}
	// })
	console.log({ musicFiles })

	// const libraryAtom = atomWithQuery((get) => ({
	// 	queryKey: ["library"],
	// 	queryFn: async () =>
	// 		invoke<RawSong[]>("process_music_files", {
	// 			paths: musicFiles,
	// 		}),
	// 	enabled: !!musicFiles?.length,
	// 	select: (data: RawSong[]) => {
	// 		const search = get(searchAtom);
	// 		if (search === "") return data;
	// 		const filtered = data.filter((song) =>
	// 			`${song.title} ${song.artist} ${song.album_artist} ${song.album_title}`
	// 				.toLowerCase()
	// 				.includes(search.toLowerCase()),
	// 		);
	// 		return filtered;
	// 	},
	// }))
	// 	placeholderData: keepPreviousData
	//
	const { data: library, isLoading } = useAtomValue(libraryQueryAtom);
	console.log({ library });



	// useLayoutEffect(() => setListOffset(parentRef.current?.offsetTop ?? 0), []);

	// useEffect(() => {
	// 	function listen(event: KeyboardEvent) {
	// 		if (event.key === " ") {
	// 			// look into it
	// 			console.log({ event });
	// 			// TODO: prevent scroll (might involve setting overflow-hidden/auto)
	// 		}
	// 	}
	//
	// 	window.addEventListener("keydown", listen);
	// 	return () => {
	// 		window.removeEventListener("keydown", listen);
	// 	};
	// }, []);

	// TODO: this shouldn't be everything
	useOutsideClick(parentRef, () => {
		// console.log('clicked outside');
		setSelectedSong(null);
	});

	const sRef = useRef<HTMLDivElement>(null);

	if (isLoading || !library) return <div>Loading...</div>;
	if (!scrollElement) return null;


	return (
		<div className="flex flex-1 w-full overflow-hidden">
			<div ref={sRef}>
				<List
					path={path}
					songs={library}
				/>
			</div>
		</div>
	)


}

export const INSPECTOR_WIDTH = 260;

export const MetaContainer = tw.div`flex flex-col px-4 py-2 gap-1`;
export const MetaTitle = tw.h5`text-xs font-bold text-ink`;

function Inspector({
	scrollElement,
}: {
	scrollElement: RefObject<HTMLElement>;
}) {
	const selectedSong = useAtomValue(selectedSongAtom);
	const [selectedImageDataUrl] = useSelectedImageDataUrl();

	console.log({ scrollElement });

	if (!scrollElement.current) return null;

	return (
		<BasicSticky scrollElement={scrollElement.current}>
			<div
				style={{
					width: INSPECTOR_WIDTH,
					paddingBottom: BOTTOM_BAR_HEIGHT,
				}}
				className="absolute right-1.5 flex flex-col gap-2 top-0 pl-3 pr-1.5"
			>
				<div className="aspect-square">
					{selectedImageDataUrl.state === "hasData" &&
						selectedImageDataUrl.data ? (
						<img
							alt=""
							className="h-full w-full object-contain"
							src={selectedImageDataUrl.data}
						/>
					) : (
						<div className="bg-app-darkBox h-full w-full" />
					)}
				</div>
				<div className="border border-app-line shadow-app-shade/10 bg-app-box rounded-lg py-0.5 pointer-events-auto flex select-text flex-col overflow-hidden ">
					{!selectedSong ? (
						<div className="flex h-[240px] items-center justify-center text-sm text-ink-dul">
							No selection
						</div>
					) : (
						<>
							<MetaContainer>
								<MetaData
									label="Artist"
									icon={MicrophoneStage}
									value={selectedSong?.artist}
								/>
								<MetaData
									label="Title"
									icon={MusicNoteSimple}
									value={selectedSong?.title}
								/>
								<MetaData
									label="Album"
									icon={VinylRecord}
									value={selectedSong?.album_title}
								/>
								<MetaData
									label="Genre"
									icon={Guitar}
									value={selectedSong?.genre}
								/>
							</MetaContainer>
							<MetaContainer>
								<MetaData label="Year" value={selectedSong?.year} />
								<MetaData
									label="Disc"
									value={`${selectedSong?.disc_number} of ${selectedSong?.disc_total}`}
								/>
								<MetaData
									label="Track"
									value={`${selectedSong?.track_number} of ${selectedSong?.track_total}`}
								/>
							</MetaContainer>
							<MetaContainer>
								<MetaTitle>Properties</MetaTitle>
								<MetaData
									label="Duration"
									value={format(selectedSong?.duration_ms ?? 0, "mm:ss")}
								/>
								<MetaData
									label="Bitrate"
									value={`${selectedSong?.audio_bitrate} kbps`}
								/>
							</MetaContainer>
						</>
					)}
				</div>
			</div>
		</BasicSticky>
	);
}
interface MetaDataProps {
	icon?: PhosphorIcon;
	label: string;
	value: ReactNode;
	tooltipValue?: ReactNode;
	onClick?: () => void;
}

// TODO: edit prop and tooltip
export const MetaData = ({
	icon: Icon,
	label,
	value,
	tooltipValue,
	onClick,
}: MetaDataProps) => {
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div className="flex items-center text-xs text-ink-dull" onClick={onClick}>
			{Icon && <Icon weight="bold" className="mr-2 shrink-0" />}
			<span className="mr-2 flex-1 whitespace-nowrap">{label}</span>
			<Tooltip label={tooltipValue || value} asChild>
				<span className="truncate break-all text-ink">{value ?? "--"}</span>
			</Tooltip>
		</div>
	);
};

function BottomBar() {
	const [filteredLibraryCount] = useAtom(filteredLibraryCountAtom);
	const leftSidebarWidth = useAtomValue(leftSidebarWidthAtom);
	const [isInspectorOpen, setIsInspectorOpen] = useAtom(isInspectorOpenAtom);

	// bizarre to handle this logic here, but whatever

	useEffect(() => {
		invoke("toggle_inspector_text", {
			show: isInspectorOpen,
		});
	}, [isInspectorOpen]);

	useEffect(() => {
		const unlisten = listen("toggle-inspector", () => {
			setIsInspectorOpen((current) => !current);
		});
		return () => {
			unlisten.then((u) => u());
		};
	}, [setIsInspectorOpen]);
	return (
		<div
			className="fixed bottom-0 z-10 bg-app/80 flex justify-between items-center gap-1 border-t border-t-app-line px-3.5 text-xs text-ink-dull backdrop-blur-lg"
			style={{
				height: BOTTOM_BAR_HEIGHT,
				width: `calc(100% - ${leftSidebarWidth}px`,
			}}
		>
			<div className="flex-grow">
				<span>{filteredLibraryCount} songs</span>
			</div>
			<div>
				<Button
					onClick={() => {
						setIsInspectorOpen(!isInspectorOpen);
					}}
					variant="subtle"
					size="icon"
					className={cn(isInspectorOpen && "bg-app-selected/50")}
				>
					<Info className="shrink-0 h-4 w-4" />
				</Button>
			</div>
			{/* <div className="flex-grow">
            <span>0:00</span>
        </div>
        <div className="flex-grow">
            <span>0:00</span>
        </div> */}
		</div>
	);
}

const LibraryItem = memo(function LibraryItem({
	row,
	paddingLeft = 0,
	paddingRight = 0,
	isSelected,
}: {
	row: Row<RawSong>;
	isSelected: boolean;
	paddingLeft: number;
	paddingRight: number;
}) {
	console.log("rendering library item", row.original.id);
	// const setSelectedSong = useSetAtom(selectedSongAtom);
	// const setLoadedSong = useSetAtom(setLoadedSongAndUpdateQueue);
	return (
		<>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				// onClick={() => {
				// 	setSelectedSong(row.original);
				// }}
				// onDoubleClick={() => {
				// 	setLoadedSong(row.original);
				// }}
				// h-full grow grid grid-cols-3 items-center select-none cursor-default truncate
				className={"relative flex h-full items-center"}
			>
				{row.getVisibleCells().map((cell) => {
					return (
						<div
							role="cell"
							key={cell.id}
							className="table-cell shrink-0 px-4 text-xs truncate cursor-default"
							style={{ width: cell.column.getSize() }}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</div>
					);
				})}
			</div>
		</>
	);
});
