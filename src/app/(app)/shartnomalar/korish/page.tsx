"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Phone, Plus } from "lucide-react";
import { useDb } from "@/lib/data/store";
import { paymentCashTypes } from "@/lib/data/permissions";
import { chargeRows, contractStatus, financeIndex, groupLabel, lookups, studentName } from "@/lib/data/calc";
import { CASH_LABEL } from "@/lib/data/types";
import { MONTHS, cn, date, money, phone } from "@/lib/format";
import { Badge, Card, CardHeader, CertificatePreview, Empty, LinkButton, Stat, Table, Tabs, Td, Th } from "@/components/ui";

export default function ContractPage() {
  const id = useSearchParams().get("id") ?? "";
  const { db, session } = useDb();
  const L = lookups(db);
  const c = db.contracts.find((x) => x.id === id);
  const [tab, setTab] = useState<"charges" | "payments" | "attendance" | "grades">("charges");
  if (!c) return <Empty title="Shartnoma topilmadi" />;

  const f = financeIndex(db).get(c.id) ?? { base: 0, discount: 0, final: 0, paid: 0, debt: 0, monthDebt: 0, monthlyPrice: 0 };
  const rows = chargeRows(db, c.id);
  const pays = db.payments.filter((p) => p.contractId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const att = db.attendance.filter((a) => a.contractId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const grs = db.grades.filter((g) => g.contractId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const st = contractStatus(c);
  const s = L.student.get(c.studentId)!;

  return (
    <>
      <Link href="/shartnomalar" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-text">
        <ArrowLeft size={16} aria-hidden="true" /> Shartnomalar
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">{studentName(L, c.studentId)}</h1>
            <Badge tone={st === "Faol" ? "success" : st === "Rejada" ? "info" : "neutral"}>{st}</Badge>
            {c.type === "Grant" && <Badge tone="accent">Grant</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            Shartnoma № {c.number} · {L.branch.get(c.branchId)?.name} · {groupLabel(L, c.groupId)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {paymentCashTypes(session.role).length > 0 && (
            <LinkButton href={`/tolovlar?yangi=1&shartnoma=${c.id}`}>
              <Plus size={16} aria-hidden="true" /> Toʻlov qabul qilish
            </LinkButton>
          )}
          <LinkButton href="#" variant="secondary">
            <FileText size={16} aria-hidden="true" /> Shartnoma PDF
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Oylik narx" value={money(f.monthlyPrice)} hint={f.discount ? `Chegirma: ${money(f.discount)}` : "Chegirmasiz"} />
        <Stat label="Hisoblangan" value={money(f.final)} hint={`${rows.length} oy`} />
        <Stat label="Toʻlangan" value={money(f.paid)} hint={`${pays.length} ta toʻlov`} />
        <Stat label="Qarz" value={<span className={f.debt > 0 ? "text-danger" : "text-success"}>{money(f.debt)}</span>} hint={f.debt > 0 ? "Toʻlanmagan" : "Qarzi yoʻq"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="border-b border-border p-4">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "charges", label: "Oylik hisoblanmalar", count: rows.length },
                { value: "payments", label: "Toʻlovlar", count: pays.length },
                { value: "attendance", label: "Davomat", count: att.length },
                { value: "grades", label: "Baholash", count: grs.length },
              ]}
            />
          </div>
          {tab === "charges" && (
            <Table>
              <thead>
                <tr>
                  <Th>Oy</Th>
                  <Th right>Asl narx</Th>
                  <Th right>Chegirma</Th>
                  <Th right>Yakuniy</Th>
                  <Th right>Toʻlandi</Th>
                  <Th right>Oldingi qarz</Th>
                  <Th right>Oy yakunida</Th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.id}>
                    <Td className="font-semibold">
                      {MONTHS[r.month - 1]} {r.year}
                    </Td>
                    <Td right>{money(r.basePrice)}</Td>
                    <Td right>
                      {r.discount ? (
                        <span className="inline-flex items-center gap-2">
                          {money(r.discount)}
                          {r.discountStatus === "Tasdiqlashga" && <Badge tone="warning">Kutmoqda</Badge>}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td right>{money(r.final)}</Td>
                    <Td right>{money(r.paid)}</Td>
                    <Td right className="text-muted">
                      {money(r.prevDebt)}
                    </Td>
                    <Td right className={cn("font-bold", r.endDebt > 0 ? "text-danger" : "text-success")}>
                      {money(r.endDebt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {tab === "payments" &&
            (pays.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Sana</Th>
                    <Th right>Summa</Th>
                    <Th>Pul shakli</Th>
                    <Th>Hisob</Th>
                    <Th>Qabul qildi</Th>
                  </tr>
                </thead>
                <tbody>
                  {pays.map((p) => (
                    <tr key={p.id}>
                      <Td>{date(p.date)}</Td>
                      <Td right className="font-semibold">
                        {money(p.amount)}
                      </Td>
                      <Td>
                        {CASH_LABEL[p.cashType]} {p.nonCashStatus === "Tasdiqlashga" && <Badge tone="warning">Tasdiqlanmagan</Badge>}
                      </Td>
                      <Td>{L.account.get(p.accountId)?.name}</Td>
                      <Td className="text-muted">{L.user.get(p.accountantId)?.fullName}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Empty title="Toʻlov yoʻq" />
            ))}
          {tab === "attendance" && (
            <div className="p-5">
              <p className="mb-4 text-sm text-muted">
                Oxirgi {att.length} dars kunida {att.filter((a) => a.status === "1").length} marta keldi, {att.filter((a) => a.status === "X").length} marta kelmadi.
              </p>
              <ul className="flex flex-wrap gap-1.5" aria-label="Davomat kunlari">
                {[...att].reverse().map((a) => (
                  <li
                    key={a.id}
                    title={`${date(a.date)}: ${a.status === "1" ? "Keldi" : "Kelmadi"}`}
                    className={cn(
                      "num inline-flex size-9 items-center justify-center rounded-lg text-xs font-bold",
                      a.status === "1" ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                    )}
                  >
                    {a.date.slice(8)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "grades" && (
            <Table>
              <thead>
                <tr>
                  <Th>Sana</Th>
                  <Th>Sheʼr</Th>
                  <Th>Odat</Th>
                </tr>
              </thead>
              <tbody>
                {grs.map((g) => (
                  <tr key={g.id}>
                    <Td>{date(g.date)}</Td>
                    {[g.poem, g.habit].map((m, i) => (
                      <Td key={i}>{m ? <Badge tone={m === "Topshirdi" ? "success" : m === "Kelmadi" ? "neutral" : "danger"}>{m}</Badge> : "—"}</Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Maʼlumotlar" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 p-5 text-sm">
            <dt className="text-muted">Toʻliq ism</dt>
            <dd className="font-semibold">
              {s.firstName} {s.lastName} {s.parentName}
            </dd>
            <dt className="text-muted">Tugʻilgan</dt>
            <dd className="font-semibold">{date(s.birthDate)}</dd>
            <dt className="text-muted">Boshlangan</dt>
            <dd className="font-semibold">{date(c.startDate)}</dd>
            <dt className="text-muted">Tugagan</dt>
            <dd className="font-semibold">{date(c.endDate)}</dd>
            {c.stopReason && (
              <>
                <dt className="text-muted">Sabab</dt>
                <dd className="font-semibold">{c.stopReason}</dd>
              </>
            )}
            <dt className="text-muted">Manzil</dt>
            <dd className="font-semibold">{c.address}</dd>
            <dt className="text-muted">Guvohnoma</dt>
            <dd>{c.hasCertificate ? <Badge tone="success">Yuklangan</Badge> : <Badge tone="warning">Yoʻq</Badge>}</dd>
          </dl>
          {c.certificate && (
            <div className="border-t border-border p-5">
              <p className="mb-2 text-sm font-bold">Tugʻilganlik guvohnomasi</p>
              <CertificatePreview file={c.certificate} />
            </div>
          )}
          <div className="flex flex-col gap-2 border-t border-border p-5">
            {[
              [c.fatherName, "ota", c.fatherPhone],
              [c.motherName, "ona", c.motherPhone],
            ]
              .filter(([, , p]) => p)
              .map(([n, who, p]) => (
                <a key={who} href={`tel:+998${p}`} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-2">
                  <Phone size={18} className="text-primary" aria-hidden="true" />
                  <span className="text-sm">
                    <span className="block font-semibold">
                      {n} ({who})
                    </span>
                    <span className="num text-muted">{phone(p)}</span>
                  </span>
                </a>
              ))}
          </div>
        </Card>
      </div>
    </>
  );
}
