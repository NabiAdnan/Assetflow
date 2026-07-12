import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ScrollText, Search, Loader2, Calendar, Shield, Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({
    meta: [
      { title: "Activity Log — AssetFlow" },
      { name: "description", content: "Detailed system activity logs and audit trail." },
    ],
  }),
  component: ActivityLogPage,
});

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  description: string;
  created_at: string;
}

function ActivityLogPage() {
  const [search, setSearch] = useState("");

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
    return matchesSearch;
  });

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Insights</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Activity Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System events, updates, and chronological changes indexed across the enterprise.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search activity logs…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Activity Table */}
      {isLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <ScrollText className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No activity logs</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No logged system events match the filter.
          </p>
        </div>
      ) : (
        <div className="surface-card p-0 overflow-hidden border border-border rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/20 border-b border-border">
                  <th className="p-4 font-semibold text-muted-foreground w-[180px]">Timestamp</th>
                  <th className="p-4 font-semibold text-muted-foreground w-[120px]">Action</th>
                  <th className="p-4 font-semibold text-muted-foreground w-[120px]">Entity</th>
                  <th className="p-4 font-semibold text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const timeStr = new Date(log.created_at).toLocaleString();
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {timeStr}
                      </td>
                      <td className="p-4 font-semibold">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="bg-primary-soft text-primary hover:bg-primary-soft text-[10px] font-semibold">
                          {log.entity}
                        </Badge>
                      </td>
                      <td className="p-4 text-foreground font-medium">
                        {log.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
