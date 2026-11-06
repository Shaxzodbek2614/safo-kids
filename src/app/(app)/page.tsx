"use client";

import Link from "next/link";
import { ArrowRight, Baby, CalendarCheck, HandCoins, TrendingUp } from "lucide-react";
import { useDb } from "@/lib/data/store";
import { canSeeInternalFlow, paymentCashTypes } from "@/lib/data/permissions";
import {
  branchScope,
  contractStatus,
  financeIndex,
  groupFill,
  lookups,
  profit,
  studentName,
  THIS_MONTH,
  THIS_YEAR,
  TODAY,
  visibleGroups,
} from "@/lib/data/calc";
import { MONTHS, cn, date, money, moneyShort, percent } from "@/lib/format";
import { Badge, Card, CardHeader, LinkButton, PageHeader, Progress, Stat, Table, Td, Th } from "@/components/ui";

export default function DashboardPage() {
  const { db, session } = useDb();
  if (session.role === "Ustoz") return <TeacherHome />;

  const scope = branchScope(db, session);
  const L = lookups(db);
  const fin = financeIndex(db);
  const contracts = db.contracts.filter((c) => scope.includes(c.branchId));
  const active = contracts.filter((c) => contractStatus(c) === "Faol");
  const monthDebt = active.reduce((s, c) => s + Math.max(0, fin.get(c.id)?.monthDebt ?? 0), 0);
  const totalDebt = contracts.reduce((s, c) => s + Math.max(0, fin.get(c.id)?.debt ?? 0), 0);
  const thisMonth = profit(db, scope, THIS_YEAR, THIS_MONTH);
  const lastMonth = profit(db, scope, THIS_YEAR, THIS_MONTH - 1);

  const lastDay = [...new Set(db.attendance.map((a) => a.date))].sort().at(-1)!;
  const att = db.attendance.filter((a) => a.date === lastDay && scope.includes(L.group.get(a.groupId)!.branchId));
  const attRate = att.length ? att.filter((a) => a.status === "1").length / att.length : 0;

  const pending =
    db.payments.filter((p) => scope.includes(p.branchId) && (p.discountStatus === "Tasdiqlashga" || p.nonCashStatus === "Tasdiqlashga")).length +
    db.charges.filter((c) => scope.includes(c.branchId) && c.discountStatus === "Tasdiqlashga").length +
    (canSeeInternalFlow(session.role) ? db.transfers.filter((t) => t.status === "Tasdiqlashga").length : 0);

  const newLeads = db.leads
    .filter((l) => scope.includes(l.branchId) && !l.status.startsWith("5"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <>
      <PageHeader
        title="Bosh sahifa"
        subtitle={`${MONTHS[THIS_MONTH - 1]} ${THIS_YEAR} holati boʻyicha umumiy koʻrsatkichlar`}
        actions={
          <>
            <LinkButton href="/lidlar" variant="secondary">
              Yangi lid
            </LinkButton>
            {paymentCashTypes(session.role).length > 0 && <LinkButton href="/tolovlar?yangi=1">Toʻlov qabul qilish</LinkButton>}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Faol tarbiyalanuvchilar" value={active.length} hint={`${contracts.filter((c) => contractStatus(c) === "Rejada").length} ta rejada`} tone="primary" icon={<Baby size={18} aria-hidden="true" />} />
        <Stat
          label={`${MONTHS[THIS_MONTH - 1]} tushumi`}
          value={moneyShort(thisMonth.income)}
          hint={`Oʻtgan oy: ${moneyShort(lastMonth.income)}`}
          tone="success"
          icon={<TrendingUp size={18} aria-hidden="true" />}
        />
        <Stat label="Shu oy qarzdorlik" value={moneyShort(monthDebt)} hint={`Umumiy qarz: ${moneyShort(totalDebt)}`} tone="danger" icon={<HandCoins size={18} aria-hidden="true" />} />
        <Stat label="Davomat" value={percent(attRate)} hint={`${date(lastDay)} · ${att.filter((a) => a.status === "X").length} ta kelmagan`} tone="info" icon={<CalendarCheck size={18} aria-hidden="true" />} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Filiallar kesimida" subtitle="Faol bolalar, guruhlar toʻlishi, shu oy tushumi va qarzdorlik" />
        <Table>
          <thead>
            <tr>
              <Th>Filial</Th>
              <Th right>Faol bolalar</Th>
              <Th>Toʻlish</Th>
              <Th right>Shu oy tushum</Th>
              <Th right>Shu oy qarz</Th>
              <Th right>Umumiy qarz</Th>
            </tr>
          </thead>
          <tbody>
            {db.branches
              .filter((b) => scope.includes(b.id))
              .map((b) => {
                const bc = db.contracts.filter((c) => c.branchId === b.id);
                const ba = bc.filter((c) => contractStatus(c) === "Faol");
                const gs = db.groups.filter((g) => g.branchId === b.id).map((g) => groupFill(db, g));
                const cap = gs.reduce((s, g) => s + g.capacity, 0);
                const fill = cap ? ba.length / cap : 0;
                return (
                  <tr key={b.id} className="hover:bg-surface-2">
                    <Td className="font-semibold">{b.name}</Td>
                    <Td right>{ba.length}</Td>
                    <Td className="min-w-40">
                      <div className="flex items-center gap-3">
                        <Progress value={fill} tone={fill > 0.75 ? "success" : fill > 0.5 ? "primary" : "warning"} />
                        <span className="num w-10 text-right text-xs font-semibold text-muted">{percent(fill)}</span>
                      </div>
                    </Td>
                    <Td right>{money(profit(db, [b.id], THIS_YEAR, THIS_MONTH).income)}</Td>
                    <Td right className="text-danger">{money(ba.reduce((s, c) => s + Math.max(0, fin.get(c.id)?.monthDebt ?? 0), 0))}</Td>
                    <Td right>{money(bc.reduce((s, c) => s + Math.max(0, fin.get(c.id)?.debt ?? 0), 0))}</Td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="self-start">
          <CardHeader title="Tasdiqlash kutmoqda" action={pending > 0 && <Badge tone="warning">{pending} ta</Badge>} />
          <div className="flex flex-col gap-3 p-5">
            <p className="text-sm text-muted">Chegirmalar, naqdsiz toʻlovlar va kassalar orasidagi oʻtkazmalar tasdiqni kutyapti.</p>
            {(session.role === "Admin" || session.role === "Bosh menejer") && (
              <LinkButton href="/tasdiqlashlar" variant="secondary" className="self-start">
                Koʻrib chiqish <ArrowRight size={16} aria-hidden="true" />
              </LinkButton>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Yangi lidlar" />
          <ul className="flex flex-col gap-3 p-5">
            {newLeads.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{studentName(L, l.studentId)}</span>
                  <span className="block text-xs text-muted">
                    {L.branch.get(l.branchId)?.name} · {date(l.createdAt)}
                  </span>
                </span>
                <Badge tone={l.status.startsWith("3") ? "info" : l.status.startsWith("6") || l.status.startsWith("7") ? "neutral" : "accent"}>{l.status.slice(3)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function TeacherHome() {
  const { db, session } = useDb();
  const me = db.users.find((u) => u.id === session.userId)!;
  const groups = visibleGroups(db, session);
  return (
    <>
      <PageHeader title={`Xush kelibsiz, ${me.fullName}`} subtitle="Bugungi guruhlaringiz" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((g) => {
          const f = groupFill(db, g);
          const marked = db.attendance.filter((a) => a.groupId === g.id && a.date === TODAY).length;
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{g.name}</h2>
                  <p className="text-sm text-muted">{f.active} ta tarbiyalanuvchi</p>
                </div>
                <Badge tone={marked >= f.active ? "success" : "warning"}>{marked >= f.active ? "Davomat olingan" : "Davomat olinmagan"}</Badge>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton href={`/davomat?guruh=${g.id}`} size="lg" className={cn("flex-1")}>
                  Davomat olish
                </LinkButton>
                <LinkButton href={`/baholash?guruh=${g.id}`} size="lg" variant="secondary" className="flex-1">
                  Baholash
                </LinkButton>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">
        Guruhlar roʻyxati: <Link className="font-semibold text-primary hover:underline" href="/guruhlar">Guruhlar</Link>
      </p>
    </>
  );
}
