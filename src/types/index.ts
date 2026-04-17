export interface Project {
  id: string;
  name: string;
  targets: Target[];
  created_at: string;
  updated_at: string;
  status: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  target_count: number;
  vulnerability_count: number;
  critical_count: number;
  high_count: number;
  created_at: string;
  updated_at: string;
}

export interface Target {
  id: string;
  host: string;
  ports: PortResult[];
  vulnerabilities: Vulnerability[];
  status: string;
}

export interface PortResult {
  port: number;
  protocol: string;
  state: string;
  service: string;
  version?: string;
}

export interface Vulnerability {
  id: string;
  cve?: string;
  title: string;
  severity: string;
  description: string;
  target_id: string;
  module: string;
  confirmed: boolean;
  false_positive: boolean;
  evidence: string[];
  cvss_score?: number;
}

export interface ScanResult {
  id: string;
  project_id: string;
  target_id: string;
  module: string;
  status: string;
  started_at: string;
  completed_at?: string;
  findings: Vulnerability[];
  ports_found: PortResult[];
  progress: number;
}

export type Module = "dashboard" | "recon" | "vuln" | "exploit" | "post" | "report";

export interface AppInfo {
  name: string;
  version: string;
  edition: string;
}

export const severityColors: Record<string, string> = {
  Critical: "#FF3366",
  High: "#FF6633",
  Medium: "#FFB800",
  Low: "#00FFC8",
  Info: "#6C7A89",
};

export const severityBg: Record<string, string> = {
  Critical: "bg-[#FF3366]/20 text-[#FF3366]",
  High: "bg-[#FF6633]/20 text-[#FF6633]",
  Medium: "bg-[#FFB800]/20 text-[#FFB800]",
  Low: "bg-[#00FFC8]/20 text-[#00FFC8]",
  Info: "bg-[#6C7A89]/20 text-[#6C7A89]",
};
