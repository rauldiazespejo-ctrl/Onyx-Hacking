import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Project, ProjectSummary, Vulnerability, ScanResult, Module } from "../types";

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
  loadProject: (id: string) => Promise<void>;
  createProject: (name: string) => Promise<ProjectSummary>;
  deleteProject: (id: string) => Promise<void>;
  addTarget: (projectId: string, host: string) => Promise<void>;
  runReconScan: (projectId: string, targetId: string) => Promise<ScanResult>;
  runVulnScan: (projectId: string, targetId: string) => Promise<Vulnerability[]>;
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
    "\x1b[90m  Security Testing Suite v0.1.0-alpha",
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
    const summaries = await invoke<ProjectSummary[]>("list_projects");
    set({ projectSummaries: summaries });
    // Auto-select first project if none active
    if (summaries.length > 0 && !get().activeProject) {
      await get().loadProject(summaries[0].id);
    }
  },

  loadProject: async (id: string) => {
    const project = await invoke<Project>("get_project", { projectId: id });
    set({ activeProject: project });
  },

  createProject: async (name: string) => {
    const project = await invoke<Project>("create_project", { name });
    get().addTerminalLine(`\x1b[32m[+]\x1b[0m Project "${name}" created (${project.id.slice(0, 8)})`);
    // Reload summaries and the new project
    const summaries = await invoke<ProjectSummary[]>("list_projects");
    set({ projectSummaries: summaries });
    await get().loadProject(project.id);
    return summaries.find(s => s.id === project.id)!;
  },

  deleteProject: async (id: string) => {
    await invoke("delete_project", { projectId: id });
    get().addTerminalLine(`\x1b[33m[-]\x1b[0m Project deleted`);
    const summaries = await invoke<ProjectSummary[]>("list_projects");
    set({
      projectSummaries: summaries,
      activeProject: get().activeProject?.id === id ? null : get().activeProject,
    });
  },

  addTarget: async (projectId: string, host: string) => {
    await invoke("add_target", { projectId, host });
    get().addTerminalLine(`\x1b[32m[+]\x1b[0m Target added: ${host}`);
    // Reload project
    await get().loadProject(projectId);
  },

  runReconScan: async (projectId: string, targetId: string) => {
    set({ isScanning: true, scanProgress: 0 });
    get().addTerminalLine(`\x1b[36m[*]\x1b[0m Starting recon scan...`);

    // Simulate progress
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
      // Reload project with new data
      await get().loadProject(projectId);
      return result;
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
    } finally {
      set({ isScanning: false });
    }
  },
}));
