import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Package, CheckCircle2, UserCheck, Wrench, CalendarClock,
  ArrowLeftRight, Clock, AlertTriangle, Loader2
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, extractApiError } from "@/lib/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth, roleLabel } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AssetFlow" },
      { name: "description", content: "Real-time view of assets, allocations, maintenance, and approvals." },
    ],
  }),
  component: DashboardPage,
});

interface DashboardStats {
  total_assets: number;
  available_assets: number;
  allocated_assets: number;
  maintenance_assets: number;
  bookable_assets: number;
  departments: number;
  categories: number;
  employees: number;
  pending_transfers: number;
  pending_maintenance: number;
  today_bookings: number;
}

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  description: string;
  created_at: string;
}

interface TransferRequest {
  id: number;
  asset_id: number;
  from_employee: number;
  to_employee: number;
  request_date: string;
  status: string;
  asset?: { name: string; asset_tag: string };
}

interface MaintenanceRequest {
  id: number;
  asset_id: number;
  reported_by: number;
  issue: string;
  technician: string | null;
  status: string;
  reported_date: string;
  asset?: { name: string; asset_tag: string };
}

function DashboardPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const first = user?.name?.split(" ")[0] || user?.full_name?.split(" ")[0] || "there";

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/");
      return res.data;
    },
  });

  const { data: audits, isLoading: auditsLoading } = useQuery<AuditLog[]>({
    queryKey: ["dashboard-audits"],
    queryFn: async () => {
      const res = await api.get("/audit/");
      return res.data;
    },
  });

  const { data: transfers } = useQuery<TransferRequest[]>({
    queryKey: ["transfers"],
    queryFn: async () => {
      const res = await api.get("/transfer/");
      return res.data;
    },
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets/");
      return res.data;
    },
  });

  const { data: departmentsList } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments/");
      return res.data;
    },
  });

  const { data: maintenance } = useQuery<MaintenanceRequest[]>({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const res = await api.get("/maintenance/");
      return res.data;
    },
  });

  // Approve Transfer Mutation
  const approveTransfer = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/transfer/approve/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transfer request approved");
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to approve transfer"));
    },
  });

  // Complete Maintenance Mutation
  const completeMaintenance = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/maintenance/complete/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Maintenance marked as completed");
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to complete maintenance"));
    },
  });

  if (statsLoading || auditsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fallback / seed stats values
  const total = stats?.total_assets ?? 0;
  const available = stats?.available_assets ?? 0;
  const allocated = stats?.allocated_assets ?? 0;
  const underMaintenance = stats?.maintenance_assets ?? 0;

  // Pie chart data
  const statusData = [
    { name: "Available", value: available, key: "chart-1" },
    { name: "Allocated", value: allocated, key: "chart-2" },
    { name: "Maintenance", value: underMaintenance, key: "chart-3" },
  ].filter(d => d.value > 0);

  // Department Utilization aggregation
  const deptMap: Record<string, number> = {};
  if (assets && Array.isArray(assets) && departmentsList && Array.isArray(departmentsList)) {
    departmentsList.forEach((dept: { id: number; name: string }) => {
      deptMap[dept.name] = 0;
    });
    assets.forEach((asset: { department_id?: number; department?: { name: string } }) => {
      const deptName = asset.department?.name || departmentsList.find(d => d.id === asset.department_id)?.name;
      if (deptName) {
        deptMap[deptName] = (deptMap[deptName] || 0) + 1;
      }
    });
  }
  const deptData = Object.entries(deptMap).map(([name, count]) => ({
    name,
    assets: count,
  })).slice(0, 6);

  // Merge pending approvals
  const pendingApprovalsList: Array<{ id: string; rawId: number; type: "transfer" | "maintenance"; title: string; subtitle: string }> = [];

  if (transfers && Array.isArray(transfers) && assets && Array.isArray(assets)) {
    transfers
      .filter((t) => t.status === "Pending")
      .forEach((t) => {
        const asset = assets.find((a) => a.id === t.asset_id);
        pendingApprovalsList.push({
          id: `TR-${t.id}`,
          rawId: t.id,
          type: "transfer",
          title: `Transfer Request`,
          subtitle: `${asset?.name || "Asset"} · tag: ${asset?.asset_tag || t.asset_id}`,
        });
      });
  }

  if (maintenance && Array.isArray(maintenance) && assets && Array.isArray(assets)) {
    maintenance
      .filter((m) => m.status === "Pending" || m.status === "Approved" || m.status === "In Progress")
      .forEach((m) => {
        const asset = assets.find((a) => a.id === m.asset_id);
        pendingApprovalsList.push({
          id: `MT-${m.id}`,
          rawId: m.id,
          type: "maintenance",
          title: `Maintenance: ${m.status}`,
          subtitle: `${asset?.name || "Asset"} · Issue: "${m.issue}"`,
        });
      });
  }

  // Format activity logs
  const activityList = (audits || []).slice(0, 5).map((log) => {
    let tone: "success" | "warning" | "default" = "default";
    if (log.action === "Allocate" || log.action === "Transfer") tone = "success";
    if (log.action === "Maintenance") tone = "warning";

    // Format relative time or standard time
    const dateObj = new Date(log.created_at);
    const diffMs = Date.now() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    let relativeTime = "just now";
    if (diffMins > 0 && diffMins < 60) relativeTime = `${diffMins}m ago`;
    else if (diffHours > 0 && diffHours < 24) relativeTime = `${diffHours}h ago`;
    else if (diffHours >= 24) relativeTime = dateObj.toLocaleDateString();

    return {
      who: log.action,
      action: log.entity.toLowerCase(),
      target: log.description,
      when: relativeTime,
      tone,
    };
  });

  const trendData = [
    { m: "Jan", v: Math.max(0, allocated - 4) },
    { m: "Feb", v: Math.max(0, allocated - 2) },
    { m: "Mar", v: Math.max(0, allocated - 3) },
    { m: "Apr", v: Math.max(0, allocated - 1) },
    { m: "May", v: Math.max(0, allocated) },
    { m: "Jun", v: Math.max(0, allocated + 1) },
    { m: "Jul", v: allocated },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Good to see you, {first}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="text-foreground font-medium">{roleLabel(role)}</span> · here's what's happening today.
          </p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard index={0} label="Total assets"        value={String(total)} icon={Package}        delta={4.2}  hint="vs. last month" />
        <KpiCard index={1} label="Available"           value={String(available)} icon={CheckCircle2}   delta={1.8}  tone="success" />
        <KpiCard index={2} label="Allocated"           value={String(allocated)} icon={UserCheck}      delta={2.6}  />
        <KpiCard index={3} label="Under maintenance"   value={String(underMaintenance)}  icon={Wrench}         delta={-3.1} tone="warning" />
        <KpiCard index={4} label="Active bookings"     value={String(stats?.today_bookings ?? 0)}  icon={CalendarClock}  delta={5.4}  />
        <KpiCard index={5} label="Pending transfers"   value={String(stats?.pending_transfers ?? 0)}  icon={ArrowLeftRight} delta={-1.2} />
        <KpiCard index={6} label="Pending maintenance"  value={String(stats?.pending_maintenance ?? 0)} icon={Clock}          delta={0.4}  />
        <KpiCard index={7} label="Employees"           value={String(stats?.employees ?? 0)}   icon={AlertTriangle}  delta={12.5} tone="default" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Monthly allocation trend</h3>
              <p className="text-xs text-muted-foreground">Total allocations across departments</p>
            </div>
            <Badge variant="secondary">Active Workspace</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    fontSize: 12,
                    boxShadow: "var(--shadow-elevated)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="var(--color-primary)"
                  strokeWidth={2.25}
                  dot={{ r: 3, fill: "var(--color-primary)" }}
                  activeDot={{ r: 5 }}
                  fill="url(#lineFill)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Asset status</h3>
            <p className="text-xs text-muted-foreground">Distribution across lifecycle</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="var(--color-surface)">
                  {statusData.map((d) => (
                    <Cell key={d.key} fill={`var(--color-${d.key})`} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {statusData.map((d) => (
              <div key={d.key} className="flex items-center gap-2">
                <span className="size-2 rounded-sm" style={{ background: `var(--color-${d.key})` }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-medium tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dept utilization + Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Department utilization</h3>
              <p className="text-xs text-muted-foreground">Active assets per department</p>
            </div>
          </div>
          <div className="h-64">
            {deptData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No asset data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    cursor={{ fill: "var(--color-primary-soft)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="assets" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Pending approvals & tasks</h3>
            <Badge variant="secondary">{pendingApprovalsList.length}</Badge>
          </div>
          {pendingApprovalsList.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <CheckCircle2 className="size-8 text-success mb-2 opacity-80" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground">No pending transfers or maintenance.</p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {pendingApprovalsList.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {p.subtitle}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{p.id}</Badge>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {p.type === "transfer" ? (
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => approveTransfer.mutate(p.rawId)}
                        disabled={approveTransfer.isPending}
                      >
                        Approve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700"
                        onClick={() => completeMaintenance.mutate(p.rawId)}
                        disabled={completeMaintenance.isPending}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Activity timeline */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <p className="text-xs text-muted-foreground">Everything flowing through the workspace</p>
          </div>
        </div>
        {activityList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activities.</p>
        ) : (
          <ol className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
            {activityList.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative"
              >
                <span className={`absolute -left-[18px] top-1.5 size-2.5 rounded-full ring-4 ring-surface ${
                  a.tone === "success" ? "bg-success" : a.tone === "warning" ? "bg-warning" : "bg-primary"
                }`} />
                <p className="text-sm">
                  <span className="font-semibold text-primary">{a.who}</span>{" "}
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  <span className="font-medium text-foreground">{a.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{a.when}</p>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
