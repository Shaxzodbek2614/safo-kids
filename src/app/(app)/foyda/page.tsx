"use client";

import { useState } from "react";
import { useDb } from "@/lib/data/store";
import { profit, THIS_MONTH, THIS_YEAR } from "@/lib/data/calc";
import { MONTHS, MONTHS_SHORT, cn, money } from "@/lib/format";
import { Card, CardHeader, Field, PageHeader, Stat, Table, Td, Th } from "@/components/ui";
import { ColumnChart } from "@/components/charts";

export default function ProfitPage() {
  const { db } = useDb();
  const [branches, setBranches] = useState<string[]>(db.branches.map((b) => b.id));
  const [month, setMonth] = useState<number | null>(THIS_MONTH - 1);
  const p = profit(db, branches, THIS_YEAR, month);
  const monthly = Array.from({ length: THIS_MONTH }, (_, i) => ({ m: i + 1, ...profit(db, branches, THIS_YEAR, i + 1) }));
  const toggle = (id: string) => setBranches((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  return (
    <>
      <PageHeader title="Foyda hisoboti" subtitle="Tushum − xarajatlar − berilgan oyliklar" />
      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-4">
          <fieldset className="min-w-0">
            <legend className="mb-1.5 text-[13px] font-semibold">Filiallar</legend>
            <div className="flex flex-wrap gap-2">
              {db.branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={branches.includes(b.id)}
                  onClick={() => toggle(b.id)}
                  className={cn(
                    "h-10 rounded-lg border px-3 text-sm font-semibold transition-colors",
                    branches.includes(b.id) ? "border-primary bg-primary-soft text-primary-ink" : "border-border-strong text-muted hover:bg-surface-2",
                  )}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Davr" className="w-48">
            {(id) => (
              <select
                id={id}
                value={month ?? 0}
                onChange={(e) => setMonth(Number(e.target.value) || null)}
                className="h-10 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm"
              >
                <option value={0}>{THIS_YEAR}-yil (butun)</option>
                {MONTHS.slice(0, THIS_MONTH).map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m} {THIS_YEAR}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </Card>

      {branches.length < db.branches.length && <p className="mb-4 rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info">Filial tanlanmasdan kiritilgan xarajatlar faqat barcha filiallar tanlanganda hisobga olinadi.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Toʻlovlar" value={money(p.income)} tone="success" />
        <Stat label="Xarajatlar" value={money(p.expense)} />
        <Stat label="Oylik uchun toʻlovlar" value={money(p.salary)} />
        <Stat label="Koʻrilgan foyda" value={<span className={p.profit >= 0 ? "text-success" : "text-danger"}>{money(p.profit)}</span>} hint={p.income ? `Rentabellik: ${Math.round((p.profit / p.income) * 100)}%` : undefined} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Oyma-oy" subtitle={`${THIS_YEAR}-yil, tanlangan filiallar`} />
        <div className="p-5">
          <ColumnChart
            label="Oylar boʻyicha tushum va chiqim"
            data={monthly.map((x) => ({ label: MONTHS_SHORT[x.m - 1], income: x.income, out: x.expense + x.salary }))}
            series={[
              { key: "income", label: "Tushum", color: "var(--chart-1)" },
              { key: "out", label: "Chiqim", color: "var(--chart-2)" },
            ]}
          />
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Oy</Th>
              <Th right>Toʻlovlar</Th>
              <Th right>Xarajatlar</Th>
              <Th right>Oyliklar</Th>
              <Th right>Foyda</Th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((x) => (
              <tr key={x.m}>
                <Td className="font-semibold">{MONTHS[x.m - 1]}</Td>
                <Td right>{money(x.income)}</Td>
                <Td right>{money(x.expense)}</Td>
                <Td right>{money(x.salary)}</Td>
                <Td right className={cn("font-bold", x.profit >= 0 ? "text-success" : "text-danger")}>
                  {money(x.profit)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
