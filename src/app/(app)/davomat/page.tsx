"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CheckCheck, X } from "lucide-react";
import { markAttendance, markStaffAttendance, useDb } from "@/lib/data/store";
import { canMarkStaff } from "@/lib/data/permissions";
import { groupRoster, lookups, rateFor, SCHOOL_DAYS_DESC, studentName, visibleGroups } from "@/lib/data/calc";
import { cn, date, money, percent } from "@/lib/format";
import { Avatar, Badge, Button, Card, CardHeader, Empty, PageHeader, Progress } from "@/components/ui";
import { SessionPicker } from "@/components/session-picker";

function MarkButtons({ label, value, onChange }: { label: string; value: "1" | "X" | undefined; onChange: (v: "1" | "X" | null) => void }) {
  return (
    <div className="flex gap-2" role="group" aria-label={label}>
      <button
        type="button"
        aria-pressed={value === "1"}
        onClick={() => onChange(value === "1" ? null : "1")}
        className={cn(
          "inline-flex h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-bold transition-colors sm:px-4",
          value === "1" ? "border-success bg-success text-white" : "border-border-strong text-muted hover:border-success hover:text-success",
        )}
      >
        <Check size={17} aria-hidden="true" />
        <span className="hidden sm:inline">Keldi</span>
      </button>
      <button
        type="button"
        aria-pressed={value === "X"}
        onClick={() => onChange(value === "X" ? null : "X")}
        className={cn(
          "inline-flex h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-bold transition-colors sm:px-4",
          value === "X" ? "border-danger bg-danger text-white" : "border-border-strong text-muted hover:border-danger hover:text-danger",
        )}
      >
        <X size={17} aria-hidden="true" />
        <span className="hidden sm:inline">Kelmadi</span>
      </button>
    </div>
  );
}

export default function AttendancePage() {
  const sp = Object.fromEntries(useSearchParams());
  const { db, session } = useDb();
  const L = lookups(db);
  const groups = visibleGroups(db, session);
  const [groupId, setGroupId] = useState(typeof sp.guruh === "string" ? sp.guruh : groups[0]?.id ?? "");
  const [day, setDay] = useState(SCHOOL_DAYS_DESC[0]);
  const g = groups.find((x) => x.id === groupId) ?? groups[0];
  if (!g) return <Empty title="Sizga biriktirilgan guruh yoʻq" />;

  const roster = groupRoster(db, g.id, day).sort((a, b) => studentName(L, a.studentId).localeCompare(studentName(L, b.studentId)));
  const marks = new Map(db.attendance.filter((a) => a.groupId === g.id && a.date === day).map((a) => [a.contractId, a.status]));
  const came = roster.filter((c) => marks.get(c.id) === "1").length;
  const absent = roster.filter((c) => marks.get(c.id) === "X").length;
  const left = roster.length - came - absent;

  const staff = [
    { user: L.user.get(g.teacherId)!, title: "Ustoz" },
    ...(g.supporterId ? [{ user: L.user.get(g.supporterId)!, title: "Yordamchi" }] : []),
  ];
  const staffMarks = new Map(db.staffAttendance.filter((a) => a.date === day).map((a) => [a.userId, a.status]));

  // absences for the side panel
  const recent = SCHOOL_DAYS_DESC.slice(0, 8).map((d) => {
    const xs = db.attendance.filter((a) => a.groupId === g.id && a.date === d);
    return { d, total: xs.length, absent: xs.filter((a) => a.status === "X").length };
  });

  return (
    <>
      <PageHeader title="Davomat" subtitle="Guruhni tanlang va har bir bolani belgilang" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card className="p-4 sm:p-5">
            <SessionPicker groupId={g.id} day={day} onGroup={setGroupId} onDay={setDay} />
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span>
                <b className="num text-success">{came}</b> keldi
              </span>
              <span>
                <b className="num text-danger">{absent}</b> kelmadi
              </span>
              <span className="text-muted">
                <b className="num">{left}</b> belgilanmagan
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="ml-auto"
                disabled={left === 0}
                onClick={() => roster.filter((c) => !marks.has(c.id)).forEach((c) => markAttendance(g.id, c.id, day, "1"))}
              >
                <CheckCheck size={16} aria-hidden="true" /> Qolganlar keldi
              </Button>
            </div>
            <div className="mt-3">
              <Progress value={roster.length ? (came + absent) / roster.length : 0} tone={left === 0 ? "success" : "primary"} />
            </div>
          </Card>

          {canMarkStaff(session.role) && (
            <Card className="overflow-hidden border-primary/40">
              <div className="border-b border-primary/20 bg-primary-soft px-4 py-3 sm:px-5">
                <h2 className="text-sm font-bold text-primary-ink">Tarbiyachilar davomati</h2>
                <p className="text-xs text-primary-ink/80">Kelgan kuni uchun belgilangan KPI oylikka avtomatik yoziladi</p>
              </div>
              <ul className="divide-y divide-border">
                {staff.map(({ user, title }) => {
                  const m = staffMarks.get(user.id);
                  const rate = rateFor(db, user.role, Number(day.slice(0, 4)), Number(day.slice(5, 7)));
                  return (
                    <li key={user.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <Avatar name={user.fullName} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold">{user.fullName}</span>
                          <Badge tone={title === "Ustoz" ? "primary" : "info"}>{title}</Badge>
                        </span>
                        <span className="block text-xs text-muted">
                          {m === "1" ? "Keldi" : m === "X" ? "Kelmadi" : "Belgilanmagan"}
                          {rate?.kind === "KPI" && ` · kuniga ${money(rate.amount)} soʻm`}
                        </span>
                      </span>
                      <MarkButtons label={`${user.fullName} davomati`} value={m} onChange={(v) => markStaffAttendance(g.id, user.id, day, v)} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card>
            <ul className="divide-y divide-border">
              {roster.map((c) => {
                const m = marks.get(c.id);
                const name = studentName(L, c.studentId);
                return (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <Avatar name={name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{name}</span>
                      <span className="block text-xs text-muted">{m === "1" ? "Keldi" : m === "X" ? "Kelmadi" : "Belgilanmagan"}</span>
                    </span>
                    <MarkButtons label={`${name} davomati`} value={m} onChange={(v) => markAttendance(g.id, c.id, day, v)} />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="Kelmaganlar" subtitle={`${g.name} guruhi, oxirgi kunlar`} />
          <ul className="flex flex-col gap-3 p-5">
            {recent.map((r) => (
              <li key={r.d} className="flex items-center gap-3 text-sm">
                <span className="num w-24 text-muted">{date(r.d)}</span>
                <span className="flex-1">
                  <Progress value={r.total ? 1 - r.absent / r.total : 0} tone="success" />
                </span>
                <span className="num w-20 text-right">
                  {r.total ? (
                    <>
                      <b className="text-danger">{r.absent}</b> · {percent(r.total ? 1 - r.absent / r.total : 0)}
                    </>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
