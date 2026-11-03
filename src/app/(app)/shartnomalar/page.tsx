"use client";

import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/lib/data/store";
import { branchScope, contractStatus, financeIndex, groupLabel, lookups, studentName } from "@/lib/data/calc";
import type { ContractStatus } from "@/lib/data/types";
import { date, money, phone } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, SearchInput, Table, Tabs, Td, Th, type Tone } from "@/components/ui";

const TONE: Record<ContractStatus, Tone> = { Faol: "success", Rejada: "info", Nofaol: "neutral" };

export default function ContractsPage() {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const L = lookups(db);
  const fin = financeIndex(db);
  const [tab, setTab] = useState<ContractStatus | "all" | "debt">("Faol");
  const [q, setQ] = useState("");

  const all = db.contracts.filter((c) => scope.includes(c.branchId));
  const count = (s: ContractStatus) => all.filter((c) => contractStatus(c) === s).length;
  const rows = all
    .filter((c) => (tab === "all" ? true : tab === "debt" ? (fin.get(c.id)?.debt ?? 0) > 0 : contractStatus(c) === tab))
    .filter((c) => !q || `${studentName(L, c.studentId)} ${c.number} ${c.fatherName} ${c.fatherPhone}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <>
      <PageHeader title="Shartnomalar" subtitle="Tarbiyalanuvchilar bilan tuzilgan shartnomalar va ularning moliyaviy holati" />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: "Faol", label: "Faol", count: count("Faol") },
          { value: "Rejada", label: "Rejada", count: count("Rejada") },
          { value: "Nofaol", label: "Nofaol", count: count("Nofaol") },
          { value: "debt", label: "Qarzdorlar", count: all.filter((c) => (fin.get(c.id)?.debt ?? 0) > 0).length },
          { value: "all", label: "Hammasi", count: all.length },
        ]}
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Ism, raqam yoki telefon" />
          <p className="text-sm text-muted">{rows.length} ta shartnoma</p>
        </div>
        {rows.length === 0 ? (
          <Empty title="Shartnoma topilmadi" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Shartnoma</Th>
                <Th>Guruh</Th>
                <Th>Status</Th>
                <Th>Muddat</Th>
                <Th>Ota-ona</Th>
                <Th right>Oylik narx</Th>
                <Th right>Toʻlangan</Th>
                <Th right>Qarz</Th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 250).map((c) => {
                const f = fin.get(c.id);
                const st = contractStatus(c);
                return (
                  <tr key={c.id} className="hover:bg-surface-2">
                    <Td>
                      <Link href={`/shartnomalar/korish?id=${c.id}`} className="font-semibold hover:text-primary">
                        {studentName(L, c.studentId)}
                      </Link>
                      <p className="text-xs text-muted">
                        № {c.number} · {L.branch.get(c.branchId)?.name}
                        {c.type === "Grant" && " · Grant"}
                      </p>
                    </Td>
                    <Td className="max-w-56 truncate">{groupLabel(L, c.groupId)}</Td>
                    <Td>
                      <Badge tone={TONE[st]}>{st}</Badge>
                    </Td>
                    <Td className="text-muted">
                      {date(c.startDate)} — {c.endDate ? date(c.endDate) : "…"}
                    </Td>
                    <Td>
                      <p>{c.fatherName}</p>
                      <p className="text-xs text-muted">{phone(c.fatherPhone)}</p>
                    </Td>
                    <Td right>{money(f?.monthlyPrice ?? 0)}</Td>
                    <Td right>{money(f?.paid ?? 0)}</Td>
                    <Td right className={(f?.debt ?? 0) > 0 ? "font-bold text-danger" : "text-muted"}>
                      {money(f?.debt ?? 0)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
