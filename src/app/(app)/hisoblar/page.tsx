"use client";

import { useState } from "react";
import { CreditCard, Landmark, Wallet } from "lucide-react";
import { useDb } from "@/lib/data/store";
import { canSeeExternalFlow, canSeeInternalFlow } from "@/lib/data/permissions";
import { accountBalance, lookups, seesAllBranches, studentName } from "@/lib/data/calc";
import { CASH_LABEL, type CashType } from "@/lib/data/types";
import { cn, date, money } from "@/lib/format";
import { Card, CardHeader, PageHeader, Table, Td, Th } from "@/components/ui";

const ICON: Record<CashType, typeof Wallet> = { Cash: Wallet, Card: CreditCard, Bank: Landmark };

export default function AccountsPage() {
  const { db, session } = useDb();
  const L = lookups(db);
  const visible = db.accounts.filter((a) => seesAllBranches(session) || a.responsibles.includes(session.userId));
  const [sel, setSel] = useState(visible[0]?.id);
  const acc = db.accounts.find((a) => a.id === sel) ?? visible[0];

  type Move = { date: string; label: string; detail: string; amount: number };
  const moves: Move[] = acc
    ? [
        ...db.payments.filter((p) => p.accountId === acc.id).map((p) => ({ date: p.date, label: "Toʻlov", detail: studentName(L, L.contract.get(p.contractId)?.studentId ?? ""), amount: p.amount })),
        ...db.transfers
          .filter((t) => canSeeInternalFlow(session.role) && t.status === "Tasdiqlandi" && (t.toAccountId === acc.id || t.fromAccountId === acc.id))
          .map((t) => ({
            date: t.date,
            label: t.toAccountId === acc.id ? "Kiruvchi oʻtkazma" : "Chiquvchi oʻtkazma",
            detail: L.account.get(t.toAccountId === acc.id ? t.fromAccountId : t.toAccountId)?.name ?? "",
            amount: t.toAccountId === acc.id ? t.amount : -t.amount,
          })),
        ...db.expenses.filter((e) => e.accountId === acc.id).map((e) => ({ date: e.date, label: "Xarajat", detail: e.name, amount: -e.quantity * e.unitPrice })),
        ...db.salaryPayments.filter((s) => s.accountId === acc.id && s.amount).map((s) => ({ date: s.date, label: "Oylik", detail: L.user.get(s.userId)?.fullName ?? "", amount: -s.amount })),
        ...db.cashFlows.filter((f) => canSeeExternalFlow(session.role) && f.accountId === acc.id).map((f) => ({ date: f.date, label: f.amount < 0 ? "Qarz olindi" : "Qarz qaytarildi", detail: L.creditor.get(f.creditorId)?.name ?? "", amount: -f.amount })),
      ]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 60)
    : [];

  const groups = (["Cash", "Card", "Bank"] as CashType[]).map((t) => ({ t, list: visible.filter((a) => a.cashType === t) })).filter((g) => g.list.length);

  return (
    <>
      <PageHeader title="Hisoblar" subtitle="Kassalar va kartalardagi hozirgi qoldiq" />
      {groups.map((g) => (
        <section key={g.t} className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-muted">
            {CASH_LABEL[g.t]}
            <span className="num rounded-full bg-black/[.06] px-2 text-xs">{money(g.list.reduce((s, a) => s + accountBalance(db, a), 0))}</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {g.list.map((a) => {
              const Icon = ICON[a.cashType];
              const bal = accountBalance(db, a);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSel(a.id)}
                  aria-pressed={acc?.id === a.id}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border bg-surface p-5 text-left transition-colors hover:border-primary",
                    acc?.id === a.id ? "border-primary ring-2 ring-primary/15" : "border-border",
                  )}
                >
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{a.name}</span>
                    <span className={cn("num block text-xl font-extrabold", bal < 0 && "text-danger")}>{money(bal)}</span>
                    <span className="block truncate text-xs text-muted">Masʼul: {a.responsibles.map((r) => L.user.get(r)?.fullName).join(", ")}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {acc && (
        <Card>
          <CardHeader title={`${acc.name} — harakatlar`} subtitle="Oxirgi 60 ta yozuv" />
          <Table>
            <thead>
              <tr>
                <Th>Sana</Th>
                <Th>Turi</Th>
                <Th>Tafsilot</Th>
                <Th right>Summa</Th>
              </tr>
            </thead>
            <tbody>
              {moves.map((m, i) => (
                <tr key={i}>
                  <Td className="text-muted">{date(m.date)}</Td>
                  <Td>{m.label}</Td>
                  <Td className="max-w-72 truncate">{m.detail}</Td>
                  <Td right className={cn("font-semibold", m.amount >= 0 ? "text-success" : "text-danger")}>
                    {m.amount >= 0 ? "+" : ""}
                    {money(m.amount)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
