import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useOnyxStore } from "../../store/onyx";

export function StatusBar() {
  const { isScanning, scanProgress, activeProject, activeModule } = useOnyxStore();
  const [version, setVersion] = useState("1.0.0");

  useEffect(() => {
    invoke<{ version: string }>("get_app_info")
      .then((info) => setVersion(info.version))
      .catch(() => {});
  }, []);
  const moduleLabels: Record<string, string> = {
    recon: "Reconnaissance",
    vuln: "Vulnerability Analysis",
    exploit: "Exploitation",
    post: "Post-Exploitation",
    report: "Reporting",
  };

  return (
    <div className="flex items-center justify-between h-8 px-4 bg-surface border-t border-border text-[11px]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isScanning ? "bg-accent animate-pulse-slow" : "bg-[#27C93F]"
            }`}
          />
          <span className="text-text-muted">
            {isScanning ? "Scanning..." : "Ready"}
          </span>
        </div>

        {activeProject && (
          <span className="text-text-muted">
            Project: <span className="text-text">{activeProject.name}</span>
          </span>
        )}

        <span className="text-text-muted">
          Module: <span className="text-accent">{moduleLabels[activeModule]}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isScanning && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <span className="text-text-muted">{scanProgress}%</span>
          </div>
        )}
        <span className="text-text-muted flex items-center gap-2">
          <span className="text-[#a78bfa]/80 font-semibold tracking-wider text-[10px]">PULSOAI</span>
          <span className="opacity-30">·</span>
          ONYX v{version}
        </span>
      </div>
    </div>
  );
}
