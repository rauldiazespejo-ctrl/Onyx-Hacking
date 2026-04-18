import { useMemo, useState } from "react";
import { useOnyxStore } from "../../store/onyx";
import type { Project } from "../../types";
import {
  Shield,
  Key,
  Network,
  ArrowRight,
  Lock,
  Unlock,
  Eye,
} from "lucide-react";

interface PrivEscCheck {
  id: string;
  name: string;
  technique: string;
  result: "Vulnerable" | "Safe" | "Unknown";
  details: string;
}

interface LateralPath {
  from: string;
  to: string;
  method: string;
  status: "Possible" | "Blocked" | "Exploited";
}

const privEscChecks: PrivEscCheck[] = [
  { id: "PE-001", name: "SUID Binaries", technique: "GTFOBins", result: "Safe", details: "No exploitable SUID binaries found" },
  { id: "PE-002", name: "Sudo Misconfiguration", technique: "sudo -l", result: "Vulnerable", details: "User can run vim as root without password (sudo vim)" },
  { id: "PE-003", name: "Kernel Exploits", technique: "uname -r", result: "Safe", details: "Kernel version 5.15.0 — no known local exploits" },
  { id: "PE-004", name: "Writable Paths", technique: "PATH hijacking", result: "Vulnerable", details: "/opt/app/bin is world-writable and in root's PATH" },
  { id: "PE-005", name: "Cron Jobs", technique: "crontab analysis", result: "Safe", details: "No writable cron job scripts found" },
  { id: "PE-006", name: "SSH Keys", technique: "file search", result: "Vulnerable", details: "Found private SSH key readable by current user: /home/admin/.ssh/id_rsa" },
];

const lateralPaths: LateralPath[] = [
  { from: "web-server (10.0.0.5)", to: "db-server (10.0.0.10)", method: "DB Credentials from config", status: "Exploited" },
  { from: "web-server (10.0.0.5)", to: "ad-controller (10.0.0.1)", method: "Kerberoasting", status: "Possible" },
  { from: "db-server (10.0.0.10)", to: "backup-server (10.0.0.20)", method: "SSH Key Reuse", status: "Possible" },
  { from: "web-server (10.0.0.5)", to: "internal-dev (10.0.0.50)", method: "Network Segmentation", status: "Blocked" },
];

export function PostModule() {
  const { activeProject } = useOnyxStore();
  const [activeTab, setActiveTab] = useState<"privesc" | "lateral" | "credentials">("privesc");

  return (
    <div className="flex flex-col h-full gap-4">
      {!activeProject ? (
        <div className="flex flex-col items-center justify-center flex-1 text-text-muted text-sm gap-2">
          <Shield size={36} className="opacity-25" />
          <p>Select a project to anchor post-ex views to your targets.</p>
        </div>
      ) : (
        <>
      <p className="text-[11px] text-text-muted border border-border rounded-lg px-3 py-2 bg-surface-2/40">
        <strong>Lab / training mode:</strong> the tables below illustrate how ONYX can present post-ex findings.
        Data is not collected from live hosts until you integrate collectors. Your current targets:{" "}
        <span className="text-accent terminal-text">
          {activeProject.targets.length ? activeProject.targets.map((t) => t.host).join(", ") : "none yet"}
        </span>
        .
      </p>
      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-lg border border-border p-1">
        {[
          { id: "privesc" as const, label: "Privilege Escalation", icon: <ArrowRight size={14} /> },
          { id: "lateral" as const, label: "Lateral Movement", icon: <Network size={14} /> },
          { id: "credentials" as const, label: "Credentials", icon: <Key size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-accent/10 text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "privesc" && <PrivEscPanel />}
      {activeTab === "lateral" && <LateralPanel project={activeProject} />}
      {activeTab === "credentials" && <CredentialsPanel />}
        </>
      )}
    </div>
  );
}

function PrivEscPanel() {
  const vulnerable = privEscChecks.filter((c) => c.result === "Vulnerable").length;
  const safe = privEscChecks.filter((c) => c.result === "Safe").length;

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-danger">{vulnerable}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Vulnerable</p>
        </div>
        <div className="bg-surface rounded-lg border border-border p-3 text-center">
          <p className="text-2xl font-bold text-[#27C93F]">{safe}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Safe</p>
        </div>
      </div>

      <div className="flex-1 bg-surface rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Shield size={14} /> Privilege Escalation Checks
          </h3>
        </div>
        <div className="overflow-y-auto">
          {privEscChecks.map((check) => (
            <div key={check.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-surface-2/50">
              <div className="flex items-center gap-3">
                {check.result === "Vulnerable" ? (
                  <Unlock size={14} className="text-danger" />
                ) : (
                  <Lock size={14} className="text-[#27C93F]" />
                )}
                <div>
                  <p className="text-sm font-medium">{check.name}</p>
                  <p className="text-[10px] text-text-muted">{check.technique}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  check.result === "Vulnerable" ? "bg-danger/20 text-danger" : "bg-[#27C93F]/20 text-[#27C93F]"
                }`}>
                  {check.result}
                </span>
                <p className="text-[10px] text-text-muted mt-1 max-w-[200px] text-right">{check.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LateralPanel({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    Exploited: "text-[#27C93F] bg-[#27C93F]/20",
    Possible: "text-[#FFB800] bg-[#FFB800]/20",
    Blocked: "text-text-muted bg-text-muted/20",
  };

  const paths = useMemo(() => {
    const t = project.targets;
    if (t.length >= 2) {
      return t.slice(0, -1).map((from, i) => ({
        from: from.host,
        to: t[i + 1]!.host,
        method: "Sequential target chain (illustrative — not an active path scan)",
        status: "Possible" as const,
      }));
    }
    return lateralPaths;
  }, [project]);

  return (
    <div className="flex-1 bg-surface rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <Network size={14} /> Lateral Movement Paths
        </h3>
      </div>
      <div className="p-4 overflow-y-auto">
        <div className="space-y-3">
          {paths.map((path, i) => (
            <div key={i} className="bg-surface-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="terminal-text text-accent">{path.from}</span>
                <ArrowRight size={14} className="text-text-muted" />
                <span className="terminal-text text-accent">{path.to}</span>
                <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[path.status]}`}>
                  {path.status}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-1.5">{path.method}</p>
            </div>
          ))}
        </div>

        {/* Network Topology Visualization */}
        <div className="mt-4 bg-[#0A0A0E] rounded-lg border border-border p-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-3">Network Topology</p>
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg bg-danger/20 border border-danger/30 flex items-center justify-center mb-1">
                <Unlock size={20} className="text-danger" />
              </div>
              <p className="text-[10px] text-text-muted">web-server</p>
              <p className="text-[9px] terminal-text text-text-muted">10.0.0.5</p>
            </div>
            <div className="flex flex-col gap-2">
              <ArrowRight size={16} className="text-[#27C93F]" />
              <span className="text-[8px] text-text-muted">credentials</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg bg-[#27C93F]/20 border border-[#27C93F]/30 flex items-center justify-center mb-1">
                <Lock size={20} className="text-[#27C93F]" />
              </div>
              <p className="text-[10px] text-text-muted">db-server</p>
              <p className="text-[9px] terminal-text text-text-muted">10.0.0.10</p>
            </div>
            <div className="flex flex-col gap-2">
              <ArrowRight size={16} className="text-text-muted" />
              <span className="text-[8px] text-text-muted">segmented</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg bg-text-muted/10 border border-text-muted/20 flex items-center justify-center mb-1">
                <Eye size={20} className="text-text-muted" />
              </div>
              <p className="text-[10px] text-text-muted">internal-dev</p>
              <p className="text-[9px] terminal-text text-text-muted">10.0.0.50</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CredentialsPanel() {
  const creds = [
    { id: 1, username: "admin", password: "••••••••", source: "Config file", type: "Plaintext" },
    { id: 2, username: "db_user", password: "••••••••", source: "Database connection string", type: "Plaintext" },
    { id: 3, username: "root@web", password: "••••••••••••", source: "SSH key found", type: "SSH Key" },
    { id: 4, username: "svc_backup", password: "••••••••••••••", source: "Kerberos ticket", type: "NTLM Hash" },
  ];

  return (
    <div className="flex-1 bg-surface rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <Key size={14} /> Harvested Credentials ({creds.length})
        </h3>
      </div>
      <div className="overflow-y-auto">
        {creds.map((cred) => (
          <div key={cred.id} className="flex items-center gap-4 px-4 py-2.5 border-b border-border hover:bg-surface-2/50">
            <Key size={14} className="text-[#FFB800]" />
            <div className="flex-1">
              <p className="text-sm font-medium terminal-text">{cred.username}</p>
              <p className="text-[10px] text-text-muted">{cred.source}</p>
            </div>
            <span className="text-xs terminal-text text-text-muted">{cred.password}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 text-text-muted">{cred.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
