import { useState } from "react";
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

export function ReportModule() {
  const [selectedTemplate, setSelectedTemplate] = useState("executive");

  const templates = [
    { id: "executive", label: "Executive Summary", desc: "High-level overview for management" },
    { id: "technical", label: "Technical Report", desc: "Detailed findings with evidence" },
    { id: "compliance", label: "Compliance Report", desc: "Mapped to OWASP/PTES/MITRE" },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Report Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <div>
            <p className="text-lg font-bold text-danger">3</p>
            <p className="text-[10px] text-text-muted">Critical/High</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFB800]/10 flex items-center justify-center">
            <BarChart3 size={18} className="text-[#FFB800]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#FFB800]">6</p>
            <p className="text-[10px] text-text-muted">Total Findings</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#27C93F]/10 flex items-center justify-center">
            <CheckCircle size={18} className="text-[#27C93F]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#27C93F]">3</p>
            <p className="text-[10px] text-text-muted">Confirmed</p>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Clock size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-lg font-bold text-accent">4.2h</p>
            <p className="text-[10px] text-text-muted">Duration</p>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText size={14} /> Report Template
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
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

      {/* Preview */}
      <div className="flex-1 bg-surface rounded-lg border border-border overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <FileText size={14} /> Report Preview
          </h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-2.5 py-1 bg-surface-2 rounded text-[11px] text-text-muted hover:text-text transition-colors">
              <Printer size={11} /> Print
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 rounded text-[11px] text-accent hover:bg-accent/20 transition-colors">
              <Download size={11} /> Export PDF
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#1A1A1E]">
          <div className="max-w-2xl mx-auto">
            {/* Report Header */}
            <div className="text-center mb-8 pb-6 border-b border-border">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield size={28} className="text-accent" />
                <h1 className="text-xl font-bold text-accent tracking-wider">ONYX</h1>
              </div>
              <h2 className="text-lg font-semibold">Penetration Testing Report</h2>
              <p className="text-xs text-text-muted mt-1">Executive Summary — April 2026</p>
              <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-text-muted">
                <span>Project: Demo Assessment</span>
                <span>|</span>
                <span>Classification: CONFIDENTIAL</span>
                <span>|</span>
                <span>Version: 1.0</span>
              </div>
            </div>

            {/* Risk Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={14} /> Risk Summary
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Critical", count: 1, color: "#FF3366" },
                  { label: "High", count: 2, color: "#FF6633" },
                  { label: "Medium", count: 1, color: "#FFB800" },
                  { label: "Low", count: 2, color: "#00FFC8" },
                ].map((r) => (
                  <div key={r.label} className="bg-surface rounded-lg p-3 text-center border border-border">
                    <p className="text-xl font-bold" style={{ color: r.color }}>{r.count}</p>
                    <p className="text-[10px] text-text-muted">{r.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Findings */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Key Findings</h3>
              <div className="space-y-2">
                {[
                  { title: "Remote Code Execution (Apache Struts)", severity: "Critical", id: "CVE-2024-9999" },
                  { title: "SQL Injection in Login Form", severity: "High", id: "CVE-2024-1234" },
                  { title: "Server-Side Request Forgery (SSRF)", severity: "High", id: "CVE-2024-7777" },
                ].map((finding, i) => (
                  <div key={i} className="bg-surface rounded-lg border border-border p-3 flex items-center gap-3">
                    <span className="text-xs font-bold w-6 text-text-muted">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{finding.title}</p>
                      <p className="text-[10px] text-accent terminal-text">{finding.id}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      finding.severity === "Critical" ? "bg-danger/20 text-danger" : "bg-[#FF6633]/20 text-[#FF6633]"
                    }`}>
                      {finding.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Recommendations</h3>
              <div className="space-y-2 text-xs text-text">
                <p>1. <span className="font-medium">Immediate:</span> Patch Apache Struts to the latest version to remediate CVE-2024-9999.</p>
                <p>2. <span className="font-medium">Short-term:</span> Implement parameterized queries to prevent SQL injection attacks.</p>
                <p>3. <span className="font-medium">Short-term:</span> Add URL validation and whitelist for the SSRF-vulnerable endpoint.</p>
                <p>4. <span className="font-medium">Medium-term:</span> Implement a WAF to provide additional protection against common attacks.</p>
              </div>
            </div>

            <div className="text-center text-[10px] text-text-muted pt-4 border-t border-border">
              Generated by ONYX Security Suite v0.1.0-alpha — April 16, 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
