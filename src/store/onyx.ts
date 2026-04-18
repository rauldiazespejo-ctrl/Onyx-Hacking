import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  Project,
  ProjectSummary,
  Vulnerability,
  ScanResult,
  Module,
  Engagement,
} from "../types";
import { useToastStore } from "../hooks/useToast";

function toastInvokeError(title: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  useToastStore.getState().addToast({ type: "error", title, message });
}

interface OnyxStore {
  // Projects
  projectSummaries: ProjectSummary[];
  activeProject: Project | null;
  activeModule: Module;

  // UI state
  sidebarCollapsed: boolean;
  terminalOutput: string[];
  isScanning: boolean;
  scanProgress: number;

  // Actions
  setActiveProject: (project: Project | null) => void;
  setActiveModule: (module: Module) => void;
  toggleSidebar: () => void;
  addTerminalLine: (line: string) => void;
  clearTerminal: () => void;
  setIsScanning: (scanning: boolean) => void;
  setScanProgress: (progress: number) => void;

  // Tauri commands
  loadProjects: () => Promise<void>;
  loadProject: (id: string, options?: { quiet?: boolean }) => Promise<void>;
  createProject: (name: string) => Promise<ProjectSummary>;
  deleteProject: (id: string) => Promise<void>;
  addTarget: (projectId: string, host: string) => Promise<void>;
  runReconScan: (projectId: string, targetId: string) => Promise<ScanResult>;
  runVulnScan: (projectId: string, targetId: string) => Promise<Vulnerability[]>;
  saveEngagement: (projectId: string, engagement: Engagement) => Promise<void>;
  deleteScanResult: (projectId: string, scanId: string) => Promise<void>;
  clearScanHistory: (projectId: string) => Promise<number>;
}

export const useOnyxStore = create<OnyxStore>((set, get) => ({
  projectSummaries: [],
  activeProject: null,
  activeModule: "dashboard",
  sidebarCollapsed: false,
  terminalOutput: [
    "\x1b[36m  ████████╗███████╗██████╗ ███╗   ███╗",
    "\x1b[36m  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║",
    "\x1b[36m  █████╗  █████╗  ██████╔╝██╔████╔██║",
    "\x1b[36m  ██╔══╝  ██╔══╝  ██╔══██╗██║╚██╔╝██║",
    "\x1b[36m  ███████╗███████╗██║  ██║██║ ╚═╝ ██║",
    "\x1b[36m  ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝",
    "",
    "\x1b[90m  Security Testing Suite v1.0.0",
    "\x1b[90m  Type 'help' for available commands.",
    "",
  ],
  isScanning: false,
  scanProgress: 0,

  setActiveProject: (project) => set({ activeProject: project }),
  setActiveModule: (module) => set({ activeModule: module }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  addTerminalLine: (line) =>
    set((s) => ({ terminalOutput: [...s.terminalOutput, line] })),
  clearTerminal: () => set({ terminalOutput: [] }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setScanProgress: (progress) => set({ scanProgress: progress }),

  loadProjects: async () => {
    try {
      const summaries = await invoke<ProjectSummary[]>("list_projects");
      set({ projectSummaries: summaries });
      if (summaries.length > 0 && !get().activeProject) {
        try {
          await get().loadProject(summaries[0].id);
        } catch {
          /* loadProject already surfaced a toast */
        }
      }
    } catch (e) {
      toastInvokeError("Could not load projects", e);
    }
  },

  loadProject: async (id: string, options?: { quiet?: boolean }) => {
    try {
      const project = await invoke<Project>("get_project", { projectId: id });
      set({ activeProject: project });
    } catch (e) {
      if (!options?.quiet) toastInvokeError("Could not open project", e);
      throw e;
    }
  },

  createProject: async (name: string) => {
    try {
      const project = await invoke<Project>("create_project", { name });
      get().addTerminalLine(`\x1b[32m[+]\x1b[0m Project "${name}" created (${project.id.slice(0, 8)})`);
      const summaries = await invoke<ProjectSummary[]>("list_projects");
      set({ projectSummaries: summaries });
      await get().loadProject(project.id, { quiet: true });
      const summary = summaries.find((s) => s.id === project.id);
      if (!summary) {
        throw new Error("Project was created but is missing from the list.");
      }
      return summary;
    } catch (e) {
      toastInvokeError("Could not create project", e);
      throw e;
    }
  },

  deleteProject: async (id: string) => {
    try {
      await invoke("delete_project", { projectId: id });
      get().addTerminalLine(`\x1b[33m[-]\x1b[0m Project deleted`);
      const summaries = await invoke<ProjectSummary[]>("list_projects");
      set({
        projectSummaries: summaries,
        activeProject: get().activeProject?.id === id ? null : get().activeProject,
      });
    } catch (e) {
      toastInvokeError("Could not delete project", e);
      throw e;
    }
  },

  addTarget: async (projectId: string, host: string) => {
    try {
      await invoke("add_target", { projectId, host });
      get().addTerminalLine(`\x1b[32m[+]\x1b[0m Target added: ${host}`);
      await get().loadProject(projectId);
    } catch (e) {
      toastInvokeError("Could not add target", e);
      throw e;
    }
  },

  runReconScan: async (projectId: string, targetId: string) => {
    set({ isScanning: true, scanProgress: 0 });
    get().addTerminalLine(`\x1b[36m[*]\x1b[0m Starting recon scan...`);

    for (let i = 0; i <= 80; i += 10) {
      await new Promise((r) => setTimeout(r, 50));
      set({ scanProgress: i });
    }

    try {
      const result = await invoke<ScanResult>("start_recon_scan", { projectId, targetId });
      set({ scanProgress: 100 });
      const openPorts = result.ports_found.filter((p) => p.state === "Open");
      get().addTerminalLine(`\x1b[32m[+]\x1b[0m Scan complete: ${openPorts.length} open ports found`);
      openPorts.forEach((p) =>
        get().addTerminalLine(`    \x1b[32m${p.port}/tcp\x1b[0m OPEN ${p.service} ${p.version || ""}`)
      );
      await get().loadProject(projectId);
      return result;
    } catch (e) {
      toastInvokeError("Recon scan failed", e);
      throw e;
    } finally {
      set({ isScanning: false, scanProgress: 0 });
    }
  },

  runVulnScan: async (projectId: string, targetId: string) => {
    set({ isScanning: true });
    get().addTerminalLine(`\x1b[36m[*]\x1b[0m Starting vulnerability scan...`);

    try {
      const vulns = await invoke<Vulnerability[]>("start_vuln_scan", { projectId, targetId });
      get().addTerminalLine(`\x1b[32m[+]\x1b[0m Vuln scan complete: ${vulns.length} findings`);
      vulns.forEach((v) => {
        const color = v.severity === "Critical" ? "31" : v.severity === "High" ? "33" : "36";
        get().addTerminalLine(`    \x1b[${color}[${v.severity.toUpperCase()}]\x1b[0m ${v.title}${v.cve ? ` (${v.cve})` : ""}`);
      });
      await get().loadProject(projectId);
      return vulns;
    } catch (e) {
      toastInvokeError("Vulnerability scan failed", e);
      throw e;
    } finally {
      set({ isScanning: false });
    }
  },

  saveEngagement: async (projectId: string, engagement: Engagement) => {
    try {
      await invoke("update_project_engagement", { projectId, engagement });
      await get().loadProject(projectId);
      useToastStore.getState().addToast({
        type: "success",
        title: "Engagement saved",
        message: "Authorization details are stored with this project.",
      });
    } catch (e) {
      toastInvokeError("Could not save engagement", e);
      throw e;
    }
  },

  deleteScanResult: async (projectId: string, scanId: string) => {
    try {
      await invoke("delete_scan_result", { projectId, scanId });
      get().addTerminalLine(`\x1b[33m[-]\x1b[0m Scan removed from history (linked ports cleared)`);
      await get().loadProject(projectId);
      useToastStore.getState().addToast({
        type: "success",
        title: "Scan deleted",
        message: "The scan record and its port rows were removed from this project.",
      });
    } catch (e) {
      toastInvokeError("Could not delete scan", e);
      throw e;
    }
  },

  clearScanHistory: async (projectId: string) => {
    try {
      const removed = await invoke<number>("clear_scan_history", { projectId });
      get().addTerminalLine(`\x1b[33m[-]\x1b[0m Cleared ${removed} scan record(s) from history`);
      await get().loadProject(projectId);
      useToastStore.getState().addToast({
        type: "success",
        title: "Scan history cleared",
        message: removed > 0 ? `${removed} scan(s) removed. Port data from those scans was deleted.` : "There were no scans to remove.",
      });
      return removed;
    } catch (e) {
      toastInvokeError("Could not clear scan history", e);
      throw e;
    }
  },
}));
