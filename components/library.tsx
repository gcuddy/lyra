import { CaretDown, CaretUp, Info } from "@phosphor-icons/react";

import { usePaths } from "@/atoms/paths";
import { readDir, type FileEntry } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { produce } from "immer";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import BasicSticky from "react-sticky-el";

import { useAudioPlayer } from "@/atoms/audio";
import {
  filteredLibraryCountAtom,
  selectedSongAtom,
  setLoadedSongAndUpdateQueue,
  useFilteredLibrary,
  useLibrary,
  useLoadedSong,
  usePlaying,
  useSelectedSong,
} from "@/atoms/library";
import { useTable } from "@/view/table";
import {
  ColumnDef,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { For } from "million/react";
import { cn } from "@/lib/utils";
import { leftSidebarWidthAtom } from "@/atoms/sizes";
import { Button } from "./ui/button";

interface LibraryProps {
  path: string;
  scrollElement?: Element | null;
}

export const BOTTOM_BAR_HEIGHT = 32;

export default function Library({ path, scrollElement }: LibraryProps) {
  console.log("rendering library", path);
  // read directory
  const [fileEntries, setFileEntries] = useState<FileEntry[]>();
  const [isParsing, setIsParsing] = useState(false);
  const [musicFiles, setMusicFiles] = usePaths();
  const [library] = useFilteredLibrary();
  const [, setLibrary] = useLibrary();
  const parentRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = usePlaying();
  const [audio] = useAudioPlayer();
  const [listOffset, setListOffset] = useState(0);
  const [selectedSong, setSelectedSong] = useSelectedSong();
  const setLoadedSong = useSetAtom(setLoadedSongAndUpdateQueue);

  //   const [sort, setSort] = useSort();
  //   console.log({ sort });

  const { table } = useTable({ data: library });

  const { columnVisibility, columnSizing } = table.getState();
  const { rows, rowsById } = table.getRowModel();

  //   or rows.length?
  const count = library?.length || 0;

  const padding = {
    top: 12,
    bottom: 12,
    left: 16,
    right: 16,
  };
  const [top, setTop] = useState(256);

  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: useCallback(() => parentRef.current, [parentRef]),
    estimateSize: useCallback(() => 35, []),
    getItemKey: (index) => library[index]?.id,
    overscan: 20,
    paddingStart: padding.top,
    paddingEnd: padding.bottom + BOTTOM_BAR_HEIGHT,
    scrollMargin: listOffset,
  });

  function isAudioFile(filename: string): boolean {
    return filename.match(/\.(mp3|ogg|aac|flac|wav|m4a)$/) !== null;
  }

  function parseMusicFiles(dir: FileEntry[], acc: string[] = []) {
    for (let i = 0; i < dir.length; ++i) {
      const file = dir[i];
      if (file.children) {
        parseMusicFiles(file.children, acc);
      } else if (
        file.name?.startsWith(".") === false &&
        isAudioFile(file.name)
      ) {
        acc.push(file.path);
      }
    }
    return acc;
  }

  console.log({ library });

  async function fn_parse() {
    if (isParsing) return;
    console.time("read_music_files");
    setIsParsing(true);
    console.log("files", musicFiles.length);
    const metadata = await invoke<RawSong[]>("process_music_files", {
      paths: musicFiles,
    });
    console.log({ metadata });
    if (metadata?.length) {
      console.log("got metadata length");
      setLibrary(metadata);
    }
    console.log("done");
    console.timeEnd("read_music_files");
    setIsParsing(false);
  }

  async function readDirectory() {
    const dir = await readDir(path, {
      recursive: true,
    });
    console.log({ dir });
    const files = parseMusicFiles(dir);
    console.log({ files });
    setMusicFiles(files);
    fn_parse();
    // const metadata = await Promise.all(
    //   files.map((file) => invoke("read_music_file", { path: file }))
    // );

    // does this work?

    // take two

    // console.log({ metadata });
  }

  useEffect(() => {
    readDirectory();
  }, []);

  //   if (isParsing) {
  //     return <div>Reading music files...</div>;
  //   }

  const virtualRows = rowVirtualizer.getVirtualItems();
  useLayoutEffect(() => setListOffset(parentRef.current?.offsetTop ?? 0), []);

  return (
    <>
      <div
        ref={parentRef}
        className="col-span-4 bg-app relative overscroll-none"
        style={{
          height: `100%`,
          width: "100%",
          overflow: "auto",
          pointerEvents: "auto",
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
                    header.getContext()
                  );

                  const firstSort = table.getState().sorting[0];

                  const isActive = header.id === firstSort?.id;

                  return (
                    <div key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
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
                              })
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

                // TODO: selected magic here

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
                    {/* todo: selected indicator */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-md border",
                        virtualItem.index % 2 === 0 && "bg-app-darkBox",
                        selected
                          ? "border-accent !bg-accent/10"
                          : "border-transparent"
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
      {/* <button
        onClick={() => {
          readDirectory();
        }}
      >
        Re-sync
      </button> */}
      {/* <div className="pointer-events-auto">
        <button
          onClick={() => {
            fn_parse();
          }}
        >
          Parse with Rust
        </button>
        <button
          onClick={() => {
            js_parse();
          }}
        >
          Parse with JS
        </button>
      </div>
      <span>
        You have {musicFiles.length} music files in {path}
      </span> */}
      {/* {JSON.stringify(library)} */}
    </>
  );
}

export const INSPECTOR_WIDTH = 256;

function Inspector({ scrollElement }: { scrollElement?: HTMLElement | null }) {
  <BasicSticky scrollElement={scrollElement ?? undefined}>
    <div
      style={{
        width: INSPECTOR_WIDTH,
      }}
      className="flex select-text flex-col overflow-hidden rounded-lg border border-app-line bg-app-box py-0.5 shadow-app-shade/10"
    >
      Metadata
    </div>
  </BasicSticky>;
}

function BottomBar() {
  const [filteredLibraryCount] = useAtom(filteredLibraryCountAtom);
  const leftSidebarWidth = useAtomValue(leftSidebarWidthAtom);
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
        <Button variant="subtle" size="icon">
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

const LibraryItem = memo(
  ({
    row,
    paddingLeft = 0,
    paddingRight = 0,
  }: {
    row: Row<RawSong>;
    paddingLeft: number;
    paddingRight: number;
  }) => {
    console.log("rendering library item", row.original.id);
    const setSelectedSong = useSetAtom(selectedSongAtom);
    const setLoadedSong = useSetAtom(setLoadedSongAndUpdateQueue);
    return (
      <>
        <div
          onClick={() => {
            setSelectedSong(row.original);
          }}
          onDoubleClick={() => {
            setLoadedSong(row.original);
          }}
          // h-full grow grid grid-cols-3 items-center select-none cursor-default truncate
          className={`relative flex h-full items-center`}
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
          {/* <span className="truncate">{song?.title}</span>
        <span className="truncate">{song.artist}</span>
        <span className="truncate">{song.album_title}</span> */}
        </div>
      </>
    );
  }
);

function Table({ data = [] }: { data: RawSong[] }) {
  const parentRef = useRef<HTMLTableElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<RawSong>[]>(
    () => [
      {
        accessorKey: "title",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "artist",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "album",
        cell: (info) => info.getValue(),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const { rows } = table.getRowModel();

  const [scrollMargin, setScrollMargin] = useState(0);
  const updateMargin = useCallback((node: HTMLDivElement | null) => {
    setScrollMargin(node?.offsetTop ?? 0);
  }, []);

  return (
    <table
      ref={parentRef}
      style={{
        height: "100px",
        overflow: "auto",
        //   flex: "1",
        position: "relative",
        pointerEvents: "auto",
      }}
    >
      <thead className="sticky top-0">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: header.column.getCanSort()
                          ? "cursor-pointer select-none pointer-events-auto"
                          : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <For
        each={rows}
        //   style={{
        //     height: `${rowVirtualizer.getTotalSize()}px`,
        //     width: "100%",
        //     position: "relative",
        //   }}
        as="tbody"
      >
        {(row) => {
          return (
            <tr
              key={row.id}
              // style={{
              //   position: "absolute",
              //   top: 0,
              //   left: 0,
              //   width: "100%",
              //   height: `${virtualItem.size}px`,
              //   transform: `translateY(${
              //     virtualItem.start - rowVirtualizer.options.scrollMargin
              //   }px)`,
              // }}
            >
              {/* {library[virtualItem.index]?.title} */}
              <For each={row.getVisibleCells()} as="div">
                {(cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                }}
              </For>
            </tr>
          );
        }}
      </For>
    </table>
  );
}
