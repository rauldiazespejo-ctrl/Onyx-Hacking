import { useState, useMemo } from "react";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Play,
} from "lucide-react";
import { useOnyxStore } from "../../store/onyx";
import type { Vulnerability } from "../../types";
import { severityBg, severityColors } from "../../types";

export function VulnModule() {
  const { activeProject, isScanning } = useOnyxStore();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get vulnerabilities from all targets in the active project
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

  // Confirmed/FP toggling is display-only in this version (managed via backend in next iteration)
  const toggleConfirmed = (_id: string) => { };
  const markFalsePositive = (_id: string) => { };

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
            <VulnItem
              key={vuln.id}
              vuln={vuln}
              expanded={expandedId === vuln.id}
              onToggle={() => setExpandedId(expandedId === vuln.id ? null : vuln.id)}
              onConfirm={() => toggleConfirmed(vuln.id)}
              onFalsePositive={() => markFalsePositive(vuln.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Shield size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No vulnerabilities found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VulnItem({
  vuln,
  expanded,
  onToggle,
  onConfirm,
  onFalsePositive,
}: {
  vuln: Vulnerability;
  expanded: boolean;
  onToggle: () => void;
  onConfirm: () => void;
  onFalsePositive: () => void;
}) {
  return (
    <div className={`border-b border-border last:border-0 ${vuln.false_positive ? "opacity-50" : ""}`}>
      <div
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <button className="text-text-muted">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${severityBg[vuln.severity]}`}>
          {vuln.severity.toUpperCase()}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{vuln.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {vuln.cve && <span className="text-[10px] text-accent terminal-text">{vuln.cve}</span>}
            {vuln.cvss_score !== undefined && vuln.cvss_score > 0 && (
              <span className="text-[10px] text-text-muted">CVSS: {vuln.cvss_score.toFixed(1)}</span>
            )}
            <span className="text-[10px] text-text-muted">[{vuln.module}]</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {vuln.confirmed && <CheckCircle size={12} className="text-[#27C93F]" />}
          {vuln.false_positive && <XCircle size={12} className="text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-3 bg-surface-2/30 border-t border-border">
          <p className="text-xs text-text mt-3">{vuln.description}</p>

          {vuln.evidence.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Evidence</p>
              {vuln.evidence.map((ev, i) => (
                <div key={i} className="bg-[#0A0A0E] rounded px-3 py-1.5 mt-1 terminal-text text-[11px] text-[#FFB800]">
                  {ev}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onConfirm(); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors ${
                vuln.confirmed
                  ? "bg-[#27C93F]/20 text-[#27C93F]"
                  : "bg-surface-3 text-text-muted hover:text-text"
              }`}
            >
              <CheckCircle size={11} /> {vuln.confirmed ? "Confirmed" : "Confirm"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onFalsePositive(); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] transition-colors ${
                vuln.false_positive
                  ? "bg-text-muted/20 text-text-muted"
                  : "bg-surface-3 text-text-muted hover:text-text"
              }`}
            >
              <XCircle size={11} /> {vuln.false_positive ? "False Positive" : "Mark FP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
