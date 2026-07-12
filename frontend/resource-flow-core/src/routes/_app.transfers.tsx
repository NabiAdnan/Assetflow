import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeftRight, Search, Plus, Loader2, Calendar, Check, AlertCircle, ShieldAlert
} from "lucide-react";
import { api, extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/transfers")({
  head: () => ({
    meta: [
      { title: "Transfers — AssetFlow" },
      { name: "description", content: "Transfer asset holdings between organization employees." },
    ],
  }),
  component: TransfersPage,
});

interface Category {
  id: number;
  name: string;
}

interface User {
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

interface Transfer {
  id: number;
  asset_id: number;
  from_employee: number;
  to_employee: number;
  request_date: string;
  status: string;
  asset?: Asset;
}

function TransfersPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  // Form Fields
  const [formAssetId, setFormAssetId] = useState("");
  const [formToEmployeeId, setFormToEmployeeId] = useState("");

  const isAdminOrManager = role === "admin" || role === "asset_manager";

  // Queries
  const { data: transfers, isLoading: transfersLoading } = useQuery<Transfer[]>({
    queryKey: ["transfers"],
    queryFn: async () => {
      const res = await api.get("/transfer/");
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

  const { data: employees } = useQuery<User[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees/");
      return res.data;
    },
  });

  // Mutations
  const requestTransferMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/transfer/", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Transfer request submitted successfully");
      setIsRequestOpen(false);
      setFormAssetId("");
      setFormToEmployeeId("");
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to submit transfer request"));
    },
  });

  const approveTransferMutation = useMutation({
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

  // Assets that are currently Allocated
  const allocatedAssets = (assets || []).filter((a) => a.status === "Allocated");

  // Selected asset current holder info
  const selectedAssetObj = assets?.find((a) => a.id === Number(formAssetId));
  const currentHolderObj = selectedAssetObj
    ? employees?.find((e) => e.id === selectedAssetObj.holder_id)
    : null;

  // Filtered employees excluding current holder
  const eligibleEmployees = (employees || []).filter(
    (emp) => !currentHolderObj || emp.id !== currentHolderObj.id
  );

  // Filtered transfers list
  const filteredTransfers = (transfers || []).filter((t) => {
    const assetObj = assets?.find((a) => a.id === t.asset_id);
    const fromEmp = employees?.find((e) => e.id === t.from_employee);
    const toEmp = employees?.find((e) => e.id === t.to_employee);

    const assetName = assetObj?.name || "";
    const assetTag = assetObj?.asset_tag || "";
    const fromName = fromEmp?.name || "";
    const toName = toEmp?.name || "";

    const matchesSearch =
      assetName.toLowerCase().includes(search.toLowerCase()) ||
      assetTag.toLowerCase().includes(search.toLowerCase()) ||
      fromName.toLowerCase().includes(search.toLowerCase()) ||
      toName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Transfers</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Reassign asset ownership smoothly from one team member to another. Requires Admin or Manager approval.
          </p>
        </div>
        <Button onClick={() => setIsRequestOpen(true)} className="gap-2">
          <Plus className="size-4" /> Request transfer
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset tag, source, destination…"
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
            <SelectItem value="all">All requests</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {transfersLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <ArrowLeftRight className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No transfer requests</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No transfer requests match the selected criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map((t) => {
            const assetObj = assets?.find((a) => a.id === t.asset_id);
            const fromEmp = employees?.find((e) => e.id === t.from_employee);
            const toEmp = employees?.find((e) => e.id === t.to_employee);

            return (
              <motion.div
                key={t.id}
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
                      {assetObj?.name || "Asset details"}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded text-foreground font-medium flex items-center gap-1">
                      From: {fromEmp?.name || "Holder"}
                    </span>
                    <ArrowLeftRight className="size-3.5 text-primary" />
                    <span className="bg-primary/10 px-2 py-0.5 rounded text-primary font-medium flex items-center gap-1">
                      To: {toEmp?.name || "Destination"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" /> Requested: {new Date(t.request_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={t.status === "Pending" ? "outline" : "default"}
                    className={
                      t.status === "Pending"
                        ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-transparent"
                        : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-transparent"
                    }
                  >
                    {t.status}
                  </Badge>

                  {t.status === "Pending" && (
                    <div className="flex gap-2">
                      {isAdminOrManager ? (
                        <Button
                          size="sm"
                          className="h-9 px-3 gap-1"
                          onClick={() => approveTransferMutation.mutate(t.id)}
                          disabled={approveTransferMutation.isPending}
                        >
                          <Check className="size-3.5" /> Approve
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                          <ShieldAlert className="size-3" /> Approval pending
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* REQUEST DIALOG */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Request Asset Transfer</DialogTitle>
            <DialogDescription>
              Initiate transfer of a currently allocated asset to another employee.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formAssetId || !formToEmployeeId) {
                toast.error("Please select both the asset and destination employee.");
                return;
              }
              requestTransferMutation.mutate({
                asset_id: Number(formAssetId),
                to_employee: Number(formToEmployeeId),
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="asset-select">Select Allocated Asset *</Label>
              <Select value={formAssetId} onValueChange={setFormAssetId}>
                <SelectTrigger id="asset-select">
                  <SelectValue placeholder="Choose asset to transfer" />
                </SelectTrigger>
                <SelectContent>
                  {allocatedAssets.length === 0 ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      No assets are currently allocated.
                    </div>
                  ) : (
                    allocatedAssets.map((a) => {
                      const holder = employees?.find((e) => e.id === a.holder_id);
                      return (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.asset_tag} — {a.name} (Held by: {holder?.name || "Unknown"})
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {currentHolderObj && (
              <div className="bg-muted/40 border border-border p-3 rounded-lg flex items-center gap-2 text-xs">
                <AlertCircle className="size-4 text-amber-500 shrink-0" />
                <div>
                  <span className="font-semibold">Current Holder: </span>
                  {currentHolderObj.name} ({currentHolderObj.email})
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="to-employee-select">Transfer To Employee *</Label>
              <Select value={formToEmployeeId} onValueChange={setFormToEmployeeId} disabled={!formAssetId}>
                <SelectTrigger id="to-employee-select">
                  <SelectValue placeholder="Choose destination employee" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={requestTransferMutation.isPending || !formAssetId || !formToEmployeeId}>
                {requestTransferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
