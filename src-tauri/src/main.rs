// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use bson::Document;
use nanoid::nanoid;
use rayon::prelude::*;
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

// use serde::ser::{Deserialize, Serialize};
// use symphonia_metadata::id3v2;
// use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
// use symphonia::core::errors::Error;
// use symphonia::core::formats::FormatOptions;
// use symphonia::core::io::MediaSourceStream;
// use symphonia::core::meta::{MetadataOptions, MetadataReader};
// use symphonia::core::probe::Hint;

use audiotags::{Album, Tag};
use logging_timer::{stime, time};

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
