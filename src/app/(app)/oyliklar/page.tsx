"use client";

import { useState } from "react";
import { addSalaryPayment, useDb } from "@/lib/data/store";
import { branchScope, salaryRows, THIS_MONTH, THIS_YEAR, TODAY } from "@/lib/data/calc";
import type { SalaryPayment } from "@/lib/data/types";
import { MONTHS, cn, money } from "@/lib/format";
import { Avatar, Button, Card, Field, Input, Modal, PageHeader, Select, Stat, Table, Td, Th } from "@/components/ui";

type Row = ReturnType<typeof salaryRows>[number];

export default function SalaryPage() {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const [month, setMonth] = useState(THIS_MONTH - 1);
  const [paying, setPaying] = useState<Row | null>(null);
  const rows = salaryRows(db, THIS_YEAR, month, scope).sort((a, b) => b.balance - a.balance);
  const sum = (k: "total" | "given" | "balance") => rows.reduce((s, r) => s + r[k], 0);

  return (
    <>
      <PageHeader title="Oyliklar" subtitle="Xodimlarga belgilangan va berilgan oyliklar, balans" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Hisoblangan" value={money(sum("total"))} hint={`${rows.length} ta xodim`} />
        <Stat label="Berildi" value={money(sum("given"))} />
        <Stat label="Berilishi kerak" value={<span className={sum("balance") > 0 ? "text-danger" : ""}>{money(sum("balance"))}</span>} />
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <label htmlFor="sm" className="sr-only">
            Oy
          </label>
          <Select id="sm" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-44">
            {MONTHS.slice(0, THIS_MONTH - 1).map((m, i) => (
              <option key={m} value={i + 1}>
                {m} {THIS_YEAR}
              </option>
            ))}
          </Select>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Xodim</Th>
              <Th right>Belgilangan</Th>
              <Th right>Bonus</Th>
              <Th right>KPI</Th>
              <Th right>Jarima</Th>
              <Th right>Jami</Th>
              <Th right>Avvalgi oydan</Th>
              <Th right>Berildi</Th>
              <Th right>Balans</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={r.user.fullName} className="size-8 text-xs" />
                    <div>
                      <p className="font-semibold">{r.user.fullName}</p>
                      <p className="text-xs text-muted">{r.user.role}</p>
                    </div>
                  </div>
                </Td>
                <Td right>{money(r.fixed)}</Td>
                <Td right>{r.bonus ? money(r.bonus) : "—"}</Td>
                <Td right>{r.teacherKpi + r.revenueKpi ? money(r.teacherKpi + r.revenueKpi) : "—"}</Td>
                <Td right className={r.fine ? "text-danger" : ""}>
                  {r.fine ? `−${money(r.fine)}` : "—"}
                </Td>
                <Td right className="font-semibold">
                  {money(r.total)}
                </Td>
                <Td right className="text-muted">
                  {money(r.prev)}
                </Td>
                <Td right>{money(r.given)}</Td>
                <Td right className={cn("font-bold", r.balance > 0 ? "text-danger" : "text-success")}>
                  {money(r.balance)}
                </Td>
                <Td className="text-right">
                  <Button size="sm" variant="secondary" disabled={r.balance <= 0} onClick={() => setPaying(r)}>
                    Berish
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {paying && <PaySalary row={paying} onClose={() => setPaying(null)} />}
    </>
  );
}

function PaySalary({ row, onClose }: { row: Row; onClose: () => void }) {
  const { db } = useDb();
  const [amount, setAmount] = useState(String(row.balance));
  const [type, setType] = useState<SalaryPayment["type"]>("Fixed");
  const [accountId, setAccountId] = useState("acc0");
  return (
    <Modal
      open
      onClose={onClose}
      title={`Oylik berish — ${row.user.fullName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={!Number(amount)}
            onClick={() => {
              addSalaryPayment({ branchId: row.branchId, userId: row.userId, year: row.year, month: row.month, date: TODAY, type, amount: Number(amount), accountId });
              onClose();
            }}
          >
            Berildi
          </Button>
        </>
      }
    >
      <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm">
        {MONTHS[row.month - 1]} {row.year}: jami <b className="num">{money(row.total)}</b>, berilgan <b className="num">{money(row.given)}</b>, qoldiq{" "}
        <b className="num text-danger">{money(row.balance)}</b>
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Summa (soʻm)">{(id) => <Input id={id} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />}</Field>
        <Field label="Oylik turi">
          {(id) => (
            <Select id={id} value={type} onChange={(e) => setType(e.target.value as "Fixed")}>
              <option value="Fixed">Belgilangan</option>
              <option value="Bonus">Bonus</option>
              <option value="KPI">KPI</option>
            </Select>
          )}
        </Field>
        <Field label="Hisob" className="sm:col-span-2">
          {(id) => (
            <Select id={id} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {db.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </Modal>
  );
}
