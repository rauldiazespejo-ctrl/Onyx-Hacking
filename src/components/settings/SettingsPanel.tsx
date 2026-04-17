import { useState } from "react";
import {
  Settings,
  Monitor,
  Terminal as TerminalIcon,
  Palette,
  Database,
  Keyboard,
  Info,
} from "lucide-react";
import { useOnyxStore } from "../../store/onyx";
import { useToastStore } from "../../hooks/useToast";
import { shortcutHelp } from "../../hooks/useKeyboardShortcuts";

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { activeProject } = useOnyxStore();
  const { addToast } = useToastStore();
  const [activeSection, setActiveSection] = useState("general");
  const [dbPath] = useState("~/Library/Application Support/com.onyx.security/onyx.db");

  const sections = [
    { id: "general", label: "General", icon: <Settings size={14} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={14} /> },
    { id: "terminal", label: "Terminal", icon: <TerminalIcon size={14} /> },
    { id: "tools", label: "Tools & Paths", icon: <Monitor size={14} /> },
    { id: "shortcuts", label: "Keyboard Shortcuts", icon: <Keyboard size={14} /> },
    { id: "database", label: "Database", icon: <Database size={14} /> },
    { id: "about", label: "About", icon: <Info size={14} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface rounded-xl border border-border w-[700px] h-[500px] overflow-hidden shadow-2xl flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-[180px] border-r border-border py-2 flex-shrink-0">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Settings size={14} /> Settings
            </h2>
          </div>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center gap-2 ${
                activeSection === s.id
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "general" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">General Settings</h3>
              <SettingRow label="Active Project" value={activeProject?.name || "None"} />
              <SettingRow label="Auto-save" value="Enabled" />
              <SettingRow label="Language" value="English" />
              <SettingRow label="Log Level" value="Info" />
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Appearance</h3>
              <div>
                <label className="text-xs text-text-muted block mb-1">Theme</label>
                <div className="flex gap-2">
                  <ThemeOption label="Dark (Default)" active />
                  <ThemeOption label="Midnight" />
                  <ThemeOption label="Light" />
                </div>
              </div>
              <SettingRow label="Font Size" value="14px" />
              <SettingRow label="Accent Color" value="#00FFC8 (Cyan)" />
              <SettingRow label="Animations" value="Enabled" />
            </div>
          )}

          {activeSection === "terminal" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Terminal Settings</h3>
              <SettingRow label="Shell" value="/bin/zsh" />
              <SettingRow label="Font" value="JetBrains Mono" />
              <SettingRow label="Font Size" value="12px" />
              <SettingRow label="Scrollback" value="10000 lines" />
              <SettingRow label="Copy on Select" value="Disabled" />
            </div>
          )}

          {activeSection === "tools" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Tools & External Paths</h3>
              <p className="text-xs text-text-muted">
                Configure paths to external security tools. These will be used for real scanning operations.
              </p>
              <ToolPath label="nmap" path="/usr/local/bin/nmap" />
              <ToolPath label="subfinder" path="/usr/local/bin/subfinder" />
              <ToolPath label="nuclei" path="/usr/local/bin/nuclei" />
              <ToolPath label="httpx" path="/usr/local/bin/httpx" />
              <ToolPath label="sqlmap" path="/usr/local/bin/sqlmap" />
              <ToolPath label="nikto" path="/usr/local/bin/nikto" />
              <button
                onClick={() => addToast({ type: "info", title: "Auto-detection would run here", message: "Scanning for installed tools..." })}
                className="text-xs text-accent hover:text-accent-dim mt-2"
              >
                Auto-detect installed tools →
              </button>
            </div>
          )}

          {activeSection === "shortcuts" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
              <div className="space-y-1">
                {shortcutHelp.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="text-text-muted">{s.desc}</span>
                    <kbd className="px-2 py-0.5 bg-surface-3 rounded text-text-muted font-mono text-[10px]">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "database" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Database</h3>
              <SettingRow label="Engine" value="SQLite (embedded)" />
              <SettingRow label="Path" value={dbPath} />
              <SettingRow label="WAL Mode" value="Enabled" />
              <SettingRow label="Foreign Keys" value="Enabled" />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => addToast({ type: "warning", title: "Database export", message: "Export would run here" })}
                  className="text-xs px-3 py-1.5 bg-surface-2 rounded text-text-muted hover:text-text"
                >
                  Export Database
                </button>
                <button
                  onClick={() => addToast({ type: "warning", title: "Dangerous!", message: "Database would be wiped" })}
                  className="text-xs px-3 py-1.5 bg-danger/10 rounded text-danger hover:bg-danger/20"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          )}

          {activeSection === "about" && (
            <div className="space-y-4">
              <div className="text-center pt-4">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-accent">ONYX</span>
                </div>
                <h3 className="text-lg font-bold text-text">ONYX Security Suite</h3>
                <p className="text-xs text-text-muted mt-1">Version 0.1.0-alpha</p>
                <p className="text-[10px] text-text-muted mt-0.5">Desktop Edition — macOS ARM64</p>
              </div>
              <div className="bg-surface-2 rounded-lg p-3 text-xs text-text-muted space-y-1 mt-4">
                <p><span className="text-text">Framework:</span> Tauri v2 + React 19</p>
                <p><span className="text-text">Backend:</span> Rust 1.95 + Tokio</p>
                <p><span className="text-text">Database:</span> SQLite (rusqlite)</p>
                <p><span className="text-text">Styling:</span> Tailwind CSS v4</p>
              </div>
              <p className="text-[10px] text-text-muted text-center mt-4">
                ⚠️ Authorized use only. All operations are logged.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs text-text">{value}</span>
    </div>
  );
}

function ToolPath({ label, path }: { label: string; path: string }) {
  return (
    <div className="bg-surface-2 rounded-lg px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#27C93F]" />
        <span className="text-xs font-medium text-text terminal-text">{label}</span>
      </div>
      <code className="text-[10px] text-text-muted terminal-text">{path}</code>
    </div>
  );
}

function ThemeOption({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
        active ? "border-accent/50 bg-accent/5 text-accent" : "border-border text-text-muted hover:border-border-hover"
      }`}
    >
      {label}
    </button>
  );
}
