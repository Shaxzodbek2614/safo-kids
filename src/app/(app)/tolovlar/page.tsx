"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { addPayment, deletePayment, updatePayment, useDb } from "@/lib/data/store";
import { canEditPayments, paymentCashTypes } from "@/lib/data/permissions";
import { branchScope, contractStatus, financeIndex, lookups, seesAllBranches, studentName, THIS_MONTH, THIS_YEAR, TODAY } from "@/lib/data/calc";
import { CASH_LABEL, type CashType, type Payment } from "@/lib/data/types";
import { MONTHS, date, money } from "@/lib/format";
import { Badge, Button, Card, Field, IconButton, Input, Modal, PageHeader, SearchInput, Select, Stat, Table, Td, Textarea, Th } from "@/components/ui";

export default function PaymentsPage() {
  const sp = Object.fromEntries(useSearchParams());
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const L = lookups(db);
  const [q, setQ] = useState("");
  const [month, setMonth] = useState(THIS_MONTH);
  const [adding, setAdding] = useState(sp.yangi === "1");
  const [editing, setEditing] = useState<Payment | null>(null);
  const [removing, setRemoving] = useState<Payment | null>(null);
  const canAdd = paymentCashTypes(session.role).length > 0;
  const canEdit = canEditPayments(session.role);

  const inMonth = db.payments.filter((p) => scope.includes(p.branchId) && p.date.startsWith(`${THIS_YEAR}-${String(month).padStart(2, "0")}`));
  const rows = inMonth
    .filter((p) => !q || studentName(L, L.contract.get(p.contractId)?.studentId ?? "").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const sum = (xs: typeof rows) => xs.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Toʻlovlar"
        subtitle="Ota-onalardan qabul qilingan toʻlovlar"
        actions={
          canAdd && (
            <Button onClick={() => setAdding(true)}>
              <Plus size={16} aria-hidden="true" /> Toʻlov qabul qilish
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label={`${MONTHS[month - 1]} jami`} value={money(sum(inMonth))} hint={`${inMonth.length} ta toʻlov`} />
        <Stat label="Naqd" value={money(sum(inMonth.filter((p) => p.cashType === "Cash")))} />
        <Stat label="Karta va bank" value={money(sum(inMonth.filter((p) => p.cashType !== "Cash")))} hint={`${inMonth.filter((p) => p.nonCashStatus === "Tasdiqlashga").length} ta tasdiqlanmagan`} />
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Bola ismi boʻyicha" />
          <label htmlFor="pm" className="sr-only">
            Oy
          </label>
          <Select id="pm" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-44">
            {MONTHS.slice(0, THIS_MONTH).map((m, i) => (
              <option key={m} value={i + 1}>
                {m} {THIS_YEAR}
              </option>
            ))}
          </Select>
          <p className="ml-auto text-sm text-muted">{rows.length} ta</p>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Sana</Th>
              <Th>Shartnoma</Th>
              <Th>Filial</Th>
              <Th right>Summa</Th>
              <Th>Pul shakli</Th>
              <Th>Hisob</Th>
              <Th>Chegirma</Th>
              <Th>Qabul qildi</Th>
              {canEdit && <Th />}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 300).map((p) => {
              const c = L.contract.get(p.contractId);
              return (
                <tr key={p.id} className="hover:bg-surface-2">
                  <Td className="text-muted">{date(p.date)}</Td>
                  <Td>
                    {c ? (
                      <Link href={`/shartnomalar/korish?id=${c.id}`} className="font-semibold hover:text-primary">
                        {studentName(L, c.studentId)} <span className="font-normal text-muted">№ {c.number}</span>
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{L.branch.get(p.branchId)?.name}</Td>
                  <Td right className="font-semibold">
                    {money(p.amount)}
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      {CASH_LABEL[p.cashType]}
                      {p.nonCashStatus === "Tasdiqlashga" && <Badge tone="warning">Kutmoqda</Badge>}
                    </span>
                  </Td>
                  <Td>{L.account.get(p.accountId)?.name}</Td>
                  <Td>
                    {p.discount ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="num">{money(p.discount)}</span>
                        <Badge tone={p.discountStatus === "Tasdiqlandi" ? "success" : "warning"}>{p.discountStatus === "Tasdiqlandi" ? "Tasdiqlangan" : "Kutmoqda"}</Badge>
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="text-muted">{L.user.get(p.accountantId)?.fullName}</Td>
                  {canEdit && (
                    <Td className="text-right">
                      <IconButton label="Tahrirlash" onClick={() => setEditing(p)}>
                        <Pencil size={16} aria-hidden="true" />
                      </IconButton>
                      <IconButton label="Oʻchirish" className="hover:text-danger" onClick={() => setRemoving(p)}>
                        <Trash2 size={16} aria-hidden="true" />
                      </IconButton>
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <NewPayment open={adding && canAdd} onClose={() => setAdding(false)} initialContract={typeof sp.shartnoma === "string" ? sp.shartnoma : undefined} />
      {editing && <EditPayment key={editing.id} payment={editing} onClose={() => setEditing(null)} />}
      {removing && (
        <Modal
          open
          onClose={() => setRemoving(null)}
          title="Toʻlovni oʻchirish"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRemoving(null)}>
                Bekor qilish
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  deletePayment(removing.id);
                  setRemoving(null);
                }}
              >
                Oʻchirish
              </Button>
            </>
          }
        >
          <p className="text-sm">
            {studentName(L, L.contract.get(removing.contractId)?.studentId ?? "")}ning {date(removing.date)} sanasidagi <b className="num">{money(removing.amount)}</b> soʻmlik toʻlovi oʻchiriladi.
            Shartnoma qarzi va hisob qoldigʻi qayta hisoblanadi.
          </p>
        </Modal>
      )}
    </>
  );
}

function EditPayment({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { db } = useDb();
  const [amount, setAmount] = useState(String(payment.amount));
  const [day, setDay] = useState(payment.date);
  const [cashType, setCashType] = useState(payment.cashType);
  const [accountId, setAccountId] = useState(payment.accountId);
  const [comment, setComment] = useState(payment.comment ?? "");
  const accounts = db.accounts.filter((a) => a.cashType === cashType);
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];
  return (
    <Modal
      open
      onClose={onClose}
      title="Toʻlovni tahrirlash"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={!Number(amount) || !account}
            onClick={() => {
              updatePayment(payment.id, { amount: Number(amount), date: day, cashType, accountId: account.id, comment: comment || null });
              onClose();
            }}
          >
            Saqlash
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Summa (soʻm)">{(id) => <Input id={id} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />}</Field>
        <Field label="Sana">{(id) => <Input id={id} type="date" max={TODAY} value={day} onChange={(e) => setDay(e.target.value)} />}</Field>
        <Field label="Pul shakli">
          {(id) => (
            <Select id={id} value={cashType} onChange={(e) => setCashType(e.target.value as CashType)}>
              {(["Cash", "Card"] as CashType[]).map((t) => (
                <option key={t} value={t}>
                  {CASH_LABEL[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Hisob (gʻazna)">
          {(id) => (
            <Select id={id} value={account?.id ?? ""} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Izoh" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={comment} onChange={(e) => setComment(e.target.value)} />}
        </Field>
      </div>
    </Modal>
  );
}

function NewPayment({ open, onClose, initialContract }: { open: boolean; onClose: () => void; initialContract?: string }) {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const L = lookups(db);
  const fin = financeIndex(db);
  const contracts = db.contracts.filter((c) => scope.includes(c.branchId) && contractStatus(c) !== "Rejada");
  const [contractId, setContractId] = useState(initialContract ?? "");
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("");
  const allowed = paymentCashTypes(session.role);
  const cashType = allowed[0] ?? "Cash";
  const [discountType, setDiscountType] = useState("");
  const [discount, setDiscount] = useState("");
  const [comment, setComment] = useState("");

  const c = L.contract.get(contractId);
  const myAccounts = db.accounts.filter((a) => a.cashType === cashType && (seesAllBranches(session) || a.responsibles.includes(session.userId)));
  const [accountId, setAccountId] = useState("");
  const account = myAccounts.find((a) => a.id === accountId) ?? myAccounts[0];
  const maxDiscount = db.discountTypes.find((d) => d.id === discountType)?.maxAmount ?? 0;
  const discountOk = !discountType || Number(discount) <= maxDiscount;
  const valid = c && Number(amount) > 0 && account && discountOk;
  const matches = search
    ? contracts.filter((x) => `${studentName(L, x.studentId)} ${x.number}`.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  const reset = () => {
    setContractId("");
    setSearch("");
    setAmount("");
    setDiscount("");
    setDiscountType("");
    setComment("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Toʻlov qabul qilish"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              if (!c || !account) return;
              addPayment({
                branchId: c.branchId,
                contractId: c.id,
                date: TODAY,
                amount: Number(amount),
                cashType,
                accountId: account.id,
                accountantId: session.userId,
                discountTypeId: discountType || null,
                discount: Number(discount) || 0,
                comment: comment || null,
              });
              reset();
              onClose();
            }}
          >
            Saqlash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {c ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary-soft p-3">
            <div className="text-sm">
              <p className="font-bold">
                {studentName(L, c.studentId)} · № {c.number}
              </p>
              <p className="text-primary-ink">
                Oylik: {money(fin.get(c.id)?.monthlyPrice ?? 0)} · Qarz: <b>{money(fin.get(c.id)?.debt ?? 0)}</b>
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setContractId("")}>
              Oʻzgartirish
            </Button>
          </div>
        ) : (
          <Field label="Shartnoma">
            {(id) => (
              <div className="relative">
                <Input id={id} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bola ismi yoki shartnoma raqami" autoComplete="off" />
                {matches.length > 0 && (
                  <ul className="absolute inset-x-0 top-11 z-10 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                    {matches.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-surface-2"
                          onClick={() => {
                            setContractId(m.id);
                            const debt = fin.get(m.id)?.debt ?? 0;
                            setAmount(String(debt > 0 ? debt : fin.get(m.id)?.monthlyPrice ?? ""));
                          }}
                        >
                          <span>
                            <span className="font-semibold">{studentName(L, m.studentId)}</span> <span className="text-muted">№ {m.number}</span>
                          </span>
                          <span className="text-xs text-muted">{L.branch.get(m.branchId)?.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Field>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Summa (soʻm)">{(id) => <Input id={id} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />}</Field>
          <Field label="Sana" hint={seesAllBranches(session) ? undefined : "Faqat bugungi sana"}>
            {(id) => <Input id={id} value={date(TODAY)} disabled />}
          </Field>
          <Field label="Pul shakli" hint={cashType === "Cash" ? "Kartani Admin kiritadi" : "Naqdni Administrator+Hisobchi kiritadi"}>
            {(id) => <Input id={id} value={CASH_LABEL[cashType]} disabled />}
          </Field>
          <Field label="Hisob (gʻazna)" hint={myAccounts.length ? undefined : "Bu pul shaklida mas'ul hisobingiz yoʻq"}>
            {(id) => (
              <Select id={id} value={account?.id ?? ""} onChange={(e) => setAccountId(e.target.value)}>
                {myAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Chegirma turi">
            {(id) => (
              <Select id={id} value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                <option value="">Chegirmasiz</option>
                {db.discountTypes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (≤ {money(d.maxAmount)})
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {discountType && (
            <Field label="Chegirma summasi" hint={discountOk ? "Tasdiqlashga yuboriladi" : `Eng koʻpi ${money(maxDiscount)}`}>
              {(id) => <Input id={id} inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ""))} className={discountOk ? "" : "border-danger"} />}
            </Field>
          )}
        </div>
        {cashType !== "Cash" && <p className="rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning">Naqdsiz toʻlov Bosh menejer yoki Admin tasdiqlagach hisobga tushadi.</p>}
        <Field label="Izoh" hint={cashType === "Cash" ? undefined : "Tasdiqlovchi shu izohga qarab tekshiradi"}>
          {(id) => <Textarea id={id} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={cashType === "Cash" ? "" : "Kimning kartasidan, qaysi ilova orqali, soat nechada"} />}
        </Field>
      </div>
    </Modal>
  );
}
