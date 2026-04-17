pub fn simulate_port_scan(host: &str) -> Vec<crate::PortResult> {
    let common_ports: Vec<(u16, &str, &str)> = vec![
        (22, "SSH", "OpenSSH 8.9p1"),
        (80, "HTTP", "nginx 1.24.0"),
        (443, "HTTPS", "nginx 1.24.0"),
        (3306, "MySQL", "MySQL 8.0.35"),
        (5432, "PostgreSQL", "PostgreSQL 15.4"),
        (8080, "HTTP-Proxy", "Apache Tomcat 9.0"),
        (8443, "HTTPS-Alt", "Apache 2.4"),
        (27017, "MongoDB", "MongoDB 6.0"),
        (21, "FTP", "vsftpd 3.0.5"),
        (25, "SMTP", "Postfix"),
        (110, "POP3", "Dovecot"),
        (993, "IMAPS", "Dovecot"),
        (1433, "MSSQL", "Microsoft SQL Server 2022"),
        (6379, "Redis", "Redis 7.2"),
        (9200, "Elasticsearch", "Elasticsearch 8.11"),
    ];

    let seed: u64 = host.bytes().fold(0u64, |a, b| a.wrapping_mul(31).wrapping_add(b as u64));

    let mut results = vec![];
    for (i, (port, service, version)) in common_ports.iter().enumerate() {
        let hash = seed.wrapping_mul((i as u64).wrapping_add(7));
        let mod_val = hash % 10;

        let (state, include) = match mod_val {
            0..=5 => ("Open", true),
            6..=7 => ("Closed", true),
            _ => ("Filtered", true),
        };

        if include {
            results.push(crate::PortResult {
                port: *port,
                protocol: "tcp".into(),
                state: state.into(),
                service: service.to_string(),
                version: if state == "Open" { Some(version.to_string()) } else { None },
            });
        }
    }

    results
}

pub fn simulate_vuln_scan(_host: &str) -> Vec<crate::Vulnerability> {
    vec![
        crate::Vulnerability {
            id: crate::new_id(),
            cve: Some("CVE-2024-9999".into()),
            title: "Remote Code Execution (Apache Struts)".into(),
            severity: "Critical".into(),
            description: "Critical RCE vulnerability in Apache Struts action mapping allows unauthenticated remote code execution. This vulnerability has a CVSS score of 10.0 and should be remediated immediately.".into(),
            target_id: "demo".into(),
            module: "exploit".into(),
            confirmed: false,
            false_positive: false,
            evidence: vec!["GET /action?payload=... HTTP/200".into(), "System command executed successfully".into()],
            cvss_score: Some(10.0),
        },
        crate::Vulnerability {
            id: crate::new_id(),
            cve: Some("CVE-2024-1234".into()),
            title: "SQL Injection in Login Form".into(),
            severity: "High".into(),
            description: "The login form is vulnerable to SQL injection via the username parameter. An attacker can bypass authentication and access the database.".into(),
            target_id: "demo".into(),
            module: "vuln".into(),
            confirmed: false,
            false_positive: false,
            evidence: vec!["POST /login username=admin' OR 1=1-- password=any".into(), "Response: HTTP 200 - Authentication bypassed".into()],
            cvss_score: Some(8.1),
        },
        crate::Vulnerability {
            id: crate::new_id(),
            cve: Some("CVE-2024-7777".into()),
            title: "Server-Side Request Forgery (SSRF)".into(),
            severity: "High".into(),
            description: "The /api/fetch endpoint is vulnerable to SSRF. Internal services can be accessed through this endpoint, potentially exposing cloud metadata and internal APIs.".into(),
            target_id: "demo".into(),
            module: "vuln".into(),
            confirmed: false,
            false_positive: false,
            evidence: vec!["GET /api/fetch?url=http://169.254.169.254/latest/meta-data/ — 200 OK".into()],
            cvss_score: Some(7.5),
        },
        crate::Vulnerability {
            id: crate::new_id(),
            cve: Some("CVE-2024-5678".into()),
            title: "Reflected Cross-Site Scripting (XSS)".into(),
            severity: "Medium".into(),
            description: "Reflected XSS found in the search parameter. Payload is reflected in the response without proper sanitization or encoding.".into(),
            target_id: "demo".into(),
            module: "vuln".into(),
            confirmed: true,
            false_positive: false,
            evidence: vec!["GET /search?q=<script>alert(document.cookie)</script>".into(), "Payload executed in browser".into()],
            cvss_score: Some(6.1),
        },
        crate::Vulnerability {
            id: crate::new_id(),
            cve: None,
            title: "Missing Security Headers".into(),
            severity: "Low".into(),
            description: "Multiple security headers are missing: X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, Strict-Transport-Security.".into(),
            target_id: "demo".into(),
            module: "recon".into(),
            confirmed: true,
            false_positive: false,
            evidence: vec!["HTTP response missing X-Frame-Options header".into(), "HTTP response missing CSP header".into()],
            cvss_score: Some(3.5),
        },
        crate::Vulnerability {
            id: crate::new_id(),
            cve: None,
            title: "TLS 1.0 Protocol Supported".into(),
            severity: "Info".into(),
            description: "The server supports TLS 1.0 which is deprecated and has known vulnerabilities. Should be disabled.".into(),
            target_id: "demo".into(),
            module: "recon".into(),
            confirmed: true,
            false_positive: false,
            evidence: vec!["openssl s_client -connect target:443 -tls1 — Connection established".into()],
            cvss_score: Some(0.0),
        },
    ]
}
