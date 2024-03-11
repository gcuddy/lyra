import { isInspectorOpenAtom } from "@/atoms/inspector";
import { filteredSongsAtom, selectedSongAtom, setLoadedSongAndUpdateQueue, songsAtom } from "@/atoms/library";
import { cn } from "@/lib/utils";
import { useTable } from "@/view/table";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { ColumnSizingState, Row, flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { emit } from "@tauri-apps/api/event";
import clsx from "clsx";
import { produce } from "immer";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { For } from "million/react";
import {
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useOutsideClick } from "rooks";
import { BOTTOM_BAR_HEIGHT, BottomBar } from "./bottom-bar";
import { INSPECTOR_WIDTH, Inspector } from "./inspector";
import { ContextMenu } from "./ui/context-menu";
import useResizeObserver from "use-resize-observer";


export const TABLE_PADDING_X = 16;
export const TABLE_PADDING_Y = 12;
export default function List() {
	const tableRef = useRef<HTMLDivElement>(null);
	const [listOffset, setListOffset] = useState(0);
	const [selectedSong, setSelectedSong] = useAtom(selectedSongAtom);
	const [songs] = useAtom(filteredSongsAtom);

	const setLoadedSong = useSetAtom(setLoadedSongAndUpdateQueue);
	const isInspectorOpen = useAtomValue(isInspectorOpenAtom);

	useEffect(() => {
		emit("selectionchange", !!selectedSong);
	}, [selectedSong]);

	const { table } = useTable({ data: songs });

	const { rows } = table.getRowModel();
	const { columnSizing } = table.getState();

	//   or rows.length? does it matter?
	const count = rows?.length || songs?.length || 0;

	const padding = {
		top: 12,
		bottom: 12,
		left: 16,
		right: 16,
	};
	//   const [top, setTop] = useState(256);

	const rowVirtualizer = useVirtualizer({
		count,
		getScrollElement: useCallback(
			() => tableRef?.current,
			[tableRef],
		),
		estimateSize: useCallback(() => 35, []),
		getItemKey: (index) => songs[index]?.id,
		overscan: 20,
		paddingStart: padding.top,
		paddingEnd: padding.bottom + BOTTOM_BAR_HEIGHT,
		scrollMargin: listOffset,
	});

	useLayoutEffect(
		() => setListOffset(tableRef.current?.offsetTop ?? 0),
		[tableRef],
	);

	useOutsideClick(tableRef, () => {
		setSelectedSong(null);
	});

	useResizeObserver({
		ref: tableRef,
		onResize: ({ width }) => {
			if (!width) return;

			const sizing = table
				.getVisibleLeafColumns()
				.reduce(
					(sizing, column) => ({ ...sizing, [column.id]: column.getSize() }),
					{} as ColumnSizingState
				);
			const columnsWidth =
				Object.values(sizing).reduce((a, b) => a + b, 0) + TABLE_PADDING_X * 2;

			console.log({ width, columnsWidth, sizing });
			console.log("resize");
			const newNameSize = (sizing.title ?? 0) + (width - columnsWidth);
			const minNameColSize = table.getColumn('title')?.columnDef.minSize;
			console.log({ newNameSize, minNameColSize });

			if (minNameColSize !== undefined && newNameSize < minNameColSize) return;

			table.setColumnSizing({
				...columnSizing,
				title: newNameSize
			});
		},
	})

	return (
		<>
			<div
				ref={tableRef}
				className=" bg-app relative overscroll-x-none overflow-auto"
				style={{
					height: "100%",
					width: "100%",
					overflow: "auto",
					pointerEvents: "auto",
					// paddingRight: isInspectorOpen ? INSPECTOR_WIDTH + 4 : 0,
				}}
			>
				<div className="sticky top-0 z-10 w-fit">
					<ContextMenu.Root trigger={<div>
						<div className="border-b bg-app/90 backdrop-saturate-[1.2] backdrop-blur-lg border-app-line overscroll-x-none">
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
															width: i === 0 ||
																i ===
																headerGroup.headers.length -
																1
																? size + TABLE_PADDING_X
																: size
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
															<span className={clsx(isActive && "font-medium")}>
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
					</div>}>
						{table.getAllLeafColumns().map((column) => {
							if (column.id === 'name') return null;
							return (
								<ContextMenu.CheckboxItem
									key={column.id}
									checked={column.getIsVisible()}
									// TODO: this doesn't immediately trigger virtualizer to update
									onSelect={column.getToggleVisibilityHandler()}
									label={
										typeof column.columnDef.header === 'string'
											? column.columnDef.header
											: column.id
									}
								/>
							);
						})}
					</ContextMenu.Root>
				</div>
				{/* table body ref */}
				<div className="">
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
									<div
										key={row.id}
										className="absolute left-0 top-0 min-w-full"
										style={{
											height: `${virtualItem.size}px`,
											transform: `translateY(${virtualItem.start - rowVirtualizer.options.scrollMargin
												}px)`,
										}}
									>
										<div
											className={cn(
												"absolute inset-0 w-max rounded-md border",
												virtualItem.index % 2 === 0 && "bg-app-darkBox",
												selected
													? "border-accent !bg-accent/10"
													: "border-transparent",
											)}
											onClick={() => {
												setSelectedSong(row.original);
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													setLoadedSong(row.original);
												}
											}}
											onDoubleClick={() => {
												setLoadedSong(row.original);
											}}
										>
											<LibrarySong
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
					{/* <BottomBar /> */}
				</div>
			</div>
			{/* {isInspectorOpen && <Inspector />} */}
		</>
	);
}


type LibrarySongProps = {
	row: Row<RawSong>;
	paddingLeft: number;
	paddingRight: number;
};

const LibrarySong = ({ row }: LibrarySongProps) => {
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
	// return <>hello</>;
}

const LibrarySongMemoized = memo(({ row }: LibrarySongProps) => {
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
	// return <>hello</>;
});
LibrarySongMemoized.displayName = "LibrarySong";
