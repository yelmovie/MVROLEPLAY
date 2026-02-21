export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        <filter id="softShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background Circle - Clay Style */}
      <circle cx="50" cy="50" r="48" fill="#F3E8FF" />
      <circle cx="50" cy="50" r="42" fill="url(#logoGradient)" opacity="0.9" />

      {/* Movie Clapperboard - Simplified Clay Style */}
      {/* Top Part (Striped Clapper) */}
      <path
        d="M 25 30 L 75 30 L 72 40 L 28 40 Z"
        fill="url(#logoGradient)"
        filter="url(#softShadow)"
      />
      
      {/* White Stripes */}
      <rect x="28" y="30" width="8" height="10" fill="white" opacity="0.4" rx="1" />
      <rect x="40" y="30" width="8" height="10" fill="white" opacity="0.4" rx="1" />
      <rect x="52" y="30" width="8" height="10" fill="white" opacity="0.4" rx="1" />
      <rect x="64" y="30" width="8" height="10" fill="white" opacity="0.4" rx="1" />

      {/* Main Board */}
      <rect 
        x="25" 
        y="40" 
        width="50" 
        height="35" 
        rx="4" 
        fill="#FFFFFF"
        filter="url(#softShadow)"
      />

      {/* Theater Masks - Simple Clay Style */}
      {/* Happy Mask (Left) */}
      <circle cx="38" cy="57" r="8" fill="#FEF3C7" stroke="#7C3AED" strokeWidth="2" />
      {/* Eyes */}
      <circle cx="35" cy="55" r="1.5" fill="#7C3AED" />
      <circle cx="41" cy="55" r="1.5" fill="#7C3AED" />
      {/* Smile */}
      <path 
        d="M 33 58 Q 38 61 43 58" 
        stroke="#7C3AED" 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round" 
      />

      {/* Sad Mask (Right) */}
      <circle cx="62" cy="57" r="8" fill="#DBEAFE" stroke="#10B981" strokeWidth="2" />
      {/* Eyes */}
      <circle cx="59" cy="55" r="1.5" fill="#10B981" />
      <circle cx="65" cy="55" r="1.5" fill="#10B981" />
      {/* Frown */}
      <path 
        d="M 57 60 Q 62 57 67 60" 
        stroke="#10B981" 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round" 
      />

      {/* Play Button - Center Bottom */}
      <circle cx="50" cy="67" r="6" fill="url(#logoGradient2)" opacity="0.9" />
      <path d="M 48 64 L 48 70 L 54 67 Z" fill="white" />

      {/* Decorative Sparkles - Clay Style */}
      <circle cx="20" cy="25" r="2" fill="#FDE68A" opacity="0.8" />
      <circle cx="80" cy="35" r="1.5" fill="#A7F3D0" opacity="0.7" />
      <circle cx="18" cy="55" r="1.5" fill="#FEC7D7" opacity="0.6" />
      <circle cx="82" cy="65" r="2" fill="#DDD6FE" opacity="0.8" />
    </svg>
  );
}
