import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Wrench, Search, Plus, Loader2, Calendar, User, Hammer, Check, Clock
} from "lucide-react";
import { api, extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — AssetFlow" },
      { name: "description", content: "Report equipment faults, assign technicians, and resolve maintenance tickets." },
    ],
  }),
  component: MaintenancePage,
});

interface Category {
  id: number;
  name: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  serial_number: string | null;
  category_id: number;
  department_id: number;
  holder_id: number | null;
  location: string;
  acquisition_cost: number;
  condition: string;
  status: string;
  is_bookable: boolean;
  category?: Category;
}

interface MaintenanceTicket {
  id: number;
  asset_id: number;
  reported_by: number;
  issue: string;
  technician: string | null;
  status: string;
  reported_date?: string;
  completed_date?: string | null;
}

function MaintenancePage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<number | null>(null);

  // Form Fields
  const [formAssetId, setFormAssetId] = useState("");
  const [formReportedBy, setFormReportedBy] = useState("");
  const [formIssue, setFormIssue] = useState("");
  const [formTechnician, setFormTechnician] = useState("");

  const isAdminOrManager = role === "admin" || role === "asset_manager";

  // Queries
  const { data: tickets, isLoading: ticketsLoading } = useQuery<MaintenanceTicket[]>({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const res = await api.get("/maintenance/");
      return res.data;
    },
  });

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets/");
      return res.data;
    },
  });

  const { data: employees } = useQuery<UserProfile[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees/");
      return res.data;
    },
  });

  // Mutations
  const reportMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/maintenance/", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Issue reported. Asset is now in Maintenance status.");
      setIsReportOpen(false);
      setFormAssetId("");
      setFormReportedBy("");
      setFormIssue("");
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to file maintenance request"));
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, tech }: { id: number; tech: string }) => {
      const res = await api.put(`/maintenance/assign/${id}?technician=${encodeURIComponent(tech)}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Technician assigned successfully");
      setAssignTicketId(null);
      setFormTechnician("");
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to assign technician"));
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/maintenance/complete/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Maintenance completed. Asset returned to Available status.");
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to complete maintenance"));
    },
  });

  // Assets eligible for maintenance (not already in maintenance)
  const reportableAssets = (assets || []).filter((a) => a.status !== "Maintenance");

  // Filtered tickets
  const filteredTickets = (tickets || []).filter((ticket) => {
    const assetObj = assets?.find((a) => a.id === ticket.asset_id);
    const employeeObj = employees?.find((e) => e.id === ticket.reported_by);

    const assetName = assetObj?.name || "";
    const assetTag = assetObj?.asset_tag || "";
    const reporterName = employeeObj?.name || "";
    const techName = ticket.technician || "";

    const matchesSearch =
      assetName.toLowerCase().includes(search.toLowerCase()) ||
      assetTag.toLowerCase().includes(search.toLowerCase()) ||
      reporterName.toLowerCase().includes(search.toLowerCase()) ||
      techName.toLowerCase().includes(search.toLowerCase()) ||
      ticket.issue.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Maintenance</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Log equipment faults, assign technicians, monitor repairs progress, and restore assets to service.
          </p>
        </div>
        <Button onClick={() => setIsReportOpen(true)} className="gap-2" disabled={reportableAssets.length === 0}>
          <Plus className="size-4" /> Report issue
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset tag, technician, issue…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tickets</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      {ticketsLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <Wrench className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No maintenance tickets</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No active or past maintenance tickets match the selection.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const assetObj = assets?.find((a) => a.id === ticket.asset_id);
            const reporterObj = employees?.find((e) => e.id === ticket.reported_by);

            return (
              <motion.div
                key={ticket.id}
                className="surface-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold font-mono text-primary bg-primary-soft px-2 py-0.5 rounded">
                      {assetObj?.asset_tag || "ASSET"}
                    </span>
                    <h4 className="text-sm font-semibold truncate text-foreground">
                      {assetObj?.name || "Asset Details"}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span className="text-foreground font-medium flex items-center gap-1">
                      <User className="size-3.5" /> Reported by: {reporterObj?.name || "Reporter"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" /> Date: {ticket.reported_date ? new Date(ticket.reported_date).toLocaleDateString() : "Recently"}
                    </span>
                    {ticket.technician ? (
                      <span className="text-primary font-medium flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded">
                        <Hammer className="size-3" /> Tech: {ticket.technician}
                      </span>
                    ) : (
                      <span className="text-amber-500 font-medium italic flex items-center gap-1">
                        ⚠ Unassigned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border border-border/50 max-w-3xl mt-1.5">
                    "{ticket.issue}"
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={ticket.status === "Pending" ? "outline" : "default"}
                    className={
                      ticket.status === "Pending"
                        ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/10 border-transparent"
                        : ticket.status === "In Progress"
                        ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-transparent"
                        : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-transparent"
                    }
                  >
                    {ticket.status}
                  </Badge>

                  {/* Actions */}
                  {isAdminOrManager && (
                    <div className="flex gap-2">
                      {ticket.status === "Pending" && assignTicketId !== ticket.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssignTicketId(ticket.id)}
                        >
                          Assign Tech
                        </Button>
                      )}

                      {ticket.status === "In Progress" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          onClick={() => {
                            if (confirm("Mark this maintenance ticket as completed and return the asset to service?")) {
                              completeMutation.mutate(ticket.id);
                            }
                          }}
                          disabled={completeMutation.isPending}
                        >
                          <Check className="size-3.5" /> Resolve
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline technician assignment form */}
                {assignTicketId === ticket.id && (
                  <div className="w-full sm:w-auto flex items-center gap-2 mt-2 sm:mt-0 bg-muted/50 p-2 rounded-lg border border-border">
                    <Input
                      placeholder="Technician name"
                      className="h-8 text-xs w-32 sm:w-40"
                      value={formTechnician}
                      onChange={(e) => setFormTechnician(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs px-2"
                      onClick={() => {
                        if (!formTechnician.trim()) {
                          toast.error("Please enter technician name.");
                          return;
                        }
                        assignMutation.mutate({ id: ticket.id, tech: formTechnician.trim() });
                      }}
                      disabled={assignMutation.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setAssignTicketId(null);
                        setFormTechnician("");
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* REPORT ISSUE DIALOG */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Report Equipment Issue</DialogTitle>
            <DialogDescription>
              Create a maintenance ticket for a damaged or malfunctioning asset.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formAssetId || !formReportedBy || !formIssue) {
                toast.error("Please fill in all fields.");
                return;
              }
              reportMutation.mutate({
                asset_id: Number(formAssetId),
                reported_by: Number(formReportedBy),
                issue: formIssue.trim(),
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="asset-fault">Select Asset *</Label>
              <Select value={formAssetId} onValueChange={setFormAssetId}>
                <SelectTrigger id="asset-fault">
                  <SelectValue placeholder="Choose asset with fault" />
                </SelectTrigger>
                <SelectContent>
                  {reportableAssets.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.asset_tag} — {a.name} ({a.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reporter-select">Reported By Employee *</Label>
              <Select value={formReportedBy} onValueChange={setFormReportedBy}>
                <SelectTrigger id="reporter-select">
                  <SelectValue placeholder="Choose employee reporting fault" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issue-desc">Fault Description *</Label>
              <Textarea
                id="issue-desc"
                required
                placeholder="Describe the issue in detail, e.g. laptop keyboard keys not working, screen flickering, power unit fail"
                value={formIssue}
                onChange={(e) => setFormIssue(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={reportMutation.isPending || !formAssetId || !formReportedBy}>
                {reportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                File Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
