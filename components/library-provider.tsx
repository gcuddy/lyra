import React from "react";

type Library = {
  songs: RawSong[];
};

export const LibraryContext = React.createContext<Library | null>(null);

export const useLibraryContext = () => {
  const ctx = React.useContext(LibraryContext);

  if (!ctx) {
    throw new Error("LibraryContext.Provider not found.");
  }

  return ctx;
};

function LibraryProvider({
  children,
  library,
}: React.PropsWithChildren<{ library: Library }>) {
  <LibraryContext.Provider value={library}>{children}</LibraryContext.Provider>;
}
