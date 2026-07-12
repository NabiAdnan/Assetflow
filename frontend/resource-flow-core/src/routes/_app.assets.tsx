import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Search, Plus, SlidersHorizontal, Trash2, Edit3, X, Check,
  Loader2, BadgeInfo, Building2, Tag, DollarSign, Activity, Wrench, ShieldCheck
} from "lucide-react";
import { api, extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assets")({
  head: () => ({
    meta: [
      { title: "Assets — AssetFlow" },
      { name: "description", content: "Manage the complete asset lifecycle across your organization." },
    ],
  }),
  component: AssetsPage,
});

interface Category {
  id: number;
  name: string;
  description?: string;
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
  holder?: User;
}

function AssetsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // Dialog/Form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formCost, setFormCost] = useState("0");
  const [formCondition, setFormCondition] = useState("Good");
  const [formBookable, setFormBookable] = useState(false);
  const [formStatus, setFormStatus] = useState("Available");

  // Queries
  const { data: assets, isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await api.get("/assets/");
      return res.data;
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories/");
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

  const { data: employees } = useQuery<User[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.get("/employees/");
      return res.data;
    },
  });

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/assets/", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Asset created successfully");
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to create asset"));
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.put(`/assets/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Asset updated successfully");
      setIsEditOpen(false);
      setSelectedAsset(null);
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to update asset"));
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      toast.success("Asset deleted");
      setSelectedAsset(null);
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to delete asset"));
    },
  });

  // Handlers
  function openCreate() {
    setFormName("");
    setFormSerial("");
    setFormCategory(categories && categories.length > 0 ? String(categories[0].id) : "");
    setFormDepartment(departments && departments.length > 0 ? String(departments[0].id) : "");
    setFormLocation("");
    setFormCost("0");
    setFormCondition("Good");
    setFormBookable(false);
    setIsCreateOpen(true);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formCategory || !formDepartment) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createAssetMutation.mutate({
      name: formName.trim(),
      serial_number: formSerial.trim() || null,
      category_id: Number(formCategory),
      department_id: Number(formDepartment),
      location: formLocation.trim() || "Headquarters",
      acquisition_cost: Number(formCost) || 0,
      condition: formCondition,
      is_bookable: formBookable,
    });
  }

  function openEdit(asset: Asset) {
    setEditAsset(asset);
    setFormName(asset.name);
    setFormSerial(asset.serial_number || "");
    setFormCategory(String(asset.category_id));
    setFormDepartment(String(asset.department_id));
    setFormLocation(asset.location);
    setFormCost(String(asset.acquisition_cost));
    setFormCondition(asset.condition);
    setFormBookable(asset.is_bookable);
    setFormStatus(asset.status);
    setIsEditOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editAsset) return;
    if (!formName || !formCategory || !formDepartment) {
      toast.error("Please fill in all required fields.");
      return;
    }
    updateAssetMutation.mutate({
      id: editAsset.id,
      payload: {
        name: formName.trim(),
        serial_number: formSerial.trim() || null,
        category_id: Number(formCategory),
        department_id: Number(formDepartment),
        location: formLocation.trim() || "Headquarters",
        acquisition_cost: Number(formCost) || 0,
        condition: formCondition,
        status: formStatus,
        is_bookable: formBookable,
      },
    });
  }

  // Filtered Assets list
  const filteredAssets = (assets || []).filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.asset_tag.toLowerCase().includes(search.toLowerCase()) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || String(asset.category_id) === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Manage the complete physical asset lifecycle, departments assignment, and conditions.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" /> Add asset
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center bg-surface border border-border p-4 rounded-xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by tag, name, serial…"
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
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Allocated">Allocated</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assets Grid & Table Layout */}
      {assetsLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <Package className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No assets found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search filters or add a new physical asset.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-2">
            {filteredAssets.map((asset) => {
              const categoryName = asset.category?.name || categories?.find((c) => c.id === asset.category_id)?.name || "Unknown";
              const departmentName = asset.department?.name || departments?.find((d) => d.id === asset.department_id)?.name || "Unassigned";
              const holderName = asset.holder?.name || employees?.find((e) => e.id === asset.holder_id)?.name || null;

              return (
                <motion.div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`surface-card p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 transition-all ${
                    selectedAsset?.id === asset.id ? "border-primary ring-1 ring-primary/20" : ""
                  }`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-mono text-primary bg-primary-soft px-2 py-0.5 rounded">
                        {asset.asset_tag}
                      </span>
                      <h4 className="text-sm font-semibold truncate text-foreground">{asset.name}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Tag className="size-3" /> {categoryName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3" /> {departmentName}
                      </span>
                      {holderName && (
                        <span className="text-primary font-medium">
                          👤 {holderName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        asset.status === "Available"
                          ? "secondary"
                          : asset.status === "Allocated"
                          ? "default"
                          : "destructive"
                      }
                      className={
                        asset.status === "Available"
                          ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-transparent"
                          : asset.status === "Allocated"
                          ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-transparent"
                          : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-transparent"
                      }
                    >
                      {asset.status}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Details Side Panel */}
          <div className="surface-card p-5 h-fit lg:sticky lg:top-20 space-y-6">
            {selectedAsset ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">{selectedAsset.asset_tag}</span>
                    <h3 className="text-lg font-semibold leading-snug mt-1">{selectedAsset.name}</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedAsset(null)} className="h-8 w-8 rounded-full">
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-y border-border py-4">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Category</div>
                    <div className="font-medium">
                      {selectedAsset.category?.name || categories?.find((c) => c.id === selectedAsset.category_id)?.name || "Unknown"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Department</div>
                    <div className="font-medium">
                      {selectedAsset.department?.name || departments?.find((d) => d.id === selectedAsset.department_id)?.name || "Unassigned"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Current Holder</div>
                    <div className="font-medium text-primary">
                      {selectedAsset.holder?.name || employees?.find((e) => e.id === selectedAsset.holder_id)?.name || "In Stock"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Location</div>
                    <div className="font-medium">{selectedAsset.location}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Acquisition Cost</div>
                    <div className="font-medium flex items-center">
                      <DollarSign className="size-3 text-muted-foreground" />
                      {selectedAsset.acquisition_cost.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Condition</div>
                    <div className="font-medium">{selectedAsset.condition}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Bookable Asset</div>
                    <div className="font-medium">{selectedAsset.is_bookable ? "Yes" : "No"}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium">{selectedAsset.status}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={() => openEdit(selectedAsset)}>
                    <Edit3 className="size-3.5" /> Edit details
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 border-destructive/20 gap-1.5"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this asset?")) {
                        deleteAssetMutation.mutate(selectedAsset.id);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                <BadgeInfo className="size-8 opacity-40 mb-2" />
                <p className="text-sm">Select an asset to view its complete record details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Create a record for a new organizational asset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Asset Name *</Label>
              <Input id="name" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. MacBook Pro 16" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="serial">Serial Number</Label>
                <Input id="serial" value={formSerial} onChange={(e) => setFormSerial(e.target.value)} placeholder="e.g. C02FG470Q..." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cost">Acquisition Cost (INR)</Label>
                <Input id="cost" type="number" value={formCost} onChange={(e) => setFormCost(e.target.value)} placeholder="e.g. 150000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="category">Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="department">Department *</Label>
                <Select value={formDepartment} onValueChange={setFormDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="condition">Condition</Label>
                <Select value={formCondition} onValueChange={setFormCondition}>
                  <SelectTrigger id="condition">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="e.g. Office Desk 4" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="bookable" checked={formBookable} onCheckedChange={(v) => setFormBookable(!!v)} />
              <Label htmlFor="bookable" className="cursor-pointer">This asset is shareable / bookable (e.g. Conference Room, Projector)</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createAssetMutation.isPending}>
                {createAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create asset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Modify asset attributes and status in the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Asset Name *</Label>
              <Input id="edit-name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-serial">Serial Number</Label>
                <Input id="edit-serial" value={formSerial} onChange={(e) => setFormSerial(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-cost">Acquisition Cost (INR)</Label>
                <Input id="edit-cost" type="number" value={formCost} onChange={(e) => setFormCost(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-department">Department *</Label>
                <Select value={formDepartment} onValueChange={setFormDepartment}>
                  <SelectTrigger id="edit-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit-condition">Condition</Label>
                <Select value={formCondition} onValueChange={setFormCondition}>
                  <SelectTrigger id="edit-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-status">Status *</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Allocated">Allocated</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-location">Location</Label>
              <Input id="edit-location" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="edit-bookable" checked={formBookable} onCheckedChange={(v) => setFormBookable(!!v)} />
              <Label htmlFor="edit-bookable" className="cursor-pointer">This asset is shareable / bookable</Label>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateAssetMutation.isPending}>
                {updateAssetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
