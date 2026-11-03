// Mirrors the AppSheet schema described in docs/TZ.md (section 4).

export type ID = string;

export type Role =
  | "Admin"
  | "Bosh menejer"
  | "Filial menejeri"
  | "Administrator+Hisobchi"
  | "Hisobchi"
  | "Administrator"
  | "Aloqa operatori"
  | "Ustoz"
  | "Yordamchi"
  | "Ustoz+Yordamchi"
  | "Boshqa";

export interface Branch {
  id: ID;
  name: string;
  accountId: ID;
  status: "Faol" | "Nofaol";
}

export interface User {
  id: ID;
  fullName: string;
  role: Role;
  branchIds: ID[];
  phone: string;
  email: string | null;
  kpi: number; // 0..1
}

export interface Room {
  id: ID;
  branchId: ID;
  name: string;
  capacity: number;
  status: "Faol" | "Nofaol";
}

export interface Group {
  id: ID;
  branchId: ID;
  name: string;
  number: number;
  teacherId: ID;
  supporterId: ID | null;
  roomId: ID;
  status: "Rejada" | "Faol" | "Nofaol";
}

export interface Student {
  id: ID;
  branchId: ID;
  firstName: string;
  lastName: string;
  parentName: string;
  gender: "Erkak" | "Ayol";
  birthDate: string;
}

export const LEAD_STATUSES = [
  "1. Qayta bogʻlanishga",
  "2. Yangi guruhga kutyapti",
  "3. Sinov darsga yozildi",
  "4. Sinov darsga qatnashdi",
  "5. Oʻqishni boshladi",
  "6. Maʼqul kelmadi",
  "7. Yoshi kichik",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const ADDRESSES = [
  "Kombinat",
  "Akva park",
  "Votstroy",
  "Sentr",
  "Toshloq",
  "Mashad",
  "Soy boʻyi",
  "Qumtepa",
  "Oq masjid",
  "Oʻram",
  "Bahrin",
];

export interface LeadSource {
  id: ID;
  name: string;
}

export interface Lead {
  id: ID;
  studentId: ID;
  branchId: ID;
  sourceId: ID;
  status: LeadStatus;
  groupId: ID | null;
  address: string;
  ageGroup: number;
  fatherName: string;
  motherName: string;
  fatherPhone: string;
  motherPhone: string;
  demoDate: string | null;
  createdAt: string;
  createdBy: ID;
}

export interface LeadComment {
  id: ID;
  leadId: ID;
  text: string;
  createdAt: string;
  createdBy: ID;
}

export const STOP_REASONS = [
  "Vaqtinchalik taʼtil",
  "Kursni tamomladi",
  "Moliyaviy qiyinchilik",
  "Dars sifatidan qoniqmadi",
  "Markaz sharoiti yoqmadi",
  "Chetlashtirildi — oʻzlashtirish past",
  "Chetlashtirildi — xulqi yomon",
  "Boshqa bogʻchaga oʻtyapti",
];

export interface Contract {
  id: ID;
  branchId: ID;
  studentId: ID;
  groupId: ID;
  type: "Pullik" | "Grant";
  number: number;
  startDate: string;
  endDate: string | null;
  stopReason: string | null;
  fatherName: string;
  motherName: string;
  fatherPhone: string;
  motherPhone: string;
  address: string;
  hasCertificate: boolean;
  createdAt: string;
}

export type ContractStatus = "Rejada" | "Faol" | "Nofaol";

export type Confirm = "Tasdiqlashga" | "Tasdiqlandi";

/** Shartnoma_summalari: one monthly charge per contract */
export interface Charge {
  id: ID;
  contractId: ID;
  branchId: ID;
  year: number;
  month: number;
  basePrice: number;
  discount: number;
  discountReason: string | null;
  discountStatus: Confirm | null;
}

export type CashType = "Cash" | "Card" | "Bank";
export const CASH_LABEL: Record<CashType, string> = { Cash: "Naqd", Card: "Karta", Bank: "Bank" };

export interface Account {
  id: ID;
  cashType: CashType;
  name: string;
  responsibles: ID[];
  initialBalance: number;
}

export interface Payment {
  id: ID;
  branchId: ID;
  contractId: ID;
  date: string;
  amount: number;
  cashType: CashType;
  accountId: ID;
  accountantId: ID;
  discountTypeId: ID | null;
  discount: number;
  discountStatus: Confirm | null;
  nonCashStatus: Confirm | null;
  comment: string | null;
  createdAt: string;
}

export interface DiscountType {
  id: ID;
  name: string;
  maxAmount: number;
}

export interface Transfer {
  id: ID;
  date: string;
  cashType: CashType;
  fromAccountId: ID;
  toAccountId: ID;
  amount: number;
  status: Confirm;
  comment: string | null;
  createdBy: ID;
}

export interface ExpenseCategory {
  id: ID;
  name: string;
  kind: "Xarajat" | "Qayta investitsiya" | "Dividend";
}

export interface Expense {
  id: ID;
  branchId: ID;
  date: string;
  categoryId: ID;
  name: string;
  quantity: number;
  unitPrice: number;
  cashType: CashType;
  accountId: ID;
  comment: string | null;
}

export interface Creditor {
  id: ID;
  name: string;
  initialBalance: number;
}

export interface CashFlow {
  id: ID;
  date: string;
  creditorId: ID;
  /** positive = repaid (money leaves), negative = borrowed (money comes in) */
  amount: number;
  accountId: ID;
  comment: string | null;
}

export interface SalaryAssignment {
  id: ID;
  branchId: ID;
  userId: ID;
  year: number;
  month: number;
  fixed: number;
  bonus: number;
  fine: number;
  teacherKpi: number;
  revenueKpi: number;
}

export interface SalaryPayment {
  id: ID;
  branchId: ID;
  userId: ID;
  year: number;
  month: number;
  date: string;
  type: "Fixed" | "Bonus" | "KPI";
  amount: number;
  accountId: ID;
}

export interface Attendance {
  id: ID;
  groupId: ID;
  contractId: ID;
  date: string;
  status: "1" | "X";
}

export type GradeMark = "Topshirdi" | "Topshirolmadi" | "Kelmadi";

export interface Grade {
  id: ID;
  groupId: ID;
  contractId: ID;
  date: string;
  poem: GradeMark | null;
  habit: GradeMark | null;
}

export interface CoursePrice {
  id: ID;
  branchId: ID;
  year: number;
  month: number;
  price: number;
}

export interface LessonDays {
  id: ID;
  branchId: ID;
  year: number;
  month: number;
  days: number;
}
