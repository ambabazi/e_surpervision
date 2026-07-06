interface UokLogoProps {
  variant?: "default" | "light" | "compact";
  className?: string;
}

const SIZES = {
  default: "h-14 sm:h-16 max-w-[min(100%,340px)]",
  light: "h-14 sm:h-16 max-w-[min(100%,340px)]",
  compact: "h-10 max-w-[min(100%,220px)]",
} as const;

/** Official University of Kigali logo (transparent background) */
export default function UokLogo({ variant = "default", className = "" }: UokLogoProps) {
  const size =
    variant === "compact" ? SIZES.compact : variant === "light" ? SIZES.light : SIZES.default;

  return (
    <img
      src="/uok-crest.svg"
      alt="University of Kigali"
      className={`w-auto object-contain object-left ${size} ${className}`}
    />
  );
}
