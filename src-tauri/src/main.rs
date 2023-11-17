// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{api, App, CustomMenuItem, FsScope, Manager, Menu, MenuItem, Submenu};

use symphonia_metadata::id3v2;

use serde::ser::{Deserialize, Serialize};
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::errors::Error;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, MetadataReader};
use symphonia::core::probe::Hint;

use audiotags::{Album, Tag};

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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[derive(serde::Serialize)]
struct Song<'a> {
    title: &'a str,
    artist: &'a str,
    album: Album,
    year: i32,
}

#[tauri::command]
fn read_music_file(path: &str) -> Song<'_> {
    // println!("path: {:?}", path);

    let mut tag = Tag::new().read_from_path(path).unwrap();

    let album = tag.album();
    let artist = tag.artist();
    let title = tag.title();
    let year = tag.year();

    let song = Song {
        title: title.unwrap(),
        artist: artist.unwrap(),
        album: album.unwrap(),
        year: year.unwrap(),
    };

    song

    // let src = std::fs::File::open(path).expect("failed to open media");

    // let mss = MediaSourceStream::new(Box::new(src), Default::default());

    // // Create a probe hint using the file's extension. [Optional]
    // let mut hint = Hint::new();
    // hint.with_extension("flac");

    // let meta_opts: MetadataOptions = Default::default();
    // let fmt_opts: FormatOptions = Default::default();

    // // Probe the media source.
    // let probed = symphonia::default::get_probe()
    //     .format(&hint, mss, &fmt_opts, &meta_opts)
    //     .expect("unsupported format");

    // // Get the instantiated format reader.
    // let mut format = probed.format;
    // // While there is newer metadata.
    // while !format.metadata().is_latest() {
    //     // Pop the old hexad of the metadata queue.
    //     format.metadata().pop();

    //     if let Some(rev) = format.metadata().current() {
    //         // Consume the new metadata at the head of the metadata queue.
    //         println!("metadata: {:?}", rev);
    //         let reader = id3v2::Id3v2Reader;

    //         reader.read_all(format, )
    //         id3v2::read_id3v2(format, format.metadata());
    //     }
    // }
    // format.metadata()
}
