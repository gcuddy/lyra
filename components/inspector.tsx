import { selectedSongAtom, useSelectedImageDataUrl } from "@/atoms/library";
import { format } from "date-fns";
import { tw } from "@/lib/tailwind";
import { useAtomValue } from "jotai";
import { ReactNode, RefObject, useEffect, useState } from "react";
import BasicSticky from "react-sticky-el";
import { BOTTOM_BAR_HEIGHT } from "./bottom-bar";
import { Tooltip } from "./ui/tooltip";

import {
  Guitar,
  type Icon as PhosphorIcon,
  MicrophoneStage,
  MusicNoteSimple,
  VinylRecord,
} from "@phosphor-icons/react";
import { useMainScrollRef } from "@/atoms/refs";
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
  const [selectedImageDataUrl] = useSelectedImageDataUrl();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, [])
  const [scrollElement] = useMainScrollRef();
  console.log({ scrollElement });
  if (!scrollElement) return null;


  if (!mounted) return null;

  return (
    <BasicSticky scrollElement={scrollElement}>
      <div
        style={{
          width: INSPECTOR_WIDTH,
          paddingBottom: BOTTOM_BAR_HEIGHT,
        }}
        className="absolute right-1.5 flex flex-col gap-2 top-0 pl-3 pr-1.5"
      >
        <div className="aspect-square">
          {selectedImageDataUrl.state === "hasData" &&
            selectedImageDataUrl.data ? (
            <img
              alt=""
              className="h-full w-full object-contain"
              src={selectedImageDataUrl.data}
            />
          ) : (
            <div className="bg-app-darkBox h-full w-full" />
          )}
        </div>
        <div className="border border-app-line shadow-app-shade/10 bg-app-box rounded-lg py-0.5 pointer-events-auto flex select-text flex-col overflow-hidden ">
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
    </BasicSticky>
  );
}
