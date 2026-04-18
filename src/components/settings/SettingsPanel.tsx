import { useEffect, useState } from "react";
import {
  Settings,
  Monitor,
  Terminal as TerminalIcon,
  Palette,
  Database,
  Keyboard,
  Info,
  FileCheck,
  ClipboardList,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useOnyxStore } from "../../store/onyx";
import { useToastStore } from "../../hooks/useToast";
import { shortcutHelp } from "../../hooks/useKeyboardShortcuts";
import type { AuditEvent, Engagement } from "../../types";
import { OnyxOwlMark } from "../branding/OnyxOwlMark";
import { engagementAllowsScans } from "../../types";

interface Props {
  onClose: () => void;
}

type EngagementForm = {
  client_name: string;
  client_contact: string;
  authorized_scope: string;
  engagement_start: string;
  engagement_end: string;
  authorization_reference: string;
  authorization_acknowledged: boolean;
};

const emptyEngagementForm = (): EngagementForm => ({
  client_name: "",
  client_contact: "",
  authorized_scope: "",
  engagement_start: "",
  engagement_end: "",
  authorization_reference: "",
  authorization_acknowledged: false,
});

export function SettingsPanel({ onClose }: Props) {
  const { activeProject, saveEngagement } = useOnyxStore();
  const { addToast } = useToastStore();
  const [activeSection, setActiveSection] = useState("general");
  const [dbPath] = useState("~/Library/Application Support/com.onyx.security/onyx.db");
  const [engagementForm, setEngagementForm] = useState<EngagementForm>(emptyEngagementForm);
  const [savingEngagement, setSavingEngagement] = useState(false);
  const [auditRows, setAuditRows] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (!activeProject?.engagement) {
      setEngagementForm(emptyEngagementForm());
      return;
    }
    const e = activeProject.engagement;
    setEngagementForm({
      client_name: e.client_name ?? "",
      client_contact: e.client_contact ?? "",
      authorized_scope: e.authorized_scope ?? "",
      engagement_start: e.engagement_start ?? "",
      engagement_end: e.engagement_end ?? "",
      authorization_reference: e.authorization_reference ?? "",
      authorization_acknowledged: e.authorization_acknowledged,
    });
  }, [activeProject?.id, activeProject?.engagement]);

  useEffect(() => {
    if (activeSection !== "audit") return;
    setAuditLoading(true);
    void invoke<AuditEvent[]>("list_audit_events", {
      project_id: activeProject?.id ?? null,
      limit: 200,
    })
      .then(setAuditRows)
      .catch(() => setAuditRows([]))
      .finally(() => setAuditLoading(false));
  }, [activeSection, activeProject?.id]);

  const sections = [
    { id: "general", label: "General", icon: <Settings size={14} /> },
    { id: "engagement", label: "Engagement", icon: <FileCheck size={14} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={14} /> },
    { id: "terminal", label: "Terminal", icon: <TerminalIcon size={14} /> },
    { id: "tools", label: "Tools & Paths", icon: <Monitor size={14} /> },
    { id: "shortcuts", label: "Keyboard Shortcuts", icon: <Keyboard size={14} /> },
    { id: "database", label: "Database", icon: <Database size={14} /> },
    { id: "audit", label: "Audit trail", icon: <ClipboardList size={14} /> },
    { id: "about", label: "About", icon: <Info size={14} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface rounded-xl border border-border w-[720px] h-[560px] overflow-hidden shadow-2xl flex"
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

          {activeSection === "engagement" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Authorized engagement</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Document the customer, allowed scope, and dates. Recon and vulnerability scans stay disabled until you
                  confirm authorization with a non-empty scope. This is enforced in the Rust backend as well.
                </p>
              </div>

              {!activeProject ? (
                <p className="text-xs text-text-muted border border-border rounded-lg p-4 bg-surface-2/50">
                  Select or create a project first, then return here to record engagement details.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Client / organization"
                      value={engagementForm.client_name}
                      onChange={(v) => setEngagementForm((f) => ({ ...f, client_name: v }))}
                      placeholder="e.g. Acme Corp"
                    />
                    <Field
                      label="Primary contact"
                      value={engagementForm.client_contact}
                      onChange={(v) => setEngagementForm((f) => ({ ...f, client_contact: v }))}
                      placeholder="Name, email, or phone"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Authorized scope (required to scan)</label>
                    <textarea
                      value={engagementForm.authorized_scope}
                      onChange={(e) => setEngagementForm((f) => ({ ...f, authorized_scope: e.target.value }))}
                      placeholder="IPs, domains, URLs, or systems explicitly in scope. Exclusions if any."
                      rows={4}
                      className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 resize-y min-h-[88px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Engagement start</label>
                      <input
                        type="date"
                        value={engagementForm.engagement_start}
                        onChange={(e) => setEngagementForm((f) => ({ ...f, engagement_start: e.target.value }))}
                        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-accent/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Engagement end</label>
                      <input
                        type="date"
                        value={engagementForm.engagement_end}
                        onChange={(e) => setEngagementForm((f) => ({ ...f, engagement_end: e.target.value }))}
                        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-accent/50"
                      />
                    </div>
                  </div>
                  <Field
                    label="Authorization reference"
                    value={engagementForm.authorization_reference}
                    onChange={(v) => setEngagementForm((f) => ({ ...f, authorization_reference: v }))}
                    placeholder="SOW, contract, or ticket ID"
                  />
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={engagementForm.authorization_acknowledged}
                      onChange={(e) =>
                        setEngagementForm((f) => ({ ...f, authorization_acknowledged: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-border"
                    />
                    <span className="text-xs text-text leading-relaxed">
                      I confirm this engagement is authorized and the scope above matches written permission from the
                      system owner.
                    </span>
                  </label>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <p className="text-[10px] text-text-muted">
                      Scan readiness:{" "}
                      <span className={engagementAllowsScans(toEngagementPayload(engagementForm)) ? "text-[#27C93F]" : "text-warning"}>
                        {engagementAllowsScans(toEngagementPayload(engagementForm)) ? "Ready" : "Blocked"}
                      </span>
                    </p>
                    <button
                      type="button"
                      disabled={savingEngagement}
                      onClick={async () => {
                        if (!activeProject) return;
                        setSavingEngagement(true);
                        try {
                          await saveEngagement(activeProject.id, toEngagementPayload(engagementForm));
                        } catch {
                          /* toast from store */
                        } finally {
                          setSavingEngagement(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
                    >
                      {savingEngagement ? "Saving…" : "Save engagement"}
                    </button>
                  </div>
                </>
              )}
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

          {activeSection === "audit" && (
            <div className="space-y-3 flex flex-col h-full min-h-0">
              <div>
                <h3 className="text-sm font-semibold">Audit trail</h3>
                <p className="text-xs text-text-muted mt-1">
                  Append-only log of security-relevant actions{activeProject ? ` for project “${activeProject.name}”.` : " across all projects."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuditLoading(true);
                  void invoke<AuditEvent[]>("list_audit_events", {
                    project_id: activeProject?.id ?? null,
                    limit: 200,
                  })
                    .then(setAuditRows)
                    .catch(() => setAuditRows([]))
                    .finally(() => setAuditLoading(false));
                }}
                className="self-start text-xs text-accent hover:text-accent-dim"
              >
                Refresh
              </button>
              <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden bg-surface-2/30">
                {auditLoading ? (
                  <p className="p-4 text-xs text-text-muted">Loading…</p>
                ) : auditRows.length === 0 ? (
                  <p className="p-4 text-xs text-text-muted">No events yet. Create a project, save engagement, or run scans.</p>
                ) : (
                  <div className="overflow-y-auto max-h-[340px]">
                    <table className="w-full text-[10px]">
                      <thead className="sticky top-0 bg-surface border-b border-border text-text-muted">
                        <tr>
                          <th className="text-left p-2 font-medium">Time</th>
                          <th className="text-left p-2 font-medium">Action</th>
                          <th className="text-left p-2 font-medium">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditRows.map((row) => (
                          <tr key={row.id} className="border-b border-border/60 hover:bg-surface-2/50 align-top">
                            <td className="p-2 text-text-muted whitespace-nowrap font-mono">{row.created_at.slice(0, 19)}</td>
                            <td className="p-2 text-accent">{row.action}</td>
                            <td className="p-2 text-text-muted break-all max-w-[280px]">{row.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "about" && (
            <div className="space-y-4">
              <div className="text-center pt-2">
                <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-accent/25 flex items-center justify-center mx-auto mb-3 shadow-[0_0_24px_rgba(0,255,200,0.12)]">
                  <OnyxOwlMark size={56} />
                </div>
                <h3 className="text-lg font-bold text-text tracking-wide">ONYX Security Suite</h3>
                <p className="text-xs text-text-muted mt-1">Version 1.0.0</p>
                <p className="text-[10px] text-[#c4b5fd] font-semibold tracking-wider mt-2">PULSOAI</p>
                <p className="text-[10px] text-text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                  Diseño de producto, capa de inteligencia asistida y arquitectura de seguridad bajo la dirección de{" "}
                  <strong className="text-text">PULSOAI</strong> — agencia de IA y sistemas.
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">Desktop — Tauri v2</p>
              </div>
              <div className="bg-surface-2 rounded-lg p-3 text-xs text-text-muted space-y-1 mt-2 border border-border/60">
                <p><span className="text-text">Shell:</span> Tauri v2 + React 19</p>
                <p><span className="text-text">Core:</span> Rust + Tokio + SQLite</p>
                <p><span className="text-text">UI:</span> Tailwind CSS v4 · marca ONYX (búho)</p>
                <p><span className="text-text">Governance:</span> engagement, audit trail, exports</p>
              </div>
              <p className="text-[10px] text-text-muted text-center mt-2">
                Authorized use only. Operations are logged locally.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toEngagementPayload(f: EngagementForm): Engagement {
  const trim = (s: string) => (s.trim() === "" ? null : s.trim());
  return {
    client_name: trim(f.client_name),
    client_contact: trim(f.client_contact),
    authorized_scope: trim(f.authorized_scope),
    engagement_start: trim(f.engagement_start),
    engagement_end: trim(f.engagement_end),
    authorization_reference: trim(f.authorization_reference),
    authorization_acknowledged: f.authorization_acknowledged,
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-text-muted block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50"
      />
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
