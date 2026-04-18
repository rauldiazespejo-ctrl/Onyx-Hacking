import { useState } from "react";
import {
  Search,
  Plus,
  Globe,
  Server,
  Wifi,
  Play,
  
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useOnyxStore } from "../../store/onyx";
import type { Target } from "../../types";
import { engagementAllowsScans } from "../../types";

export function ReconModule() {
  const { activeProject, addTarget, } = useOnyxStore();
  const [newTarget, setNewTarget] = useState("");
  const [scanningTargetId, setScanningTargetId] = useState<string | null>(null);
  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set());

  const handleAddTarget = async () => {
    if (!newTarget.trim() || !activeProject) return;
    try {
      await addTarget(activeProject.id, newTarget.trim());
      setNewTarget("");
    } catch {
      /* toast from store */
    }
  };

  const handleScan = async (target: Target) => {
    if (!activeProject) return;
    setScanningTargetId(target.id);
    try {
      await useOnyxStore.getState().runReconScan(activeProject.id, target.id);
      setExpandedTargets((prev) => new Set(prev).add(target.id));
    } catch {
      /* toast from store */
    } finally {
      setScanningTargetId(null);
    }
  };

  const toggleTarget = (id: string) => {
    setExpandedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const targets = activeProject?.targets || [];
  const scansAllowed = activeProject ? engagementAllowsScans(activeProject.engagement) : false;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Add Target */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Plus size={14} />
          Add Target
        </h3>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTarget()}
              placeholder="Enter IP address, domain, or CIDR range..."
              className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <button
            onClick={handleAddTarget}
            className="px-4 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {!scansAllowed && activeProject && (
        <p className="text-[11px] text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
          Scans are disabled until engagement is documented: open Settings → Engagement, add authorized scope, and confirm
          authorization.
        </p>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-muted hover:text-text hover:border-border-hover transition-all">
          <Globe size={13} /> OSINT
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-muted hover:text-text hover:border-border-hover transition-all">
          <Wifi size={13} /> Subdomain Enum
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-muted hover:text-text hover:border-border-hover transition-all">
          <Shield size={13} /> Certificate Scan
        </button>
      </div>

      {/* Target List */}
      <div className="flex-1 bg-surface rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Server size={14} />
            Targets ({targets.length})
          </h3>
          <button className="text-[10px] text-accent hover:text-accent-dim transition-colors">
            Import from file
          </button>
        </div>

        <div className="overflow-y-auto max-h-[400px]">
          {targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Server size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No targets added yet</p>
              <p className="text-xs mt-1">Add a target above to begin scanning</p>
            </div>
          ) : (
            targets.map((target) => (
              <TargetItem
                key={target.id}
                target={target}
                expanded={expandedTargets.has(target.id)}
                isScanning={scanningTargetId === target.id}
                scansAllowed={scansAllowed}
                onToggle={() => toggleTarget(target.id)}
                onScan={() => handleScan(target)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TargetItem({
  target,
  expanded,
  isScanning,
  scansAllowed,
  onToggle,
  onScan,
}: {
  target: Target;
  expanded: boolean;
  isScanning: boolean;
  scansAllowed: boolean;
  onToggle: () => void;
  onScan: () => void;
}) {
  const openPorts = target.ports.filter((p) => p.state === "Open").length;

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-2/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={onToggle} className="text-text-muted">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isScanning
                ? "bg-accent animate-pulse-slow"
                : target.ports.length > 0
                ? "bg-[#27C93F]"
                : "bg-text-muted"
            }`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{target.host}</p>
            <p className="text-[10px] text-text-muted">
              {target.ports.length > 0 ? `${openPorts} open ports` : target.status}
              {target.vulnerabilities.length > 0 && ` · ${target.vulnerabilities.length} vulns`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isScanning ? (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-accent">Scanning...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onScan}
              disabled={!scansAllowed}
              title={
                scansAllowed
                  ? "Run recon scan"
                  : "Complete Settings → Engagement (scope + authorization) to enable scans"
              }
              className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent rounded text-[11px] hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={10} /> Scan
            </button>
          )}
        </div>
      </div>

      {expanded && target.ports.length > 0 && (
        <div className="bg-surface-2/30 border-t border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted">
                <th className="text-left px-6 py-1.5 font-medium">Port</th>
                <th className="text-left px-3 py-1.5 font-medium">State</th>
                <th className="text-left px-3 py-1.5 font-medium">Service</th>
                <th className="text-left px-3 py-1.5 font-medium">Version</th>
              </tr>
            </thead>
            <tbody>
              {target.ports.map((port) => (
                <tr key={port.port} className="border-t border-border/50 hover:bg-surface-3/30">
                  <td className="px-6 py-1.5 terminal-text text-accent font-medium">
                    {port.port}/{port.protocol}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        port.state === "Open"
                          ? "bg-[#27C93F]/20 text-[#27C93F]"
                          : port.state === "Filtered"
                          ? "bg-[#FFB800]/20 text-[#FFB800]"
                          : "bg-[#6C7A89]/20 text-[#6C7A89]"
                      }`}
                    >
                      {port.state}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-text">{port.service}</td>
                  <td className="px-3 py-1.5 text-text-muted">{port.version || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
