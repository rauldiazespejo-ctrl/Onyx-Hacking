import { OnyxOwlMark } from "../branding/OnyxOwlMark";
import { PulsoAiBadge } from "../branding/PulsoAiBadge";

const STORAGE_KEY = "onyx_accepted_terms";

export function hasAcceptedTerms(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface Props {
  onAccept: () => void;
}

export function LegalDisclaimer({ onAccept }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 app-shell-gradient">
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-accent/[0.04] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#a78bfa]/[0.06] blur-3xl" />
      </div>

      <div className="relative max-w-lg w-full bg-surface/95 backdrop-blur-md border border-accent/20 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.5)] p-8 animate-logo-reveal">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <span className="onyx-hero-ring" />
            <span className="onyx-hero-ring delay" />
            <div className="relative rounded-2xl p-3 bg-surface-2/90 border border-accent/25 shadow-[0_0_28px_rgba(0,255,200,0.15)]">
              <OnyxOwlMark size={72} animated />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-accent">ONYX</h1>
          <p className="text-xs text-text-muted mt-1">Security Suite · v1.0</p>
          <div className="mt-4 flex justify-center">
            <PulsoAiBadge />
          </div>
          <p className="text-[10px] text-text-muted mt-3 max-w-sm leading-relaxed">
            Product experience, AI-assisted workflows, and security architecture direction by{" "}
            <strong className="text-[#c4b5fd]">PULSOAI</strong>.
          </p>
        </div>

        <div className="space-y-3 text-xs text-text leading-relaxed border-t border-border pt-5">
          <p>
            ONYX is designed for <strong>legitimate security assessments</strong> with explicit written permission from
            system owners. Unauthorized access to computer systems is illegal in most jurisdictions.
          </p>
          <p>
            You are responsible for documenting engagement scope, respecting data-protection rules, and using exported
            reports appropriately. ONYX logs key actions locally to support accountability.
          </p>
          <p className="text-text-muted">
            By continuing you confirm you will only use this software in compliance with applicable laws and the policies
            of your organization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            onAccept();
          }}
          className="mt-8 w-full py-3 rounded-xl text-sm font-semibold tracking-wide bg-gradient-to-r from-accent/20 via-accent/15 to-[#a78bfa]/20 text-accent border border-accent/35 hover:border-accent/55 hover:shadow-[0_0_24px_rgba(0,255,200,0.15)] transition-all"
        >
          I understand and agree
        </button>
      </div>
    </div>
  );
}
