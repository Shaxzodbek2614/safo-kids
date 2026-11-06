"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type ComponentProps, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn, initials } from "@/lib/format";
import type { FileRef } from "@/lib/data/types";

// ── Buttons ──────────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
  secondary: "bg-surface text-text border border-border-strong hover:bg-surface-2",
  ghost: "text-muted hover:bg-black/5 hover:text-text",
  danger: "bg-danger text-white hover:opacity-90",
  success: "bg-success text-white hover:opacity-90",
};
const SIZE = { sm: "h-8 px-3 text-[13px] gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-5 text-[15px] gap-2" };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof SIZE }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZE }) {
  return (
    <Link
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition-colors",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    />
  );
}

export function IconButton({ label, className, ...rest }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-text", className)}
      {...rest}
    />
  );
}

// ── Badges ───────────────────────────────────────────────────────────────
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "accent";
const TONE: Record<Tone, string> = {
  neutral: "bg-black/5 text-muted",
  primary: "bg-primary-soft text-primary-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  accent: "bg-accent-soft text-[#8a5a00]",
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", TONE[tone], className)}>
      {children}
    </span>
  );
}

// ── Surfaces ─────────────────────────────────────────────────────────────
export function Card({ className, children, ...rest }: ComponentProps<"section">) {
  return (
    <section className={cn("rounded-xl border border-border bg-surface", className)} {...rest}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-muted">{label}</p>
        {icon && <span className={cn("inline-flex size-9 items-center justify-center rounded-lg", TONE[tone])}>{icon}</span>}
      </div>
      <p className="num mt-2 text-[26px] font-extrabold leading-tight tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
    </Card>
  );
}

export function Progress({ value, tone = "primary" }: { value: number; tone?: "primary" | "success" | "warning" | "danger" }) {
  const bar = { primary: "bg-primary", success: "bg-success", warning: "bg-accent", danger: "bg-danger" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/[.07]" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", bar)} style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const hues = ["#0b7c80", "#2e5aac", "#8a5a00", "#7a3d9c", "#12805c", "#b54708"];
  const h = hues[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % hues.length];
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white", className)}
      style={{ background: h }}
    >
      {initials(name)}
    </span>
  );
}

export function CertificatePreview({ file }: { file: FileRef }) {
  return (
    <a href={file.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-border hover:border-primary">
      {file.isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL, nothing to optimise
        <img src={file.url} alt={file.name} className="max-h-64 w-full bg-surface-2 object-contain" />
      ) : (
        <span className="block px-4 py-6 text-center text-sm font-semibold text-primary">PDF faylni ochish</span>
      )}
      <span className="block truncate border-t border-border px-3 py-2 text-xs text-muted">{file.name}</span>
    </a>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

// ── Tabs / segmented ─────────────────────────────────────────────────────
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto rounded-lg bg-black/[.05] p-1 scroll-thin", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          type="button"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition-colors",
            value === it.value ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text",
          )}
        >
          {it.label}
          {it.count !== undefined && (
            <span className={cn("num rounded-full px-1.5 text-[11px]", value === it.value ? "bg-primary-soft text-primary-ink" : "bg-black/[.06]")}>
              {it.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Form controls ────────────────────────────────────────────────────────
const control =
  "h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-text placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%235b6474' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "h-auto min-h-20 py-2", className)} {...rest} />;
}

// ── Modal ────────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-auto w-[calc(100%-24px)] rounded-2xl border border-border bg-surface p-0 text-text shadow-2xl backdrop:bg-black/40",
        wide ? "max-w-3xl" : "max-w-lg",
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <IconButton label="Yopish" onClick={onClose}>
              <X size={18} aria-hidden="true" />
            </IconButton>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

// ── Table ────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto scroll-thin", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, right, className }: { children?: ReactNode; right?: boolean; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 whitespace-nowrap border-b border-border bg-surface-2 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-muted",
        right && "text-right",
        className,
      )}
    >
      {children}
    </th>
  );
}
export function Td({ children, right, className, ...rest }: ComponentProps<"td"> & { right?: boolean }) {
  return (
    <td className={cn("whitespace-nowrap border-b border-border px-4 py-3 align-middle", right && "num text-right", className)} {...rest}>
      {children}
    </td>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(control, "pl-9")}
      />
    </div>
  );
}
