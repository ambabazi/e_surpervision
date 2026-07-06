import type { HTMLAttributes, ReactNode } from "react";
import { initials } from "@/lib/format";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  value,
  color = "crimson",
}: {
  value: number;
  color?: "crimson" | "gold" | "royal" | "emerald";
}) {
  const colors: Record<string, string> = {
    crimson: "bg-crimson-600",
    gold: "bg-gold-400",
    royal: "bg-royal-600",
    emerald: "bg-emerald-500",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${colors[color]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  // task / submission / project statuses
  UPCOMING: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-royal-50 text-royal-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-crimson-50 text-crimson-700",
  SUBMITTED: "bg-royal-50 text-royal-700",
  UNDER_REVIEW: "bg-gold-100 text-gold-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  NEEDS_REVISION: "bg-crimson-50 text-crimson-700",
  PROPOSAL: "bg-slate-100 text-slate-600",
  REVISION: "bg-gold-100 text-gold-800",
  ON_HOLD: "bg-slate-100 text-slate-500",
  HIGH: "bg-crimson-50 text-crimson-700",
  MEDIUM: "bg-gold-100 text-gold-800",
  LOW: "bg-slate-100 text-slate-600",
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  AT_CAPACITY: "bg-crimson-50 text-crimson-700",
};

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`chip ${cls}`}>
      {status
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = 40,
}: {
  name?: string;
  src?: string;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-crimson-700 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = "crimson",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: "crimson" | "gold" | "royal" | "emerald";
  hint?: string;
}) {
  const accents: Record<string, string> = {
    crimson: "bg-crimson-50 text-crimson-700",
    gold: "bg-gold-100 text-gold-800",
    royal: "bg-royal-50 text-royal-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="card flex items-center gap-4 p-5">
      {icon && (
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accents[accent]}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-extrabold leading-tight text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-crimson-600" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}
