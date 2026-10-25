// Display helpers. Date-only fields are stored as UTC midnight, so they are
// always formatted in UTC to avoid shifting by a day.

export function formatArea(sqm: number | null | undefined): string {
  return sqm == null ? "—" : `${sqm.toLocaleString("en-GB")} m²`;
}

export function formatAreaRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  if (min == null || max == null || min === max) return formatArea(min ?? max);
  return `${min.toLocaleString("en-GB")}–${formatArea(max)}`;
}

export function formatRent(eurPerSqmMonth: number | null | undefined): string {
  return eurPerSqmMonth == null ? "—" : `€${eurPerSqmMonth.toFixed(2)}/m²/month`;
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

// Value for <input type="date">.
export function toDateInput(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function startOfTodayUtc(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
