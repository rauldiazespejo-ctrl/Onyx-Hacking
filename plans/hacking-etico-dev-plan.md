# Plan de desarrollo — ONYX (hacking ético autorizado)

Este documento alinea el **roadmap técnico** con el producto descrito en el README. ONYX es una suite de escritorio (Tauri + React + Rust + SQLite) orientada a **pruebas de penetración con autorización explícita** y trazabilidad local.

## Estado actual (v0.1.0-alpha)

| Área | Estado | Notas |
|------|--------|--------|
| Shell Tauri v2 + IPC | Hecho | Comandos en `src-tauri/src/commands.rs` |
| Proyectos / targets / SQLite | Hecho | Migración `001_init.sql`, `db.rs` |
| Recon (UI + flujo) | Hecho | Escaneo **simulado** vía `scanner.rs` |
| Vulnerabilidades (lista, modal, toggles) | Hecho | Inserción simulada en BD |
| Dashboard, Exploit, Post, Report (UI) | Parcial | Módulos presentes; lógica de negocio mayormente placeholder |
| Terminal + atajos + toasts | Hecho | Base para auditoría en UI |
| CI / lockfile / errores IPC visibles | En curso | Profesionalizar entrega continua |

## Fases recomendadas

### Fase 1 — Profesionalizar la base (corto plazo)

- Lockfile y `npm ci` reproducibles; pipeline CI (frontend + `cargo check` en Linux).
- Errores de `invoke` visibles al usuario (toasts), sin fallos silenciosos.
- README y estructura de repo alineados (rutas reales, no carpetas inexistentes).

### Fase 2 — Autorización y auditoría (obligatorio antes de herramientas reales)

- Flujo explícito: declaración de alcance (targets permitidos), ventana de fechas, contacto del cliente.
- Registro de operaciones (quién/qué/cuándo) en SQLite + exportación para revisión.
- “Kill switch” y cancelación de tareas largas (hoy el recon bloquea hasta terminar).

### Fase 3 — Recon y vuln “de verdad” (tras Fase 2)

- Sustituir o complementar `simulate_*` con integraciones controladas (p. ej. parsers de salida de herramientas aprobadas, no ejecución arbitraria sin sandbox).
- Historial de escaneos ya expuesto vía `get_scan_history`; enlazar UI y re-ejecución segura.

### Fase 4 — Exploit / post-explotación / informes

- Explotación: solo plantillas y evidencia si no hay sandbox fuerte; integrar políticas de equipo.
- Post: mapas y “paths” como vistas sobre datos reales, no solo mock.
- Reportes: export HTML/PDF desde plantillas + datos del proyecto (executive / técnico).

### Fase 5 — Endurecimiento

- Capabilities Tauri mínimas; revisión de `tauri_plugin_shell`.
- Almacenamiento de credenciales (Keychain / APIs del SO), nunca en texto plano.
- Pruebas automatizadas (Rust + tests de contrato IPC si aplica).

## Criterios de éxito

1. Un auditor puede clonar el repo, ejecutar CI verde y generar un build reproducible.
2. Ninguna acción destructiva o de red ocurre sin **alcance documentado** en la app.
3. Los datos del engagement son **exportables** y **borrables** de forma consciente (RGPD / retención).

## Referencias en código

- IPC: `src-tauri/src/commands.rs`, tipos en `src-tauri/src/lib.rs`
- Estado UI: `src/store/onyx.ts`
- UI por módulo: `src/components/*`
