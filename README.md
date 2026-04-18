# ONYX Security Suite

> *See everything. Break nothing. Report everything.*

ONYX is a professional desktop application for ethical hacking and penetration testing, built with Rust (Tauri) and React.

**Product design & AI architecture layer:** **PULSOAI** — marca visual ONYX (búho nocturno), flujos asistidos y dirección de experiencia de producto.

![Version](https://img.shields.io/badge/version-1.0.0-00FFC8)
![macOS](https://img.shields.io/badge/macOS-ARM64%20%7C%20x64-blue)
![Tauri](https://img.shields.io/badge/Tauri-v2-24C8D8)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Rust](https://img.shields.io/badge/Rust-1.95-DEA584)
![License](https://img.shields.io/badge/License-Proprietary-red)

## Features

- 🔍 **Reconnaissance** — Port scanning, service fingerprinting, OSINT
- 🛡️ **Vulnerability Analysis** — CVE matching, web app scanning, CVSS scoring
- ⚔️ **Exploitation** — Controlled exploit execution with evidence capture
- 🎯 **Post-Exploitation** — Privilege escalation, lateral movement, credential auditing
- 📊 **Reporting** — Professional PDF/HTML reports with executive summaries

## Architecture

```
┌─────────────────────────────────────────────┐
│  PULSOAI layer (UX, IA aplicada, marca)     │
├─────────────────────────────────────────────┤
│  Frontend (React 19 + TypeScript + Tailwind) │
│         ↕ Tauri IPC                          │
│  Backend (Rust + Tokio + SQLite + audit)   │
├─────────────────────────────────────────────┤
│  Network / OS (herramientas bajo engagement)│
└─────────────────────────────────────────────┘
```

- **Desktop Framework:** Tauri v2 (lightweight, ~11MB binary)
- **Frontend:** React 19 + TypeScript + Tailwind CSS v4
- **Backend:** Rust (zero-copy, memory-safe, concurrent)
- **Database:** SQLite (embedded, portable)
- **State:** Zustand (frontend) + SQLite (persistent)

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) 1.70+
- [Node.js](https://nodejs.org/) 20+
- Xcode Command Line Tools (macOS)

### Build

```bash
# Install frontend dependencies
npm install

# Typecheck + production frontend bundle
npm run build

# Build Tauri app (release)
npx tauri build
```

### Development

```bash
# Start the desktop app with hot reload (Vite + Tauri)
npx tauri dev
```

### Continuous integration

GitHub Actions runs on every push and pull request: `npm ci` + `npm run build`, and `cargo check --locked` in `src-tauri` (Linux runner with WebKit dependencies for Tauri).

The app binary will be at:
- Binary: `src-tauri/target/release/onyx`
- macOS App: `dist/ONYX.app`

## Project Structure

```
.
├── src/                         # React frontend
│   ├── components/
│   │   ├── layout/              # Sidebar, Terminal, StatusBar
│   │   ├── dashboard/
│   │   ├── recon/               # Reconnaissance module
│   │   ├── vuln/                # Vulnerability analysis module
│   │   ├── exploit/             # Exploitation module
│   │   ├── post/                # Post-exploitation module
│   │   ├── report/              # Report generation module
│   │   ├── settings/
│   │   └── shared/
│   ├── hooks/
│   ├── store/                   # Zustand state management
│   ├── styles/                  # Global styles + Tailwind
│   ├── types/                   # TypeScript interfaces
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Entry point
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── main.rs              # Tauri entry point
│   │   ├── lib.rs               # Core types + state
│   │   ├── commands.rs          # Tauri IPC commands
│   │   ├── db.rs                # SQLite database layer
│   │   ├── scanner.rs           # Scan simulation engine
│   │   └── migrations/          # SQL migrations
│   ├── capabilities/            # Tauri permissions
│   ├── icons/                   # App icon
│   └── tauri.conf.json          # Tauri configuration
├── plans/                       # Roadmap + ethical-use planning
│   └── hacking-etico-dev-plan.md
├── .github/workflows/           # CI (frontend + Rust)
└── dist/                        # Vite build output (gitignored)
```

## Modules

### Recon
- Add targets (IP, domain, CIDR)
- Port scanning with service detection
- Expandable port tables with version info
- Quick actions: OSINT, Subdomain Enum, Certificate Scan

### Vulnerabilities
- Severity dashboard (Critical/High/Medium/Low/Info)
- Searchable + filterable vulnerability list
- CVE tracking with CVSS scoring
- Confirm/False Positive workflow
- One-click vulnerability scanning

### Exploitation
- Exploit wizard with safety warnings
- Live output terminal
- Evidence capture gallery
- Authorized use only enforcement

### Post-Exploitation
- Privilege escalation checks
- Lateral movement path visualization
- Network topology viewer
- Credential vault

### Reports
- Executive summary with risk metrics
- Template selection (Executive/Technical/Compliance)
- Live preview with WYSIWYG
- PDF export capability

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Shell | Tauri v2 | Native window management, IPC |
| UI Framework | React 19 | Component-based UI |
| Styling | Tailwind CSS v4 | Utility-first dark theme |
| State | Zustand | Frontend state management |
| Backend | Rust + Tokio | High-performance core |
| Database | SQLite + rusqlite | Persistent storage |
| Serialization | serde/serde_json | Data interchange |
| HTTP | reqwest + rustls | API clients |
| Time | chrono | Timestamps |

## Security

- ⚠️ **Authorized use only** — All tools require explicit authorization
- 🔒 **Local storage** — All data stored locally, no cloud
- 📝 **Audit trail** — Complete logging of all operations
- 🛡️ **Kill switch** — Emergency stop available at all times
- 🔐 **Keychain integration** — Planned for credential storage

## Disclaimer

This software is developed exclusively for **authorized** penetration testing and security auditing. Unauthorized use is prohibited and may constitute a criminal offense.

## License

Proprietary. All rights reserved.

---

*ONYX · Experience and architecture direction by PULSOAI — 2026*
