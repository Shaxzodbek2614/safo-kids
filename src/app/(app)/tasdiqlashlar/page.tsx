"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { confirmChargeDiscount, confirmPayment, confirmTransfer, useDb } from "@/lib/data/store";
import { branchScope, lookups, studentName } from "@/lib/data/calc";
import { canSeeInternalFlow } from "@/lib/data/permissions";
import { CASH_LABEL } from "@/lib/data/types";
import { MONTHS, date, money } from "@/lib/format";
import { Button, Card, Empty, PageHeader, Table, Tabs, Td, Th } from "@/components/ui";

export default function ApprovalsPage() {
  const { db, session } = useDb();
  const scope = branchScope(db, session);
  const L = lookups(db);
  const [tab, setTab] = useState<"discounts" | "noncash" | "transfers">("discounts");

  const chargeDiscounts = db.charges.filter((c) => scope.includes(c.branchId) && c.discountStatus === "Tasdiqlashga");
  const payDiscounts = db.payments.filter((p) => scope.includes(p.branchId) && p.discountStatus === "Tasdiqlashga");
  const noncash = db.payments.filter((p) => scope.includes(p.branchId) && p.nonCashStatus === "Tasdiqlashga");
  const transfers = db.transfers.filter((t) => t.status === "Tasdiqlashga");
  const showTransfers = canSeeInternalFlow(session.role);

  const ConfirmBtn = ({ onClick }: { onClick: () => void }) => (
    <Button size="sm" variant="success" onClick={onClick}>
      <Check size={15} aria-hidden="true" /> Tasdiqlash
    </Button>
  );

  return (
    <>
      <PageHeader title="Tasdiqlashlar" subtitle="Chegirmalar, naqdsiz toʻlovlar va kassalar orasidagi oʻtkazmalar" />
      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: "discounts", label: "Chegirmalar", count: chargeDiscounts.length + payDiscounts.length },
          { value: "noncash", label: "Naqdsiz toʻlovlar", count: noncash.length },
          ...(showTransfers ? [{ value: "transfers" as const, label: "Oʻtkazmalar", count: transfers.length }] : []),
        ]}
      />
      <Card>
        {tab === "discounts" &&
          (chargeDiscounts.length + payDiscounts.length === 0 ? (
            <Empty title="Hammasi tasdiqlangan" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Tarbiyalanuvchi</Th>
                  <Th>Turi</Th>
                  <Th>Davr / sana</Th>
                  <Th right>Chegirma</Th>
                  <Th>Sabab</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {chargeDiscounts.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-semibold">{studentName(L, L.contract.get(c.contractId)?.studentId ?? "")}</Td>
                    <Td>Oylik narx chegirmasi</Td>
                    <Td>
                      {MONTHS[c.month - 1]} {c.year}
                    </Td>
                    <Td right className="font-semibold">
                      {money(c.discount)}
                    </Td>
                    <Td className="text-muted">{c.discountReason}</Td>
                    <Td className="text-right">
                      <ConfirmBtn onClick={() => confirmChargeDiscount(c.id)} />
                    </Td>
                  </tr>
                ))}
                {payDiscounts.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-semibold">{studentName(L, L.contract.get(p.contractId)?.studentId ?? "")}</Td>
                    <Td>{L.discountType.get(p.discountTypeId ?? "")?.name}</Td>
                    <Td>{date(p.date)}</Td>
                    <Td right className="font-semibold">
                      {money(p.discount)}
                    </Td>
                    <Td className="text-muted">{p.comment}</Td>
                    <Td className="text-right">
                      <ConfirmBtn onClick={() => confirmPayment(p.id, "discount")} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ))}
        {tab === "noncash" &&
          (noncash.length === 0 ? (
            <Empty title="Hammasi tasdiqlangan" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Sana</Th>
                  <Th>Tarbiyalanuvchi</Th>
                  <Th right>Summa</Th>
                  <Th>Pul shakli</Th>
                  <Th>Hisob</Th>
                  <Th>Izoh</Th>
                  <Th>Qabul qildi</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {noncash.map((p) => (
                  <tr key={p.id}>
                    <Td>{date(p.date)}</Td>
                    <Td className="font-semibold">{studentName(L, L.contract.get(p.contractId)?.studentId ?? "")}</Td>
                    <Td right className="font-semibold">
                      {money(p.amount)}
                    </Td>
                    <Td>{CASH_LABEL[p.cashType]}</Td>
                    <Td>{L.account.get(p.accountId)?.name}</Td>
                    <Td className="min-w-56 whitespace-normal font-medium">{p.comment ?? <span className="text-subtle">Izoh yoʻq</span>}</Td>
                    <Td className="text-muted">{L.user.get(p.accountantId)?.fullName}</Td>
                    <Td className="text-right">
                      <ConfirmBtn onClick={() => confirmPayment(p.id, "noncash")} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ))}
        {tab === "transfers" &&
          showTransfers &&
          (transfers.length === 0 ? (
            <Empty title="Hammasi tasdiqlangan" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Sana</Th>
                  <Th>Qayerdan</Th>
                  <Th>Qayerga</Th>
                  <Th right>Summa</Th>
                  <Th>Yubordi</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <Td>{date(t.date)}</Td>
                    <Td>{L.account.get(t.fromAccountId)?.name}</Td>
                    <Td>{L.account.get(t.toAccountId)?.name}</Td>
                    <Td right className="font-semibold">
                      {money(t.amount)}
                    </Td>
                    <Td className="text-muted">{L.user.get(t.createdBy)?.fullName}</Td>
                    <Td className="text-right">
                      <ConfirmBtn onClick={() => confirmTransfer(t.id)} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ))}
      </Card>
      <p className="mt-4 text-[13px] text-muted">
        Qoida: Admin har doim tasdiqlaydi; Bosh menejer — 30 kun ichida; Filial menejeri chegirmani — 7 kun ichida. Oʻtkazmani qabul qiluvchi hisob masʼuli tasdiqlaydi.
      </p>
    </>
  );
}
