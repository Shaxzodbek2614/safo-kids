import {
  ArrowLeftRight,
  Banknote,
  BadgeCheck,
  BookOpenCheck,
  CalendarCheck,
  ChartColumn,
  FileSignature,
  HandCoins,
  LayoutDashboard,
  Receipt,
  Settings,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/data/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[]; // omitted = everyone
}

const OFFICE: Role[] = ["Admin", "Bosh menejer", "Filial menejeri", "Administrator+Hisobchi", "Administrator", "Hisobchi"];
const TOP: Role[] = ["Admin", "Bosh menejer"];
const CASH_DESK: Role[] = ["Bosh menejer", "Filial menejeri", "Administrator+Hisobchi", "Hisobchi"];

export const NAV: { title: string; items: NavItem[] }[] = [
  { title: "", items: [{ href: "/", label: "Bosh sahifa", icon: LayoutDashboard }] },
  {
    title: "Mijozlar",
    items: [
      { href: "/lidlar", label: "Lidlar", icon: UserPlus, roles: OFFICE },
      { href: "/shartnomalar", label: "Shartnomalar", icon: FileSignature, roles: OFFICE },
      { href: "/guruhlar", label: "Guruhlar", icon: Users },
    ],
  },
  {
    title: "Taʼlim",
    items: [
      { href: "/davomat", label: "Davomat", icon: CalendarCheck },
      { href: "/baholash", label: "Baholash", icon: BookOpenCheck },
    ],
  },
  {
    title: "Moliya",
    items: [
      { href: "/tolovlar", label: "Toʻlovlar", icon: Banknote, roles: OFFICE },
      { href: "/qarzdorlik", label: "Qarzdorlik", icon: HandCoins, roles: OFFICE },
      { href: "/tasdiqlashlar", label: "Tasdiqlashlar", icon: BadgeCheck, roles: TOP },
      { href: "/hisoblar", label: "Hisoblar", icon: Wallet, roles: OFFICE },
      { href: "/xarajatlar", label: "Xarajatlar", icon: Receipt, roles: OFFICE },
      { href: "/pul-oqimi", label: "Pul oqimi", icon: ArrowLeftRight, roles: CASH_DESK },
    ],
  },
  {
    title: "Xodimlar va hisobot",
    items: [
      { href: "/oyliklar", label: "Oyliklar", icon: WalletCards, roles: OFFICE },
      { href: "/foyda", label: "Foyda hisoboti", icon: ChartColumn, roles: TOP },
      { href: "/sozlamalar", label: "Sozlamalar", icon: Settings, roles: TOP },
    ],
  },
];

export function canSee(item: NavItem, role: Role) {
  return !item.roles || item.roles.includes(role);
}
