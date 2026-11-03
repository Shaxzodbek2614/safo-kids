"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addExpense, useDb } from "@/lib/data/store";
import { branchScope, lookups, seesAllBranches, THIS_MONTH, THIS_YEAR, TODAY } from "@/lib/data/calc";
import { CASH_LABEL, type CashType } from "@/lib/data/types";
import { MONTHS, date, money } from "@/lib/format";
import { Button, Card, CardHeader, Field, Input, Modal, PageHeader, Progress, Select, Table, Td, Textarea, Th } from "@/components/ui";

export default function ExpensesPage() {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const L = lookups(db);
  const [month, setMonth] = useState(THIS_MONTH - 1);
  const [adding, setAdding] = useState(false);

  const rows = db.expenses
    .filter((e) => scope.includes(e.branchId) && e.date.startsWith(`${THIS_YEAR}-${String(month).padStart(2, "0")}`))
    .sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((s, e) => s + e.quantity * e.unitPrice, 0);
  const byCat = db.expenseCategories
    .map((c) => ({ c, sum: rows.filter((e) => e.categoryId === c.id).reduce((s, e) => s + e.quantity * e.unitPrice, 0) }))
    .filter((x) => x.sum > 0)
    .sort((a, b) => b.sum - a.sum);

  return (
    <>
      <PageHeader
        title="Xarajatlar"
        subtitle="Filiallar xarajatlari, kategoriya boʻyicha"
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden="true" /> Xarajat qoʻshish
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <label htmlFor="em" className="sr-only">
              Oy
            </label>
            <Select id="em" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-44">
              {MONTHS.slice(0, THIS_MONTH).map((m, i) => (
                <option key={m} value={i + 1}>
                  {m} {THIS_YEAR}
                </option>
              ))}
            </Select>
            <p className="ml-auto text-sm">
              Jami: <b className="num">{money(total)}</b> soʻm
            </p>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Sana</Th>
                <Th>Nomi</Th>
                <Th>Kategoriya</Th>
                <Th>Filial</Th>
                <Th right>Soni</Th>
                <Th right>Narxi</Th>
                <Th right>Jami</Th>
                <Th>Toʻlov</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-surface-2">
                  <Td className="text-muted">{date(e.date)}</Td>
                  <Td className="font-semibold">{e.name}</Td>
                  <Td>{L.category.get(e.categoryId)?.name}</Td>
                  <Td>{L.branch.get(e.branchId)?.name}</Td>
                  <Td right>{e.quantity}</Td>
                  <Td right>{money(e.unitPrice)}</Td>
                  <Td right className="font-semibold">
                    {money(e.quantity * e.unitPrice)}
                  </Td>
                  <Td className="text-muted">{CASH_LABEL[e.cashType]}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card className="self-start">
          <CardHeader title="Kategoriyalar" subtitle={`${MONTHS[month - 1]} ${THIS_YEAR}`} />
          <ul className="flex flex-col gap-4 p-5">
            {byCat.map(({ c, sum }) => (
              <li key={c.id}>
                <div className="mb-1.5 flex justify-between gap-3 text-sm">
                  <span className="font-semibold">{c.name}</span>
                  <span className="num text-muted">{money(sum)}</span>
                </div>
                <Progress value={total ? sum / total : 0} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <NewExpense open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function NewExpense({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const [f, setF] = useState({ branchId: scope[0] ?? "", categoryId: db.expenseCategories[0].id, name: "", quantity: "1", unitPrice: "", cashType: "Cash" as CashType, comment: "" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const accounts = db.accounts.filter((a) => a.cashType === f.cashType && (seesAllBranches(session) || a.responsibles.includes(session.userId)));
  const total = Number(f.quantity) * Number(f.unitPrice);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xarajat qoʻshish"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={!f.name || !total || !accounts.length}
            onClick={() => {
              addExpense({ branchId: f.branchId, date: TODAY, categoryId: f.categoryId, name: f.name, quantity: Number(f.quantity), unitPrice: Number(f.unitPrice), cashType: f.cashType, accountId: accounts[0].id, comment: f.comment || null });
              setF({ ...f, name: "", unitPrice: "", quantity: "1", comment: "" });
              onClose();
            }}
          >
            Saqlash
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Filial">
          {(id) => (
            <Select id={id} value={f.branchId} onChange={set("branchId")}>
              {db.branches
                .filter((b) => scope.includes(b.id))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
          )}
        </Field>
        <Field label="Kategoriya">
          {(id) => (
            <Select id={id} value={f.categoryId} onChange={set("categoryId")}>
              {db.expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Nomi" className="sm:col-span-2">
          {(id) => <Input id={id} value={f.name} onChange={set("name")} placeholder="Masalan, Sabzavotlar" />}
        </Field>
        <Field label="Soni">{(id) => <Input id={id} inputMode="numeric" value={f.quantity} onChange={set("quantity")} />}</Field>
        <Field label="Narxi (soʻm)">{(id) => <Input id={id} inputMode="numeric" value={f.unitPrice} onChange={set("unitPrice")} />}</Field>
        <Field label="Toʻlov shakli">
          {(id) => (
            <Select id={id} value={f.cashType} onChange={set("cashType")}>
              {(["Cash", "Card"] as CashType[]).map((t) => (
                <option key={t} value={t}>
                  {CASH_LABEL[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex flex-col justify-end rounded-lg bg-surface-2 px-3 py-2">
          <span className="text-xs text-muted">Jami summa</span>
          <span className="num text-lg font-extrabold">{money(total || 0)}</span>
        </div>
        <Field label="Izoh" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={f.comment} onChange={set("comment")} />}
        </Field>
      </div>
    </Modal>
  );
}
