"use client";

import Link from "next/link";
import { useState } from "react";
import { Phone } from "lucide-react";
import { useDb } from "@/lib/data/store";
import { branchScope, contractStatus, financeIndex, groupLabel, lookups, studentName, THIS_MONTH } from "@/lib/data/calc";
import { MONTHS, money, phone } from "@/lib/format";
import { Badge, Card, Empty, LinkButton, PageHeader, SearchInput, Table, Tabs, Td, Th } from "@/components/ui";

export default function DebtsPage() {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const L = lookups(db);
  const fin = financeIndex(db);
  const [tab, setTab] = useState<"month" | "total">("month");
  const [q, setQ] = useState("");

  const value = (id: string) => (tab === "month" ? fin.get(id)?.monthDebt ?? 0 : fin.get(id)?.debt ?? 0);
  const debtors = db.contracts
    .filter((c) => scope.includes(c.branchId) && (tab === "total" || contractStatus(c) === "Faol"))
    .filter((c) => value(c.id) > 0);
  const rows = debtors
    .filter((c) => !q || `${studentName(L, c.studentId)} ${c.fatherName}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => value(b.id) - value(a.id));

  return (
    <>
      <PageHeader title="Qarzdorlik" subtitle="Toʻlov qilinmagan shartnomalar, filial boʻyicha" />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {db.branches
          .filter((b) => scope.includes(b.id))
          .map((b) => {
            const list = debtors.filter((c) => c.branchId === b.id);
            return (
              <Card key={b.id} className="p-5">
                <p className="text-[13px] font-semibold text-muted">{b.name}</p>
                <p className="num mt-2 text-xl font-extrabold text-danger sm:text-2xl">{money(list.reduce((s, c) => s + value(c.id), 0))}</p>
                <p className="mt-1 text-[13px] text-muted">{list.length} ta qarzdor</p>
              </Card>
            );
          })}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "month", label: `Shu oy (${MONTHS[THIS_MONTH - 1]})` },
              { value: "total", label: "Umumiy qarz" },
            ]}
          />
          <SearchInput value={q} onChange={setQ} placeholder="Bola yoki ota-ona ismi" />
        </div>
        {rows.length === 0 ? (
          <Empty title="Qarzdor yoʻq" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Tarbiyalanuvchi</Th>
                <Th>Guruh</Th>
                <Th>Ota-ona</Th>
                <Th right>Oylik narx</Th>
                <Th right>{tab === "month" ? "Shu oy qarzi" : "Jami qarz"}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((c) => (
                <tr key={c.id} className="hover:bg-surface-2">
                  <Td>
                    <Link href={`/shartnomalar/korish?id=${c.id}`} className="font-semibold hover:text-primary">
                      {studentName(L, c.studentId)}
                    </Link>
                    <p className="text-xs text-muted">
                      № {c.number} · {L.branch.get(c.branchId)?.name}
                      {contractStatus(c) === "Nofaol" && " · shartnoma yopilgan"}
                    </p>
                  </Td>
                  <Td className="max-w-52 truncate">{groupLabel(L, c.groupId)}</Td>
                  <Td>
                    <p>{c.fatherName}</p>
                    <p className="text-xs text-muted">{phone(c.fatherPhone)}</p>
                  </Td>
                  <Td right>{money(fin.get(c.id)?.monthlyPrice ?? 0)}</Td>
                  <Td right className="font-bold text-danger">
                    {money(value(c.id))}
                    {tab === "total" && (fin.get(c.id)?.debt ?? 0) > (fin.get(c.id)?.monthlyPrice ?? 0) && (
                      <Badge tone="danger" className="ml-2">
                        1 oydan koʻp
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <a href={`tel:+998${c.fatherPhone}`} aria-label={`${c.fatherName}ga qoʻngʻiroq`} className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-primary hover:bg-primary-soft">
                        <Phone size={16} aria-hidden="true" />
                      </a>
                      <LinkButton href={`/tolovlar?yangi=1&shartnoma=${c.id}`} size="sm" variant="secondary">
                        Toʻlov
                      </LinkButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
