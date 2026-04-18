import React from "react";
import {
  LayoutDashboard,
  Search,
  Target,
  Shield,
  Crosshair,
  FileText,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { useOnyxStore } from "../../store/onyx";
import type { Module } from "../../types";
import { OnyxOwlMark } from "../branding/OnyxOwlMark";
import { PulsoAiBadge } from "../branding/PulsoAiBadge";

const modules: { id: Module; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "recon", label: "Recon", icon: <Search size={18} /> },
  { id: "vuln", label: "Vulnerabilities", icon: <Shield size={18} /> },
  { id: "exploit", label: "Exploitation", icon: <Crosshair size={18} /> },
  { id: "post", label: "Post-Exploit", icon: <Target size={18} /> },
  { id: "report", label: "Reports", icon: <FileText size={18} /> },
];

export function Sidebar() {
  const { activeModule, setActiveModule, sidebarCollapsed, toggleSidebar, activeProject, projectSummaries, loadProject } =
    useOnyxStore();

  return (
    <div
      className={`flex flex-col h-full bg-surface border-r border-border transition-all duration-200 ${
        sidebarCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo — ONYX owl + PULSOAI layer */}
      <div
        className={`flex items-center border-b border-border bg-gradient-to-b from-surface to-surface-2/80 py-4 ${
          sidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"
        }`}
      >
        <div
          className={`relative flex items-center justify-center rounded-xl bg-surface-2/80 border border-accent/20 shadow-[0_0_20px_rgba(0,255,200,0.12)] ${
            sidebarCollapsed ? "w-9 h-9" : "w-10 h-10"
          }`}
        >
          <OnyxOwlMark size={sidebarCollapsed ? 28 : 34} />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-[0.18em] text-accent">ONYX</h1>
            <p className="text-[10px] text-text-muted">Security Suite</p>
            <div className="mt-2 opacity-90">
              <PulsoAiBadge compact />
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <span className="sr-only">ONYX by PULSOAI</span>
        )}
      </div>

      {/* Projects List */}
      {!sidebarCollapsed && (
        <div className="border-b border-border">
          <p className="px-4 pt-3 pb-1 text-[10px] text-text-muted uppercase tracking-wider">Projects</p>
          <div className="max-h-[120px] overflow-y-auto">
            {projectSummaries.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  void loadProject(p.id).catch(() => {
                    /* toast from store */
                  });
                }}
                className={`w-full text-left px-4 py-1.5 text-xs transition-colors flex items-center justify-between ${
                  activeProject?.id === p.id
                    ? "bg-accent/10 text-accent"
                    : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen size={11} className="flex-shrink-0" />
                  <span className="truncate">{p.name}</span>
                </div>
                {(p.critical_count > 0 || p.high_count > 0) && (
                  <span className="flex-shrink-0 text-[10px] text-danger font-mono">
                    {p.critical_count > 0 ? `${p.critical_count}C` : ""}
                    {p.critical_count > 0 && p.high_count > 0 ? "/" : ""}
                    {p.high_count > 0 ? `${p.high_count}H` : ""}
                  </span>
                )}
              </button>
            ))}
            {projectSummaries.length === 0 && (
              <p className="px-4 py-2 text-[10px] text-text-muted">No projects yet</p>
            )}
          </div>
        </div>
      )}

      {/* Active project info */}
      {!sidebarCollapsed && activeProject && (
        <div className="px-4 py-2 border-b border-border bg-surface-2/30">
          <p className="text-[10px] text-text-muted">
            <span className="text-accent">{activeProject.name}</span> — {activeProject.targets.length} targets, {activeProject.targets.reduce((a, t) => a + t.vulnerabilities.length, 0)} findings
          </p>
        </div>
      )}

      {/* Module Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        <p className={`text-[10px] text-text-muted uppercase tracking-wider mb-1 mt-1 ${sidebarCollapsed ? "text-center" : "px-2"}`}>
          {sidebarCollapsed ? "•••" : "Modules"}
        </p>
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
              activeModule === mod.id
                ? "bg-accent/10 text-accent"
                : "text-text-muted hover:text-text hover:bg-surface-2"
            }`}
            title={sidebarCollapsed ? mod.label : undefined}
          >
            <span className="flex-shrink-0">{mod.icon}</span>
            {!sidebarCollapsed && <span>{mod.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-border p-2">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text hover:bg-surface-2 transition-all"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}
