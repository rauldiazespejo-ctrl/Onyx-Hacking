import type { Project, Vulnerability } from "../types";

export type ReportTemplate = "executive" | "technical" | "compliance";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type VulnRow = Vulnerability & { target_host: string };

function collectVulns(project: Project): VulnRow[] {
  return project.targets.flatMap((t) =>
    t.vulnerabilities.map((v) => ({ ...v, target_host: t.host }))
  );
}

function countBySeverity(vulns: VulnRow[]) {
  const keys = ["Critical", "High", "Medium", "Low", "Info"] as const;
  const m = Object.fromEntries(keys.map((k) => [k, 0])) as Record<(typeof keys)[number], number>;
  for (const v of vulns) {
    if (v.severity in m) m[v.severity as keyof typeof m]++;
  }
  return m;
}

export function buildReportHtml(
  project: Project,
  template: ReportTemplate,
  appVersion: string
): string {
  const vulns = collectVulns(project);
  const sev = countBySeverity(vulns);
  const confirmed = vulns.filter((v) => v.confirmed).length;
  const openPorts = project.targets.reduce(
    (n, t) => n + t.ports.filter((p) => p.state === "Open").length,
    0
  );
  const generated = new Date().toISOString();
  const title =
    template === "executive"
      ? "Executive summary"
      : template === "technical"
        ? "Technical findings report"
        : "Compliance-oriented summary";

  const topFindings = [...vulns]
    .sort((a, b) => {
      const order = ["Critical", "High", "Medium", "Low", "Info"];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    })
    .slice(0, 25);

  const engagementBlock = `
    <section class="card">
      <h2>Engagement</h2>
      <table>
        <tr><th>Client</th><td>${escapeHtml(project.engagement.client_name ?? "—")}</td></tr>
        <tr><th>Contact</th><td>${escapeHtml(project.engagement.client_contact ?? "—")}</td></tr>
        <tr><th>Authorization ref.</th><td>${escapeHtml(project.engagement.authorization_reference ?? "—")}</td></tr>
        <tr><th>Window</th><td>${escapeHtml(project.engagement.engagement_start ?? "—")} → ${escapeHtml(project.engagement.engagement_end ?? "—")}</td></tr>
        <tr><th>Acknowledged</th><td>${project.engagement.authorization_acknowledged ? "Yes" : "No"}</td></tr>
      </table>
      <p class="small"><strong>Authorized scope (excerpt):</strong> ${escapeHtml((project.engagement.authorized_scope ?? "").slice(0, 2000))}${(project.engagement.authorized_scope?.length ?? 0) > 2000 ? "…" : ""}</p>
    </section>
  `;

  const findingsRows = topFindings
    .map(
      (v) => `
    <tr>
      <td>${escapeHtml(v.severity)}</td>
      <td>${escapeHtml(v.target_host)}</td>
      <td>${escapeHtml(v.title)}</td>
      <td>${escapeHtml(v.cve ?? "—")}</td>
      <td>${v.confirmed ? "Yes" : "No"}</td>
      <td>${v.false_positive ? "Yes" : "No"}</td>
    </tr>`
    )
    .join("");

  const complianceNote =
    template === "compliance"
      ? `<section class="card"><h2>Framework mapping</h2><p class="small">High-level alignment: findings should be mapped to your control framework (OWASP ASVS, PTES, NIST 800-53, ISO 27001) during formal assessment. This export lists technical facts only.</p></section>`
      : "";

  const technicalExtra =
    template === "technical"
      ? `<section class="card"><h2>Targets &amp; exposure</h2>
        <ul>${project.targets.map((t) => `<li><code>${escapeHtml(t.host)}</code> — ${t.ports.length} port records, ${t.vulnerabilities.length} findings, status ${escapeHtml(t.status)}</li>`).join("")}</ul>
        </section>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(project.name)} — ${escapeHtml(title)}</title>
  <style>
    :root { --bg:#111; --fg:#e8e8e8; --muted:#888; --accent:#00c9a7; --danger:#ff3366; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--fg); margin: 0; padding: 2rem; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin: 0 0 0.25rem; color: var(--accent); }
    h2 { font-size: 1.1rem; margin: 1.25rem 0 0.5rem; border-bottom: 1px solid #333; padding-bottom: 0.25rem; }
    .meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 2rem; }
    .card { background: #1a1a1f; border: 1px solid #2a2a35; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #2a2a35; vertical-align: top; }
    th { color: var(--muted); font-weight: 600; }
    .small { font-size: 0.8rem; color: var(--muted); }
    .sev-c { color: var(--danger); font-weight: 700; }
    .sev-h { color: #ff6633; font-weight: 700; }
    footer { margin-top: 2rem; font-size: 0.75rem; color: var(--muted); text-align: center; }
    @media print { body { background: #fff; color: #111; } .card { border-color: #ccc; } }
  </style>
</head>
<body>
  <header>
    <h1>ONYX — ${escapeHtml(title)}</h1>
    <p class="meta">Project: <strong>${escapeHtml(project.name)}</strong> · Generated ${escapeHtml(generated)} · ONYX ${escapeHtml(appVersion)} · CONFIDENTIAL</p>
  </header>

  <section class="card">
    <h2>Risk overview</h2>
    <table>
      <tr><th>Targets</th><td>${project.targets.length}</td></tr>
      <tr><th>Open ports (records)</th><td>${openPorts}</td></tr>
      <tr><th>Total findings</th><td>${vulns.length}</td></tr>
      <tr><th>Confirmed</th><td>${confirmed}</td></tr>
      <tr><th>Critical</th><td class="sev-c">${sev.Critical}</td></tr>
      <tr><th>High</th><td class="sev-h">${sev.High}</td></tr>
      <tr><th>Medium</th><td>${sev.Medium}</td></tr>
      <tr><th>Low</th><td>${sev.Low}</td></tr>
      <tr><th>Info</th><td>${sev.Info}</td></tr>
    </table>
  </section>

  ${engagementBlock}
  ${technicalExtra}
  ${complianceNote}

  <section class="card">
    <h2>Findings (${topFindings.length} of ${vulns.length})</h2>
    <table>
      <thead><tr><th>Severity</th><th>Target</th><th>Title</th><th>CVE</th><th>Confirmed</th><th>False +</th></tr></thead>
      <tbody>${findingsRows || `<tr><td colspan="6" class="small">No findings recorded.</td></tr>`}</tbody>
    </table>
  </section>

  <section class="card">
    <h2>Recommendations</h2>
    <ol class="small">
      <li>Remediate Critical and High findings first, with change control.</li>
      <li>Re-test after patches; track confirmed vs false positives in ONYX.</li>
      <li>Retain this report according to your data-retention policy.</li>
    </ol>
  </section>

  <footer>Generated by ONYX Security Suite. Authorized security testing only.</footer>
</body>
</html>`;
}
