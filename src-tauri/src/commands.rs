use tauri::State;
use crate::*;
use crate::db::Database;
use rusqlite::params;

// === PROJECT COMMANDS ===

#[tauri::command]
pub fn create_project(
    db: State<'_, Database>,
    state: State<'_, AppState>,
    name: String,
) -> Result<Project, String> {
    let id = new_id();
    let now = now_iso();
    let conn = db.get_conn()?;

    conn.execute(
        "INSERT INTO projects (id, name, created_at, updated_at, status) VALUES (?1, ?2, ?3, ?4, 'Active')",
        params![id, name, now, now],
    ).map_err(|e| e.to_string())?;

    let mut s = state.lock().map_err(|e| e.to_string())?;
    s.active_project_id = Some(id.clone());

    Ok(Project {
        id,
        name,
        created_at: now.clone(),
        updated_at: now,
        status: "Active".into(),
        targets: vec![],
    })
}

#[tauri::command]
pub fn list_projects(db: State<'_, Database>) -> Result<Vec<ProjectSummary>, String> {
    let conn = db.get_conn()?;
    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, p.status, p.created_at, p.updated_at,
                COUNT(DISTINCT t.id) as target_count,
                COUNT(DISTINCT v.id) as vulnerability_count,
                SUM(CASE WHEN v.severity = 'Critical' THEN 1 ELSE 0 END) as critical_count,
                SUM(CASE WHEN v.severity = 'High' THEN 1 ELSE 0 END) as high_count
         FROM projects p
         LEFT JOIN targets t ON t.project_id = p.id
         LEFT JOIN vulnerabilities v ON v.target_id = t.id
         GROUP BY p.id
         ORDER BY p.updated_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(ProjectSummary {
            id: row.get(0)?,
            name: row.get(1)?,
            status: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
            target_count: row.get::<_, i64>(5)?,
            vulnerability_count: row.get::<_, i64>(6)?,
            critical_count: row.get::<_, i64>(7)?,
            high_count: row.get::<_, i64>(8)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut projects = vec![];
    for row in rows {
        projects.push(row.map_err(|e| e.to_string())?);
    }
    Ok(projects)
}

#[tauri::command]
pub fn get_project(db: State<'_, Database>, project_id: String) -> Result<Project, String> {
    let conn = db.get_conn()?;

    // Get project
    let project: (String, String, String, String, String) = conn.query_row(
        "SELECT id, name, created_at, updated_at, status FROM projects WHERE id = ?1",
        params![project_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
    ).map_err(|e| e.to_string())?;

    // Get targets
    let mut stmt = conn.prepare(
        "SELECT id, host, status FROM targets WHERE project_id = ?1"
    ).map_err(|e| e.to_string())?;

    let target_rows: Vec<(String, String, String)> = stmt.query_map(
        params![project_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    ).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();

    let mut targets = vec![];
    for (t_id, host, status) in target_rows {
        // Get ports for this target
        let mut port_stmt = conn.prepare(
            "SELECT port, protocol, state, service, version FROM ports WHERE target_id = ?1"
        ).map_err(|e| e.to_string())?;

        let ports: Vec<PortResult> = port_stmt.query_map(
            params![t_id],
            |row| Ok(PortResult {
                port: row.get(0)?,
                protocol: row.get(1)?,
                state: row.get(2)?,
                service: row.get(3)?,
                version: row.get(4)?,
            }),
        ).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

        // Get vulnerabilities for this target
        let mut vuln_stmt = conn.prepare(
            "SELECT id, cve, title, severity, description, module, confirmed, false_positive, evidence, cvss_score FROM vulnerabilities WHERE target_id = ?1"
        ).map_err(|e| e.to_string())?;

        let vulns: Vec<Vulnerability> = vuln_stmt.query_map(
            params![t_id],
            |row| Ok(Vulnerability {
                id: row.get(0)?,
                cve: row.get(1)?,
                title: row.get(2)?,
                severity: row.get(3)?,
                description: row.get(4)?,
                target_id: t_id.clone(),
                module: row.get(5)?,
                confirmed: row.get::<_, i32>(6)? != 0,
                false_positive: row.get::<_, i32>(7)? != 0,
                evidence: serde_json::from_str(&row.get::<_, String>(8).unwrap_or_else(|_| "[]".into())).unwrap_or_default(),
                cvss_score: row.get(9)?,
            }),
        ).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

        targets.push(Target {
            id: t_id,
            host,
            ports,
            vulnerabilities: vulns,
            status,
        });
    }

    Ok(Project {
        id: project.0,
        name: project.1,
        created_at: project.2,
        updated_at: project.3,
        status: project.4,
        targets,
    })
}

#[tauri::command]
pub fn delete_project(db: State<'_, Database>, state: State<'_, AppState>, project_id: String) -> Result<(), String> {
    let conn = db.get_conn()?;
    conn.execute("DELETE FROM vulnerabilities WHERE target_id IN (SELECT id FROM targets WHERE project_id = ?1)", params![project_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM ports WHERE target_id IN (SELECT id FROM targets WHERE project_id = ?1)", params![project_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM targets WHERE project_id = ?1", params![project_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM scan_results WHERE project_id = ?1", params![project_id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM projects WHERE id = ?1", params![project_id]).map_err(|e| e.to_string())?;

    let mut s = state.lock().map_err(|e| e.to_string())?;
    if s.active_project_id.as_ref() == Some(&project_id) {
        s.active_project_id = None;
    }
    Ok(())
}

// === TARGET COMMANDS ===

#[tauri::command]
pub fn add_target(db: State<'_, Database>, project_id: String, host: String) -> Result<Target, String> {
    let id = new_id();
    let conn = db.get_conn()?;

    conn.execute(
        "INSERT INTO targets (id, project_id, host, status, created_at) VALUES (?1, ?2, ?3, 'Pending', ?4)",
        params![id, project_id, host, now_iso()],
    ).map_err(|e| e.to_string())?;

    // Update project timestamp
    conn.execute(
        "UPDATE projects SET updated_at = ?1 WHERE id = ?2",
        params![now_iso(), project_id],
    ).map_err(|e| e.to_string())?;

    Ok(Target {
        id,
        host,
        ports: vec![],
        vulnerabilities: vec![],
        status: "Pending".into(),
    })
}

// === SCAN COMMANDS ===

#[tauri::command]
pub fn start_recon_scan(db: State<'_, Database>, project_id: String, target_id: String) -> Result<ScanResult, String> {
    let conn = db.get_conn()?;
    let scan_id = new_id();
    let now = now_iso();

    conn.execute(
        "INSERT INTO scan_results (id, project_id, target_id, module, status, started_at, progress) VALUES (?1, ?2, ?3, 'recon', 'Running', ?4, 0)",
        params![scan_id, project_id, target_id, now],
    ).map_err(|e| e.to_string())?;

    // Get target host
    let host: String = conn.query_row(
        "SELECT host FROM targets WHERE id = ?1",
        params![target_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    // Update target status
    conn.execute(
        "UPDATE targets SET status = 'Scanning' WHERE id = ?1",
        params![target_id],
    ).map_err(|e| e.to_string())?;

    // Run simulated scan
    let ports = scanner::simulate_port_scan(&host);

    // Save ports to database
    for port in &ports {
        conn.execute(
            "INSERT INTO ports (target_id, port, protocol, state, service, version, scan_id, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![target_id, port.port as i32, port.protocol, port.state, port.service, port.version, scan_id, now_iso()],
        ).map_err(|e| e.to_string())?;
    }

    // Complete scan
    conn.execute(
        "UPDATE scan_results SET status = 'Completed', completed_at = ?1, progress = 100, ports_found = ?2 WHERE id = ?3",
        params![now_iso(), serde_json::to_string(&ports).unwrap_or_default(), scan_id],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE targets SET status = 'Completed' WHERE id = ?1",
        params![target_id],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE projects SET updated_at = ?1 WHERE id = ?2",
        params![now_iso(), project_id],
    ).map_err(|e| e.to_string())?;

    Ok(ScanResult {
        id: scan_id,
        project_id,
        target_id,
        module: "recon".into(),
        status: "Completed".into(),
        started_at: now,
        completed_at: Some(now_iso()),
        findings: vec![],
        ports_found: ports,
        progress: 100,
    })
}

#[tauri::command]
pub fn start_vuln_scan(db: State<'_, Database>, project_id: String, target_id: String) -> Result<Vec<Vulnerability>, String> {
    let conn = db.get_conn()?;
    let now = now_iso();

    // Get target host
    let host: String = conn.query_row(
        "SELECT host FROM targets WHERE id = ?1",
        params![target_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    // Run simulated vuln scan
    let vulns = scanner::simulate_vuln_scan(&host);

    // Save vulnerabilities to database
    for vuln in &vulns {
        conn.execute(
            "INSERT INTO vulnerabilities (id, target_id, cve, title, severity, description, module, confirmed, false_positive, evidence, cvss_score, scan_id, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                vuln.id,
                target_id,
                vuln.cve,
                vuln.title,
                vuln.severity,
                vuln.description,
                vuln.module,
                vuln.confirmed as i32,
                vuln.false_positive as i32,
                serde_json::to_string(&vuln.evidence).unwrap_or_default(),
                vuln.cvss_score,
                new_id(),
                now,
                now,
            ],
        ).map_err(|e| e.to_string())?;
    }

    // Update project timestamp
    conn.execute(
        "UPDATE projects SET updated_at = ?1 WHERE id = ?2",
        params![now_iso(), project_id],
    ).map_err(|e| e.to_string())?;

    Ok(vulns)
}

#[tauri::command]
pub fn toggle_vuln_confirmed(db: State<'_, Database>, vuln_id: String) -> Result<bool, String> {
    let conn = db.get_conn()?;
    conn.execute(
        "UPDATE vulnerabilities SET confirmed = CASE WHEN confirmed = 0 THEN 1 ELSE 0 END, updated_at = ?1 WHERE id = ?2",
        params![now_iso(), vuln_id],
    ).map_err(|e| e.to_string())?;

    let confirmed: i32 = conn.query_row(
        "SELECT confirmed FROM vulnerabilities WHERE id = ?1",
        params![vuln_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    Ok(confirmed != 0)
}

#[tauri::command]
pub fn toggle_false_positive(db: State<'_, Database>, vuln_id: String) -> Result<bool, String> {
    let conn = db.get_conn()?;
    conn.execute(
        "UPDATE vulnerabilities SET false_positive = CASE WHEN false_positive = 0 THEN 1 ELSE 0 END, updated_at = ?1 WHERE id = ?2",
        params![now_iso(), vuln_id],
    ).map_err(|e| e.to_string())?;

    let fp: i32 = conn.query_row(
        "SELECT false_positive FROM vulnerabilities WHERE id = ?1",
        params![vuln_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    Ok(fp != 0)
}

// === SCAN HISTORY ===

#[tauri::command]
pub fn get_scan_history(db: State<'_, Database>, project_id: String) -> Result<Vec<ScanResult>, String> {
    let conn = db.get_conn()?;
    let mut stmt = conn.prepare(
        "SELECT id, project_id, target_id, module, status, started_at, completed_at, progress, ports_found FROM scan_results WHERE project_id = ?1 ORDER BY started_at DESC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![project_id], |row| {
        Ok(ScanResult {
            id: row.get(0)?,
            project_id: row.get(1)?,
            target_id: row.get(2)?,
            module: row.get(3)?,
            status: row.get(4)?,
            started_at: row.get(5)?,
            completed_at: row.get(6)?,
            findings: vec![],
            ports_found: serde_json::from_str(&row.get::<_, String>(8).unwrap_or_else(|_| "[]".into())).unwrap_or_default(),
            progress: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = vec![];
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

// === APP INFO ===

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "ONYX Security Suite".into(),
        version: env!("CARGO_PKG_VERSION").into(),
        edition: "Desktop v0.1.0-alpha".into(),
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub edition: String,
}
