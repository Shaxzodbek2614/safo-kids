// Who may do what. Client's change list of 2026-11-06, see docs/TZ.md section 13.
import type { CashType, Role } from "./types";

const ADMINS: Role[] = ["Admin", "Administrator"];

/** Only the general manager edits or deletes payments; others just enter them. */
export const canEditPayments = (r: Role) => r === "Bosh menejer";

/** Cash goes in through Administrator+Hisobchi, card payments through Admin. */
export function paymentCashTypes(r: Role): CashType[] {
  if (r === "Administrator+Hisobchi") return ["Cash"];
  if (ADMINS.includes(r)) return ["Card"];
  return [];
}

export const canSeeInternalFlow = (r: Role) => !ADMINS.includes(r);
export const canSeeExternalFlow = (r: Role) => r === "Bosh menejer";
export const canMarkStaff = (r: Role) => r === "Administrator+Hisobchi" || r === "Bosh menejer";
export const canSetSalaryRates = (r: Role) => r === "Bosh menejer";
