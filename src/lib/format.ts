export const MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

export const MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

/** 1250000 -> "1 250 000" */
export function money(n: number): string {
  const sign = n < 0 ? "−" : "";
  return sign + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 1250000 -> "1,25 mln" */
export function moneyShort(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1_000_000_000) return `${sign}${(a / 1_000_000_000).toFixed(2).replace(".", ",")} mlrd`;
  if (a >= 1_000_000) return `${sign}${(a / 1_000_000).toFixed(1).replace(".", ",")} mln`;
  if (a >= 1_000) return `${sign}${Math.round(a / 1_000)} ming`;
  return sign + String(a);
}

/** "2026-11-03" -> "03.11.2026" */
export function date(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export function dateLong(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d}-${MONTHS[m - 1].toLowerCase()}, ${y}`;
}

/** 901234567 -> "+998 90 123 45 67" */
export function phone(p: string | null | undefined): string {
  if (!p) return "—";
  const s = p.replace(/\D/g, "").slice(-9);
  if (s.length !== 9) return p;
  return `+998 ${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5, 7)} ${s.slice(7)}`;
}

export function percent(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
