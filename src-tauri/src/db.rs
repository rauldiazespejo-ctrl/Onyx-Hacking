use rusqlite::Connection;
use std::sync::Mutex;
use std::path::PathBuf;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        let db_path = app_data_dir.join("onyx.db");
        let conn = Connection::open(&db_path)?;

        // Enable WAL mode for better performance
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        // Run migrations
        let migration_sql = include_str!("../migrations/001_init.sql");
        conn.execute_batch(migration_sql)?;

        let has_engagement: bool = conn
            .prepare("SELECT 1 FROM pragma_table_info('projects') WHERE name = 'client_name' LIMIT 1")
            .and_then(|mut s| s.exists([]))
            .unwrap_or(false);
        if !has_engagement {
            conn.execute_batch(include_str!("../migrations/002_project_engagement.sql"))?;
        }

        let has_audit: bool = conn
            .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_log' LIMIT 1")
            .and_then(|mut s| s.exists([]))
            .unwrap_or(false);
        if !has_audit {
            conn.execute_batch(include_str!("../migrations/003_audit_log.sql"))?;
        }

        log::info!("Database initialized at: {:?}", db_path);

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn get_conn(&self) -> Result<std::sync::MutexGuard<'_, Connection>, String> {
        self.conn.lock().map_err(|e| e.to_string())
    }
}
