import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  Printer,
  BarChart3,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useOnyxStore } from "../../store/onyx";
import { useToastStore } from "../../hooks/useToast";
import { buildReportHtml, type ReportTemplate } from "../../lib/reportHtml";
import type { Vulnerability } from "../../types";

type VulnRow = Vulnerability & { target_host: string };

export function ReportModule() {
  const { activeProject } = useOnyxStore();
  const { addToast } = useToastStore();
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>("executive");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    invoke<{ version: string }>("get_app_info")
      .then((info) => setAppVersion(info.version))
      .catch(() => {});
  }, []);

  const vulns: VulnRow[] = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.targets.flatMap((t) =>
      t.vulnerabilities.map((v) => ({ ...v, target_host: t.host }))
    );
  }, [activeProject]);

  const stats = useMemo(() => {
    const criticalHigh = vulns.filter((v) => v.severity === "Critical" || v.severity === "High").length;
    const confirmed = vulns.filter((v) => v.confirmed).length;
    return { criticalHigh, total: vulns.length, confirmed };
  }, [vulns]);

  const html = useMemo(() => {
    if (!activeProject) return "";
    return buildReportHtml(activeProject, selectedTemplate, appVersion);
  }, [activeProject, selectedTemplate, appVersion]);

  const topFindings = useMemo(() => {
    const order = ["Critical", "High", "Medium", "Low", "Info"];
    return [...vulns].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)).slice(0, 8);
  }, [vulns]);

  const handleExportHtml = async () => {
    if (!activeProject || !html) return;
    setExporting(true);
    try {
      const path = await save({
        defaultPath: `${sanitizeFilePart(activeProject.name)}-onyx-report.html`,
        filters: [{ name: "HTML", extensions: ["html"] }],
      });
      if (!path) return;
      await invoke("save_text_file", { path, contents: html });
      await invoke("record_audit_event", {
        project_id: activeProject.id,
        action: "report_export_html",
        detail: JSON.stringify({ template: selectedTemplate, path }),
      });
      addToast({ type: "success", title: "Report exported", message: path });
    } catch (e) {
      addToast({
        type: "error",
        title: "Export failed",
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) {
      addToast({ type: "warning", title: "Pop-up blocked", message: "Allow pop-ups to print the preview." });
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted gap-2">
        <FileText size={40} className="opacity-25" />
        <p className="text-sm">Select a project to build reports from live findings.</p>
      </div>
    );
  }

  const templates: { id: ReportTemplate; label: string; desc: string }[] = [
    { id: "executive", label: "Executive summary", desc: "Risk posture and top themes for leadership" },
    { id: "technical", label: "Technical report", desc: "Targets, exposure, and finding tables" },
    { id: "compliance", label: "Compliance framing", desc: "Same data with framework-oriented preamble" },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <div>
            <p className="text-lg font-bold text-danger">{stats.criticalHigh}</p>
            <p className="text-[10px] text-text-muted">Critical / High</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFB800]/10 flex items-center justify-center">
            <BarChart3 size={18} className="text-[#FFB800]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#FFB800]">{stats.total}</p>
            <p className="text-[10px] text-text-muted">Findings</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#27C93F]/10 flex items-center justify-center">
            <CheckCircle size={18} className="text-[#27C93F]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#27C93F]">{stats.confirmed}</p>
            <p className="text-[10px] text-text-muted">Confirmed</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Clock size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-lg font-bold text-accent">{activeProject.targets.length}</p>
            <p className="text-[10px] text-text-muted">Targets</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg border border-border p-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText size={14} /> Report template
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplate(t.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedTemplate === t.id
                  ? "border-accent/50 bg-accent/5"
                  : "border-border hover:border-border-hover"
              }`}
            >
              <p className="text-sm font-medium text-text">{t.label}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-surface rounded-lg border border-border overflow-hidden flex flex-col min-h-[280px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} /> Live preview
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1 bg-surface-2 rounded text-[11px] text-text-muted hover:text-text transition-colors"
            >
              <Printer size={11} /> Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={handleExportHtml}
              disabled={exporting}
              className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 rounded text-[11px] text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
            >
              <Download size={11} /> {exporting ? "Exporting…" : "Export HTML"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#1A1A1E]">
          <div className="max-w-2xl mx-auto text-text">
            <div className="text-center mb-6 pb-4 border-b border-border">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Shield size={26} className="text-accent" />
                <h1 className="text-lg font-bold text-accent tracking-wider">ONYX</h1>
              </div>
              <h2 className="text-base font-semibold">{activeProject.name}</h2>
              <p className="text-[11px] text-text-muted mt-1">
                {selectedTemplate === "executive"
                  ? "Executive summary"
                  : selectedTemplate === "technical"
                    ? "Technical report"
                    : "Compliance-oriented summary"}{" "}
                · {new Date().toLocaleDateString()}
              </p>
              <p className="text-[10px] text-text-muted mt-2">CONFIDENTIAL · v{appVersion}</p>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <TrendingUp size={14} /> Severity mix
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {(["Critical", "High", "Medium", "Low", "Info"] as const).map((label) => (
                  <div key={label} className="bg-surface rounded-lg p-2 text-center border border-border">
                    <p className="text-lg font-bold text-text">{vulns.filter((v) => v.severity === label).length}</p>
                    <p className="text-[9px] text-text-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Top findings</h3>
              <div className="space-y-2">
                {topFindings.length === 0 ? (
                  <p className="text-xs text-text-muted">No findings yet — run vulnerability analysis first.</p>
                ) : (
                  topFindings.map((finding, i) => (
                    <div key={finding.id} className="bg-surface rounded-lg border border-border p-3 flex gap-2">
                      <span className="text-xs font-bold text-text-muted w-5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{finding.title}</p>
                        <p className="text-[10px] text-accent terminal-text">
                          {finding.target_host}
                          {finding.cve ? ` · ${finding.cve}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
                          finding.severity === "Critical"
                            ? "bg-danger/20 text-danger"
                            : finding.severity === "High"
                              ? "bg-[#FF6633]/20 text-[#FF6633]"
                              : "bg-surface-3 text-text-muted"
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="text-center text-[10px] text-text-muted pt-6 border-t border-border mt-6">
              Use Export HTML for a standalone file. Use your browser print dialog for PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function sanitizeFilePart(name: string): string {
  return name.replace(/[^\w\-]+/g, "_").slice(0, 64) || "project";
}
