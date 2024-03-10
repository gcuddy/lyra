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
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type FileEntry, readDir } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { produce } from "immer";
import {
	ReactNode,
	RefObject,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import BasicSticky from "react-sticky-el";

import { isInspectorOpenAtom } from "@/atoms/inspector";
import {
	filteredLibraryAtom,
	filteredLibraryCountAtom,
	libraryAtom,
	searchAtom,
	selectedSongAtom,
	setLoadedSongAndUpdateQueue,
	useSelectedImageDataUrl,
} from "@/atoms/library";
import { leftSidebarWidthAtom } from "@/atoms/sizes";
import { tw } from "@/lib/tailwind";
import { cn } from "@/lib/utils";
import { useTable } from "@/view/table";
import { Row, flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { emit, listen } from "@tauri-apps/api/event";
import clsx from "clsx";
import { format } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithQuery } from 'jotai-tanstack-query'
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
					scrollElement={sRef}
				/>
			</div>
		</div>
	)


	return (
		<div className="flex flex-1 w-full overflow-hidden">
			<div
				ref={parentRef}
				onKeyDown={(e) => {
					console.log({ e });
				}}
				className=" bg-app relative overscroll-none"
				style={{
					height: "100%",
					width: "100%",
					overflow: "auto",
					pointerEvents: "auto",
					paddingRight: isInspectorOpen ? INSPECTOR_WIDTH + 4 : 0,
				}}
			>
				{/* <button
          onClick={() => {
            console.time("read_music_files");
            invoke<RawSong[]>("process_music_files", {
              paths: musicFiles,
            }).then((metadata) => {
              console.log({ metadata });
              console.timeEnd("read_music_files");
              //   if (metadata?.length) {
              //     console.log("got metadata length");
              //     setLibrary(metadata);
              //   }
            });
          }}
        >
          parse
        </button>
        <div>{library.length} songs</div> */}
				<BasicSticky
					scrollElement={parentRef.current ?? undefined}
					stickyStyle={{ zIndex: 10 }}
					//   stickyStyle={{ top, zIndex: 10 }}
					//   topOffset={-top}
					// Without this the width of the element doesn't get updated
					// when the inspector is toggled
					positionRecheckInterval={100}
				>
					<ContextMenu.Root
						trigger={
							<div className="border-b bg-app/90 backdrop-saturate-[1.2] backdrop-blur-lg border-app-line overflow-x-auto overscroll-x-none">
								{table.getHeaderGroups().map((headerGroup) => (
									<div
										key={headerGroup.id}
										className="flex w-fit divide-x divide-app-line"
									>
										{headerGroup.headers.map((header, i) => {
											const size = header.column.getSize();

											// const orderKey
											const cellContent = flexRender(
												header.column.columnDef.header,
												header.getContext(),
											);

											const firstSort = table.getState().sorting[0];

											const isActive = header.id === firstSort?.id;

											return (
												<div key={header.id}>
													{header.isPlaceholder ? null : (
														<button
															type="button"
															style={{
																width: size,
															}}
															className="relative select-none cursor-default flex items-center justify-between gap-3 px-4 py-2 text-xs active:bg-app-focus"
															onClick={() => {
																// see table.tsx - we set [0] because [1] is album and [2] is track, for tiebreakers
																table.setSorting(
																	produce((draft) => {
																		if (draft[0].id === header.id) {
																			draft[0].desc = !draft[0].desc;
																		}
																		draft[0].id = header.id;
																	}),
																);
															}}
														>
															<div className="truncate">
																<span
																	className={clsx(isActive && "font-medium")}
																>
																	{cellContent}
																</span>
															</div>
															{isActive ? (
																firstSort?.desc ? (
																	<CaretDown className="shrink-0 text-ink-faint" />
																) : (
																	<CaretUp className="shrink-0 text-ink-faint" />
																)
															) : null}
														</button>
													)}
												</div>
											);
										})}
									</div>
								))}
							</div>
						}
					>
						{table.getAllLeafColumns().map((column) => {
							if (column.id === "name") return null;
							return (
								<ContextMenu.CheckboxItem
									key={column.id}
									checked={column.getIsVisible()}
									onSelect={column.getToggleVisibilityHandler()}
									label={
										typeof column.columnDef.header === "string"
											? column.columnDef.header
											: column.id
									}
								/>
							);
						})}
					</ContextMenu.Root>
				</BasicSticky>
				{/* table body ref */}
				<div className="overflow-x-auto overscroll-x-none">
					<div
						className="relative"
						style={{
							height: `${rowVirtualizer.getTotalSize()}px`,
						}}
					>
						<For each={rowVirtualizer.getVirtualItems()} as="div">
							{(virtualItem) => {
								// we don't have to use normal td's here because it's a desktop app

								const row = rows[virtualItem.index];

								const selected = selectedSong?.id === row?.id;

								if (!row) return <></>;

								return (
									// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
									<div
										key={row.id}
										className="absolute left-0 top-0 min-w-full"
										style={{
											height: `${virtualItem.size}px`,
											transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin
												}px)`,
										}}
										onClick={() => {
											setSelectedSong(row.original);
										}}
										onDoubleClick={() => {
											setLoadedSong(row.original);
										}}
									>
										<div
											className={cn(
												"absolute inset-0 rounded-md border",
												virtualItem.index % 2 === 0 && "bg-app-darkBox",
												selected
													? "border-accent !bg-accent/10"
													: "border-transparent",
											)}
										>
											<LibraryItem
												row={row}
												paddingLeft={padding.left}
												paddingRight={padding.right}
											/>
										</div>
									</div>
								);
							}}
						</For>
					</div>
					<BottomBar />
				</div>
			</div>
			{isInspectorOpen && <Inspector scrollElement={parentRef} />}
		</div>
	);
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
