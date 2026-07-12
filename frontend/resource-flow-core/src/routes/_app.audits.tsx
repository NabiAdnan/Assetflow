import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  History, Search, Loader2, Calendar, Shield, Activity, Tag, ShieldAlert
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/audits")({
  head: () => ({
    meta: [
      { title: "Audit Trail — AssetFlow" },
      { name: "description", content: "View organizational activity history and security audit logs." },
    ],
  }),
  component: AuditsPage,
});

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  description: string;
  created_at: string;
}

function AuditsPage() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["audits"],
    queryFn: async () => {
      const res = await api.get("/audit/");
      return res.data;
    },
  });

  const filteredLogs = (logs || []).filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase());

    const matchesEntity = entityFilter === "all" || log.entity.toLowerCase() === entityFilter.toLowerCase();

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Compliance & Security</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Audit Trail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable logs showing organizational actions, asset reassignments, and maintenance lifecycle activities.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search action or description…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "Asset", "Category", "Department", "Allocation", "Transfer", "Maintenance"].map((entity) => (
            <Button
              key={entity}
              variant={entityFilter.toLowerCase() === entity.toLowerCase() ? "default" : "outline"}
              className="h-9 px-3 text-xs"
              onClick={() => setEntityFilter(entity === "All" ? "all" : entity)}
            >
              {entity}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Logs Feed */}
      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <History className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No audit logs found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No logged actions match the current criteria.
          </p>
        </div>
      ) : (
        <div className="relative border-l border-border pl-6 ml-4 space-y-6">
          {filteredLogs.map((log, index) => {
            const timeStr = new Date(log.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <motion.div
                key={log.id}
                className="relative group"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
              >
                {/* Timeline Bullet */}
                <div className="absolute -left-[31px] top-1.5 size-4 rounded-full border border-border bg-surface flex items-center justify-center group-hover:border-primary transition-colors">
                  <div className="size-1.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                </div>

                <div className="surface-card p-4 space-y-2 hover:border-border-hover transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-semibold text-[10px] uppercase font-mono tracking-wider">
                        {log.action}
                      </Badge>
                      <span className="text-muted-foreground">on</span>
                      <Badge variant="secondary" className="bg-primary-soft text-primary hover:bg-primary-soft text-[10px] font-semibold">
                        {log.entity}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" /> {timeStr}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/90 font-medium">
                    {log.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
