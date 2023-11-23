import { usePaths } from "@/atoms/paths";
import { BaseDirectory, readDir, type FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import BasicSticky from "react-sticky-el";
import { produce } from "immer";

import {
  useFilteredLibrary,
  useLibrary,
  useLoadedSong,
  usePlaying,
  useSelectedSong,
  //   useSort,
} from "@/atoms/library";
import { For } from "million/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useAudioPlayer } from "@/atoms/audio";
import { useTable } from "@/view/table";

interface LibraryProps {
  path: string;
  scrollElement?: Element | null;
}

export default function Library({ path, scrollElement }: LibraryProps) {
    console.log("rendering library");
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
    paddingEnd: padding.bottom,
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
        className="col-span-4 bg-white dark:bg-gray-950 overscroll-none"
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
          <div className="border-b backdrop-saturate-[1.2] backdrop-blur-lg bg-black/50 overflow-x-auto overscroll-x-none">
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className="flex w-fit">
                {headerGroup.headers.map((header, i) => {
                  const size = header.column.getSize();

                  // const orderKey
                  const cellContent = flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  );

                  return (
                    <div key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          style={{
                            width: size,
                          }}
                          className="relative select-none cursor-default flex items-center justify-between gap-3 px-4 py-2 text-xs"
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
                            <span>{cellContent}</span>
                          </div>
                        </div>
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
                    <LibraryItem
                      row={row}
                      paddingLeft={padding.left}
                      paddingRight={padding.right}
                    />
                  </div>
                );
              }}
            </For>
          </div>
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

function LibraryItem({
  row,
  paddingLeft = 0,
  paddingRight = 0,
}: {
  row: Row<RawSong>;
  paddingLeft: number;
  paddingRight: number;
}) {
  const [selectedSong, setSelectedSong] = useSelectedSong();
  const [, setLoadedSong] = useLoadedSong();
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
        className={`relative flex h-full items-center ${
          selectedSong?.id === row?.id ? "bg-blue-500 text-white" : ""
        }`}
      >
        {row.getVisibleCells().map((cell) => {
          return (
            <div
              role="cell"
              key={cell.id}
              className="table-cell shrink-0 px-4 text-xs truncate"
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
