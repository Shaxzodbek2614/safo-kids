"use client";

// In-memory demo store. Screens read it through useDb() and change it through
// the actions below; a page reload restores the seed. When the database lands
// these actions become server actions with the same names.
import { useSyncExternalStore } from "react";
import * as seed from "./seed";
import type {
  Attendance,
  CashFlow,
  Contract,
  Expense,
  FileRef,
  Grade,
  GradeMark,
  Lead,
  LeadStatus,
  Payment,
  Role,
  SalaryPayment,
  SalaryRate,
  Student,
  Transfer,
  User,
} from "./types";

const clone = <T,>(xs: T[]): T[] => xs.map((x) => ({ ...x }));

export const db = {
  branches: clone(seed.branches),
  users: clone(seed.users),
  rooms: clone(seed.rooms),
  groups: clone(seed.groups),
  students: clone(seed.students),
  leads: clone(seed.leads),
  leadComments: clone(seed.leadComments),
  leadSources: clone(seed.leadSources),
  contracts: clone(seed.contracts),
  charges: clone(seed.charges),
  payments: clone(seed.payments),
  accounts: clone(seed.accounts),
  discountTypes: clone(seed.discountTypes),
  transfers: clone(seed.transfers),
  expenseCategories: clone(seed.expenseCategories),
  expenses: clone(seed.expenses),
  creditors: clone(seed.creditors),
  cashFlows: clone(seed.cashFlows),
  salaryAssignments: clone(seed.salaryAssignments),
  salaryPayments: clone(seed.salaryPayments),
  salaryRates: clone(seed.salaryRates),
  staffAttendance: clone(seed.staffAttendance),
  attendance: clone(seed.attendance),
  grades: clone(seed.grades),
  coursePrices: clone(seed.coursePrices),
  lessonDays: clone(seed.lessonDays),
  telegramReport: { weekday: 5, time: "18:00", recipients: ["Metodist", "Bosh menejer", "Guruh ustozi"] as string[] },
};
export type DB = typeof db;

// ── Session (demo role switcher + branch filter) ─────────────────────────
export interface Session {
  role: Role;
  userId: string;
  branchId: string | "all";
}

const DEMO_USERS: Record<string, () => User> = {
  Admin: () => db.users.find((u) => u.role === "Admin")!,
  "Bosh menejer": () => db.users.find((u) => u.role === "Bosh menejer")!,
  "Administrator+Hisobchi": () => db.users.find((u) => u.role === "Administrator+Hisobchi")!,
  Ustoz: () => db.users.find((u) => u.role === "Ustoz" && u.branchIds[0] === "b2")!,
};
export const DEMO_ROLES = Object.keys(DEMO_USERS) as Role[];

let session: Session = { role: "Admin", userId: DEMO_USERS.Admin().id, branchId: "all" };

let version = 0;
const listeners = new Set<() => void>();
function emit() {
  version++;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDb(): { db: DB; session: Session; version: number } {
  const v = useSyncExternalStore(subscribe, () => version, () => 0);
  return { db, session, version: v };
}

export function setRole(role: Role) {
  const u = DEMO_USERS[role]();
  const branchId = u.branchIds.length === 1 ? u.branchIds[0] : "all";
  session = { role, userId: u.id, branchId };
  try {
    localStorage.setItem("demo-role", role);
  } catch {}
  emit();
}

export function setBranch(branchId: string | "all") {
  session = { ...session, branchId };
  emit();
}

export function restoreSession() {
  try {
    const r = localStorage.getItem("demo-role") as Role | null;
    if (r && r in DEMO_USERS && r !== session.role) setRole(r);
  } catch {}
}

// ── Actions ──────────────────────────────────────────────────────────────
let n = 0;
const newId = (p: string) => `${p}-new-${++n}`;
const today = () => seed.TODAY;

export function addPayment(p: Omit<Payment, "id" | "createdAt" | "discountStatus" | "nonCashStatus">) {
  db.payments.unshift({
    ...p,
    id: newId("p"),
    createdAt: today(),
    discountStatus: p.discount ? "Tasdiqlashga" : null,
    nonCashStatus: p.cashType === "Cash" ? null : "Tasdiqlashga",
  });
  emit();
}

export function updatePayment(id: string, patch: Partial<Pick<Payment, "amount" | "date" | "cashType" | "accountId" | "comment">>) {
  const p = db.payments.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
  emit();
}

export function deletePayment(id: string) {
  const i = db.payments.findIndex((x) => x.id === id);
  if (i >= 0) db.payments.splice(i, 1);
  emit();
}

export function confirmPayment(id: string, what: "discount" | "noncash") {
  const p = db.payments.find((x) => x.id === id);
  if (!p) return;
  if (what === "discount") p.discountStatus = "Tasdiqlandi";
  else p.nonCashStatus = "Tasdiqlandi";
  emit();
}

export function confirmChargeDiscount(id: string) {
  const c = db.charges.find((x) => x.id === id);
  if (c) c.discountStatus = "Tasdiqlandi";
  emit();
}

export function addTransfer(t: Omit<Transfer, "id" | "status">) {
  db.transfers.unshift({ ...t, id: newId("t"), status: "Tasdiqlashga" });
  emit();
}

export function confirmTransfer(id: string) {
  const t = db.transfers.find((x) => x.id === id);
  if (t) t.status = "Tasdiqlandi";
  emit();
}

export function addExpense(e: Omit<Expense, "id">) {
  db.expenses.unshift({ ...e, id: newId("e") });
  emit();
}

export function addCashFlow(c: Omit<CashFlow, "id">) {
  db.cashFlows.unshift({ ...c, id: newId("cf") });
  emit();
}

export function addSalaryPayment(s: Omit<SalaryPayment, "id">) {
  db.salaryPayments.unshift({ ...s, id: newId("sp") });
  emit();
}

export function addLead(student: Omit<Student, "id">, lead: Omit<Lead, "id" | "studentId" | "createdAt">) {
  const s = { ...student, id: newId("s") };
  db.students.push(s);
  db.leads.unshift({ ...lead, id: newId("l"), studentId: s.id, createdAt: today() });
  emit();
}

export function setLeadCertificate(id: string, file: FileRef) {
  const l = db.leads.find((x) => x.id === id);
  if (l) l.certificate = file;
  emit();
}

export function setLeadStatus(id: string, status: LeadStatus, groupId?: string | null) {
  const l = db.leads.find((x) => x.id === id);
  if (!l) return;
  l.status = status;
  if (groupId !== undefined) l.groupId = groupId;
  emit();
}

export function addLeadComment(leadId: string, text: string, userId: string) {
  db.leadComments.push({ id: newId("lc"), leadId, text, createdAt: today(), createdBy: userId });
  emit();
}

/** "Shartnoma tuzish" from a lead (TZ 5.1) — returns the new contract id */
export function createContractFromLead(leadId: string): string | null {
  const l = db.leads.find((x) => x.id === leadId);
  if (!l || !l.groupId || !l.certificate) return null;
  const existing = db.contracts.find((c) => c.studentId === l.studentId);
  if (existing) return existing.id;
  const number = Math.max(0, ...db.contracts.filter((c) => c.branchId === l.branchId).map((c) => c.number)) + 1;
  const c: Contract = {
    id: newId("c"),
    branchId: l.branchId,
    studentId: l.studentId,
    groupId: l.groupId,
    type: "Pullik",
    number,
    startDate: l.demoDate ?? today(),
    endDate: null,
    stopReason: null,
    fatherName: l.fatherName,
    motherName: l.motherName,
    fatherPhone: l.fatherPhone,
    motherPhone: l.motherPhone,
    address: l.address,
    hasCertificate: true,
    certificate: l.certificate,
    createdAt: today(),
  };
  db.contracts.unshift(c);
  const price = db.coursePrices.find((p) => p.branchId === c.branchId && p.year === seed.THIS_YEAR && p.month === seed.THIS_MONTH)?.price ?? 0;
  db.charges.push({ id: newId("ch"), contractId: c.id, branchId: c.branchId, year: seed.THIS_YEAR, month: seed.THIS_MONTH, basePrice: price, discount: 0, discountReason: null, discountStatus: null });
  l.status = "5. Oʻqishni boshladi";
  emit();
  return c.id;
}

export function markAttendance(groupId: string, contractId: string, date: string, status: Attendance["status"] | null) {
  const i = db.attendance.findIndex((a) => a.groupId === groupId && a.contractId === contractId && a.date === date);
  if (status === null) {
    if (i >= 0) db.attendance.splice(i, 1);
  } else if (i >= 0) db.attendance[i] = { ...db.attendance[i], status };
  else db.attendance.push({ id: newId("a"), groupId, contractId, date, status });
  emit();
}

export function markStaffAttendance(groupId: string, userId: string, date: string, status: "1" | "X" | null) {
  const i = db.staffAttendance.findIndex((a) => a.userId === userId && a.date === date);
  if (status === null) {
    if (i >= 0) db.staffAttendance.splice(i, 1);
  } else if (i >= 0) db.staffAttendance[i] = { ...db.staffAttendance[i], status };
  else db.staffAttendance.push({ id: newId("sta"), groupId, userId, date, status });
  emit();
}

/** A new rate applies from the current month; earlier months keep the old one. */
export function setSalaryRate(role: Role, kind: SalaryRate["kind"], amount: number) {
  db.salaryRates.push({ id: newId("rt"), role, kind, amount, fromYear: seed.THIS_YEAR, fromMonth: seed.THIS_MONTH });
  emit();
}

export function setTelegramReport(patch: Partial<DB["telegramReport"]>) {
  Object.assign(db.telegramReport, patch);
  emit();
}

export function markGrade(groupId: string, contractId: string, date: string, field: "poem" | "habit", mark: GradeMark) {
  let g: Grade | undefined = db.grades.find((x) => x.groupId === groupId && x.contractId === contractId && x.date === date);
  if (!g) {
    g = { id: newId("gr"), groupId, contractId, date, poem: null, habit: null };
    db.grades.push(g);
  }
  g[field] = g[field] === mark ? null : mark;
  emit();
}
