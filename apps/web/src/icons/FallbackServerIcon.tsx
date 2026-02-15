interface FallbackServerIconProps {
  className?: string;
}

export function FallbackServerIcon({ className }: FallbackServerIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Server icon"
    >
      <rect width="64" height="64" rx="4" fill="#d1d5db" />
      <text
        x="32"
        y="44"
        textAnchor="middle"
        fontSize="32"
        fontFamily="sans-serif"
        fill="#9ca3af"
      >
        ?
      </text>
    </svg>
  );
}
