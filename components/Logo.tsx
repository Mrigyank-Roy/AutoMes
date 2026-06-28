import * as React from 'react'

type MarkProps = React.SVGProps<SVGSVGElement> & { size?: number }

// Icon-only mark (square)
export function LogoMark({ size = 64, className, ...props }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AutoMes"
      className={className}
      {...props}
    >
      {/* orbit ring */}
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.2" />
      {/* message bubble */}
      <rect x="15" y="19" width="34" height="22" rx="8" fill="currentColor" />
      <path d="M24 41 L24 49 L33 41 Z" fill="currentColor" />
      {/* typing dots */}
      <circle cx="24" cy="30" r="2.6" fill="#fff" />
      <circle cx="32" cy="30" r="2.6" fill="#fff" />
      <circle cx="40" cy="30" r="2.6" fill="#fff" />
      {/* orbiting dot */}
      <circle cx="50" cy="14" r="6" fill="#FF3D6E" />
    </svg>
  )
}

type LockupProps = React.SVGProps<SVGSVGElement> & { height?: number }

// Horizontal lockup (icon + wordmark) — keeps the 230:64 aspect ratio
export function LogoLockup({ height = 32, className, ...props }: LockupProps) {
  return (
    <svg
      height={height}
      width={(height * 230) / 64}
      viewBox="0 0 230 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AutoMes"
      className={className}
      {...props}
    >
      {/* mark */}
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.2" />
      <rect x="15" y="19" width="34" height="22" rx="8" fill="currentColor" />
      <path d="M24 41 L24 49 L33 41 Z" fill="currentColor" />
      <circle cx="24" cy="30" r="2.6" fill="#fff" />
      <circle cx="32" cy="30" r="2.6" fill="#fff" />
      <circle cx="40" cy="30" r="2.6" fill="#fff" />
      <circle cx="50" cy="14" r="6" fill="#FF3D6E" />
      {/* wordmark */}
      <text
        x="74"
        y="41"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="800"
        letterSpacing="-0.5"
        fill="currentColor"
      >
        Auto<tspan fill="#FF3D6E">Mes</tspan>
      </text>
    </svg>
  )
}