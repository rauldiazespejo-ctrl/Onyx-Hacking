import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Eye,
} from "lucide-react";
import { useOnyxStore } from "../../store/onyx";
import type { ScanResult } from "../../types";
import { engagementAllowsScans } from "../../types";

interface DashboardStats {
  totalTargets: number;
  totalVulns: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalPorts: number;
  openPorts: number;
  recentScans: ScanResult[];
}

export function DashboardModule() {
  const { activeProject } = useOnyxStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  useEffect(() => {
    if (!activeProject) {
      setStats(null);
      return;
    }

    const targets = activeProject.targets || [];
    const allVulns = targets.flatMap((t) => t.vulnerabilities);
    const allPorts = targets.flatMap((t) => t.ports);

    setStats({
      totalTargets: targets.length,
      totalVulns: allVulns.length,
      criticalCount: allVulns.filter((v) => v.severity === "Critical").length,
      highCount: allVulns.filter((v) => v.severity === "High").length,
      mediumCount: allVulns.filter((v) => v.severity === "Medium").length,
      lowCount: allVulns.filter((v) => v.severity === "Low").length,
      totalPorts: allPorts.length,
      openPorts: allPorts.filter((p) => p.state === "Open").length,
      recentScans: [],
    });

    // Load recent scans
    invoke<ScanResult[]>("get_scan_history", { projectId: activeProject.id })
      .then((scans) => setRecentScans(scans.slice(0, 5)))
      .catch(() => {});
  }, [activeProject]);

  if (!activeProject || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted">
        <Shield size={48} className="mb-4 opacity-20" />
        <h2 className="text-lg font-medium text-text mb-2">No Active Project</h2>
        <p className="text-sm">Create or select a project to see the dashboard</p>
      </div>
    );
  }

  const riskScore = Math.max(0, Math.min(100,
    stats.criticalCount * 30 + stats.highCount * 15 + stats.mediumCount * 5 + stats.lowCount * 1
  ));

  const riskLabel = riskScore >= 80 ? "Critical" : riskScore >= 60 ? "High" : riskScore >= 30 ? "Medium" : "Low";
  const riskColor = riskScore >= 80 ? "#FF3366" : riskScore >= 60 ? "#FF6633" : riskScore >= 30 ? "#FFB800" : "#00FFC8";

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Risk Score Banner */}
      <div className="bg-surface rounded-lg border border-border p-5 flex items-center gap-6">
        <div className="relative">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#26262E" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={riskColor}
              strokeWidth="6"
              strokeDasharray={`${riskScore * 2.64} ${264 - riskScore * 2.64}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: riskColor }}>{riskScore}</span>
            <span className="text-[9px] text-text-muted">RISK SCORE</span>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text">
            {activeProject.name}
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Overall risk level: <span className="font-semibold" style={{ color: riskColor }}>{riskLabel}</span>
          </p>
          <div className="flex gap-4 mt-2">
            <span className="text-[11px] text-text-muted">
              <span className="text-text font-medium">{stats.totalTargets}</span> targets
            </span>
            <span className="text-[11px] text-text-muted">
              <span className="text-text font-medium">{stats.totalVulns}</span> findings
            </span>
            <span className="text-[11px] text-text-muted">
              <span className="text-text font-medium">{stats.openPorts}</span> open ports
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            title={
              engagementAllowsScans(activeProject.engagement)
                ? "Run recon on first target"
                : "Complete Settings → Engagement to enable scans"
            }
            disabled={!engagementAllowsScans(activeProject.engagement) || activeProject.targets.length === 0}
            onClick={async () => {
              if (activeProject.targets.length === 0) return;
              try {
                await useOnyxStore.getState().runReconScan(activeProject.id, activeProject.targets[0].id);
              } catch {
                /* toast from store */
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap size={13} /> Quick Scan
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-2">
        <StatCard
          icon={<Target size={16} />}
          label="Targets"
          value={stats.totalTargets}
          color="#00FFC8"
          sub="added"
        />
        <StatCard
          icon={<AlertTriangle size={16} />}
          label="Critical"
          value={stats.criticalCount}
          color="#FF3366"
          sub="findings"
        />
        <StatCard
          icon={<Activity size={16} />}
          label="High"
          value={stats.highCount}
          color="#FF6633"
          sub="findings"
        />
        <StatCard
          icon={<Eye size={16} />}
          label="Medium"
          value={stats.mediumCount}
          color="#FFB800"
          sub="findings"
        />
        <StatCard
          icon={<CheckCircle size={16} />}
          label="Open Ports"
          value={stats.openPorts}
          color="#4A9EFF"
          sub={`of ${stats.totalPorts}`}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
        {/* Targets Overview */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Target size={14} /> Targets Overview
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeProject.targets.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                No targets added yet
              </div>
            ) : (
              activeProject.targets.map((target) => {
                const vulnCount = target.vulnerabilities.length;
                const portCount = target.ports.filter((p) => p.state === "Open").length;
                const critVulns = target.vulnerabilities.filter((v) => v.severity === "Critical").length;
                return (
                  <div key={target.id} className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-surface-2/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${target.ports.length > 0 ? "bg-[#27C93F]" : "bg-text-muted"}`} />
                      <div>
                        <p className="text-sm font-medium">{target.host}</p>
                        <p className="text-[10px] text-text-muted">{portCount} open ports</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {critVulns > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-danger/20 text-danger font-semibold">
                          {critVulns}C
                        </span>
                      )}
                      {vulnCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 text-text-muted">
                          {vulnCount} vulns
                        </span>
                      )}
                      <span className="text-[10px] text-text-muted">{target.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} /> Recent Scans
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentScans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <Clock size={24} className="mb-2 opacity-30" />
                <p className="text-sm">No scans yet</p>
                <p className="text-[10px] mt-1">Run a scan from the Recon module</p>
              </div>
            ) : (
              recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-surface-2/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      scan.status === "Completed" ? "bg-[#27C93F]" :
                      scan.status === "Running" ? "bg-accent animate-pulse-slow" : "bg-danger"
                    }`} />
                    <div>
                      <p className="text-sm font-medium capitalize">{scan.module} Scan</p>
                      <p className="text-[10px] text-text-muted">{scan.started_at.slice(0, 19).replace("T", " ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      scan.status === "Completed" ? "bg-[#27C93F]/20 text-[#27C93F]" :
                      scan.status === "Running" ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger"
                    }`}>
                      {scan.status}
                    </span>
                    <p className="text-[10px] text-text-muted mt-0.5">{scan.ports_found.length} ports</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vulnerability Breakdown Bar */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp size={14} /> Vulnerability Distribution
        </h3>
        {stats.totalVulns > 0 ? (
          <div className="flex h-6 rounded-lg overflow-hidden bg-surface-2">
            {stats.criticalCount > 0 && (
              <div className="bg-[#FF3366] flex items-center justify-center text-[9px] font-bold text-white min-w-[24px]"
                style={{ width: `${(stats.criticalCount / stats.totalVulns) * 100}%` }}>
                {stats.criticalCount}
              </div>
            )}
            {stats.highCount > 0 && (
              <div className="bg-[#FF6633] flex items-center justify-center text-[9px] font-bold text-white min-w-[24px]"
                style={{ width: `${(stats.highCount / stats.totalVulns) * 100}%` }}>
                {stats.highCount}
              </div>
            )}
            {stats.mediumCount > 0 && (
              <div className="bg-[#FFB800] flex items-center justify-center text-[9px] font-bold text-[#0D0D0D] min-w-[24px]"
                style={{ width: `${(stats.mediumCount / stats.totalVulns) * 100}%` }}>
                {stats.mediumCount}
              </div>
            )}
            {stats.lowCount > 0 && (
              <div className="bg-[#00FFC8] flex items-center justify-center text-[9px] font-bold text-[#0D0D0D] min-w-[24px]"
                style={{ width: `${(stats.lowCount / stats.totalVulns) * 100}%` }}>
                {stats.lowCount}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-muted">No vulnerabilities discovered yet</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  sub: string;
}) {
  return (
    <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color }}>{value}</p>
        <p className="text-[10px] text-text-muted">{label} <span className="opacity-60">({sub})</span></p>
      </div>
    </div>
  );
}
