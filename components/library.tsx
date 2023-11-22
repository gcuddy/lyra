import { usePaths } from "@/atoms/paths";
import { BaseDirectory, readDir, type FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import * as mm from "music-metadata-browser";
import {
  useFilteredLibrary,
  useLibrary,
  useLoadedSong,
  usePlaying,
  useSelectedSong,
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

interface LibraryProps {
  path: string;
  scrollElement?: Element | null;
}

export default function Library({ path, scrollElement }: LibraryProps) {
  // read directory
  const [fileEntries, setFileEntries] = useState<FileEntry[]>();
  const [isParsing, setIsParsing] = useState(false);
  const [musicFiles, setMusicFiles] = usePaths();
  const [library] = useFilteredLibrary();
  const [, setLibrary] = useLibrary();
  const parentRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = usePlaying();
  const [audio] = useAudioPlayer();

  const rowVirtualizer = useVirtualizer({
    count: library?.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    getItemKey: (index) => library[index]?.id,
    overscan: 10,
    paddingStart: 16,
    //   scrollMargin,
  });
  //   const rowVirtualizer = useVirtualizer({
  //     count: 10000,
  //     getScrollElement: () => parentRef.current,
  //     estimateSize: () => 35,
  //   });

  //   const { virtualItems: virtualRows, totalSize } = rowVirtualizer;

  //   const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  //   const paddingBottom =
  //     virtualRows.length > 0
  //       ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
  //       : 0;

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
  }, [path]);

  if (isParsing) {
    return <div>Reading music files...</div>;
  }

  return (
    <>
      {!!isParsing && "Parsing"}
      <div
        ref={parentRef}
        className="col-span-4 bg-white dark:bg-gray-950"
        style={{
          height: `100%`,
          width: "100%",
          overflow: "auto",
          pointerEvents: "auto",
        }}
      >
        {library.length} songs
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          <For each={rowVirtualizer.getVirtualItems()} as="div">
            {(virtualItem) => (
              <div
                key={virtualItem.key}
                className="flex items-center"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <LibraryItem song={library[virtualItem.index]} />
              </div>
            )}
          </For>
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

function LibraryItem({ song }: { song: RawSong }) {
  const [selectedSong, setSelectedSong] = useSelectedSong();
  const [, setLoadedSong] = useLoadedSong();
  return (
    <>
      <div
        onClick={() => {
          setSelectedSong(song);
        }}
        onDoubleClick={() => {
          setLoadedSong(song);
        }}
        className={`h-full grow grid grid-cols-3 items-center select-none cursor-default truncate ${
          selectedSong?.id === song?.id ? "bg-blue-500 text-white" : ""
        }`}
      >
        <span className="truncate">{song?.title}</span>
        <span className="truncate">{song.artist}</span>
        <span className="truncate">{song.album_title}</span>
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
                          ? "cursor-pointer select-none"
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
