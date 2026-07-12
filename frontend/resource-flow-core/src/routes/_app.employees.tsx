import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users, Search, UserPlus, Loader2, Edit2, Trash2, Mail, Briefcase, Building
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
import { useAuth, roleLabel } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/employees")({
  head: () => ({
    meta: [
      { title: "Employees — AssetFlow" },
      { name: "description", content: "Manage organizational roles, departments, and user profiles." },
    ],
  }),
  component: EmployeesPage,
});

interface Department {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number | null;
  is_active: boolean;
}

function EmployeesPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("employee");
  const [formDept, setFormDept] = useState("unassigned");
  const [formActive, setFormActive] = useState(true);

  const isAdmin = role === "admin";

  // Queries
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees/");
      return res.data;
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments/");
      return res.data;
    },
  });

  // Mutations
  const signupMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/auth/signup", payload);
      return res.data;
    },
    onSuccess: (newUser) => {
      // If we need to assign department or role, we do a subsequent update since signup only creates base credentials
      if (formRole !== "employee" || formDept !== "unassigned") {
        updateMutation.mutate({
          id: newUser.id,
          payload: {
            name: formName.trim(),
            email: formEmail.trim(),
            role: formRole,
            department_id: formDept === "unassigned" ? null : Number(formDept),
            is_active: true,
          },
        });
      } else {
        toast.success("Employee registered successfully");
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      }
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to register employee"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.put(`/employees/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Employee updated successfully");
      setIsAddOpen(false);
      setIsEditOpen(false);
      setEditingEmployee(null);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to update employee"));
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      toast.success("Employee deactivated");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to deactivate employee"));
    },
  });

  // Handlers
  function openAdd() {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("employee");
    setFormDept("unassigned");
    setIsAddOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormRole(emp.role);
    setFormDept(emp.department_id ? String(emp.department_id) : "unassigned");
    setFormActive(emp.is_active);
    setIsEditOpen(true);
  }

  // Filtered employees list
  const filteredEmployees = (employees || []).filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Organization</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Directory of organization members, roles management, and department allocations.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd} className="gap-2">
            <UserPlus className="size-4" /> Add employee
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Directory Grid */}
      {employeesLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <Users className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No employees found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const deptObj = departments?.find((d) => d.id === emp.department_id);
            return (
              <motion.div
                key={emp.id}
                className="surface-card p-5 space-y-4 hover:border-primary/30 transition-colors flex flex-col justify-between"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground text-base">{emp.name}</h4>
                      <Badge variant="outline" className="text-[10px] mt-1 uppercase tracking-wider font-mono">
                        {roleLabel(emp.role)}
                      </Badge>
                    </div>
                    <Badge
                      variant={emp.is_active ? "secondary" : "outline"}
                      className={
                        emp.is_active
                          ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-transparent text-[10px]"
                          : "bg-muted text-muted-foreground text-[10px]"
                      }
                    >
                      {emp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                    <p className="flex items-center gap-2">
                      <Mail className="size-3.5" /> {emp.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Building className="size-3.5" /> Department: <span className="font-medium text-foreground">{deptObj?.name || "Unassigned"}</span>
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex gap-2 pt-3 border-t border-border/60">
                    <Button variant="outline" size="sm" className="h-8 text-xs flex-1 gap-1" onClick={() => openEdit(emp)}>
                      <Edit2 className="size-3" /> Edit
                    </Button>
                    {emp.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/20 gap-1 shrink-0"
                        onClick={() => {
                          if (confirm(`Deactivate account for ${emp.name}?`)) {
                            deactivateMutation.mutate(emp.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3" /> Deactivate
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ADD DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Register Employee</DialogTitle>
            <DialogDescription>
              Create credentials and assign department roles.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formName || !formEmail || !formPassword) {
                toast.error("Please fill in name, email, and password.");
                return;
              }
              signupMutation.mutate({
                name: formName.trim(),
                email: formEmail.trim(),
                password: formPassword,
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Aditi Sharma" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="aditi@company.com" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Temporary Password *</Label>
              <Input id="password" type="password" required value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="role-select">Role</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger id="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="asset_manager">Asset Manager</SelectItem>
                    <SelectItem value="department_head">Department Head</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dept-select">Department</Label>
                <Select value={formDept} onValueChange={setFormDept}>
                  <SelectTrigger id="dept-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={signupMutation.isPending || updateMutation.isPending}>
                {(signupMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit Profile details</DialogTitle>
            <DialogDescription>
              Modify name, department, role, or status parameters.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingEmployee) return;
              updateMutation.mutate({
                id: editingEmployee.id,
                payload: {
                  name: formName.trim(),
                  email: formEmail.trim(),
                  role: formRole,
                  department_id: formDept === "unassigned" ? null : Number(formDept),
                  is_active: formActive,
                },
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input id="edit-name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input id="edit-email" type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-role">Role *</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="asset_manager">Asset Manager</SelectItem>
                    <SelectItem value="department_head">Department Head</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-dept">Department</Label>
                <Select value={formDept} onValueChange={setFormDept}>
                  <SelectTrigger id="edit-dept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Account Status</Label>
              <Select value={formActive ? "true" : "false"} onValueChange={(v) => setFormActive(v === "true")}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive / Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Details
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
