import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2, Search, Plus, Loader2, Edit3, ShieldAlert
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

export const Route = createFileRoute("/_app/departments")({
  head: () => ({
    meta: [
      { title: "Departments — AssetFlow" },
      { name: "description", content: "Organize asset flows by managing enterprise departments." },
    ],
  }),
  component: DepartmentsPage,
});

interface Department {
  id: number;
  name: string;
  parent_department: string | null;
  status: string;
}

function DepartmentsPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formParent, setFormParent] = useState("");
  const [formStatus, setFormStatus] = useState("Active");

  const isAdminOrManager = role === "admin" || role === "asset_manager";

  // Queries
  const { data: departments, isLoading: deptsLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments/");
      return res.data;
    },
  });

  // Mutations
  const createDeptMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/departments/", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Department created successfully");
      setIsAddOpen(false);
      setFormName("");
      setFormParent("");
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to create department"));
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.put(`/departments/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Department updated successfully");
      setIsEditOpen(false);
      setEditingDept(null);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to update department"));
    },
  });

  function openAdd() {
    setFormName("");
    setFormParent("");
    setIsAddOpen(true);
  }

  function openEdit(dept: Department) {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormParent(dept.parent_department || "");
    setFormStatus(dept.status);
    setIsEditOpen(true);
  }

  const filteredDepts = (departments || []).filter((dept) =>
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    (dept.parent_department && dept.parent_department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Organization</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Configure organizational divisions and parent hierarchies to align asset holdings.
          </p>
        </div>
        {isAdminOrManager && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" /> Add department
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search departments…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Departments Grid */}
      {deptsLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <Building2 className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No departments found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create departments to group your employees and assets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.map((dept) => (
            <motion.div
              key={dept.id}
              className="surface-card p-5 space-y-4 hover:border-primary/30 transition-colors flex flex-col justify-between"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-foreground text-base">{dept.name}</h4>
                  <Badge
                    variant={dept.status === "Active" ? "secondary" : "outline"}
                    className={
                      dept.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-transparent text-[10px]"
                        : "bg-muted text-muted-foreground text-[10px]"
                    }
                  >
                    {dept.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Parent Hierarchy: <span className="font-medium text-foreground">{dept.parent_department || "None (Root)"}</span>
                </div>
              </div>

              {isAdminOrManager && (
                <div className="flex gap-2 pt-3 border-t border-border/60">
                  <Button variant="outline" size="sm" className="h-8 text-xs flex-1 gap-1" onClick={() => openEdit(dept)}>
                    <Edit3 className="size-3" /> Edit department
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ADD DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new organizational business unit.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formName.trim()) {
                toast.error("Department name is required.");
                return;
              }
              createDeptMutation.mutate({
                name: formName.trim(),
                parent_department: formParent.trim() || null,
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <Label htmlFor="name">Department Name *</Label>
              <Input id="name" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Research & Development" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="parent">Parent Department (Optional)</Label>
              <Input id="parent" value={formParent} onChange={(e) => setFormParent(e.target.value)} placeholder="e.g. Engineering" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createDeptMutation.isPending}>
                {createDeptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Modify department parameters or status.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingDept) return;
              if (!formName.trim()) {
                toast.error("Department name is required.");
                return;
              }
              updateDeptMutation.mutate({
                id: editingDept.id,
                payload: {
                  name: formName.trim(),
                  parent_department: formParent.trim() || null,
                  status: formStatus,
                },
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input id="edit-name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-parent">Parent Department (Optional)</Label>
              <Input id="edit-parent" value={formParent} onChange={(e) => setFormParent(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateDeptMutation.isPending}>
                {updateDeptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
