"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { DEMO_ROLES, restoreSession, setBranch, setRole, useDb } from "@/lib/data/store";
import { seesAllBranches, TODAY } from "@/lib/data/calc";
import { cn, dateLong } from "@/lib/format";
import { Avatar, IconButton } from "@/components/ui";
import { canSee, NAV } from "./nav";
import type { Role } from "@/lib/data/types";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-white" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c-2.5 3-6 4-6 8a6 6 0 0 0 12 0c0-4-3.5-5-6-8Z" />
          <path d="M9.5 13.5a2.5 2.5 0 0 0 5 0" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight">Safo Kids</span>
        <span className="block text-[11px] font-semibold text-muted">Boshqaruv tizimi</span>
      </span>
    </Link>
  );
}

function Sidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <nav aria-label="Asosiy menyu" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-6 scroll-thin">
      {NAV.map((sec) => {
        const items = sec.items.filter((i) => canSee(i, role));
        if (!items.length) return null;
        return (
          <div key={sec.title || "main"}>
            {sec.title && <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-subtle">{sec.title}</p>}
            <ul className="flex flex-col gap-0.5">
              {items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={active(it.href) ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                      active(it.href) ? "bg-primary-soft text-primary-ink" : "text-muted hover:bg-black/[.04] hover:text-text",
                    )}
                  >
                    <it.icon size={18} aria-hidden="true" />
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { db, session } = useDb();
  const [open, setOpen] = useState(false);
  useEffect(() => restoreSession(), []);
  const me = db.users.find((u) => u.id === session.userId)!;
  const branchOptions = seesAllBranches(session) ? db.branches : db.branches.filter((b) => me.branchIds.includes(b.id));

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface pt-5 lg:flex">
        <Logo />
        <Suspense>
          <Sidebar role={session.role} />
        </Suspense>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Menyuni yopish" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-6 bg-surface pt-4 shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Logo />
              <IconButton label="Yopish" onClick={() => setOpen(false)}>
                <X size={20} aria-hidden="true" />
              </IconButton>
            </div>
            <Suspense>
              <Sidebar role={session.role} onNavigate={() => setOpen(false)} />
            </Suspense>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface/90 px-4 backdrop-blur sm:gap-3 lg:px-8">
          <IconButton label="Menyu" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={20} aria-hidden="true" />
          </IconButton>

          <label className="sr-only" htmlFor="branch">
            Filial
          </label>
          <select
            id="branch"
            value={session.branchId}
            onChange={(e) => setBranch(e.target.value)}
            className="h-10 min-w-0 max-w-[48vw] rounded-lg border border-border-strong bg-surface px-3 text-sm font-semibold sm:max-w-none"
          >
            {branchOptions.length > 1 && <option value="all">Barcha filiallar</option>}
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <span className="hidden text-sm text-muted md:inline">{dateLong(TODAY)}</span>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-dashed border-accent bg-accent-soft px-2 py-1 sm:flex">
              <label htmlFor="role" className="text-[11px] font-bold uppercase tracking-wide text-[#8a5a00]">
                Demo rol
              </label>
              <select
                id="role"
                value={session.role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-7 rounded-md bg-transparent text-[13px] font-semibold"
              >
                {DEMO_ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <IconButton label="Bildirishnomalar">
              <Bell size={19} aria-hidden="true" />
            </IconButton>
            <div className="flex items-center gap-2.5 pl-1">
              <Avatar name={me.fullName} />
              <div className="hidden leading-tight xl:block">
                <p className="text-sm font-bold">{me.fullName}</p>
                <p className="text-xs text-muted">{session.role}</p>
              </div>
            </div>
            <Link href="/login" aria-label="Chiqish" title="Chiqish" className="inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-text">
              <LogOut size={18} aria-hidden="true" />
            </Link>
          </div>
        </header>

        {/* role switcher for phones */}
        <div className="flex items-center gap-2 border-b border-dashed border-accent bg-accent-soft px-4 py-2 sm:hidden">
          <label htmlFor="role-m" className="text-[11px] font-bold uppercase tracking-wide text-[#8a5a00]">
            Demo rol
          </label>
          <select id="role-m" value={session.role} onChange={(e) => setRole(e.target.value as Role)} className="h-8 flex-1 rounded-md bg-transparent text-[13px] font-semibold">
            {DEMO_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Suspense fallback={<p className="text-sm text-muted">Yuklanmoqda…</p>}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
