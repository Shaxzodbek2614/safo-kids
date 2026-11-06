"use client";

import { useState } from "react";
import { addSalaryPayment, setSalaryRate, useDb } from "@/lib/data/store";
import { canSetSalaryRates } from "@/lib/data/permissions";
import { branchScope, rateFor, salaryRows, THIS_MONTH, THIS_YEAR, TODAY } from "@/lib/data/calc";
import { CASH_LABEL, type CashType, type Role, type SalaryRate } from "@/lib/data/types";
import { MONTHS, cn, money } from "@/lib/format";
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Modal, PageHeader, Select, Stat, Table, Tabs, Td, Textarea, Th } from "@/components/ui";

type Row = ReturnType<typeof salaryRows>[number];

const PAYROLL_ROLES: Role[] = ["Ustoz", "Yordamchi", "Bosh menejer", "Administrator+Hisobchi", "Metodist", "Boshqa"];

export default function SalaryPage() {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const [tab, setTab] = useState<"list" | "rates">("list");
  const [month, setMonth] = useState(THIS_MONTH - 1);
  const [paying, setPaying] = useState<Row | null>(null);
  const rows = salaryRows(db, THIS_YEAR, month, scope).sort((a, b) => b.balance - a.balance);
  const sum = (k: "total" | "given" | "balance") => rows.reduce((s, r) => s + r[k], 0);
  const showRates = canSetSalaryRates(session.role);

  return (
    <>
      <PageHeader title="Oyliklar" subtitle="Hisoblangan va berilgan oyliklar, xodimlar balansi" />
      {showRates && (
        <Tabs
          className="mb-4 w-fit"
          value={tab}
          onChange={setTab}
          items={[
            { value: "list", label: "Oyliklar" },
            { value: "rates", label: "KPI va oylik belgilash" },
          ]}
        />
      )}

      {tab === "rates" && showRates ? (
        <Rates />
      ) : (
        <>
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
                {MONTHS.slice(0, THIS_MONTH).map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m} {THIS_YEAR}
                  </option>
                ))}
              </Select>
              <p className="text-[13px] text-muted">KPI: davomatda “Keldi” belgilangan kunlar × kunlik summa</p>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Xodim</Th>
                  <Th right>Belgilangan</Th>
                  <Th right>KPI</Th>
                  <Th right>Bonus</Th>
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
                    <Td right>{r.fixed ? money(r.fixed) : "—"}</Td>
                    <Td right>
                      {r.rate?.kind === "KPI" ? (
                        <>
                          {money(r.kpi)}
                          <span className="block text-xs text-muted">{r.present} kun</span>
                        </>
                      ) : r.revenueKpi ? (
                        money(r.revenueKpi)
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td right>{r.bonus ? money(r.bonus) : "—"}</Td>
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
        </>
      )}
      {paying && <PaySalary key={paying.id} row={paying} onClose={() => setPaying(null)} />}
    </>
  );
}

function Rates() {
  const { db } = useDb();
  const [role, setRole] = useState<Role>("Ustoz");
  const current = rateFor(db, role, THIS_YEAR, THIS_MONTH);
  const [kind, setKind] = useState<SalaryRate["kind"]>(current?.kind ?? "KPI");
  const [amount, setAmount] = useState("");
  const staffCount = (r: Role) => db.users.filter((u) => u.role === r).length;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="self-start">
        <CardHeader title="Yangi narx" subtitle={`${MONTHS[THIS_MONTH - 1]} oyidan boshlab amal qiladi`} />
        <form
          className="flex flex-col gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!Number(amount)) return;
            setSalaryRate(role, kind, Number(amount));
            setAmount("");
          }}
        >
          <Field label="Lavozim">
            {(id) => (
              <Select
                id={id}
                value={role}
                onChange={(e) => {
                  const r = e.target.value as Role;
                  setRole(r);
                  setKind(rateFor(db, r, THIS_YEAR, THIS_MONTH)?.kind ?? "Belgilangan");
                }}
              >
                {PAYROLL_ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Turi" hint={kind === "KPI" ? "Xodim kelgan har bir kun uchun yoziladi" : "Har oy toʻliq yoziladi"}>
            {(id) => (
              <Select id={id} value={kind} onChange={(e) => setKind(e.target.value as SalaryRate["kind"])}>
                <option value="KPI">KPI (kuniga)</option>
                <option value="Belgilangan">Belgilangan (oyiga)</option>
              </Select>
            )}
          </Field>
          <Field label="Narx (soʻm)" hint={`Hozirgi: ${current ? money(current.amount) : "belgilanmagan"}`}>
            {(id) => <Input id={id} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />}
          </Field>
          <Button type="submit" disabled={!Number(amount)}>
            Barcha {role} uchun saqlash
          </Button>
        </form>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader title="Amaldagi narxlar" />
        <Table>
          <thead>
            <tr>
              <Th>Lavozim</Th>
              <Th>Turi</Th>
              <Th right>Narx</Th>
              <Th right>Xodimlar</Th>
              <Th>Amal qiladi</Th>
            </tr>
          </thead>
          <tbody>
            {PAYROLL_ROLES.map((r) => {
              const rate = rateFor(db, r, THIS_YEAR, THIS_MONTH);
              return (
                <tr key={r}>
                  <Td className="font-semibold">{r}</Td>
                  <Td>{rate ? <Badge tone={rate.kind === "KPI" ? "primary" : "neutral"}>{rate.kind}</Badge> : "—"}</Td>
                  <Td right className="font-semibold">
                    {rate ? money(rate.amount) : "—"}
                    {rate && <span className="ml-1 text-xs font-normal text-muted">{rate.kind === "KPI" ? "/ kun" : "/ oy"}</span>}
                  </Td>
                  <Td right>{staffCount(r)}</Td>
                  <Td className="text-muted">{rate ? `${MONTHS[rate.fromMonth - 1]} ${rate.fromYear} dan` : "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

function PaySalary({ row, onClose }: { row: Row; onClose: () => void }) {
  const { db } = useDb();
  const [amount, setAmount] = useState(String(row.balance));
  const [cashType, setCashType] = useState<CashType>("Cash");
  const [accountId, setAccountId] = useState("acc0");
  const [comment, setComment] = useState("");
  const accounts = db.accounts.filter((a) => a.cashType === cashType);
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];
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
            disabled={!Number(amount) || !account}
            onClick={() => {
              addSalaryPayment({ branchId: row.branchId, userId: row.userId, year: row.year, month: row.month, date: TODAY, amount: Number(amount), accountId: account.id, comment: comment || null });
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
        <Field label="Summa (soʻm)" className="sm:col-span-2">
          {(id) => <Input id={id} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />}
        </Field>
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
        <Field label="Hisob">
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
