import { useState } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Copy,
  ChevronRight,
  Shield,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { Vulnerability } from "../../types";
import { severityBg, severityColors } from "../../types";
import { useToastStore } from "../../hooks/useToast";

interface Props {
  vuln: Vulnerability;
  targetHost?: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export function VulnDetailModal({ vuln, targetHost, onClose, onUpdate }: Props) {
  const { addToast } = useToastStore();
  const [confirming, setConfirming] = useState(false);
  const [markingFP, setMarkingFP] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const result = await invoke<boolean>("toggle_vuln_confirmed", { vulnId: vuln.id });
      addToast({
        type: "success",
        title: result ? "Vulnerability confirmed" : "Confirmation removed",
      });
      onUpdate?.();
    } catch {
      addToast({ type: "error", title: "Failed to update vulnerability" });
    }
    setConfirming(false);
  };

  const handleFalsePositive = async () => {
    setMarkingFP(true);
    try {
      const result = await invoke<boolean>("toggle_false_positive", { vulnId: vuln.id });
      addToast({
        type: result ? "warning" : "info",
        title: result ? "Marked as false positive" : "False positive removed",
      });
      onUpdate?.();
    } catch {
      addToast({ type: "error", title: "Failed to update vulnerability" });
    }
    setMarkingFP(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast({ type: "info", title: "Copied to clipboard" });
    });
  };

  const mitreMapping: Record<string, string> = {
    "SQL Injection": "T1190 - Initial Access",
    "XSS": "T1189 - Drive-by Compromise",
    "SSRF": "T1071 - Application Layer Protocol",
    "RCE": "T1210 - Exploitation of Remote Services",
    "Security Headers": "T1195 - Supply Chain Compromise",
  };

  const matchedMitre = Object.entries(mitreMapping).find(([key]) =>
    vuln.title.toLowerCase().includes(key.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface rounded-xl border border-border w-[560px] max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${severityBg[vuln.severity]}`}>
                {vuln.severity.toUpperCase()}
              </span>
              {vuln.confirmed && (
                <span className="flex items-center gap-1 text-[10px] text-[#27C93F]">
                  <CheckCircle size={10} /> Confirmed
                </span>
              )}
              {vuln.false_positive && (
                <span className="flex items-center gap-1 text-[10px] text-text-muted">
                  <XCircle size={10} /> False Positive
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-text">{vuln.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted">
              {vuln.cve && (
                <button
                  onClick={() => copyToClipboard(vuln.cve!)}
                  className="flex items-center gap-1 text-accent hover:text-accent-dim"
                  title="Click to copy"
                >
                  {vuln.cve} <Copy size={10} />
                </button>
              )}
              {vuln.cvss_score !== undefined && vuln.cvss_score > 0 && (
                <span>
                  CVSS: <span style={{ color: severityColors[vuln.severity] }}>{vuln.cvss_score.toFixed(1)}</span>
                </span>
              )}
              {targetHost && <span>Target: {targetHost}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto max-h-[400px] space-y-4">
          {/* Description */}
          <div>
            <h3 className="text-[11px] text-text-muted uppercase tracking-wider mb-1.5 font-medium">Description</h3>
            <p className="text-sm text-text leading-relaxed">{vuln.description}</p>
          </div>

          {/* CVSS Score Visual */}
          {vuln.cvss_score !== undefined && vuln.cvss_score > 0 && (
            <div>
              <h3 className="text-[11px] text-text-muted uppercase tracking-wider mb-1.5 font-medium">CVSS Score</h3>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#26262E" strokeWidth="4" />
                    <circle
                      cx="28" cy="28" r="24" fill="none"
                      stroke={severityColors[vuln.severity]}
                      strokeWidth="4"
                      strokeDasharray={`${(vuln.cvss_score / 10) * 150.8} ${150.8 - (vuln.cvss_score / 10) * 150.8}`}
                      strokeLinecap="round"
                      transform="rotate(-90 28 28)"
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                    style={{ color: severityColors[vuln.severity] }}
                  >
                    {vuln.cvss_score.toFixed(1)}
                  </span>
                </div>
                <div className="text-[11px] text-text-muted">
                  {vuln.cvss_score >= 9.0 ? "Critical severity — Immediate remediation required" :
                   vuln.cvss_score >= 7.0 ? "High severity — Remediation should be prioritized" :
                   vuln.cvss_score >= 4.0 ? "Medium severity — Address in next sprint" :
                   "Low severity — Address when possible"}
                </div>
              </div>
            </div>
          )}

          {/* Evidence */}
          {vuln.evidence.length > 0 && (
            <div>
              <h3 className="text-[11px] text-text-muted uppercase tracking-wider mb-1.5 font-medium">Evidence</h3>
              <div className="space-y-1.5">
                {vuln.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight size={12} className="text-accent mt-0.5 flex-shrink-0" />
                    <code className="text-xs bg-[#0A0A0E] px-2.5 py-1.5 rounded text-[#FFB800] font-mono flex-1">
                      {ev}
                    </code>
                    <button onClick={() => copyToClipboard(ev)} className="text-text-muted hover:text-text p-0.5">
                      <Copy size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MITRE ATT&CK Mapping */}
          {matchedMitre && (
            <div>
              <h3 className="text-[11px] text-text-muted uppercase tracking-wider mb-1.5 font-medium">
                <Shield size={11} className="inline mr-1" /> MITRE ATT&CK Mapping
              </h3>
              <div className="bg-surface-2 rounded-lg px-3 py-2 text-xs text-text">
                <span className="text-accent">{matchedMitre[1]}</span>
              </div>
            </div>
          )}

          {/* Remediation */}
          <div>
            <h3 className="text-[11px] text-text-muted uppercase tracking-wider mb-1.5 font-medium">Recommended Remediation</h3>
            <div className="bg-surface-2 rounded-lg px-3 py-2 text-xs text-text-muted">
              {vuln.title.toLowerCase().includes("sql") && "Use parameterized queries / prepared statements. Never concatenate user input directly into SQL queries."}
              {vuln.title.toLowerCase().includes("xss") && "Implement output encoding and Content-Security-Policy headers. Sanitize all user inputs."}
              {vuln.title.toLowerCase().includes("ssrf") && "Validate and whitelist allowed URLs. Block requests to internal IP ranges and cloud metadata endpoints."}
              {vuln.title.toLowerCase().includes("rce") && "Update the affected software to the latest patched version. Apply input validation and use WAF rules."}
              {vuln.title.toLowerCase().includes("header") && "Add security headers: X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, Strict-Transport-Security."}
              {vuln.title.toLowerCase().includes("tls") && "Disable deprecated TLS versions (1.0, 1.1). Configure server to only accept TLS 1.2+ with strong cipher suites."}
              {!["sql", "xss", "ssrf", "rce", "header", "tls"].some(k => vuln.title.toLowerCase().includes(k)) && "Review the vulnerability details above and apply appropriate security measures."}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-2/30">
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                vuln.confirmed
                  ? "bg-[#27C93F]/10 text-[#27C93F] hover:bg-[#27C93F]/20"
                  : "bg-surface-3 text-text-muted hover:text-text"
              }`}
            >
              <CheckCircle size={12} /> {confirming ? "..." : vuln.confirmed ? "Confirmed" : "Confirm"}
            </button>
            <button
              onClick={handleFalsePositive}
              disabled={markingFP}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                vuln.false_positive
                  ? "bg-text-muted/10 text-text-muted hover:bg-text-muted/20"
                  : "bg-surface-3 text-text-muted hover:text-text"
              }`}
            >
              <XCircle size={12} /> {markingFP ? "..." : vuln.false_positive ? "False Positive" : "Mark FP"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
