"use client";

/** Fixed full-viewport ambient background: soft aurora blobs + a faint grid, all SVG. */
export const Background = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
    <svg
      aria-hidden="true"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
    >
      <defs>
        <radialGradient id="bg-indigo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4338ca" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#4338ca" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-emerald" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bg-rose" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e11d48" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="bg-grid"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 48 0 L 0 0 0 48"
            fill="none"
            stroke="rgba(148,163,184,0.06)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="1440" height="900" fill="#070b15" />
      <rect width="1440" height="900" fill="url(#bg-grid)" />
      <circle cx="280" cy="120" r="520" fill="url(#bg-indigo)">
        <animate
          attributeName="cx"
          values="280;380;280"
          dur="26s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="1240" cy="220" r="460" fill="url(#bg-rose)">
        <animate
          attributeName="cy"
          values="220;340;220"
          dur="31s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="820" cy="860" r="560" fill="url(#bg-emerald)">
        <animate
          attributeName="cx"
          values="820;680;820"
          dur="37s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  </div>
);
