import Link from "next/link";

export const metadata = { title: "Kirish" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/15" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c-2.5 3-6 4-6 8a6 6 0 0 0 12 0c0-4-3.5-5-6-8Z" />
              <path d="M9.5 13.5a2.5 2.5 0 0 0 5 0" />
            </svg>
          </span>
          <span className="text-lg font-extrabold">Safo Kids</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">Bogʻchangizni bitta joydan boshqaring</h1>
          <p className="mt-4 max-w-md text-white/80">Lidlar, shartnomalar, toʻlovlar, davomat va oyliklar — toʻrtala filial uchun.</p>
        </div>
        <p className="text-sm text-white/60">© 2026 Safo Kids</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">Tizimga kirish</h2>
          <p className="mt-1 text-sm text-muted">Ish hisobingiz bilan kiring</p>

          <Link
            href="/"
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border-strong bg-surface font-semibold hover:bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8Z" />
              <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 10l3.7-2.8Z" />
              <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z" />
            </svg>
            Google orqali kirish
          </Link>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold text-subtle">
            <span className="h-px flex-1 bg-border" />
            yoki
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login" className="text-[13px] font-semibold">
                Login yoki email
              </label>
              <input id="login" autoComplete="username" className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-semibold">
                Parol
              </label>
              <input id="password" type="password" autoComplete="current-password" className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <Link href="/" className="flex h-11 items-center justify-center rounded-lg bg-primary font-semibold text-white hover:bg-primary-hover">
              Kirish
            </Link>
          </div>
          <p className="mt-6 rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-[#8a5a00]">Demo versiya: istalgan tugma tizimga kiritadi.</p>
        </div>
      </div>
    </div>
  );
}
