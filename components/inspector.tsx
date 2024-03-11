import { selectedImageQueryAtom, selectedSongAtom, useSelectedImageDataUrl } from "@/atoms/library";
import { tw } from "@/lib/tailwind";
import { format } from "date-fns";
import { useAtomValue } from "jotai";
import { ReactNode, useEffect, useState } from "react";
import { BOTTOM_BAR_HEIGHT } from "./bottom-bar";
import { Tooltip } from "./ui/tooltip";

import {
  Guitar,
  MicrophoneStage,
  MusicNoteSimple,
  VinylRecord,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Album } from "lucide-react";
export const INSPECTOR_WIDTH = 260;

export const MetaContainer = tw.div`flex flex-col px-4 py-2 gap-1`;
export const MetaTitle = tw.h5`text-xs font-bold text-ink`;

interface MetaDataProps {
  icon?: PhosphorIcon;
  label: string;
  value: ReactNode;
  tooltipValue?: ReactNode;
  onClick?: () => void;
}

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

export function Inspector() {

  const selectedSong = useAtomValue(selectedSongAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [])

  if (!mounted) return null;

  return (
    <div
      style={{
        width: INSPECTOR_WIDTH,
        paddingBottom: BOTTOM_BAR_HEIGHT,
      }}
      className="flex flex-col shrink-0 gap-2 top-0 pl-3 pr-1.5"
    >
      <AlbumArtWrapper />
      <div className="border border-app-line shadow-app-shade/10 bg-app-box rounded-lg py-0.5 pointer-events-auto flex select-text flex-col overflow-y-auto">
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
  );
}

function AlbumArtPlaceholder() {
  return (
    <div className="aspect-square">
      <div className="bg-app-darkBox h-full w-full">
      </div>
    </div>
  );
}

function AlbumArtWrapper() {
  const selectedSong = useAtomValue(selectedSongAtom);
  const query = useAtomValue(selectedImageQueryAtom)
  if (!selectedSong) return (<AlbumArtPlaceholder />)
  if (!query) return (<AlbumArtPlaceholder />)
  console.log({ query })

  return <div className="aspect-square">
    {query.data &&
      query.data ? (
      <img
        alt=""
        className="h-full w-full object-contain"
        src={query.data}
      />
    ) : (
      <div className="bg-app-darkBox h-full w-full" />
    )}
  </div>
}
