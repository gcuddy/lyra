import { isInspectorOpenAtom } from "@/atoms/inspector";
import { selectedSongAtom, setLoadedSongAndUpdateQueue } from "@/atoms/library";
import { cn } from "@/lib/utils";
import { useTable } from "@/view/table";
import { CaretDown, CaretUp } from "@phosphor-icons/react";
import { Row, flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { emit } from "@tauri-apps/api/event";
import clsx from "clsx";
import { produce } from "immer";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { For } from "million/react";
import {
	RefObject,
	memo,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import BasicSticky from "react-sticky-el";
import { useOutsideClick } from "rooks";
import { BOTTOM_BAR_HEIGHT, INSPECTOR_WIDTH } from "./library";
import { ContextMenu } from "./ui/context-menu";

type LibraryProps = {
	path: string;
	scrollElement: RefObject<HTMLElement>;
	songs: RawSong[];
};

export default function List({ path, songs, scrollElement }: LibraryProps) {
	const tableRef = useRef<HTMLDivElement>(null);
	const [listOffset, setListOffset] = useState(0);
	const [selectedSong, setSelectedSong] = useAtom(selectedSongAtom);
	const setLoadedSong = useSetAtom(setLoadedSongAndUpdateQueue);
	const isInspectorOpen = useAtomValue(isInspectorOpenAtom);

	useEffect(() => {
		emit("selectionchange", !!selectedSong);
	}, [selectedSong]);

	const { table } = useTable({ data: songs });

	const { rows } = table.getRowModel();

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
			() => scrollElement?.current,
			[scrollElement],
		),
		estimateSize: useCallback(() => 35, []),
		getItemKey: (index) => songs[index]?.id,
		overscan: 20,
		paddingStart: padding.top,
		paddingEnd: padding.bottom + BOTTOM_BAR_HEIGHT,
		scrollMargin: listOffset,
	});

	useLayoutEffect(
		() => setListOffset(scrollElement.current?.offsetTop ?? 0),
		[scrollElement],
	);

	useOutsideClick(tableRef, () => {
		setSelectedSong(null);
	});

	return (
		<div
			ref={tableRef}
			className=" bg-app relative overscroll-none"
			style={{
				height: "100%",
				width: "100%",
				overflow: "auto",
				pointerEvents: "auto",
				paddingRight: isInspectorOpen ? INSPECTOR_WIDTH + 4 : 0,
			}}
		>
			<BasicSticky
				scrollElement={scrollElement.current ?? undefined}
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
								<div
									key={row.id}
									className="absolute left-0 top-0 min-w-full"
									style={{
										height: `${virtualItem.size}px`,
										transform: `translateY(${
											virtualItem.start - rowVirtualizer.options.scrollMargin
										}px)`,
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
			</div>
		</div>
	);
}

type LibrarySongProps = {
	row: Row<RawSong>;
	paddingLeft: number;
	paddingRight: number;
};

const LibrarySong = memo((props: LibrarySongProps) => {
	return <>hello</>;
});
