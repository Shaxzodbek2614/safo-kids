"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { markGrade, useDb } from "@/lib/data/store";
import { branchScope, gradePeriods, gradeStats, groupRoster, lookups, SCHOOL_DAYS_DESC, studentName, visibleGroups, type GradePeriod } from "@/lib/data/calc";
import type { GradeMark } from "@/lib/data/types";
import { cn, percent } from "@/lib/format";
import { Card, CardHeader, Empty, PageHeader, Table, Tabs, Td, Th } from "@/components/ui";
import { SessionPicker } from "@/components/session-picker";

const MARKS: { m: GradeMark; short: string; on: string }[] = [
  { m: "Topshirdi", short: "✓", on: "border-success bg-success text-white" },
  { m: "Topshirolmadi", short: "✗", on: "border-danger bg-danger text-white" },
  { m: "Kelmadi", short: "—", on: "border-subtle bg-subtle text-white" },
];

function GroupResults({ groupId, groupName, day }: { groupId: string; groupName: string; day: string }) {
  const { db } = useDb();
  const [field, setField] = useState<"habit" | "poem">("habit");
  const [period, setPeriod] = useState<GradePeriod>("week");
  const p = gradePeriods(day, period);
  const cur = gradeStats(db, groupId, field, p.cur);
  const prev = gradeStats(db, groupId, field, p.prev);
  const delta = cur.rate !== null && prev.rate !== null ? Math.round(cur.rate * 100) - Math.round(prev.rate * 100) : null;
  const Arrow = delta === null || delta === 0 ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="mb-6">
      <CardHeader
        title={`${groupName} — natijalar`}
        subtitle={period === "week" ? "Tanlangan sana haftasi" : "Tanlangan sana oyi"}
        action={
          <div className="flex flex-wrap gap-2">
            <Tabs
              value={field}
              onChange={setField}
              items={[
                { value: "habit", label: "Odat" },
                { value: "poem", label: "Sheʼr" },
              ]}
            />
            <Tabs
              value={period}
              onChange={setPeriod}
              items={[
                { value: "week", label: "Hafta" },
                { value: "month", label: "Oy" },
              ]}
            />
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <div className="flex items-end gap-6 sm:gap-8">
          <div>
            <p className="num text-5xl font-extrabold leading-none text-success">{cur.ok}</p>
            <p className="mt-2 text-sm font-semibold text-success">topshirdi</p>
          </div>
          <div>
            <p className="num text-2xl font-extrabold leading-none text-danger">{cur.no}</p>
            <p className="mt-2 text-[13px] font-semibold text-danger">topshira olmadi</p>
          </div>
          <div>
            <p className="num text-2xl font-bold leading-none text-muted">{cur.absent}</p>
            <p className="mt-2 text-[13px] font-semibold text-muted">kelmadi</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-2 p-4">
          <div>
            <p className="text-xs font-semibold text-muted">{p.prevLabel}</p>
            <p className="num text-xl font-bold text-muted">{prev.rate === null ? "—" : percent(prev.rate)}</p>
            <p className="num text-xs text-muted">
              {prev.ok} / {prev.ok + prev.no} ta
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">{p.curLabel}</p>
            <p className="num text-3xl font-extrabold">{cur.rate === null ? "—" : percent(cur.rate)}</p>
            <p className="num text-xs text-muted">
              {cur.ok} / {cur.ok + cur.no} ta
            </p>
          </div>
          <p className={cn("flex items-center gap-1 text-sm font-bold", delta === null || delta === 0 ? "text-muted" : delta > 0 ? "text-success" : "text-danger")}>
            <Arrow size={18} aria-hidden="true" />
            {delta === null ? "Maʼlumot yoʻq" : delta === 0 ? "Oʻzgarmadi" : `${Math.abs(delta)}% ${delta > 0 ? "oʻsish" : "pasayish"}`}
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function GradesPage() {
  const sp = Object.fromEntries(useSearchParams());
  const { db, session } = useDb();
  const L = lookups(db);
  const groups = visibleGroups(db, session);
  const scope = branchScope(db, session);
  const [groupId, setGroupId] = useState(typeof sp.guruh === "string" ? sp.guruh : groups[0]?.id ?? "");
  const [day, setDay] = useState(SCHOOL_DAYS_DESC[0]);
  const g = groups.find((x) => x.id === groupId) ?? groups[0];
  if (!g) return <Empty title="Sizga biriktirilgan guruh yoʻq" />;

  const roster = groupRoster(db, g.id, day).sort((a, b) => studentName(L, a.studentId).localeCompare(studentName(L, b.studentId)));
  const byContract = new Map(db.grades.filter((x) => x.groupId === g.id && x.date === day).map((x) => [x.contractId, x]));

  const stats = db.branches
    .filter((b) => scope.includes(b.id))
    .map((b) => {
      const gs = db.grades.filter((x) => L.group.get(x.groupId)?.branchId === b.id);
      const c = (f: "poem" | "habit", m: GradeMark) => gs.filter((x) => x[f] === m).length;
      return { b, poemOk: c("poem", "Topshirdi"), poemNo: c("poem", "Topshirolmadi"), habitOk: c("habit", "Topshirdi"), habitNo: c("habit", "Topshirolmadi"), absent: c("habit", "Kelmadi") };
    });

  const Toggle = ({ contractId, field, current }: { contractId: string; field: "poem" | "habit"; current: GradeMark | null | undefined }) => (
    <div className="flex gap-1.5" role="group" aria-label={field === "poem" ? "Sheʼr" : "Odat"}>
      {MARKS.map(({ m, short, on }) => (
        <button
          key={m}
          type="button"
          title={m}
          aria-label={m}
          aria-pressed={current === m}
          onClick={() => markGrade(g.id, contractId, day, field, m)}
          className={cn("inline-flex size-10 items-center justify-center rounded-lg border text-base font-bold transition-colors", current === m ? on : "border-border-strong text-muted hover:bg-surface-2")}
        >
          {short}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader title="Baholash" subtitle="Sheʼr va odat topshiriqlari: ✓ topshirdi, ✗ topshirolmadi, — kelmadi" />
      <Card className="mb-6 p-4 sm:p-5">
        <SessionPicker groupId={g.id} day={day} onGroup={setGroupId} onDay={setDay} />
      </Card>
      <GroupResults groupId={g.id} groupName={g.name} day={day} />
      <Card className="mb-6">
        <Table>
          <thead>
            <tr>
              <Th>Tarbiyalanuvchi</Th>
              <Th>Sheʼr</Th>
              <Th>Odat</Th>
            </tr>
          </thead>
          <tbody>
            {roster.map((c) => {
              const gr = byContract.get(c.id);
              return (
                <tr key={c.id}>
                  <Td className="font-semibold">{studentName(L, c.studentId)}</Td>
                  <Td>
                    <Toggle contractId={c.id} field="poem" current={gr?.poem} />
                  </Td>
                  <Td>
                    <Toggle contractId={c.id} field="habit" current={gr?.habit} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      {session.role !== "Ustoz" && (
        <Card>
          <CardHeader title="Filiallar boʻyicha natijalar" subtitle="Barcha baholash kunlari" />
          <Table>
            <thead>
              <tr>
                <Th>Filial</Th>
                <Th right>Sheʼr ✓</Th>
                <Th right>Sheʼr ✗</Th>
                <Th right>Odat ✓</Th>
                <Th right>Odat ✗</Th>
                <Th right>Kelmagan</Th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.b.id}>
                  <Td className="font-semibold">{s.b.name}</Td>
                  <Td right>{s.poemOk}</Td>
                  <Td right className="text-danger">
                    {s.poemNo}
                  </Td>
                  <Td right>{s.habitOk}</Td>
                  <Td right className="text-danger">
                    {s.habitNo}
                  </Td>
                  <Td right className="text-muted">
                    {s.absent}
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
