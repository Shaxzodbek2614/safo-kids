"use client";

import { useDb } from "@/lib/data/store";
import { groupFill, lookups, SCHOOL_DAYS_DESC, visibleGroups } from "@/lib/data/calc";
import { date } from "@/lib/format";
import { Field, Select } from "@/components/ui";

/** Filial → tarbiyachi → guruh → sana, shared by Davomat and Baholash (TZ 5.5, 5.6). */
export function SessionPicker({
  groupId,
  day,
  onGroup,
  onDay,
  days = SCHOOL_DAYS_DESC,
}: {
  groupId: string;
  day: string;
  onGroup: (id: string) => void;
  onDay: (d: string) => void;
  days?: string[];
}) {
  const { db, session } = useDb();
  const L = lookups(db);
  const groups = visibleGroups(db, session);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Guruh">
        {(id) => (
          <Select id={id} value={groupId} onChange={(e) => onGroup(e.target.value)}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {L.branch.get(g.branchId)?.name} · {g.name} · {L.user.get(g.teacherId)?.fullName} ({groupFill(db, g).active})
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Sana">
        {(id) => (
          <Select id={id} value={day} onChange={(e) => onDay(e.target.value)}>
            {days.map((d, i) => (
              <option key={d} value={d}>
                {date(d)}
                {i === 0 ? " (bugun)" : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </div>
  );
}
