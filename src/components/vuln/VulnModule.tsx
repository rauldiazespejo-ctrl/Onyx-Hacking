import { useState, useMemo } from "react";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Play,
  Eye,
} from "lucide-react";
import { useOnyxStore } from "../../store/onyx";
import { VulnDetailModal } from "../shared/VulnDetailModal";
import type { Vulnerability } from "../../types";
import { severityBg, severityColors } from "../../types";

export function VulnModule() {
  const { activeProject, isScanning } = useOnyxStore();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [selectedTargetHost, setSelectedTargetHost] = useState<string | undefined>();

  const vulns = activeProject?.targets.flatMap((t) =>
    t.vulnerabilities.map((v) => ({ ...v, target_host: t.host }))
  ) || [];

  const filtered = useMemo(() => {
    return vulns.filter((v) => {
      if (filter !== "all" && v.severity !== filter) return false;
      if (search && !v.title.toLowerCase().includes(search.toLowerCase()) && !v.cve?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [vulns, filter, search]);

  const counts = useMemo(() => ({
    Critical: vulns.filter((v) => v.severity === "Critical").length,
    High: vulns.filter((v) => v.severity === "High").length,
    Medium: vulns.filter((v) => v.severity === "Medium").length,
    Low: vulns.filter((v) => v.severity === "Low").length,
    Info: vulns.filter((v) => v.severity === "Info").length,
  }), [vulns]);

  const refreshProject = async () => {
    if (activeProject) {
      await useOnyxStore.getState().loadProject(activeProject.id);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-2">
        {(["Critical", "High", "Medium", "Low", "Info"] as const).map((sev) => (
          <div key={sev} className="bg-surface rounded-lg border border-border p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: severityColors[sev] }}>
              {counts[sev]}
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{sev}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vulnerabilities or CVEs..."
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50"
          />
        </div>
        {activeProject && activeProject.targets.length > 0 && (
          <button
            onClick={async () => {
              const firstTarget = activeProject.targets[0];
              await useOnyxStore.getState().runVulnScan(activeProject.id, firstTarget.id);
            }}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            <Play size={12} /> Run Vuln Scan
          </button>
        )}
        <div className="flex gap-1">
          {["all", "Critical", "High", "Medium", "Low"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                filter === f
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:text-text hover:bg-surface-2"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Vulnerability List */}
      <div className="flex-1 bg-surface rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Shield size={14} />
            Findings ({filtered.length})
          </h3>
          <div className="flex gap-2">
            <button className="text-[10px] text-accent hover:text-accent-dim transition-colors">
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[350px]">
          {filtered.map((vuln) => (
            <VulnRow
              key={vuln.id}
              vuln={vuln}
              expanded={expandedId === vuln.id}
              onToggle={() => setExpandedId(expandedId === vuln.id ? null : vuln.id)}
              onDetail={() => {
                setSelectedVuln(vuln);
                setSelectedTargetHost(vuln.target_host);
              }}
            />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Shield size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No vulnerabilities found</p>
              {vulns.length === 0 && (
                <p className="text-xs mt-1">Run a vulnerability scan from the Recon module first</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vuln Detail Modal */}
      {selectedVuln && (
        <VulnDetailModal
          vuln={selectedVuln}
          targetHost={selectedTargetHost}
          onClose={() => setSelectedVuln(null)}
          onUpdate={refreshProject}
        />
      )}
    </div>
  );
}

function VulnRow({
  vuln,
  expanded,
  onToggle,
  onDetail,
}: {
  vuln: Vulnerability & { target_host: string };
  expanded: boolean;
  onToggle: () => void;
  onDetail: () => void;
}) {
  return (
    <div className={`border-b border-border last:border-0 ${vuln.false_positive ? "opacity-50" : ""}`}>
      <div
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2/50 transition-colors"
      >
        <button onClick={onToggle} className="text-text-muted">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${severityBg[vuln.severity]}`}>
          {vuln.severity.toUpperCase()}
        </span>

        <button className="flex-1 min-w-0 text-left" onClick={onDetail} title="Click for details">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{vuln.title}</p>
            <Eye size={12} className="text-text-muted flex-shrink-0 opacity-0 hover:opacity-100" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {vuln.cve && <span className="text-[10px] text-accent terminal-text">{vuln.cve}</span>}
            {vuln.cvss_score !== undefined && vuln.cvss_score > 0 && (
              <span className="text-[10px] text-text-muted">CVSS: {vuln.cvss_score.toFixed(1)}</span>
            )}
            <span className="text-[10px] text-text-muted">{vuln.target_host}</span>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          {vuln.confirmed && <CheckCircle size={12} className="text-[#27C93F]" />}
          {vuln.false_positive && <XCircle size={12} className="text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-3 bg-surface-2/30 border-t border-border">
          <p className="text-xs text-text mt-2">{vuln.description}</p>
          <button
            onClick={onDetail}
            className="mt-2 text-[11px] text-accent hover:text-accent-dim flex items-center gap-1"
          >
            View full details <Eye size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
