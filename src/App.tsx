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
import { useOnyxStore } from "./store/onyx";
import { Plus, FolderOpen } from "lucide-react";
import "./styles/globals.css";

function App() {
  const { activeModule, activeProject, loadProjects } = useOnyxStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await useOnyxStore.getState().createProject(newProjectName.trim());
    setNewProjectName("");
    setShowNewProject(false);
  };

  const renderModule = () => {
    if (!activeProject) {
      return <EmptyState onCreateClick={() => setShowNewProject(true)} />;
    }

    switch (activeModule) {
      case "dashboard":
        return <DashboardModule />;
      case "recon":
        return <ReconModule />;
      case "vuln":
        return <VulnModule />;
      case "exploit":
        return <ExploitModule />;
      case "post":
        return <PostModule />;
      case "report":
        return <ReportModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-onyx">
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
            <div className="flex items-center gap-3">
              {activeProject && (
                <span className="text-xs text-text-muted">
                  {activeProject.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors"
              >
                <Plus size={13} /> New Project
              </button>
            </div>
          </div>

          {/* Module Content + Terminal */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              {renderModule()}
            </div>

            {/* Terminal Panel (right side) */}
            <div className="w-[380px] border-l border-border p-2 flex-shrink-0 overflow-hidden">
              <TerminalPanel />
            </div>
          </div>
        </div>
      </div>

      <StatusBar />

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl border border-border p-6 w-[400px] shadow-2xl">
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
              <button
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-muted">
      <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
        <FolderOpen size={36} className="opacity-30" />
      </div>
      <h2 className="text-lg font-medium text-text mb-2">Welcome to ONYX</h2>
      <p className="text-sm mb-6 text-center max-w-sm">
        Create a new project to start your penetration testing engagement.
      </p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors"
      >
        <Plus size={16} /> Create Project
      </button>
    </div>
  );
}

export default App;
