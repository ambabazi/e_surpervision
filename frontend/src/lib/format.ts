export const APP_TIMEZONE = "Africa/Kigali";

/** Backend stores UTC; naive ISO strings must be parsed as UTC. */
export function parseApiDate(value?: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed) && !trimmed.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}Z`);
  }
  return new Date(trimmed);
}

export function formatDate(value?: string): string {
  const d = parseApiDate(value);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

export function formatDateTime(value?: string): string {
  const d = parseApiDate(value);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIMEZONE,
  });
}

export function timeAgo(value?: string): string {
  const date = parseApiDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 45) return "just now";
  if (seconds < 90) return "1 minute ago";
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

export function formatCountdown(hours: number): string {
  if (hours <= 0) return "Deadline passed";
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  const m = Math.floor((hours * 60) % 60);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""} remaining`.trim();
  return `${Math.max(m, 1)}m remaining`;
}

export function reviewCountdownTone(isOverdue: boolean, hoursUntilDeadline: number): {
  box: string;
  text: string;
} {
  if (isOverdue) {
    return {
      box: "border-2 border-crimson-400 bg-crimson-100",
      text: "text-crimson-900",
    };
  }
  if (hoursUntilDeadline <= 24) {
    return {
      box: "border-2 border-orange-400 bg-orange-100",
      text: "text-orange-950",
    };
  }
  if (hoursUntilDeadline <= 48) {
    return {
      box: "border-2 border-gold-400 bg-gold-100",
      text: "text-gold-950",
    };
  }
  return {
    box: "border-2 border-emerald-300 bg-emerald-50",
    text: "text-emerald-900",
  };
}

export function initials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function prettyStatus(status?: string): string {
  if (!status) return "";
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
