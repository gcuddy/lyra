// matches Structs in main.rs
// TODO: automate this with specta

type RawSong = {
  id: string;
  path: string;
  title: string;
  artist: string;
  rating?: number;
  album_artist: string;
  album_title: string;
  genre?: string;
  track_number?: number;
  track_total?: number;
  disc_number?: number;
  disc_total?: number;
  year?: number;
  //   properties
  audio_bitrate?: number;
  overall_bitrate?: number;
  duration_ms?: number;
};

type Picture = {
  data: number[];
  mime_type: string;
};
