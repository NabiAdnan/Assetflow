import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number; // percentage change
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  index?: number;
  trend?: ReactNode;
}

const toneMap: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-primary-soft text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
};

export function KpiCard({ label, value, icon: Icon, delta, hint, tone = "default", index = 0, trend }: KpiCardProps) {
  const positive = typeof delta === "number" ? delta >= 0 : undefined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card hover-lift p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
            {typeof delta === "number" && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-medium rounded px-1.5 py-0.5",
                  positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                )}
              >
                {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(delta).toFixed(1)}%
              </span>
            )}
          </div>
          {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("size-10 rounded-lg grid place-items-center shrink-0", toneMap[tone])}>
          <Icon className="size-4.5" />
        </div>
      </div>
      {trend && <div className="mt-4">{trend}</div>}
    </motion.div>
  );
}
