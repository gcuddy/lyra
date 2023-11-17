import { usePaths } from "@/atoms/paths";
import { BaseDirectory, readDir, type FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import * as mm from "music-metadata-browser";
import { useFilteredLibrary, useLibrary } from "@/atoms/library";
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

interface LibraryProps {
  path: string;
  scrollElement?: Element | null;
}

export default function Library({ path, scrollElement }: LibraryProps) {
  // read directory
  const [fileEntries, setFileEntries] = useState<FileEntry[]>();
  const [musicFiles, setMusicFiles] = usePaths();
  const [library] = useFilteredLibrary();
  const [, setLibrary] = useLibrary();
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
    data: library,
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

  const rowVirtualizer = useVirtualizer({
    count: rows?.length,
    getScrollElement: () => scrollElement ?? parentRef.current,
    estimateSize: () => 35,
    getItemKey: (index) => library[index]?.id,
    overscan: 10,
    paddingStart: 16,
    scrollMargin,
  });

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
    console.time("read_music_file");
    console.log("files", musicFiles.length);
    const metadata = await invoke<RawSong[]>("process_music_files", {
      paths: musicFiles,
    });
    console.log({ metadata });
    setLibrary(metadata);
    console.log("done");
    console.timeEnd("read_music_file");
  }

  async function js_parse() {
    console.time("read_music_file");
    console.log("files", musicFiles.length);
    console.time("metadata");
    const metadata = await Promise.all(
      musicFiles
        .slice(0, 50)
        .map((file) => mm.fetchFromUrl(convertFileSrc(file)))
    );
    rowVirtualizer.measure();
    table.reset();
    // const metadata = await mm.fetchFromUrl(convertFileSrc(musicFiles[0]));
    console.timeEnd("metadata");
    console.log({ metadata });
  }

  async function readDirectory() {
    const dir = await readDir(path, {
      recursive: true,
    });
    console.log({ dir });
    const files = parseMusicFiles(dir);
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

  return (
    <>
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
          each={rowVirtualizer.getVirtualItems()}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
          as="tbody"
        >
          {(virtualItem) => {
            const row = rows[virtualItem.index];
            return (
              <tr
                key={row.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${
                    virtualItem.start - rowVirtualizer.options.scrollMargin
                  }px)`,
                }}
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
    </>
  );
}
