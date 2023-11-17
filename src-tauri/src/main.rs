// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use bson::Document;
use nanoid::nanoid;
use rayon::prelude::*;
use std::fs::File;
use std::path::Path;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

// use serde::ser::{Deserialize, Serialize};
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL, FinalizeResult};
use symphonia::core::formats::{FormatOptions, FormatReader, Track};
use symphonia::core::io::MediaSourceStream;
// use symphonia::core::errors::{Error, Result};
use symphonia::core::meta::{MetadataOptions, MetadataReader};
use symphonia::core::probe::Hint;
use symphonia_metadata::id3v2;

use audiotags::{Album, Tag};
use logging_timer::{stime, time};

// mod output;

// #[cfg(not(target_os = "linux"))]
// mod resampler;


fn main() {
    // build menu (move into a function)
    let open_directory = CustomMenuItem::new("openDirectory".to_string(), "Open Directory");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let submenu = Submenu::new(
        "File",
        Menu::new()
            .add_item(open_directory)
            .add_item(quit)
            .add_item(close),
    );
    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    // tauri_api

    // let menu = Menu::os_default("rTunes").add_item(open_directory);

    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "openDirectory" => {
                println!("openDirectory");
                event.window().emit("openDirectory", 1).unwrap();
                // api::dialog::FileDialogBuilder::new().pick_folder(|path| match path {
                //     Some(path) => {
                //         println!("path: {:?}", path);
                //         // TODO: can we get it to work on the App struct?
                //         event.window().emit("openDirectory", path).unwrap();
                //     }
                //     None => {
                //         println!("no path");
                //     }
                // });
            }
            "quit" => {
                std::process::exit(0);
            }
            "close" => {
                event.window().close().unwrap();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![read_music_file])
        .invoke_handler(tauri::generate_handler![process_music_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[derive(serde::Serialize)]
struct Song {
    id: String,
    title: String,
    artist: String,
    album_artist: String,
    album_title: String,
    album_art: Option<Vec<u8>>,
    year: i32,
    path: String,
}
// struct Song<'a> {
//     title: &'a str,
//     artist: &'a str,
//     // no idea if this is best way to do this lol
//     album_title: &'a str,
//     album_artist: &'a str,
//     album_art: Vec<u8>,
//     year: i32,
// }

// impl serde::Serialize for Song<'_> {
//     fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//     where
//         S: serde::ser::Serializer,
//     {
//         wrapper.serialize(serializer)
//     }
// }

#[time]
#[tauri::command]
async fn read_music_file(path: &str) -> Song {
    // println!("path: {:?}", path);

    let tag = Tag::new().read_from_path(path).unwrap();

    let album = tag.album().unwrap();
    let artist = tag.artist();
    let title = tag.title();
    let year = tag.year();

    let album_artist = album.artist.unwrap_or_default().to_string();
    let album_title = album.title.to_string();
    let id = nanoid!();
    // let album_art = match album.cover {
    //     Some(cover) => Some(cover.data.to_vec()),
    //     None => None,
    // };
    // album.as_ref()
    let song = Song {
        id,
        title: title.unwrap_or_default().to_string(),
        artist: artist.unwrap_or_default().to_string(),
        album_artist,
        album_title,
        album_art: None,
        // album_art,
        path: path.to_string(),
        year: year.unwrap(),
    };

    // event.window().emit("fileProcessed", song).unwrap();

    return song;
}

#[tauri::command]
fn process_music_files(paths: Vec<&str>) -> Vec<Song> {
    let batch_size = 100; // Experiment with different batch sizes
    paths
        .chunks(batch_size)
        .flat_map(|batch| {
            batch
                .into_par_iter()
                .map(|&path| read_music_file(path))
                .collect::<Vec<_>>()
        })
        .collect()
    // paths
    //     .par_iter()
    //     .map(|path| read_music_file(path))
    //     .collect()
}

// https://github.com/pdeljanov/Symphonia/blob/master/symphonia-play/src/main.rs
// #[tauri::command]
// fn play_file(path: &str, info_only: bool) {
//     let mut hint = Hint::new();

//     let path = Path::new(path);
//     // Provide the file extension as a hint.
//     if let Some(extension) = path.extension() {
//         if let Some(extension_str) = extension.to_str() {
//             hint.with_extension(extension_str);
//         }
//     }

//     let source = Box::new(File::open(path).unwrap());

//     // Create the media source stream using the boxed media source from above.
//     let mss = MediaSourceStream::new(source, Default::default());

//     // Use the default options for format readers other than for gapless playback.
//     let format_opts = FormatOptions {
//         ..Default::default()
//     };

//     // Use the default options for metadata readers.
//     let metadata_opts: MetadataOptions = Default::default();

//     match symphonia::default::get_probe().format(&hint, mss, &format_opts, &metadata_opts) {
//         Ok(mut probed) => {
//             if info_only {
//                 // Probe-only mode only prints information about the format, tracks, metadata, etc.
//                 // print_format(path_str, &mut probed);
//                 // Ok(0)
//             } else {
//                 // Playback mode.
//                 // Look into this!!
//                 // print_format(path_str, &mut probed);

//                 // If present, parse the seek argument.
//                 // let seek_time = args
//                 //     .value_of("seek")
//                 //     .map(|p| p.parse::<f64>().unwrap_or(0.0));

//                 // Set the decoder options.
//                 let decode_opts = DecoderOptions {
//                     // verify: args.is_present("verify"),
//                     ..Default::default()
//                 };

//                 // Play it!
//                 play(probed.format, &decode_opts)
//             }
//         }
//         Err(err) => {
//             // The input was not supported by any format reader.
//             // info!("the input is not supported");
//             // Err(err)
//         }
//     }
// }

// #[derive(Copy, Clone)]
// struct PlayTrackOptions {
//     track_id: u32,
//     seek_ts: u64,
// }

// fn play(
//     mut reader: Box<dyn FormatReader>,
//     // track_num: Option<usize>,
//     // seek_time: Option<f64>,
//     decode_opts: &DecoderOptions,
//     // no_progress: bool,
// ) {
//     // If the user provided a track number, select that track if it exists, otherwise, select the
//     // first track with a known codec.
//     let track = None
//         .and_then(|t| reader.tracks().get(t))
//         .or_else(|| first_supported_track(reader.tracks()));

//     let mut track_id = match track {
//         Some(track) => track.id,
//         _ => return Ok(0),
//     };

//     // If there is a seek time, seek the reader to the time specified and get the timestamp of the
//     // seeked position. All packets with a timestamp < the seeked position will not be played.
//     //
//     // Note: This is a half-baked approach to seeking! After seeking the reader, packets should be
//     // decoded and *samples* discarded up-to the exact *sample* indicated by required_ts. The
//     // current approach will discard excess samples if seeking to a sample within a packet.
//     // (see actual file for more info)
//     let seek_ts = 0;

//     // The audio output device.
//     let mut audio_output = None;

//     let mut track_info = PlayTrackOptions { track_id, seek_ts };

//     let result = loop {
//         match play_track(
//             &mut reader,
//             &mut audio_output,
//             track_info,
//             decode_opts,
//             // no_progress,
//         ) {
//             Err(Error::ResetRequired) => {
//                 // The demuxer indicated that a reset is required. This is sometimes seen with
//                 // streaming OGG (e.g., Icecast) wherein the entire contents of the container change
//                 // (new tracks, codecs, metadata, etc.). Therefore, we must select a new track and
//                 // recreate the decoder.
//                 // print_tracks(reader.tracks());

//                 // Select the first supported track since the user's selected track number might no
//                 // longer be valid or make sense.
//                 let track_id = first_supported_track(reader.tracks()).unwrap().id;
//                 track_info = PlayTrackOptions {
//                     track_id,
//                     seek_ts: 0,
//                 };
//             }
//             res => break res,
//         }
//     };

//     // Flush the audio output to finish playing back any leftover samples.
//     if let Some(audio_output) = audio_output.as_mut() {
//         audio_output.flush()
//     }

//     result
// }

// fn play_track(
//     reader: &mut Box<dyn FormatReader>,
//     audio_output: &mut Option<Box<dyn output::AudioOutput>>,
//     play_opts: PlayTrackOptions,
//     decode_opts: &DecoderOptions,
//     // no_progress: bool,
// ) {
//     // Get the selected track using the track ID.
//     let track = match reader
//         .tracks()
//         .iter()
//         .find(|track| track.id == play_opts.track_id)
//     {
//         Some(track) => track,
//         _ => return Ok(0),
//     };

//     // Create a decoder for the track.
//     let mut decoder = symphonia::default::get_codecs().make(&track.codec_params, decode_opts)?;

//     // Get the selected track's timebase and duration.
//     let tb = track.codec_params.time_base;
//     let dur = track
//         .codec_params
//         .n_frames
//         .map(|frames| track.codec_params.start_ts + frames);

//     // Decode and play the packets belonging to the selected track.
//     let result = loop {
//         // Get the next packet from the format reader.
//         let packet = match reader.next_packet() {
//             Ok(packet) => packet,
//             Err(err) => break Err(err),
//         };

//         // If the packet does not belong to the selected track, skip it.
//         if packet.track_id() != play_opts.track_id {
//             continue;
//         }

//         //Print out new metadata.
//         while !reader.metadata().is_latest() {
//             reader.metadata().pop();

//             if let Some(rev) = reader.metadata().current() {
//                 // print_update(rev);
//             }
//         }

//         // Decode the packet into audio samples.
//         match decoder.decode(&packet) {
//             Ok(decoded) => {
//                 // If the audio output is not open, try to open it.
//                 if audio_output.is_none() {
//                     // Get the audio buffer specification. This is a description of the decoded
//                     // audio buffer's sample format and sample rate.
//                     let spec = *decoded.spec();

//                     // Get the capacity of the decoded buffer. Note that this is capacity, not
//                     // length! The capacity of the decoded buffer is constant for the life of the
//                     // decoder, but the length is not.
//                     let duration = decoded.capacity() as u64;

//                     // Try to open the audio output.
//                     audio_output.replace(output::try_open(spec, duration).unwrap());
//                 } else {
//                     // TODO: Check the audio spec. and duration hasn't changed.
//                 }

//                 // Write the decoded audio samples to the audio output if the presentation timestamp
//                 // for the packet is >= the seeked position (0 if not seeking).
//                 if packet.ts() >= play_opts.seek_ts {
//                     // if !no_progress {
//                     //     print_progress(packet.ts(), dur, tb);
//                     // }

//                     if let Some(audio_output) = audio_output {
//                         audio_output.write(decoded).unwrap()
//                     }
//                 }
//             }
//             Err(Error::DecodeError(err)) => {
//                 // Decode errors are not fatal. Print the error message and try to decode the next
//                 // packet as usual.
//                 // warn!("decode error: {}", err);
//             }
//             Err(err) => break Err(err),
//         }
//     };

//     // if !no_progress {
//     //     println!();
//     // }

//     // Return if a fatal error occured.
//     ignore_end_of_stream_error(result)?;

//     // Finalize the decoder and return the verification result if it's been enabled.
//     do_verification(decoder.finalize())
// }

// fn first_supported_track(tracks: &[Track]) -> Option<&Track> {
//     tracks
//         .iter()
//         .find(|t| t.codec_params.codec != CODEC_TYPE_NULL)
// }

// fn ignore_end_of_stream_error(result: Result<()>) -> Result<()> {
//     match result {
//         Err(Error::IoError(err))
//             if err.kind() == std::io::ErrorKind::UnexpectedEof
//                 && err.to_string() == "end of stream" =>
//         {
//             // Do not treat "end of stream" as a fatal error. It's the currently only way a
//             // format reader can indicate the media is complete.
//             Ok(())
//         }
//         _ => result,
//     }
// }

// fn do_verification(finalization: FinalizeResult) -> Result<i32> {
//     match finalization.verify_ok {
//         Some(is_ok) => {
//             // Got a verification result.
//             println!("verification: {}", if is_ok { "passed" } else { "failed" });

//             Ok(i32::from(!is_ok))
//         }
//         // Verification not enabled by user, or unsupported by the codec.
//         _ => Ok(0),
//     }
// }
