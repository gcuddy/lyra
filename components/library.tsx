import { usePaths } from "@/atoms/paths";
import { BaseDirectory, readDir, type FileEntry } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";

interface LibraryProps {
  path: string;
}

export default function Library({ path }: LibraryProps) {
  // read directory
  const [fileEntries, setFileEntries] = useState<FileEntry[]>();
  const [musicFiles, setMusicFiles] = usePaths();

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

  async function readDirectory() {
    const dir = await readDir(path, {
      recursive: true,
    });
    console.log({ dir });
    const files = parseMusicFiles(dir);
    setMusicFiles(files);
  }

  useEffect(() => {
    readDirectory();
  }, [path]);

  return (
    <div>
      {/* <button
        onClick={() => {
          readDirectory();
        }}
      >
        Re-sync
      </button> */}
      <ul className="pointer-events-auto">
        {musicFiles.map((file) => (
          <li
            onClick={() => {
              invoke("read_music_file", { path: file });
            }}
            key={file}
          >
            {file}
          </li>
        ))}
      </ul>
    </div>
  );
}
