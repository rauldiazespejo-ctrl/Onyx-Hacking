import { useEffect } from "react";
import { useOnyxStore } from "../store/onyx";
import type { Module } from "../types";

const moduleKeys: Record<string, Module> = {
  "1": "dashboard",
  "2": "recon",
  "3": "vuln",
  "4": "exploit",
  "5": "post",
  "6": "report",
};

export function useKeyboardShortcuts() {
  const { activeModule, setActiveModule, sidebarCollapsed, toggleSidebar, clearTerminal } = useOnyxStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      // Alt+1-6: Switch module
      if (e.altKey && moduleKeys[e.key]) {
        e.preventDefault();
        setActiveModule(moduleKeys[e.key]);
        return;
      }

      // Alt+B: Toggle sidebar
      if (e.altKey && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Alt+N: New project (handled by parent)
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("onyx:new-project"));
        return;
      }

      // Ctrl+L or Cmd+K: Clear terminal
      if ((e.metaKey || e.ctrlKey) && (e.key === "l" || e.key === "k")) {
        e.preventDefault();
        clearTerminal();
        return;
      }

      // Escape: Close modals
      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("onyx:escape"));
      }

      // /: Focus terminal
      if (e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("onyx:focus-terminal"));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeModule, setActiveModule, sidebarCollapsed, toggleSidebar, clearTerminal]);
}

export const shortcutHelp = [
  { keys: "Alt+1-6", desc: "Switch module" },
  { keys: "Alt+B", desc: "Toggle sidebar" },
  { keys: "Alt+N", desc: "New project" },
  { keys: "Ctrl+L", desc: "Clear terminal" },
  { keys: "/", desc: "Focus terminal" },
  { keys: "Esc", desc: "Close modal" },
];
