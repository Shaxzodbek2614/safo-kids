"use client";

import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { addCashFlow, addTransfer, useDb } from "@/lib/data/store";
import { canSeeExternalFlow, canSeeInternalFlow } from "@/lib/data/permissions";
import { creditorBalance, lookups, seesAllBranches, TODAY } from "@/lib/data/calc";
import { cn, date, money } from "@/lib/format";
import { Badge, Button, Card, CardHeader, Empty, Field, Input, Modal, PageHeader, Select, Table, Tabs, Td, Textarea, Th } from "@/components/ui";

export default function CashFlowPage() {
  const { db, session } = useDb();
  const L = lookups(db);
  const top = seesAllBranches(session);
  const [tab, setTab] = useState<"internal" | "external">("internal");
  const [adding, setAdding] = useState(false);

  const mine = (id: string) => top || (L.account.get(id)?.responsibles.includes(session.userId) ?? false);
  const transfers = db.transfers.filter((t) => mine(t.fromAccountId) || mine(t.toAccountId)).sort((a, b) => b.date.localeCompare(a.date));
  const showExternal = canSeeExternalFlow(session.role);
  if (!canSeeInternalFlow(session.role)) return <Empty title="Bu boʻlim sizga koʻrinmaydi" />;

  return (
    <>
      <PageHeader
        title="Pul oqimi"
        subtitle="Kassalar orasidagi oʻtkazmalar va tashqi qarzlar"
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden="true" /> {tab === "internal" || !showExternal ? "Oʻtkazma" : "Yozuv qoʻshish"}
          </Button>
        }
      />
      {showExternal && (
        <Tabs
          className="mb-4"
          value={tab}
          onChange={setTab}
          items={[
            { value: "internal", label: "Ichki pul oqimi", count: transfers.length },
            { value: "external", label: "Tashqi pul oqimi", count: db.cashFlows.length },
          ]}
        />
      )}

      {tab === "internal" || !showExternal ? (
        <Card>
          <Table>
            <thead>
              <tr>
                <Th>Sana</Th>
                <Th>Yoʻnalish</Th>
                <Th right>Summa</Th>
                <Th>Status</Th>
                <Th>Yubordi</Th>
                <Th>Izoh</Th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-surface-2">
                  <Td className="text-muted">{date(t.date)}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-2 font-semibold">
                      {L.account.get(t.fromAccountId)?.name}
                      <ArrowRight size={14} className="text-subtle" aria-hidden="true" />
                      {L.account.get(t.toAccountId)?.name}
                    </span>
                  </Td>
                  <Td right className="font-semibold">
                    {money(t.amount)}
                  </Td>
                  <Td>
                    <Badge tone={t.status === "Tasdiqlandi" ? "success" : "warning"}>{t.status}</Badge>
                  </Td>
                  <Td className="text-muted">{L.user.get(t.createdBy)?.fullName}</Td>
                  <Td className="text-muted">{t.comment ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="self-start">
            <CardHeader title="Qarz beruvchilar" subtitle="Manfiy — bizning qarzimiz" />
            <ul className="divide-y divide-border">
              {db.creditors.map((c) => {
                const b = creditorBalance(db, c.id);
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <span className="font-semibold">{c.name}</span>
                    <span className={cn("num font-bold", b < 0 ? "text-danger" : "text-success")}>{money(b)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader title="Qarz olish va qaytarish" />
            <Table>
              <thead>
                <tr>
                  <Th>Sana</Th>
                  <Th>Qarz beruvchi</Th>
                  <Th>Amal</Th>
                  <Th right>Summa</Th>
                  <Th>Izoh</Th>
                </tr>
              </thead>
              <tbody>
                {[...db.cashFlows]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((f) => (
                    <tr key={f.id}>
                      <Td className="text-muted">{date(f.date)}</Td>
                      <Td className="font-semibold">{L.creditor.get(f.creditorId)?.name}</Td>
                      <Td>
                        <Badge tone={f.amount < 0 ? "info" : "primary"}>{f.amount < 0 ? "Qarz olindi" : "Qaytarildi"}</Badge>
                      </Td>
                      <Td right className="font-semibold">
                        {money(Math.abs(f.amount))}
                      </Td>
                      <Td className="text-muted">{f.comment ?? "—"}</Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      {tab === "internal" || !showExternal ? <NewTransfer open={adding} onClose={() => setAdding(false)} /> : <NewCashFlow open={adding} onClose={() => setAdding(false)} />}
    </>
  );
}

function NewTransfer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, session } = useDb();
  const top = seesAllBranches(session);
  const from = db.accounts.filter((a) => a.cashType === "Cash" && (top || a.responsibles.includes(session.userId)));
  const [fromId, setFromId] = useState(from[0]?.id ?? "");
  const to = db.accounts.filter((a) => a.id !== fromId);
  const [toId, setToId] = useState("acc0");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kassadan kassaga oʻtkazma"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={!Number(amount) || !fromId || fromId === toId}
            onClick={() => {
              addTransfer({ date: TODAY, cashType: "Cash", fromAccountId: fromId, toAccountId: toId, amount: Number(amount), comment: comment || null, createdBy: session.userId });
              setAmount("");
              setComment("");
              onClose();
            }}
          >
            Yuborish
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Yuboruvchi hisob">
          {(id) => (
            <Select id={id} value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {from.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Qabul qiluvchi hisob">
          {(id) => (
            <Select id={id} value={toId} onChange={(e) => setToId(e.target.value)}>
              {to.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Summa (soʻm)" className="sm:col-span-2">
          {(id) => <Input id={id} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />}
        </Field>
        <Field label="Izoh" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={comment} onChange={(e) => setComment(e.target.value)} />}
        </Field>
      </div>
      <p className="mt-4 rounded-lg bg-info-soft px-3 py-2 text-[13px] text-info">Pul qabul qiluvchi hisob masʼuli tasdiqlagandan keyin qoldiqqa tushadi.</p>
    </Modal>
  );
}

function NewCashFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db } = useDb();
  const [creditorId, setCreditorId] = useState(db.creditors[0].id);
  const [kind, setKind] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tashqi pul oqimi"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={!Number(amount)}
            onClick={() => {
              addCashFlow({ date: TODAY, creditorId, amount: kind === "in" ? -Number(amount) : Number(amount), accountId: "acc0", comment: comment || null });
              setAmount("");
              onClose();
            }}
          >
            Saqlash
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Qarz beruvchi">
          {(id) => (
            <Select id={id} value={creditorId} onChange={(e) => setCreditorId(e.target.value)}>
              {db.creditors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Amal">
          {(id) => (
            <Select id={id} value={kind} onChange={(e) => setKind(e.target.value as "in")}>
              <option value="in">Qarz olindi (kassaga kiradi)</option>
              <option value="out">Qarz qaytarildi (kassadan chiqadi)</option>
            </Select>
          )}
        </Field>
        <Field label="Summa (soʻm)" className="sm:col-span-2">
          {(id) => <Input id={id} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />}
        </Field>
        <Field label="Izoh" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={comment} onChange={(e) => setComment(e.target.value)} />}
        </Field>
      </div>
    </Modal>
  );
}
