import { useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { TerminalPanel } from "./components/layout/TerminalPanel";
import { StatusBar } from "./components/layout/StatusBar";
import { DashboardModule } from "./components/dashboard/DashboardModule";
import { ReconModule } from "./components/recon/ReconModule";
import { VulnModule } from "./components/vuln/VulnModule";
import { ExploitModule } from "./components/exploit/ExploitModule";
import { PostModule } from "./components/post/PostModule";
import { ReportModule } from "./components/report/ReportModule";
import { ToastContainer } from "./components/shared/ToastContainer";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { useOnyxStore } from "./store/onyx";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { Plus, FolderOpen, Settings } from "lucide-react";
import { LegalDisclaimer, hasAcceptedTerms } from "./components/legal/LegalDisclaimer";
import { OnyxOwlMark } from "./components/branding/OnyxOwlMark";
import { PulsoAiBadge } from "./components/branding/PulsoAiBadge";
import "./styles/globals.css";

function App() {
  const [showLegal, setShowLegal] = useState(() => !hasAcceptedTerms());
  const { activeModule, activeProject, loadProjects } = useOnyxStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useKeyboardShortcuts();

  useEffect(() => {
    void loadProjects();
    const handleNewProject = () => setShowNewProject(true);
    const handleEscape = () => {
      setShowNewProject(false);
      setShowSettings(false);
    };
    const handleFocusTerminal = () => {
      const input = document.querySelector("input[spellCheck]") as HTMLInputElement;
      input?.focus();
    };

    window.addEventListener("onyx:new-project", handleNewProject);
    window.addEventListener("onyx:escape", handleEscape);
    window.addEventListener("onyx:focus-terminal", handleFocusTerminal);
    return () => {
      window.removeEventListener("onyx:new-project", handleNewProject);
      window.removeEventListener("onyx:escape", handleEscape);
      window.removeEventListener("onyx:focus-terminal", handleFocusTerminal);
    };
  }, [loadProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await useOnyxStore.getState().createProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProject(false);
    } catch {
      /* error toast from store */
    }
  };

  const renderModule = () => {
    if (!activeProject) {
      return <EmptyState onCreateClick={() => setShowNewProject(true)} />;
    }
    switch (activeModule) {
      case "dashboard": return <DashboardModule />;
      case "recon": return <ReconModule />;
      case "vuln": return <VulnModule />;
      case "exploit": return <ExploitModule />;
      case "post": return <PostModule />;
      case "report": return <ReportModule />;
      default: return <DashboardModule />;
    }
  };

  if (showLegal) {
    return <LegalDisclaimer onAccept={() => setShowLegal(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen app-shell-gradient">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden main-content-glow">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-surface/90 backdrop-blur-sm border-b border-border/80 shadow-sm">
            <div className="flex items-center gap-4 min-w-0">
              <PulsoAiBadge compact />
              {activeProject && (
                <>
                  <span className="text-border h-4 w-px bg-border hidden sm:block" aria-hidden />
                  <span className="text-xs text-text-muted truncate">{activeProject.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
                title="Alt+N"
              >
                <Plus size={13} /> New Project
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 rounded-lg text-xs text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
              >
                <Settings size={13} />
              </button>
            </div>
          </div>

          {/* Module Content + Terminal */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-transparent to-onyx/40">
              {renderModule()}
            </div>
            <div className="w-[380px] border-l border-border p-2 flex-shrink-0 overflow-hidden">
              <TerminalPanel />
            </div>
          </div>
        </div>
      </div>

      <StatusBar />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Modals */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowNewProject(false)}>
          <div className="bg-surface rounded-xl border border-border p-6 w-[400px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-1">New Project</h2>
            <p className="text-xs text-text-muted mb-4">Create a new penetration testing engagement</p>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
              placeholder="Project name (e.g., Acme Corp Pentest)"
              autoFocus
              className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewProject(false)} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-2 transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="px-4 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40">
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-muted px-4">
      <div className="relative mb-6">
        <span className="onyx-hero-ring opacity-60" />
        <div className="relative w-24 h-24 rounded-2xl bg-surface-2/90 border border-accent/25 flex items-center justify-center shadow-[0_0_32px_rgba(0,255,200,0.12)]">
          <OnyxOwlMark size={64} />
        </div>
      </div>
      <h2 className="text-lg font-semibold text-text mb-1 tracking-wide">Welcome to ONYX</h2>
      <p className="text-[11px] text-[#c4b5fd]/90 mb-3 font-medium tracking-wide">PULSOAI intelligence layer</p>
      <p className="text-sm mb-1 text-center max-w-md">
        Create a project to start a structured engagement — recon, findings, and reports stay on your machine.
      </p>
      <p className="text-xs text-text-muted mb-6">
        Press <kbd className="px-1.5 py-0.5 bg-surface-2 rounded text-text font-mono text-[10px]">Alt+N</kbd> for a shortcut
      </p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent/20 to-[#a78bfa]/15 text-accent border border-accent/30 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(0,255,200,0.12)] transition-all"
      >
        <FolderOpen size={16} /> Create Project
      </button>
    </div>
  );
}

export default App;
