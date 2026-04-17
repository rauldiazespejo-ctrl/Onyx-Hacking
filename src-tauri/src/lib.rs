use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::path::PathBuf;

pub mod commands;
pub mod db;
pub mod scanner;

pub type AppState = Mutex<OnyxState>;
pub type DbPath = PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OnyxState {
    pub active_project_id: Option<String>,
}

impl Default for OnyxState {
    fn default() -> Self {
        Self {
            active_project_id: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub status: String,
    pub targets: Vec<Target>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Target {
    pub id: String,
    pub host: String,
    pub ports: Vec<PortResult>,
    pub vulnerabilities: Vec<Vulnerability>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortResult {
    pub port: u16,
    pub protocol: String,
    pub state: String,
    pub service: String,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vulnerability {
    pub id: String,
    pub cve: Option<String>,
    pub title: String,
    pub severity: String,
    pub description: String,
    pub target_id: String,
    pub module: String,
    pub confirmed: bool,
    pub false_positive: bool,
    pub evidence: Vec<String>,
    pub cvss_score: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub id: String,
    pub project_id: String,
    pub target_id: String,
    pub module: String,
    pub status: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub findings: Vec<Vulnerability>,
    pub ports_found: Vec<PortResult>,
    pub progress: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub status: String,
    pub target_count: i64,
    pub vulnerability_count: i64,
    pub critical_count: i64,
    pub high_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

// Helper to generate UUIDs
pub fn new_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

pub fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}
