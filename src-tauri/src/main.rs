// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dotenv;
use lofty::{Accessor, AudioFile, ItemKey, ItemValue, Probe, TaggedFileExt};
use nanoid::nanoid;
use rayon::prelude::*;
use rustfm_scrobble::{Scrobble, Scrobbler};
use std::env;
use std::path::Path;
use tauri::{window, AboutMetadata, CustomMenuItem, Manager, Menu, MenuItem, Submenu};

use logging_timer::time;

fn main() {
    // dotenv::load().ok();
    if cfg!(debug_assertions) {
        dotenv::from_filename("../../.env.development").ok();
    } else {
        let prod_env = include_str!("../../.env.production");
        println!("prod_env: {}", prod_env);
        let result = dotenv::from_read(prod_env.as_bytes()).unwrap();
        result.load();
    }
    for (key, value) in dotenv::vars() {
        println!("{}: {}", key, value);
    }
    let open_directory = CustomMenuItem::new("openDirectory".to_string(), "Open Directory");

    let submenu = Submenu::new("File", Menu::new().add_item(open_directory));

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

    let view_menu = Menu::new()
        .add_item(CustomMenuItem::new("inspector", "Show Inspector").accelerator("CmdOrCtrl+I"));

    let menu = Menu::new()
        // .add_native_item(MenuItem::Copy)
        // .add_item(CustomMenuItem::new("hide", "Hide")))
        .add_submenu(Submenu::new("rtunes", about_menu))
        .add_submenu(submenu)
        .add_submenu(edit_submenu)
        .add_submenu(Submenu::new("View", view_menu))
        .add_submenu(controls);

    tauri::Builder::default()
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
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
            "inspector" => {
                event.window().emit("toggle-inspector", 1).unwrap();
            }
            _ => {}
        })
        .setup(move |app| {
            let main_window = app.get_window("main").unwrap();
            let menu_handle = main_window.menu_handle();
            main_window.listen("selectionchange", move |event| {
                let payload = event.payload().unwrap();
                match payload {
                    "true" => {
                        menu_handle.get_item("inspector").set_enabled(true).ok();
                    }
                    _ => {
                        menu_handle.get_item("inspector").set_enabled(false).ok();
                    }
                }
            });
            // main_window.listen("inspectorchange", move |event| {
            //     let payload = event.payload().unwrap();
            //     match payload {
            //         "true" => {
            //             menu_handle.get_item("inspector").set_checked(true).ok();

            //         }
            //         _ => {
            //             menu_handle.get_item("inspector").set_checked(false).ok();
            //         }
            //     }
            // });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            read_music_file,
            get_album_cover,
            process_music_files,
            toggle_inspector_text,
            lastfm_authenticate,
            lastfm_scrobble,
            get_env_values
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
fn get_env_values() -> Vec<String> {
    let mut values = Vec::new();
    for (key, value) in env::vars() {
        values.push(format!("{}: {}", key, value));
    }
    values
}

#[derive(Debug, serde::Serialize)]
pub struct Picture {
    /// The picture's MIME type.
    // pub mime_type: String,
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

    let file_md = match _path.metadata() {
        Ok(md) => md,
        Err(_) => return None,
    };

    let tagged_file = match Probe::open(_path) {
        // TODO: clean up this .expect()
        Ok(tagged_file) => tagged_file.read().expect("Failed to read file"),
        Err(_) => return None,
    };

    // TODO: iterate through tags
    let tag = match tagged_file.primary_tag() {
        Some(tag) => tag,
        None => tagged_file.first_tag()?,
    };

    let id = nanoid!();
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
        genre: tag.genre().and_then(|s| Some(s.to_string())),
        year: tag.year().map(|f| f as i32),
        track_number: tag.track().map(|f| f as u16),
        track_total: tag.track_total().map(|f| f as u16),
        disc_number: tag.disk().map(|f| f as u16),
        disc_total: tag.disk_total().map(|f| f as u16),
        file_size: Some(file_md.len()),
        audio_bitrate: tagged_file.properties().audio_bitrate(),
        overall_bitrate: tagged_file.properties().overall_bitrate(),
    };

    println!("song: {:?}", song);

    Some(song)
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

    let tagged_file = match Probe::open(_path) {
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
                // mime_type: cover.mime_type().to_string(),
                data: cover.data().to_vec(),
            })
        }
        None => None,
    }
}
// TODO: should we play audio files thru rust?

#[tauri::command]
async fn toggle_inspector_text(window: tauri::Window, show: bool) {
    window
        .menu_handle()
        .get_item("inspector")
        .set_title(if show {
            "Hide Inspector"
        } else {
            "Show Inspector"
        })
        .ok();
}

#[derive(serde::Serialize, Debug)]
struct LastfmAuthResponse {
    name: String,
    key: String,
}

#[tauri::command]
async fn lastfm_authenticate(
    username: String,
    password: String,
) -> Result<LastfmAuthResponse, String> {
    let mut scrobbler = Scrobbler::new(
        env::var("LASTFM_KEY").unwrap().as_str(),
        env::var("LASTFM_SECRET").unwrap().as_str(),
    );
    let response = scrobbler
        .authenticate_with_password(username.as_str(), password.as_str())
        .map_err(|e| e.to_string())?;
    Ok(LastfmAuthResponse {
        name: response.name,
        key: response.key,
    })
}

#[tauri::command]
async fn lastfm_scrobble(
    session_key: String,
    artist: String,
    track: String,
    album: String,
    done: bool
) -> Result<(), String> {
    println!("scrobbling: {} - {} - {}", artist, track, album);
    let mut scrobbler = Scrobbler::new(
        env::var("LASTFM_KEY").unwrap().as_str(),
        env::var("LASTFM_SECRET").unwrap().as_str(),
    );
    let song = Scrobble::new(artist.as_str(), track.as_str(), album.as_str());
    let auth_token = scrobbler.authenticate_with_token(&session_key);
    scrobbler.scrobble(&song);
    // TODO: handle error
    //
    Ok(())
}
