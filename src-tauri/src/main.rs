// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bson::Document;
use lofty::{Accessor, AudioFile, ItemKey, ItemValue, Probe, TaggedFileExt};
use nanoid::nanoid;
use rayon::prelude::*;
use std::fs::File;
use std::path::Path;
use tauri::{AboutMetadata, CustomMenuItem, Manager, Menu, MenuItem, Submenu};

// use symphonia::core::codecs::{DecoderOptions, FinalizeResult, CODEC_TYPE_NULL};
// use symphonia::core::formats::{FormatOptions, FormatReader, Track};
// use symphonia::core::io::MediaSourceStream;
// use symphonia::core::meta::{MetadataOptions, MetadataReader};
// use symphonia::core::probe::Hint;
// use symphonia_metadata::id3v2;

use audiotags::{Album, Tag};
use logging_timer::{stime, time};

// mod output;

// #[cfg(not(target_os = "linux"))]
// mod resampler;

fn main() {
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

    // TODO: toggle play/pause display depending on state
    let controls = Submenu::new(
        "Controls",
        Menu::new()
            .add_item(CustomMenuItem::new("play".to_string(), "Play/Pause").accelerator("Space")),
    );

    let edit_submenu = Submenu::new(
        "Edit",
        Menu::new()
            .add_native_item(MenuItem::Undo)
            .add_native_item(MenuItem::Redo)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::SelectAll)
            .add_item(CustomMenuItem::new("find", "Find").accelerator("CmdOrCtrl+F")),
    );

    let about_menu = Menu::new()
        .add_native_item(MenuItem::About("rtunes".to_string(), AboutMetadata::new()))
        .add_native_item(MenuItem::Separator)
        .add_item(CustomMenuItem::new("preferences", "Preferences").accelerator("CmdOrCtrl+,"))
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Services)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Hide)
        .add_native_item(MenuItem::HideOthers)
        .add_native_item(MenuItem::ShowAll)
        .add_native_item(MenuItem::Separator)
        .add_native_item(MenuItem::Quit);

    let menu = Menu::new()
        // .add_native_item(MenuItem::Copy)
        // .add_item(CustomMenuItem::new("hide", "Hide")))
        .add_submenu(Submenu::new("rtunes", about_menu))
        .add_submenu(submenu)
        .add_submenu(edit_submenu)
        .add_submenu(controls);

    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "openDirectory" => {
                event.window().emit("openDirectory", 1).unwrap();
            }
            "preferences" => {
                event.window().emit("preferences", 1).unwrap();
            }
            "quit" => {
                std::process::exit(0);
            }
            "close" => {
                event.window().close().unwrap();
            }
            "play" => {
                event.window().emit("play", 1).unwrap();
            }
            "find" => {
                event.window().emit("find", 1).unwrap();
            }
            _ => {}
        })
        .invoke_handler(
            tauri::generate_handler![greet, read_music_file, get_album_cover, process_music_files]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[derive(Debug, serde::Serialize)]
pub struct Picture {
    /// The picture's MIME type.
    pub mime_type: String,
    /// The image data.
    pub data: Vec<u8>,
}

#[derive(serde::Serialize, Debug)]
struct Song {
    id: String,
    path: String,
    title: String,
    artist: String,
    album_artist: String,
    album_title: String,
    rating: Option<u8>,
    genre: Option<String>,
    audio_bitrate: Option<u32>,
    overall_bitrate: Option<u32>,
    duration_ms: Option<f64>,
    // picture: Option<Picture>,
    track_number: Option<u16>,
    track_total: Option<u16>,
    disc_number: Option<u16>,
    disc_total: Option<u16>,
    year: Option<i32>,
    file_size: Option<u64>,
    // TODO: other properties?
}

#[time]
#[tauri::command]
async fn read_music_file(path: &str) -> Option<Song> {
    // TODO: clean up this function to have much better error handling (don't use unwrap)
    // TODO: fix performance/ownership issues

    let _path = Path::new(path);

    if !_path.is_file() {
        return None;
    }

    let tagged_file =
        match Probe::open(_path) {
            // TODO: clean up this .expect()
            Ok(tagged_file) => tagged_file.read().expect("Failed to read file"),
            Err(_) => return None,
        };

    // TODO: iterate through tags
    let tag = match tagged_file.primary_tag() {
        Some(tag) => tag,
        None => tagged_file.first_tag()?,
    };

    // credit some of this https://github.dev/KRTirtho/metadata_god/tree/main/packages/metadata_god

    // let cover = tag
    //     .get_picture_type(lofty::PictureType::CoverFront)
    //     .or(tag.pictures().first());

    // let title = tag.title().to_owned().unwrap();

    // let tag = Tag::new().read_from_path(path).unwrap();

    // let album = tag.album().unwrap();
    // let artist = tag.artist();
    // let title = tag.title();
    // let year = tag.year();

    // let album_artist = album.artist.unwrap_or_default().to_string();
    // let album_title = album.title.to_string();
    let id = nanoid!();
    // let album_art = match album.cover {
    //     Some(cover) => Some(cover.data.to_vec()),
    //     None => None,
    // };
    // album.as_ref()
    let rating = match tag.get(&ItemKey::Popularimeter) {
        Some(s) => match s.value() {
            ItemValue::Text(t) => t.parse::<u8>().ok(),
            _ => None,
        },
        None => None,
    };
    let song = Song {
        id,
        rating,
        title: match tag.title() {
            Some(title) => title.to_string(),
            None => "[untitled]".to_string(),
        },
        artist: match tag.artist() {
            Some(artist) => artist.to_string(),
            None => "[unknown]".to_string(),
        },
        album_artist: match tag.get(&ItemKey::AlbumArtist) {
            Some(s) => match s.value() {
                ItemValue::Text(t) => t.to_string(),
                _ => "[unknown]".to_string(),
            },
            None => "[unknown]".to_string(),
        },
        album_title: match tag.album() {
            Some(album_title) => album_title.to_string(),
            None => "[unknown]".to_string(),
        },
        duration_ms: Some(tagged_file.properties().duration().as_millis() as f64),
        path: path.to_string(),
        // picture: (match cover {
        //     Some(cover) => Some(Picture {
        //         mime_type: cover.mime_type().to_string(),
        //         data: cover.data().to_vec(),
        //     }),
        //     None => None,
        // }),
        genre: tag.genre().and_then(|s| Some(s.to_string())),
        year: tag.year().map(|f| f as i32),
        track_number: tag.track().map(|f| f as u16),
        track_total: tag.track_total().map(|f| f as u16),
        disc_number: tag.disk().map(|f| f as u16),
        disc_total: tag.disk_total().map(|f| f as u16),
        file_size: Some(21231_u64),
        audio_bitrate: tagged_file.properties().audio_bitrate(),
        overall_bitrate: tagged_file.properties().overall_bitrate(),
        // title: title.unwrap_or_default().to_string(),
        // artist: artist.unwrap_or_default().to_string(),
        // album_artist,
        // album_title,
        // album_art: None,
        // // album_art,
        // path: path.to_string(),
        // year: year.unwrap(),
    };

    println!("song: {:?}", song);

    // event.window().emit("fileProcessed", song).unwrap();

    return Some(song);
}

#[tauri::command]
fn process_music_files(paths: Vec<&str>) -> Vec<Song> {
    println!("paths: {:?}", paths.len());
    let batch_size = 100; // Experiment with different batch sizes
    let songs: Vec<Song> = paths
        .chunks(batch_size)
        .flat_map(|batch| {
            batch
                .into_par_iter()
                .filter_map(|&path| match read_music_file(path) {
                    Some(song) => Some(song),
                    None => None,
                })
                .collect::<Vec<_>>()
        })
        .collect();

    // TODO sort by artist, then track number
    // let sorted = songs.sort_unstable_by(|a, b| a.title.cmp(b.title));
    songs
}

// TODO: should this be async?
#[tauri::command]
fn get_album_cover(path: &str) -> Option<Picture> {
    let _path = Path::new(path);

    if !_path.is_file() {
        return None;
    }

    let tagged_file =
        match Probe::open(_path) {
            // TODO: clean up this .expect()
            Ok(tagged_file) => tagged_file.read().expect("Failed to read file"),
            Err(_) => return None,
        };

    let tag = match tagged_file.primary_tag() {
        Some(tag) => tag,
        None => tagged_file.first_tag()?,
    };

    let cover = tag
        .get_picture_type(lofty::PictureType::CoverFront)
        .or(tag.pictures().first());

    match cover {
        Some(cover) => {
            Some(Picture {
                mime_type: cover.mime_type().to_string(),
                data: cover.data().to_vec(),
            })
        }
        None => None,
    }
}
// TODO: should we play audio files thru rust?

// A function that sends a message from Rust to JavaScript via a Tauri Event
fn rs2js<R: tauri::Runtime>(message: String, manager: &impl Manager<R>) {
    manager.emit_all("rs2js", message).unwrap();
}
