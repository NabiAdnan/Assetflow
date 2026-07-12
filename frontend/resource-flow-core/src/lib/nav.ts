import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  Tags,
  ClipboardCheck,
  ArrowLeftRight,
  CalendarDays,
  Wrench,
  Bell,
  BarChart3,
  ShieldCheck,
  ScrollText,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  group?: string;
  roles?: string[]; // optional: restrict visibility
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },

  { to: "/assets", label: "Assets", icon: Package, group: "Operations" },
  { to: "/allocations", label: "Allocations", icon: ClipboardCheck, group: "Operations" },
  { to: "/transfers", label: "Transfers", icon: ArrowLeftRight, group: "Operations" },
  { to: "/bookings", label: "Bookings", icon: CalendarDays, group: "Operations" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, group: "Operations" },

  { to: "/employees", label: "Employees", icon: Users, group: "Organization" },
  { to: "/departments", label: "Departments", icon: Building2, group: "Organization" },
  { to: "/categories", label: "Categories", icon: Tags, group: "Organization" },

  { to: "/audits", label: "Audits", icon: ShieldCheck, group: "Insights" },
  { to: "/reports", label: "Reports", icon: BarChart3, group: "Insights" },
  { to: "/notifications", label: "Notifications", icon: Bell, group: "Insights" },
  { to: "/activity", label: "Activity Log", icon: ScrollText, group: "Insights" },
];
