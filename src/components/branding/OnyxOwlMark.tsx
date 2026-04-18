/**
 * ONYX wordmark — nocturnal sentinel (owl). Designed for motion + glow on dark UI.
 */
export function OnyxOwlMark({
  size = 40,
  className = "",
  animated = true,
}: {
  size?: number;
  className?: string;
  /** Subtle breathing + ring pulse */
  animated?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${animated ? "onyx-owl-mark" : ""} ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="onyxOwlBody" x1="12" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1a2a28" />
          <stop offset="0.45" stopColor="#0f1816" />
          <stop offset="1" stopColor="#0a1210" />
        </linearGradient>
        <linearGradient id="onyxOwlEye" x1="22" y1="24" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00FFC8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#00a896" stopOpacity="0.85" />
        </linearGradient>
        <filter id="onyxGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Ear tufts */}
      <path d="M22 14 L18 4 L26 12 Z" fill="#2d4a44" stroke="#00FFC8" strokeOpacity="0.35" strokeWidth="0.5" />
      <path d="M42 14 L46 4 L38 12 Z" fill="#2d4a44" stroke="#00FFC8" strokeOpacity="0.35" strokeWidth="0.5" />
      {/* Head + body */}
      <path
        d="M32 12 C18 12 10 24 10 36 C10 50 18 56 32 56 C46 56 54 50 54 36 C54 24 46 12 32 12 Z"
        fill="url(#onyxOwlBody)"
        stroke="#00FFC8"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      {/* Face disc */}
      <ellipse cx="32" cy="34" rx="20" ry="16" fill="#121c1a" stroke="#00FFC8" strokeOpacity="0.15" strokeWidth="0.75" />
      {/* Eyes outer */}
      <circle cx="24" cy="32" r="9" fill="#0d1412" stroke="#00FFC8" strokeOpacity="0.4" strokeWidth="1" filter="url(#onyxGlow)" />
      <circle cx="40" cy="32" r="9" fill="#0d1412" stroke="#00FFC8" strokeOpacity="0.4" strokeWidth="1" filter="url(#onyxGlow)" />
      {/* Pupils */}
      <circle cx="24" cy="32" r="4.5" fill="url(#onyxOwlEye)" />
      <circle cx="40" cy="32" r="4.5" fill="url(#onyxOwlEye)" />
      <circle cx="25" cy="31" r="1.4" fill="#0a1210" opacity="0.85" />
      <circle cx="41" cy="31" r="1.4" fill="#0a1210" opacity="0.85" />
      {/* Beak */}
      <path d="M32 38 L28 44 L32 42 L36 44 Z" fill="#c4a35a" stroke="#8b7355" strokeOpacity="0.5" strokeWidth="0.4" />
      {/* Chest highlight */}
      <ellipse cx="32" cy="46" rx="8" ry="5" fill="#00FFC8" fillOpacity="0.06" />
    </svg>
  );
}
