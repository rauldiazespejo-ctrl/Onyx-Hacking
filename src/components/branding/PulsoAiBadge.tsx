/** Agency ribbon — PULSOAI (product architecture & AI layer). */
export function PulsoAiBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-[10px] font-semibold tracking-wide text-[#c4b5fd]">
        <span className="w-1 h-1 rounded-full bg-[#00FFC8] animate-pulse" aria-hidden />
        PULSOAI
      </span>
    );
  }
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[10px] font-bold tracking-[0.2em] text-[#c4b5fd]">PULSOAI</span>
      <span className="text-[9px] text-text-muted leading-tight">IA · arquitectura · seguridad</span>
    </div>
  );
}
