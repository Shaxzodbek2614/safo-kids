"use client";

import { DoorOpen, UserRound, Users } from "lucide-react";
import { useDb } from "@/lib/data/store";
import { groupFill, lookups, visibleGroups } from "@/lib/data/calc";
import { percent } from "@/lib/format";
import { Badge, Card, PageHeader, Progress, Stat, type Tone } from "@/components/ui";

const GRADE_TONE: Record<string, Tone> = { "Boʻsh": "neutral", Yomon: "danger", "Oʻrtacha": "warning", Yaxshi: "primary", "Zoʻr": "success" };

export default function GroupsPage() {
  const { db, session } = useDb();
  const L = lookups(db);
  const groups = visibleGroups(db, session);
  const fills = groups.map((g) => ({ g, f: groupFill(db, g) }));
  const cap = fills.reduce((s, x) => s + x.f.capacity, 0);
  const act = fills.reduce((s, x) => s + x.f.active, 0);

  return (
    <>
      <PageHeader title="Guruhlar" subtitle="Faol guruhlar tahlili: toʻlish darajasi va boʻsh oʻrinlar" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Guruhlar" value={groups.length} />
        <Stat label="Tarbiyalanuvchilar" value={act} hint={`${cap} oʻrindan`} />
        <Stat label="Boʻsh oʻrinlar" value={cap - act} hint={`Toʻlish: ${percent(cap ? act / cap : 0)}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fills
          .sort((a, b) => b.f.ratio - a.f.ratio)
          .map(({ g, f }) => (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted">
                    {L.branch.get(g.branchId)?.name} · №{g.number}
                  </p>
                  <h2 className="truncate text-lg font-bold">{g.name}</h2>
                </div>
                <Badge tone={GRADE_TONE[f.grade]}>{f.grade}</Badge>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <p className="num text-3xl font-extrabold">
                  {f.active}
                  <span className="text-base font-semibold text-muted"> / {f.capacity}</span>
                </p>
                <p className="text-sm text-muted">{f.open > 0 ? `${f.open} ta boʻsh oʻrin` : "Toʻla"}</p>
              </div>
              <div className="mt-2">
                <Progress value={f.ratio} tone={f.ratio > 0.85 ? "success" : f.ratio > 0.5 ? "primary" : "warning"} />
              </div>
              <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
                <li className="flex items-center gap-2">
                  <UserRound size={16} className="text-subtle" aria-hidden="true" /> {L.user.get(g.teacherId)?.fullName}
                </li>
                <li className="flex items-center gap-2">
                  <Users size={16} className="text-subtle" aria-hidden="true" /> Yordamchi: {g.supporterId ? L.user.get(g.supporterId)?.fullName : "—"}
                </li>
                <li className="flex items-center gap-2">
                  <DoorOpen size={16} className="text-subtle" aria-hidden="true" /> {L.room.get(g.roomId)?.name}
                </li>
              </ul>
            </Card>
          ))}
      </div>
    </>
  );
}
