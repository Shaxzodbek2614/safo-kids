// Deterministic demo data. Every name here is invented; real data is imported
// from Kids.xlsx once the database exists (docs/TZ.md, section 9).
import type {
  Account,
  Attendance,
  Branch,
  CashFlow,
  CashType,
  Charge,
  Contract,
  CoursePrice,
  Creditor,
  DiscountType,
  Expense,
  ExpenseCategory,
  Grade,
  GradeMark,
  Group,
  Lead,
  LeadComment,
  LeadSource,
  LeadStatus,
  LessonDays,
  Payment,
  Room,
  SalaryAssignment,
  SalaryPayment,
  Student,
  Transfer,
  User,
} from "./types";
import { ADDRESSES, LEAD_STATUSES, STOP_REASONS } from "./types";

export const TODAY = "2026-11-03";
export const THIS_YEAR = 2026;
export const THIS_MONTH = 11;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261103);
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)];
const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
const chance = (p: number) => rand() < p;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();
const phoneNo = () => `${pick(["90", "91", "93", "94", "97", "99", "33", "88"])}${int(1000000, 9999999)}`;
let seq = 0;
const nid = (p: string) => `${p}${(++seq).toString(36).padStart(4, "0")}`;

const BOYS = ["Muhammad Ali", "Abdulloh", "Umar", "Yusuf", "Ibrohim", "Muhammad Yahyo", "Solih", "Bilol", "Hasan", "Husayn", "Muhammad Amin", "Ismoil", "Abdurahmon", "Zayd", "Muso", "Sulaymon", "Muhammad Sodiq", "Azizbek", "Saʼdulloh", "Imron"];
const GIRLS = ["Oysha", "Fotima", "Maryam", "Hadicha", "Sumayya", "Robiya", "Zaynab", "Mohinur", "Shukrona", "Muslima", "Asmo", "Safiya", "Oyshaxon", "Ruqiya", "Mehrona", "Sevinch", "Hafsa", "Madina", "Soliha", "Bibisora"];
const SURNAMES = ["Karimov", "Rahimov", "Yusupov", "Tursunov", "Aliyev", "Qodirov", "Saidov", "Ergashev", "Nazarov", "Abdullayev", "Xolmatov", "Sobirov", "Ismoilov", "Mirzayev", "Haydarov", "Jalilov", "Valiyev", "Rasulov", "Ochilov", "Hamidov"];
const FATHERS = ["Jasur", "Bekzod", "Sardor", "Otabek", "Anvar", "Rustam", "Sherzod", "Doniyor", "Akmal", "Farhod", "Ulugʻbek", "Jamshid", "Bahodir", "Ilhom", "Zafar"];
const MOTHERS = ["Nilufar", "Dilnoza", "Gulnora", "Malika", "Shahnoza", "Nodira", "Feruza", "Zarina", "Dilfuza", "Mohira", "Sevara", "Kamola"];
const female = (s: string) => s + "a";

// ── Branches, accounts, staff ────────────────────────────────────────────
export const branches: Branch[] = [1, 2, 3, 4].map((n) => ({
  id: `b${n}`,
  name: `Safo Kids ${n}`,
  accountId: `acc${n}`,
  status: "Faol",
}));

export const users: User[] = [];
const addUser = (fullName: string, role: User["role"], branchIds: string[], kpi = 0, email = true): User => {
  const u: User = {
    id: nid("u"),
    fullName,
    role,
    branchIds,
    phone: phoneNo(),
    email: email ? `${fullName.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")}${users.length + 1}@example.com` : null,
    kpi,
  };
  users.push(u);
  return u;
};
export const admin = addUser("Jasur Karimov", "Admin", []);
export const manager = addUser("Dilshod Rahimov", "Bosh menejer", [], 0.03);
const cashiers = [
  addUser("Nodira Yusupova", "Administrator+Hisobchi", ["b1"]),
  addUser("Malika Qodirova", "Administrator+Hisobchi", ["b2"]),
  addUser("Sevara Tursunova", "Administrator+Hisobchi", ["b2", "b3"]),
  addUser("Kamola Saidova", "Administrator+Hisobchi", ["b4"]),
];

export const accounts: Account[] = [
  { id: "acc0", cashType: "Cash", name: "Bosh hisob", responsibles: [admin.id, manager.id], initialBalance: 0 },
  { id: "acc1", cashType: "Cash", name: "1-filial hisobi", responsibles: [cashiers[0].id], initialBalance: 0 },
  { id: "acc2", cashType: "Cash", name: "2-filial hisobi", responsibles: [cashiers[1].id], initialBalance: 0 },
  { id: "acc3", cashType: "Cash", name: "3-filial hisobi", responsibles: [cashiers[2].id], initialBalance: 0 },
  { id: "acc4", cashType: "Cash", name: "4-filial hisobi", responsibles: [cashiers[3].id], initialBalance: 0 },
  { id: "acc5", cashType: "Card", name: "Humo •••• 2622", responsibles: [admin.id, manager.id], initialBalance: 0 },
];

// ── Rooms and groups ─────────────────────────────────────────────────────
const GROUP_PLAN: [string, string[]][] = [
  ["b1", ["Kichik (1)", "Katta (1)"]],
  ["b2", ["Kichik (2)", "Oʻrta (2)", "Katta (2)", "Oʻrta (3)", "Katta"]],
  ["b3", ["Kichik", "Oʻrta"]],
  ["b4", ["Kichik guruh", "Katta guruh"]],
];
const TEACHERS = ["Dilorom", "Gulchehra", "Muxlisa", "Zulfiya", "Mohlaroy", "Shaxnoza", "Hilola", "Barno", "Iroda", "Nargiza", "Sarvinoz"];
const SUPPORTERS = ["Oydin", "Lola", "Gavhar", "Saida", "Yulduz", "Munisa", "Ozoda"];

export const rooms: Room[] = [];
export const groups: Group[] = [];
let gNo = 0;
for (const [branchId, names] of GROUP_PLAN) {
  names.forEach((name, i) => {
    const room: Room = { id: nid("r"), branchId, name: `${i + 1}-xona`, capacity: 30, status: "Faol" };
    rooms.push(room);
    const t = addUser(`${TEACHERS[gNo]} ustoz`, "Ustoz", [branchId]);
    const s = gNo < SUPPORTERS.length ? addUser(`${SUPPORTERS[gNo]} opa`, "Yordamchi", [branchId]) : null;
    groups.push({ id: nid("g"), branchId, name, number: gNo + 1, teacherId: t.id, supporterId: s?.id ?? null, roomId: room.id, status: "Faol" });
    gNo++;
  });
}
addUser("Xurshida opa (oshpaz)", "Boshqa", ["b2"], 0, false);
addUser("Ravshan aka (qorovul)", "Boshqa", ["b1"], 0, false);
// A spare room for settings
rooms.push({ id: nid("r"), branchId: "b2", name: "Oʻyin xonasi", capacity: 20, status: "Faol" });

// ── Reference lists ──────────────────────────────────────────────────────
export const leadSources: LeadSource[] = [
  { id: "src1", name: "Tanishlardan" },
  { id: "src2", name: "Instagram orqali" },
  { id: "src3", name: "Koʻchadan koʻrib" },
  { id: "src4", name: "Telegram kanaldan" },
];
export const discountTypes: DiscountType[] = [
  { id: "dt1", name: "Maxsus chegirma", maxAmount: 200_000 },
  { id: "dt2", name: "Boshlangʻich qoldiq", maxAmount: 500_000 },
];
export const expenseCategories: ExpenseCategory[] = [
  { id: "ec1", name: "Oziq-ovqat", kind: "Xarajat" },
  { id: "ec2", name: "Kommunal xarajatlar", kind: "Xarajat" },
  { id: "ec3", name: "Xoʻjalik xarajatlar", kind: "Xarajat" },
  { id: "ec4", name: "Ijara", kind: "Xarajat" },
  { id: "ec5", name: "Marketing", kind: "Xarajat" },
  { id: "ec6", name: "Taʼmirlash", kind: "Qayta investitsiya" },
];
const PRICE: Record<string, number> = { b1: 600_000, b2: 770_000, b3: 680_000, b4: 620_000 };
export const coursePrices: CoursePrice[] = [];
export const lessonDays: LessonDays[] = [];
for (const b of branches)
  for (let m = 1; m <= 12; m++) {
    coursePrices.push({ id: nid("cp"), branchId: b.id, year: THIS_YEAR, month: m, price: PRICE[b.id] });
    lessonDays.push({ id: nid("ld"), branchId: b.id, year: THIS_YEAR, month: m, days: m === 1 ? 20 : m === 3 ? 19 : 22 });
  }

// ── Students, leads, contracts ───────────────────────────────────────────
export const students: Student[] = [];
export const leads: Lead[] = [];
export const leadComments: LeadComment[] = [];
export const contracts: Contract[] = [];
const contractNo: Record<string, number> = { b1: 0, b2: 0, b3: 0, b4: 0 };
const cashierOf = (branchId: string) => cashiers.find((c) => c.branchIds.includes(branchId))!;

function newChild(branchId: string, age: number) {
  const boy = chance(0.5);
  const last = pick(SURNAMES);
  const father = pick(FATHERS);
  const s: Student = {
    id: nid("s"),
    branchId,
    firstName: boy ? pick(BOYS) : pick(GIRLS),
    lastName: boy ? last : female(last),
    parentName: `${father} ${boy ? "oʻgʻli" : "qizi"}`,
    gender: boy ? "Erkak" : "Ayol",
    birthDate: iso(THIS_YEAR - age, int(1, 12), int(1, 28)),
  };
  students.push(s);
  return { s, father };
}

const GROUP_SIZE = [18, 22, 26, 25, 29, 24, 31, 20, 23, 19, 21];
groups.forEach((g, gi) => {
  const active = GROUP_SIZE[gi];
  const ended = int(3, 6);
  for (let k = 0; k < active + ended; k++) {
    const age = g.name.startsWith("Katta") ? int(5, 6) : g.name.startsWith("Oʻrta") ? 4 : int(2, 3);
    const { s, father } = newChild(g.branchId, age);
    const isEnded = k >= active;
    const startY = chance(0.7) ? 2025 : 2026;
    const startM = startY === 2025 ? int(9, 12) : int(1, isEnded ? 6 : 10);
    const startDate = iso(startY, startM, int(1, 25));
    let endDate: string | null = null;
    if (isEnded) {
      const em = Math.min(10, (startY === 2025 ? 0 : startM) + int(1, 4));
      endDate = iso(THIS_YEAR, Math.max(em, 2), int(1, 28));
    }
    const lead: Lead = {
      id: nid("l"),
      studentId: s.id,
      branchId: g.branchId,
      sourceId: pick(leadSources).id,
      status: "5. Oʻqishni boshladi",
      groupId: g.id,
      address: pick(ADDRESSES),
      ageGroup: age,
      fatherName: father,
      motherName: pick(MOTHERS),
      fatherPhone: phoneNo(),
      motherPhone: phoneNo(),
      demoDate: startDate,
      createdAt: startDate,
      createdBy: cashierOf(g.branchId).id,
    };
    leads.push(lead);
    contracts.push({
      id: nid("c"),
      branchId: g.branchId,
      studentId: s.id,
      groupId: g.id,
      type: chance(0.03) ? "Grant" : "Pullik",
      number: ++contractNo[g.branchId],
      startDate,
      endDate,
      stopReason: endDate ? pick(STOP_REASONS) : null,
      fatherName: lead.fatherName,
      motherName: lead.motherName,
      fatherPhone: lead.fatherPhone,
      motherPhone: lead.motherPhone,
      address: lead.address,
      hasCertificate: chance(0.6),
      createdAt: startDate,
    });
  }
});

// Leads still in the funnel
const OPEN_STATUSES: LeadStatus[] = [LEAD_STATUSES[0], LEAD_STATUSES[1], LEAD_STATUSES[2], LEAD_STATUSES[3], LEAD_STATUSES[5], LEAD_STATUSES[6]];
const LEAD_NOTES = [
  "Narxi qimmatlik qildi, keyinroq qaytadi",
  "Dadasi bilan maslahatlashib javob beradi",
  "Sinov darsiga dushanba kuni keladi",
  "Uyiga yaqin filialni soʻradi",
  "Telefonni koʻtarmadi, qayta qoʻngʻiroq qilish kerak",
  "Yangi guruh ochilishini kutyapti",
];
for (let k = 0; k < 74; k++) {
  const b = pick(branches);
  const age = int(2, 6);
  const { s, father } = newChild(b.id, age);
  const status = k < 6 ? LEAD_STATUSES[2] : pick(OPEN_STATUSES);
  const daysAgo = int(0, 60);
  const created = new Date(Date.UTC(THIS_YEAR, THIS_MONTH - 1, 3 - daysAgo)).toISOString().slice(0, 10);
  const bGroups = groups.filter((g) => g.branchId === b.id);
  const lead: Lead = {
    id: nid("l"),
    studentId: s.id,
    branchId: b.id,
    sourceId: pick(leadSources).id,
    status,
    groupId: status.startsWith("3") || status.startsWith("4") ? pick(bGroups).id : null,
    address: pick(ADDRESSES),
    ageGroup: age,
    fatherName: father,
    motherName: pick(MOTHERS),
    fatherPhone: phoneNo(),
    motherPhone: chance(0.6) ? phoneNo() : "",
    demoDate: status.startsWith("3") ? iso(THIS_YEAR, THIS_MONTH, int(4, 10)) : status.startsWith("4") ? created : null,
    createdAt: created,
    createdBy: cashierOf(b.id).id,
  };
  leads.push(lead);
  const n = int(0, 3);
  for (let c = 0; c < n; c++)
    leadComments.push({ id: nid("lc"), leadId: lead.id, text: pick(LEAD_NOTES), createdAt: created, createdBy: lead.createdBy });
}

// ── Monthly charges and payments ─────────────────────────────────────────
export const charges: Charge[] = [];
export const payments: Payment[] = [];
const ym = (y: number, m: number) => y * 12 + m;

for (const c of contracts) {
  if (c.type === "Grant") continue;
  const [sy, sm] = c.startDate.split("-").map(Number);
  const end = c.endDate ? c.endDate.split("-").map(Number) : [THIS_YEAR, THIS_MONTH];
  const hasDiscount = chance(0.1);
  const discountConfirmed = chance(0.8);
  const payer = rand(); // how reliable this family is
  for (let t = Math.max(ym(sy, sm), ym(THIS_YEAR, 1)); t <= ym(end[0], end[1]); t++) {
    const y = Math.floor((t - 1) / 12);
    const m = t - y * 12;
    const base = PRICE[c.branchId];
    const disc = hasDiscount ? 100_000 : 0;
    charges.push({
      id: nid("ch"),
      contractId: c.id,
      branchId: c.branchId,
      year: y,
      month: m,
      basePrice: base,
      discount: disc,
      discountReason: hasDiscount ? pick(["2 ta farzand", "Ilk mijoz"]) : null,
      discountStatus: hasDiscount ? (discountConfirmed || m < THIS_MONTH - 1 ? "Tasdiqlandi" : "Tasdiqlashga") : null,
    });
    const due = base - (hasDiscount && (discountConfirmed || m < THIS_MONTH - 1) ? disc : 0);
    const current = y === THIS_YEAR && m === THIS_MONTH;
    let paid = 0;
    if (current) paid = chance(0.28) ? due : 0;
    else if (payer > 0.18) paid = due;
    else if (payer > 0.07) paid = chance(0.5) ? Math.round(due / 2 / 10_000) * 10_000 : due;
    else paid = chance(0.4) ? due : 0;
    if (paid > 0) {
      const card = chance(0.2);
      const d = current ? int(1, 3) : int(1, Math.min(18, daysIn(y, m)));
      const day = iso(y, m, d);
      payments.push({
        id: nid("p"),
        branchId: c.branchId,
        contractId: c.id,
        date: day,
        amount: paid,
        cashType: card ? "Card" : "Cash",
        accountId: card ? "acc5" : `acc${c.branchId.slice(1)}`,
        accountantId: cashierOf(c.branchId).id,
        discountTypeId: null,
        discount: 0,
        discountStatus: null,
        nonCashStatus: card ? (current || (m === THIS_MONTH - 1 && d > 25) ? "Tasdiqlashga" : "Tasdiqlandi") : null,
        comment: null,
        createdAt: day,
      });
    }
  }
}
// a couple of payment-level discounts waiting for approval
payments
  .filter((p) => p.date.startsWith(`${THIS_YEAR}-${pad(THIS_MONTH)}`))
  .slice(0, 3)
  .forEach((p, i) => {
    p.discountTypeId = "dt1";
    p.discount = [100_000, 150_000, 50_000][i];
    p.discountStatus = "Tasdiqlashga";
    p.comment = "Ota-onasi soʻradi";
  });

// ── Transfers to the head office ─────────────────────────────────────────
export const transfers: Transfer[] = [];
for (let m = 1; m <= THIS_MONTH; m++) {
  for (const b of branches) {
    const branchCash = payments
      .filter((p) => p.branchId === b.id && p.cashType === "Cash" && p.date.startsWith(`${THIS_YEAR}-${pad(m)}`))
      .reduce((s, p) => s + p.amount, 0);
    if (branchCash === 0) continue;
    const parts = m === THIS_MONTH ? 1 : 2;
    for (let k = 0; k < parts; k++) {
      const share = m === THIS_MONTH ? 0.6 : 0.47;
      transfers.push({
        id: nid("t"),
        date: iso(THIS_YEAR, m, m === THIS_MONTH ? 3 : k === 0 ? 12 : 26),
        cashType: "Cash",
        fromAccountId: b.accountId,
        toAccountId: "acc0",
        amount: Math.round((branchCash * share) / 5_000) * 5_000,
        status: m === THIS_MONTH ? "Tasdiqlashga" : "Tasdiqlandi",
        comment: null,
        createdBy: cashierOf(b.id).id,
      });
    }
  }
}

// ── Expenses ─────────────────────────────────────────────────────────────
export const expenses: Expense[] = [];
const EXPENSE_PLAN: [string, string, number, number][] = [
  ["ec1", "Oziq-ovqat", 1_400_000, 4],
  ["ec2", "Elektr energiya", 450_000, 1],
  ["ec2", "Gaz", 300_000, 1],
  ["ec3", "Xoʻjalik buyumlari", 320_000, 2],
  ["ec4", "Ijara", 6_000_000, 1],
];
for (let m = 1; m <= THIS_MONTH; m++)
  for (const b of branches) {
    const scale = b.id === "b2" ? 1.8 : 1;
    for (const [cat, name, price, times] of EXPENSE_PLAN) {
      if (cat === "ec4" && b.id === "b2") continue; // own building
      for (let k = 0; k < times; k++) {
        const d = m === THIS_MONTH ? int(1, 3) : int(1, 28);
        if (m === THIS_MONTH && k > 0) continue;
        expenses.push({
          id: nid("e"),
          branchId: b.id,
          date: iso(THIS_YEAR, m, d),
          categoryId: cat,
          name: `${name}${cat === "ec2" ? ` ${b.id.slice(1)}-filial` : ""}`,
          quantity: 1,
          unitPrice: Math.round((price * scale * (0.8 + rand() * 0.4)) / 5_000) * 5_000,
          cashType: "Cash",
          accountId: "acc0",
          comment: null,
        });
      }
    }
    if (chance(0.3) && m < THIS_MONTH)
      expenses.push({ id: nid("e"), branchId: b.id, date: iso(THIS_YEAR, m, int(1, 28)), categoryId: "ec5", name: "Instagram reklama", quantity: 1, unitPrice: 1_500_000, cashType: "Card", accountId: "acc5", comment: null });
    if (chance(0.2) && m < THIS_MONTH)
      expenses.push({ id: nid("e"), branchId: b.id, date: iso(THIS_YEAR, m, int(1, 28)), categoryId: "ec6", name: "Boʻyoq va taʼmir", quantity: 1, unitPrice: int(15, 40) * 100_000, cashType: "Cash", accountId: "acc0", comment: null });
  }

// ── Salaries ─────────────────────────────────────────────────────────────
export const salaryAssignments: SalaryAssignment[] = [];
export const salaryPayments: SalaryPayment[] = [];
const FIXED: Partial<Record<User["role"], number>> = {
  "Bosh menejer": 5_000_000,
  "Administrator+Hisobchi": 3_200_000,
  Ustoz: 3_000_000,
  Yordamchi: 1_800_000,
  Boshqa: 2_200_000,
};
for (let m = 1; m <= THIS_MONTH - 1; m++)
  for (const u of users) {
    const fixed = FIXED[u.role];
    if (!fixed) continue;
    const branchId = u.branchIds[0] ?? "b2";
    const bonus = chance(0.2) ? 300_000 : 0;
    const fine = chance(0.08) ? 100_000 : 0;
    const teacherKpi = u.role === "Ustoz" ? int(2, 5) * 100_000 : 0;
    const a: SalaryAssignment = { id: nid("sa"), branchId, userId: u.id, year: THIS_YEAR, month: m, fixed, bonus, fine, teacherKpi, revenueKpi: 0 };
    salaryAssignments.push(a);
    const givenShare = m <= THIS_MONTH - 2 ? 1 : chance(0.5) ? 1 : 0.5;
    const pay = (amount: number, type: SalaryPayment["type"], day: number) =>
      salaryPayments.push({ id: nid("sp"), branchId, userId: u.id, year: THIS_YEAR, month: m, date: iso(THIS_YEAR, Math.min(m + 1, THIS_MONTH), day), type, amount, accountId: u.role === "Yordamchi" ? "acc5" : "acc0" });
    pay(Math.round((fixed * givenShare) / 10_000) * 10_000, "Fixed", 2);
    if (teacherKpi + bonus > 0 && givenShare === 1) pay(teacherKpi + bonus - fine, "KPI", 2);
  }
// revenue KPI for the general manager (TZ 6.5)
for (const a of salaryAssignments.filter((s) => s.userId === manager.id)) {
  const rev = payments.filter((p) => p.date.startsWith(`${a.year}-${pad(a.month)}`)).reduce((s, p) => s + p.amount, 0);
  a.revenueKpi = Math.round((rev * manager.kpi) / 10_000) * 10_000;
  salaryPayments.push({ id: nid("sp"), branchId: a.branchId, userId: a.userId, year: a.year, month: a.month, date: iso(a.year, Math.min(a.month + 1, THIS_MONTH), 3), type: "KPI", amount: a.month < THIS_MONTH - 1 ? a.revenueKpi : 0, accountId: "acc0" });
}

// ── External cash flow (creditors) ───────────────────────────────────────
export const creditors: Creditor[] = [
  { id: "cr1", name: "Asoschi (shaxsiy mablagʻ)", initialBalance: 0 },
  { id: "cr2", name: "Hamkor investor", initialBalance: 0 },
  { id: "cr3", name: "Mebel doʻkoni (nasiya)", initialBalance: 0 },
];
export const cashFlows: CashFlow[] = [
  { id: nid("cf"), date: "2026-01-15", creditorId: "cr1", amount: -40_000_000, accountId: "acc0", comment: "Yangi filial uchun" },
  { id: nid("cf"), date: "2026-03-10", creditorId: "cr2", amount: -60_000_000, accountId: "acc0", comment: "Investitsiya" },
  { id: nid("cf"), date: "2026-04-02", creditorId: "cr3", amount: -12_750_000, accountId: "acc0", comment: "Mebel nasiyaga olindi" },
  { id: nid("cf"), date: "2026-05-20", creditorId: "cr1", amount: 5_000_000, accountId: "acc0", comment: null },
  { id: nid("cf"), date: "2026-06-25", creditorId: "cr3", amount: 4_250_000, accountId: "acc0", comment: "1-qism" },
  { id: nid("cf"), date: "2026-07-20", creditorId: "cr2", amount: 10_000_000, accountId: "acc0", comment: null },
  { id: nid("cf"), date: "2026-08-25", creditorId: "cr3", amount: 4_250_000, accountId: "acc0", comment: "2-qism" },
  { id: nid("cf"), date: "2026-09-22", creditorId: "cr1", amount: 8_000_000, accountId: "acc0", comment: null },
  { id: nid("cf"), date: "2026-10-25", creditorId: "cr2", amount: 10_000_000, accountId: "acc0", comment: null },
  { id: nid("cf"), date: "2026-10-30", creditorId: "cr3", amount: 4_250_000, accountId: "acc0", comment: "Yakuniy qism" },
];

// ── Attendance and grades (last weeks) ───────────────────────────────────
export const attendance: Attendance[] = [];
export const grades: Grade[] = [];
const schoolDays: string[] = [];
for (let back = 40; back >= 0; back--) {
  const d = new Date(Date.UTC(THIS_YEAR, THIS_MONTH - 1, 3 - back));
  const wd = d.getUTCDay();
  if (wd === 0 || wd === 6) continue;
  schoolDays.push(d.toISOString().slice(0, 10));
}
export const SCHOOL_DAYS = schoolDays;
const marks: GradeMark[] = ["Topshirdi", "Topshirdi", "Topshirdi", "Topshirolmadi", "Kelmadi"];
for (const day of schoolDays) {
  if (day === TODAY) continue; // today's attendance is taken live in the demo
  for (const c of contracts) {
    if (c.startDate > day || (c.endDate && c.endDate < day)) continue;
    attendance.push({ id: nid("a"), groupId: c.groupId, contractId: c.id, date: day, status: chance(0.88) ? "1" : "X" });
  }
  const wd = new Date(day).getUTCDay();
  if (wd === 5)
    for (const c of contracts) {
      if (c.startDate > day || (c.endDate && c.endDate < day)) continue;
      grades.push({ id: nid("gr"), groupId: c.groupId, contractId: c.id, date: day, poem: pick(marks), habit: pick(marks) });
    }
}

export type { CashType };
