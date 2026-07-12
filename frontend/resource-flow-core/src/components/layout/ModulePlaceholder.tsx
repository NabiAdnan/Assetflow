import { motion } from "framer-motion";
import { Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  action?: ReactNode;
}

export function ModulePlaceholder({ title, description, icon: Icon, features, action }: ModulePlaceholderProps) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Module</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">{description}</p>
        </div>
        {action}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="surface-card p-10 flex flex-col items-center text-center"
      >
        <div className="size-14 rounded-2xl bg-primary-soft text-primary grid place-items-center mb-5">
          <Icon className="size-6" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Coming online next</h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
          The foundation is wired up. This module will connect to your FastAPI endpoints
          with the same design language you're seeing throughout the workspace.
        </p>

        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left w-full max-w-xl">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3 py-2.5">
              <Sparkles className="size-3.5 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-foreground/90">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-2">
          <Button size="sm">Configure</Button>
          <Button size="sm" variant="outline">Read docs</Button>
        </div>
      </motion.div>
    </div>
  );
}
