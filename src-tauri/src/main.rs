#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use onyx_lib::AppState;
use onyx_lib::db::Database;
use tauri::Manager;

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            let database = Database::new(app_data_dir)
                .expect("Failed to initialize database");

            app.manage(database);
            app.manage(AppState::default());

            log::info!("ONYX Security Suite initialized");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            onyx_lib::commands::create_project,
            onyx_lib::commands::list_projects,
            onyx_lib::commands::get_project,
            onyx_lib::commands::delete_project,
            onyx_lib::commands::add_target,
            onyx_lib::commands::start_recon_scan,
            onyx_lib::commands::start_vuln_scan,
            onyx_lib::commands::toggle_vuln_confirmed,
            onyx_lib::commands::toggle_false_positive,
            onyx_lib::commands::get_scan_history,
            onyx_lib::commands::get_app_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ONYX");
}
