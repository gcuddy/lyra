import { usePaths } from "@/atoms/paths";
import { BaseDirectory, readDir, type FileEntry } from "@tauri-apps/api/fs";
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState, useRef } from "react";
import * as mm from "music-metadata-browser";
import { useFilteredLibrary, useLibrary } from "@/atoms/library";
import { For } from "million/react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface LibraryProps {
  path: string;
}

export default function Library({ path }: LibraryProps) {
  // read directory
  const [fileEntries, setFileEntries] = useState<FileEntry[]>();
  const [musicFiles, setMusicFiles] = usePaths();
  const [library] = useFilteredLibrary();
  const [, setLibrary] = useLibrary();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: library.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    getItemKey: (index) => library[index]?.id,
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
      <div className="pointer-events-auto">
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
      </span>
      <div
        ref={parentRef}
        style={{
          height: "100%",
          overflow: "auto",
          //   flex: "1",
          position: "relative",
          pointerEvents: "auto",
        }}
      >
        <For
          each={rowVirtualizer.getVirtualItems()}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
          as="div"
        >
          {(virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                fontSize: "20px",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {library[virtualItem.index]?.title}
            </div>
          )}
        </For>
      </div>
    </>
  );
}
