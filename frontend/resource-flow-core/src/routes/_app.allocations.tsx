import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  UserCheck, Search, Plus, Loader2, ArrowLeftRight, Check, X, Calendar, FileText
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
import { toast } from "sonner";

export const Route = createFileRoute("/_app/allocations")({
  head: () => ({
    meta: [
      { title: "Allocations — AssetFlow" },
      { name: "description", content: "Assign assets to employees and manage returns." },
    ],
  }),
  component: AllocationsPage,
});

interface Category {
  id: number;
  name: string;
}

interface Department {
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
  department?: Department;
}

interface Allocation {
  id: number;
  asset_id: number;
  employee_id: number;
  allocated_date: string;
  expected_return: string;
  returned_date: string | null;
  remarks?: string;
  asset?: Asset;
  employee?: User;
}

function AllocationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);

  // Form Fields
  const [formAssetId, setFormAssetId] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formExpectedReturn, setFormExpectedReturn] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  // Queries
  const { data: allocations, isLoading: allocsLoading } = useQuery<Allocation[]>({
    queryKey: ["allocations"],
    queryFn: async () => {
      const res = await api.get("/allocation/");
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
  const allocateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/allocation/", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Asset allocated successfully");
      setIsAllocateOpen(false);
      // Reset form
      setFormAssetId("");
      setFormEmployeeId("");
      setFormExpectedReturn("");
      setFormRemarks("");
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to allocate asset"));
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/allocation/return/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Asset returned successfully");
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to process asset return"));
    },
  });

  // Available Assets for dropdown
  const availableAssets = (assets || []).filter((a) => a.status === "Available");

  // Filtered allocations
  const filteredAllocs = (allocations || []).filter((alloc) => {
    // Resolve asset name and employee name
    const asset = assets?.find((a) => a.id === alloc.asset_id);
    const emp = employees?.find((e) => e.id === alloc.employee_id);

    const assetName = asset?.name || "";
    const assetTag = asset?.asset_tag || "";
    const employeeName = emp?.name || "";

    const matchesSearch =
      assetName.toLowerCase().includes(search.toLowerCase()) ||
      assetTag.toLowerCase().includes(search.toLowerCase()) ||
      employeeName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = showHistory ? alloc.returned_date !== null : alloc.returned_date === null;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Allocations</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Track assets issued to employees, monitor estimated return schedules, and process returns.
          </p>
        </div>
        <Button onClick={() => setIsAllocateOpen(true)} className="gap-2">
          <Plus className="size-4" /> New allocation
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset, tag, or employee…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={!showHistory ? "default" : "outline"}
            className="h-10"
            onClick={() => setShowHistory(false)}
          >
            Active Allocations
          </Button>
          <Button
            variant={showHistory ? "default" : "outline"}
            className="h-10"
            onClick={() => setShowHistory(true)}
          >
            Return History
          </Button>
        </div>
      </div>

      {/* Allocation List */}
      {allocsLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredAllocs.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <UserCheck className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No allocations found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {showHistory ? "There are no historical records of returned assets." : "All assets are currently in stock."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAllocs.map((alloc) => {
            const assetObj = assets?.find((a) => a.id === alloc.asset_id);
            const employeeObj = employees?.find((e) => e.id === alloc.employee_id);

            return (
              <motion.div
                key={alloc.id}
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
                      {assetObj?.name || "Asset details not loaded"}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span className="text-foreground font-medium">
                      👤 {employeeObj?.name || "Employee"} · {employeeObj?.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" /> Issued: {new Date(alloc.allocated_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" /> Due: {new Date(alloc.expected_return).toLocaleDateString()}
                    </span>
                    {alloc.returned_date && (
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        ✓ Returned: {new Date(alloc.returned_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {alloc.remarks && (
                    <p className="text-xs text-muted-foreground/80 flex items-start gap-1 bg-muted/30 p-2 rounded border border-border/40 mt-1 max-w-2xl">
                      <FileText className="size-3.5 mt-0.5 shrink-0" />
                      <span>Remarks: "{alloc.remarks}"</span>
                    </p>
                  )}
                </div>

                {!alloc.returned_date && (
                  <div className="flex shrink-0">
                    <Button
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 h-9 gap-1.5"
                      onClick={() => {
                        if (confirm(`Mark ${assetObj?.name || "this asset"} as returned?`)) {
                          returnMutation.mutate(alloc.id);
                        }
                      }}
                      disabled={returnMutation.isPending}
                    >
                      Process Return
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ALLOCATE DIALOG */}
      <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Allocate Asset</DialogTitle>
            <DialogDescription>
              Assign an available physical asset to an organization employee.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formAssetId || !formEmployeeId || !formExpectedReturn) {
                toast.error("Please fill in all fields.");
                return;
              }
              allocateMutation.mutate({
                asset_id: Number(formAssetId),
                employee_id: Number(formEmployeeId),
                expected_return: formExpectedReturn,
                remarks: formRemarks.trim() || null,
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="asset-select">Select Asset *</Label>
              <Select value={formAssetId} onValueChange={setFormAssetId}>
                <SelectTrigger id="asset-select">
                  <SelectValue placeholder="Choose an available asset" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.length === 0 ? (
                    <div className="p-2 text-center text-xs text-muted-foreground">
                      No assets are currently available.
                    </div>
                  ) : (
                    availableAssets.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.asset_tag} — {a.name} ({a.condition})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employee-select">Select Employee *</Label>
              <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Choose employee" />
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
              <Label htmlFor="return-date">Expected Return Date *</Label>
              <Input
                id="return-date"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formExpectedReturn}
                onChange={(e) => setFormExpectedReturn(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Include details about setup requirements or location rules"
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAllocateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={allocateMutation.isPending}>
                {allocateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Issue Asset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
