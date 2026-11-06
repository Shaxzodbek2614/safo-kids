"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { setTelegramReport, useDb } from "@/lib/data/store";
import { gradePeriods, gradeStats, lookups, THIS_YEAR, TODAY } from "@/lib/data/calc";
import { MONTHS, money, phone, percent } from "@/lib/format";
import { Avatar, Badge, Button, Card, Field, Input, PageHeader, Progress, Select, Table, Tabs, Td, Th } from "@/components/ui";

type Tab = "branches" | "users" | "rooms" | "prices" | "days" | "discounts" | "categories" | "sources" | "telegram";

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
const RECIPIENTS = ["Metodist", "Bosh menejer", "Guruh ustozi"];

export default function SettingsPage() {
  const { db } = useDb();
  const L = lookups(db);
  const [tab, setTab] = useState<Tab>("branches");
  const [branchId, setBranchId] = useState(db.branches[0].id);

  const head = (title: string) => (
    <div className="flex items-center justify-between gap-3 border-b border-border p-4">
      <h2 className="font-bold">{title}</h2>
      <Button size="sm" variant="secondary">
        <Plus size={15} aria-hidden="true" /> Qoʻshish
      </Button>
    </div>
  );

  const branchFilter = (
    <div className="flex flex-wrap gap-2 border-b border-border p-4">
      {db.branches.map((b) => (
        <button
          key={b.id}
          type="button"
          aria-pressed={branchId === b.id}
          onClick={() => setBranchId(b.id)}
          className={`h-9 rounded-lg border px-3 text-sm font-semibold ${branchId === b.id ? "border-primary bg-primary-soft text-primary-ink" : "border-border-strong text-muted"}`}
        >
          {b.name}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="Sozlamalar" subtitle="Maʼlumotnomalar va foydalanuvchilar" />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: "branches", label: "Filiallar", count: db.branches.length },
          { value: "users", label: "Foydalanuvchilar", count: db.users.length },
          { value: "rooms", label: "Xonalar", count: db.rooms.length },
          { value: "prices", label: "Oylik narx" },
          { value: "days", label: "Dars kunlari" },
          { value: "discounts", label: "Chegirma turlari", count: db.discountTypes.length },
          { value: "categories", label: "Xarajat kategoriyalari", count: db.expenseCategories.length },
          { value: "sources", label: "Lid manbalari", count: db.leadSources.length },
          { value: "telegram", label: "Telegram hisobot" },
        ]}
      />
      <Card>
        {tab === "telegram" && <TelegramReport />}
        {tab === "branches" && (
          <>
            {head("Filiallar")}
            <Table>
              <thead>
                <tr>
                  <Th>Nomi</Th>
                  <Th>Kassasi</Th>
                  <Th right>Guruhlar</Th>
                  <Th right>Xonalar</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {db.branches.map((b) => (
                  <tr key={b.id}>
                    <Td className="font-semibold">{b.name}</Td>
                    <Td>{L.account.get(b.accountId)?.name}</Td>
                    <Td right>{db.groups.filter((g) => g.branchId === b.id).length}</Td>
                    <Td right>{db.rooms.filter((r) => r.branchId === b.id).length}</Td>
                    <Td>
                      <Badge tone="success">{b.status}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
        {tab === "users" && (
          <>
            {head("Foydalanuvchilar")}
            <Table>
              <thead>
                <tr>
                  <Th>Ism</Th>
                  <Th>Lavozim</Th>
                  <Th>Filial</Th>
                  <Th>Telefon</Th>
                  <Th>Email</Th>
                  <Th right>KPI</Th>
                </tr>
              </thead>
              <tbody>
                {db.users.map((u) => (
                  <tr key={u.id}>
                    <Td>
                      <span className="flex items-center gap-3">
                        <Avatar name={u.fullName} className="size-8 text-xs" />
                        <span className="font-semibold">{u.fullName}</span>
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={u.role === "Admin" ? "danger" : u.role === "Bosh menejer" ? "accent" : u.role.startsWith("Admin") ? "info" : "neutral"}>{u.role}</Badge>
                    </Td>
                    <Td>{u.branchIds.length ? u.branchIds.map((b) => L.branch.get(b)?.name).join(", ") : "Barchasi"}</Td>
                    <Td className="num">{phone(u.phone)}</Td>
                    <Td className="text-muted">{u.email ?? "Tizimga kirmaydi"}</Td>
                    <Td right>{u.kpi ? percent(u.kpi) : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
        {tab === "rooms" && (
          <>
            {head("Xonalar")}
            <Table>
              <thead>
                <tr>
                  <Th>Filial</Th>
                  <Th>Xona</Th>
                  <Th right>Sigʻimi</Th>
                  <Th>Biriktirilgan guruh</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {db.rooms.map((r) => (
                  <tr key={r.id}>
                    <Td>{L.branch.get(r.branchId)?.name}</Td>
                    <Td className="font-semibold">{r.name}</Td>
                    <Td right>{r.capacity}</Td>
                    <Td>{db.groups.find((g) => g.roomId === r.id)?.name ?? <span className="text-muted">Boʻsh</span>}</Td>
                    <Td>
                      <Badge tone="success">{r.status}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
        {(tab === "prices" || tab === "days") && (
          <>
            {head(tab === "prices" ? `Oylik narx, ${THIS_YEAR}` : `Oydagi dars kunlari, ${THIS_YEAR}`)}
            {branchFilter}
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
              {MONTHS.map((m, i) => {
                const v =
                  tab === "prices"
                    ? db.coursePrices.find((p) => p.branchId === branchId && p.year === THIS_YEAR && p.month === i + 1)?.price
                    : db.lessonDays.find((p) => p.branchId === branchId && p.year === THIS_YEAR && p.month === i + 1)?.days;
                return (
                  <div key={m} className="rounded-xl border border-border p-3">
                    <p className="text-xs font-semibold text-muted">{m}</p>
                    <p className="num mt-1 font-extrabold">{v === undefined ? "—" : tab === "prices" ? money(v) : `${v} kun`}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {tab === "discounts" && (
          <>
            {head("Chegirma turlari")}
            <Table>
              <thead>
                <tr>
                  <Th>Nomi</Th>
                  <Th right>Eng koʻp miqdori</Th>
                </tr>
              </thead>
              <tbody>
                {db.discountTypes.map((d) => (
                  <tr key={d.id}>
                    <Td className="font-semibold">{d.name}</Td>
                    <Td right>{money(d.maxAmount)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
        {tab === "categories" && (
          <>
            {head("Xarajat kategoriyalari")}
            <Table>
              <thead>
                <tr>
                  <Th>Nomi</Th>
                  <Th>Turi</Th>
                </tr>
              </thead>
              <tbody>
                {db.expenseCategories.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-semibold">{c.name}</Td>
                    <Td>
                      <Badge tone={c.kind === "Xarajat" ? "neutral" : "info"}>{c.kind}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
        {tab === "sources" && (
          <>
            {head("Lid manbalari")}
            <Table>
              <thead>
                <tr>
                  <Th>Nomi</Th>
                  <Th right>Lidlar</Th>
                  <Th right>Shartnomaga aylangan</Th>
                </tr>
              </thead>
              <tbody>
                {db.leadSources.map((s) => {
                  const ls = db.leads.filter((l) => l.sourceId === s.id);
                  const won = ls.filter((l) => l.status.startsWith("5")).length;
                  return (
                    <tr key={s.id}>
                      <Td className="font-semibold">{s.name}</Td>
                      <Td right>{ls.length}</Td>
                      <Td right>
                        {won} ({percent(ls.length ? won / ls.length : 0)})
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
      </Card>
    </>
  );
}

function TelegramReport() {
  const { db } = useDb();
  const t = db.telegramReport;
  const g = db.groups[1];
  const p = gradePeriods(TODAY, "week");
  const bars = [
    { label: "Odat, bu hafta", s: gradeStats(db, g.id, "habit", p.cur) },
    { label: "Odat, oʻtgan hafta", s: gradeStats(db, g.id, "habit", p.prev) },
    { label: "Sheʼr, bu hafta", s: gradeStats(db, g.id, "poem", p.cur) },
    { label: "Sheʼr, oʻtgan hafta", s: gradeStats(db, g.id, "poem", p.prev) },
  ];
  return (
    <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-bold">Haftalik baholash hisoboti</h2>
          <p className="mt-1 text-sm text-muted">Har bir guruh natijasi diagramma koʻrinishida Telegram bot orqali yuboriladi.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hafta kuni">
            {(id) => (
              <Select id={id} value={t.weekday} onChange={(e) => setTelegramReport({ weekday: Number(e.target.value) })}>
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i + 1}>
                    {d}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Vaqt">{(id) => <Input id={id} type="time" value={t.time} onChange={(e) => setTelegramReport({ time: e.target.value })} />}</Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold">Kimga yuboriladi</legend>
          <div className="flex flex-wrap gap-2">
            {RECIPIENTS.map((r) => {
              const on = t.recipients.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTelegramReport({ recipients: on ? t.recipients.filter((x) => x !== r) : [...t.recipients, r] })}
                  className={`h-10 rounded-lg border px-3 text-sm font-semibold ${on ? "border-primary bg-primary-soft text-primary-ink" : "border-border-strong text-muted"}`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </fieldset>
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-[#8a5a00]">Demo: yuborish bot va server ulangandan keyin ishlaydi. Oʻngda xabar namunasi.</p>
      </div>

      <div className="rounded-2xl bg-[#e7ebf0] p-4">
        <p className="mb-2 text-center text-xs font-semibold text-muted">
          Namuna · {WEEKDAYS[t.weekday - 1]}, {t.time}
        </p>
        <div className="rounded-xl bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold">{g.name} guruhi — haftalik natija</p>
          <ul className="mt-3 flex flex-col gap-3">
            {bars.map((b) => (
              <li key={b.label} className="text-[13px]">
                <div className="mb-1 flex justify-between gap-3">
                  <span>{b.label}</span>
                  <span className="num font-bold">{b.s.rate === null ? "—" : percent(b.s.rate)}</span>
                </div>
                <Progress value={b.s.rate ?? 0} tone={b.label.includes("bu hafta") ? "primary" : "warning"} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
