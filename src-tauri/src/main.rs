// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bson::Document;
use nanoid::nanoid;
use rayon::prelude::*;
use std::fs::File;
use std::path::Path;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

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

    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu)
        .add_submenu(controls);

    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "openDirectory" => {
                event.window().emit("openDirectory", 1).unwrap();
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

#[time]
#[tauri::command]
async fn read_music_file(path: &str) -> Song {
    // println!("path: {:?}", path);

    // TODO: clean up this function to have much better error handling (don't use unwrap)
    // TODO: fix performance/ownership issues

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
}

// TODO: should we play audio files thru rust?
