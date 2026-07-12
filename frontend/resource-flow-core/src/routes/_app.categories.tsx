import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Tag, Search, Plus, Loader2, Edit3, Trash2
} from "lucide-react";
import { api, extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/categories")({
  head: () => ({
    meta: [
      { title: "Categories — AssetFlow" },
      { name: "description", content: "Configure asset classes and descriptions." },
    ],
  }),
  component: CategoriesPage,
});

interface Category {
  id: number;
  name: string;
  description: string | null;
}

function CategoriesPage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const isAdminOrManager = role === "admin" || role === "asset_manager";

  // Queries
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories/");
      return res.data;
    },
  });

  // Mutations
  const createCatMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/categories/", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Category created successfully");
      setIsAddOpen(false);
      setFormName("");
      setFormDesc("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to create category"));
    },
  });

  const updateCatMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.put(`/categories/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Category updated successfully");
      setIsEditOpen(false);
      setEditingCat(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to update category"));
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to delete category"));
    },
  });

  function openAdd() {
    setFormName("");
    setFormDesc("");
    setIsAddOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingCat(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setIsEditOpen(true);
  }

  const filteredCats = (categories || []).filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Settings</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Configure asset classes to classify resources, filter tracking metrics, and align lifecycle defaults.
          </p>
        </div>
        {isAdminOrManager && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" /> Add category
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search categories…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      {categoriesLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredCats.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <Tag className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No categories found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create categories to classify your assets (e.g. Laptops, Office Supplies).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCats.map((cat) => (
            <motion.div
              key={cat.id}
              className="surface-card p-5 space-y-4 hover:border-primary/30 transition-colors flex flex-col justify-between"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-foreground text-base flex items-center gap-1.5">
                    <Tag className="size-4 text-primary" /> {cat.name}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cat.description || "No description provided."}
                </p>
              </div>

              {isAdminOrManager && (
                <div className="flex gap-2 pt-3 border-t border-border/60">
                  <Button variant="outline" size="sm" className="h-8 text-xs flex-1 gap-1" onClick={() => openEdit(cat)}>
                    <Edit3 className="size-3" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/20 gap-1 shrink-0"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this category?")) {
                        deleteCatMutation.mutate(cat.id);
                      }
                    }}
                    disabled={deleteCatMutation.isPending}
                  >
                    <Trash2 className="size-3" /> Delete
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
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new category for classifying assets.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formName.trim()) {
                toast.error("Category name is required.");
                return;
              }
              createCatMutation.mutate({
                name: formName.trim(),
                description: formDesc.trim() || null,
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <Label htmlFor="name">Category Name *</Label>
              <Input id="name" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. AV Hardware" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe what falls under this class" rows={3} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCatMutation.isPending}>
                {createCatMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Modify name or description for this category.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingCat) return;
              if (!formName.trim()) {
                toast.error("Category name is required.");
                return;
              }
              updateCatMutation.mutate({
                id: editingCat.id,
                payload: {
                  name: formName.trim(),
                  description: formDesc.trim() || null,
                },
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input id="edit-name" required value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateCatMutation.isPending}>
                {updateCatMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
