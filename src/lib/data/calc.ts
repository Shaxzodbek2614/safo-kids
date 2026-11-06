// Calculation rules from docs/TZ.md section 6. These become SQL views later.
import type { DB, Session } from "./store";
import type { Account, Charge, Contract, ContractStatus, Group, Role, SalaryRate, User } from "./types";
import { SCHOOL_DAYS, THIS_MONTH, THIS_YEAR, TODAY } from "./seed";

export { TODAY, THIS_MONTH, THIS_YEAR };
export const SCHOOL_DAYS_DESC = [...SCHOOL_DAYS].reverse().slice(0, 15);

/** Contracts sitting in a group on a given day (TakeAttendance.Students). */
export function groupRoster(db: DB, groupId: string, day: string) {
  return db.contracts.filter((c) => c.groupId === groupId && c.startDate <= day && (!c.endDate || c.endDate >= day));
}

const ym = (y: number, m: number) => y * 12 + m;
const monthOf = (isoDate: string) => {
  const [y, m] = isoDate.split("-").map(Number);
  return { y, m };
};

// ── Access ───────────────────────────────────────────────────────────────
export function seesAllBranches(s: Session) {
  return s.role === "Admin" || s.role === "Bosh menejer";
}

/** Branch filter applied to every list: the topbar choice, limited by role. */
export function branchScope(db: DB, s: Session): string[] {
  const me = db.users.find((u) => u.id === s.userId)!;
  const allowed = seesAllBranches(s) ? db.branches.map((b) => b.id) : me.branchIds;
  return s.branchId === "all" ? allowed : allowed.filter((b) => b === s.branchId);
}

export function visibleGroups(db: DB, s: Session): Group[] {
  const scope = branchScope(db, s);
  return db.groups.filter(
    (g) => scope.includes(g.branchId) && (s.role !== "Ustoz" || g.teacherId === s.userId),
  );
}

// ── Lookups ──────────────────────────────────────────────────────────────
export function lookups(db: DB) {
  const by = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
  return {
    branch: by(db.branches),
    user: by(db.users),
    group: by(db.groups),
    room: by(db.rooms),
    student: by(db.students),
    contract: by(db.contracts),
    account: by(db.accounts),
    source: by(db.leadSources),
    category: by(db.expenseCategories),
    creditor: by(db.creditors),
    discountType: by(db.discountTypes),
  };
}
export type Lookups = ReturnType<typeof lookups>;

export function studentName(l: Lookups, studentId: string) {
  const s = l.student.get(studentId);
  return s ? `${s.firstName} ${s.lastName}` : "—";
}

export function groupLabel(l: Lookups, groupId: string | null) {
  if (!groupId) return "—";
  const g = l.group.get(groupId);
  if (!g) return "—";
  return `${g.name} · ${l.user.get(g.teacherId)?.fullName ?? ""}`;
}

// ── Contracts ────────────────────────────────────────────────────────────
export function contractStatus(c: Contract, today = TODAY): ContractStatus {
  if (c.startDate > today) return "Rejada";
  if (c.endDate && c.endDate < today) return "Nofaol";
  return "Faol";
}

export function chargeFinal(ch: Charge) {
  return ch.discountStatus === "Tasdiqlandi" ? ch.basePrice - ch.discount : ch.basePrice;
}

export interface ChargeRow extends Charge {
  final: number;
  paid: number;
  monthDebt: number;
  prevDebt: number;
  endDebt: number;
}

/** Year-aware version of AppSheet's Shartnoma_summalari virtual columns. */
export function chargeRows(db: DB, contractId: string): ChargeRow[] {
  const rows = db.charges
    .filter((c) => c.contractId === contractId)
    .sort((a, b) => ym(a.year, a.month) - ym(b.year, b.month));
  const pays = db.payments.filter((p) => p.contractId === contractId);
  let carried = 0;
  return rows.map((ch) => {
    const final = chargeFinal(ch);
    const paid = pays
      .filter((p) => {
        const { y, m } = monthOf(p.date);
        return y === ch.year && m === ch.month;
      })
      .reduce((s, p) => s + p.amount, 0);
    const monthDebt = final - paid;
    const prevDebt = carried;
    carried += monthDebt;
    return { ...ch, final, paid, monthDebt, prevDebt, endDebt: prevDebt + monthDebt };
  });
}

export interface ContractFinance {
  base: number;
  discount: number;
  final: number;
  paid: number;
  debt: number;
  monthDebt: number;
  monthlyPrice: number;
}

export function financeIndex(db: DB): Map<string, ContractFinance> {
  const out = new Map<string, ContractFinance>();
  const get = (id: string) => {
    let f = out.get(id);
    if (!f) {
      f = { base: 0, discount: 0, final: 0, paid: 0, debt: 0, monthDebt: 0, monthlyPrice: 0 };
      out.set(id, f);
    }
    return f;
  };
  for (const ch of db.charges) {
    const f = get(ch.contractId);
    const fin = chargeFinal(ch);
    f.base += ch.basePrice;
    f.discount += ch.discountStatus === "Tasdiqlandi" ? ch.discount : 0;
    f.final += fin;
    f.monthlyPrice = Math.max(f.monthlyPrice, fin);
    if (ch.year === THIS_YEAR && ch.month === THIS_MONTH) f.monthDebt += fin;
  }
  for (const p of db.payments) {
    const f = get(p.contractId);
    f.paid += p.amount;
    const { y, m } = monthOf(p.date);
    if (y === THIS_YEAR && m === THIS_MONTH) f.monthDebt -= p.amount;
  }
  for (const f of out.values()) f.debt = f.final - f.paid;
  return out;
}

// ── Accounts (TZ 6.2) ────────────────────────────────────────────────────
export function accountBalance(db: DB, a: Account) {
  let s = a.initialBalance;
  for (const p of db.payments) if (p.accountId === a.id) s += p.amount;
  for (const t of db.transfers) {
    if (t.status !== "Tasdiqlandi") continue;
    if (t.toAccountId === a.id) s += t.amount;
    if (t.fromAccountId === a.id) s -= t.amount;
  }
  for (const e of db.expenses) if (e.accountId === a.id) s -= e.quantity * e.unitPrice;
  for (const sp of db.salaryPayments) if (sp.accountId === a.id) s -= sp.amount;
  for (const cf of db.cashFlows) if (cf.accountId === a.id) s -= cf.amount;
  return s;
}

export function creditorBalance(db: DB, creditorId: string) {
  const c = db.creditors.find((x) => x.id === creditorId)!;
  return c.initialBalance - db.cashFlows.filter((f) => f.creditorId === creditorId).reduce((s, f) => s + f.amount, 0);
}

// ── Groups (TZ 6.4) ──────────────────────────────────────────────────────
export function groupFill(db: DB, g: Group) {
  const capacity = db.rooms.find((r) => r.id === g.roomId)?.capacity ?? 0;
  const active = db.contracts.filter((c) => c.groupId === g.id && contractStatus(c) === "Faol").length;
  const ratio = capacity ? active / capacity : 0;
  const grade =
    ratio === 0 ? "Boʻsh" : ratio <= 0.5 ? "Yomon" : ratio <= 0.75 ? "Oʻrtacha" : ratio <= 0.85 ? "Yaxshi" : "Zoʻr";
  return { capacity, active, open: capacity - active, ratio, grade };
}

// ── Salaries (TZ 6.5, 13) ────────────────────────────────────────────────
export function rateFor(db: DB, role: Role, year: number, month: number): SalaryRate | null {
  const t = ym(year, month);
  return db.salaryRates.filter((r) => r.role === role && ym(r.fromYear, r.fromMonth) <= t).at(-1) ?? null;
}

export function salaryRows(db: DB, year: number, month: number, branchIds: string[]) {
  const days = new Map<string, number>();
  for (const a of db.staffAttendance) {
    if (a.status !== "1") continue;
    const { y, m } = monthOf(a.date);
    const k = `${a.userId}-${ym(y, m)}`;
    days.set(k, (days.get(k) ?? 0) + 1);
  }
  const given = new Map<string, number>();
  for (const p of db.salaryPayments) {
    const k = `${p.userId}-${ym(p.year, p.month)}`;
    given.set(k, (given.get(k) ?? 0) + p.amount);
  }
  const extras = new Map(db.salaryAssignments.map((a) => [`${a.userId}-${ym(a.year, a.month)}`, a]));

  const monthFor = (u: User, y: number, m: number) => {
    const rate = rateFor(db, u.role, y, m);
    const k = `${u.id}-${ym(y, m)}`;
    const present = days.get(k) ?? 0;
    const fixed = rate?.kind === "Belgilangan" ? rate.amount : 0;
    const kpi = rate?.kind === "KPI" ? rate.amount * present : 0;
    const a = extras.get(k);
    const bonus = a?.bonus ?? 0;
    const fine = a?.fine ?? 0;
    const revenueKpi = a?.revenueKpi ?? 0;
    return { rate, present, fixed, kpi, bonus, fine, revenueKpi, total: fixed + kpi + bonus + revenueKpi - fine, given: given.get(k) ?? 0 };
  };

  return db.users
    .filter((u) => rateFor(db, u.role, year, month) && branchIds.includes(u.branchIds[0] ?? "b2"))
    .map((user) => {
      const cur = monthFor(user, year, month);
      let prev = 0;
      for (let t = ym(THIS_YEAR, 1); t < ym(year, month); t++) {
        const y = Math.floor((t - 1) / 12);
        const x = monthFor(user, y, t - y * 12);
        prev += x.total - x.given;
      }
      return { id: user.id, user, userId: user.id, branchId: user.branchIds[0] ?? "b2", year, month, ...cur, prev, balance: cur.total + prev - cur.given };
    });
}

// ── Grades (TZ 13) ───────────────────────────────────────────────────────
const shift = (day: string, n: number) => new Date(Date.parse(day) + n * 86_400_000).toISOString().slice(0, 10);

export type GradePeriod = "week" | "month";

export function gradePeriods(day: string, period: GradePeriod) {
  if (period === "week") {
    const monday = shift(day, -((new Date(day).getUTCDay() + 6) % 7));
    return { cur: [monday, shift(monday, 6)], prev: [shift(monday, -7), shift(monday, -1)], curLabel: "Bu hafta", prevLabel: "Oʻtgan hafta" };
  }
  const first = `${day.slice(0, 7)}-01`;
  const lastPrev = shift(first, -1);
  const nextFirst = shift(first, 32).slice(0, 7) + "-01";
  return { cur: [first, shift(nextFirst, -1)], prev: [`${lastPrev.slice(0, 7)}-01`, lastPrev], curLabel: "Bu oy", prevLabel: "Oʻtgan oy" };
}

/** Share of children who passed, among those graded (absent ones are not counted). */
export function gradeStats(db: DB, groupId: string, field: "poem" | "habit", [from, to]: string[]) {
  const xs = db.grades.filter((g) => g.groupId === groupId && g.date >= from && g.date <= to);
  const ok = xs.filter((g) => g[field] === "Topshirdi").length;
  const no = xs.filter((g) => g[field] === "Topshirolmadi").length;
  const absent = xs.filter((g) => g[field] === "Kelmadi").length;
  return { ok, no, absent, rate: ok + no ? ok / (ok + no) : null };
}

// ── Profit (TZ 6.6) ──────────────────────────────────────────────────────
export function profit(db: DB, branchIds: string[], year: number, month: number | null) {
  const inPeriod = (d: string) => {
    const { y, m } = monthOf(d);
    return y === year && (month === null || m === month);
  };
  const income = db.payments.filter((p) => branchIds.includes(p.branchId) && inPeriod(p.date)).reduce((s, p) => s + p.amount, 0);
  // Company-wide expenses have no branch, so they only count for the whole company.
  const whole = branchIds.length === db.branches.length;
  const expense = db.expenses
    .filter((e) => (e.branchId === null ? whole : branchIds.includes(e.branchId)) && inPeriod(e.date))
    .reduce((s, e) => s + e.quantity * e.unitPrice, 0);
  const salary = db.salaryPayments
    .filter((p) => branchIds.includes(p.branchId) && p.year === year && (month === null || p.month === month))
    .reduce((s, p) => s + p.amount, 0);
  return { income, expense, salary, profit: income - expense - salary };
}
