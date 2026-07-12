import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CalendarClock, Search, Plus, Loader2, Calendar, Clock, FileText, User
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

export const Route = createFileRoute("/_app/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — AssetFlow" },
      { name: "description", content: "Schedule and manage bookings for shareable company resources." },
    ],
  }),
  component: BookingsPage,
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

interface Booking {
  id: number;
  resource_id: number;
  employee_id: number;
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
}

function BookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Form Fields
  const [formResourceId, setFormResourceId] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formPurpose, setFormPurpose] = useState("");

  // Queries
  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["bookings"],
    queryFn: async () => {
      const res = await api.get("/booking/");
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
  const bookMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/booking/", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Resource booked successfully");
      setIsBookOpen(false);
      // Reset form
      setFormResourceId("");
      setFormEmployeeId("");
      setFormStartTime("");
      setFormEndTime("");
      setFormPurpose("");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-audits"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to create booking"));
    },
  });

  // Shareable / Bookable resources
  const bookableResources = (assets || []).filter((a) => a.is_bookable);

  // Filtered Bookings
  const filteredBookings = (bookings || []).filter((booking) => {
    const assetObj = assets?.find((a) => a.id === booking.resource_id);
    const employeeObj = employees?.find((e) => e.id === booking.employee_id);

    const assetName = assetObj?.name || "";
    const assetTag = assetObj?.asset_tag || "";
    const employeeName = employeeObj?.name || "";

    const matchesSearch =
      assetName.toLowerCase().includes(search.toLowerCase()) ||
      assetTag.toLowerCase().includes(search.toLowerCase()) ||
      employeeName.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Reserve company resources, meeting spaces, or shared devices for specific timeslots.
          </p>
        </div>
        <Button onClick={() => setIsBookOpen(true)} className="gap-2" disabled={bookableResources.length === 0}>
          <Plus className="size-4" /> Book resource
        </Button>
      </div>

      {/* Search Row */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-surface border border-border p-4 rounded-xl">
        <div className="relative w-full max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by resource, tag, employee…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings List */}
      {bookingsLoading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <CalendarClock className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No bookings scheduled</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No upcoming or historical bookings found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const assetObj = assets?.find((a) => a.id === b.resource_id);
            const employeeObj = employees?.find((e) => e.id === b.employee_id);

            const startStr = new Date(b.start_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
            const endStr = new Date(b.end_time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

            return (
              <motion.div
                key={b.id}
                className="surface-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold font-mono text-primary bg-primary-soft px-2 py-0.5 rounded">
                      {assetObj?.asset_tag || "RESOURCE"}
                    </span>
                    <h4 className="text-sm font-semibold truncate text-foreground">
                      {assetObj?.name || "Shared Resource"}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                    <span className="text-foreground font-medium flex items-center gap-1">
                      <User className="size-3.5 text-muted-foreground" /> {employeeObj?.name || "Employee"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" /> {startStr} — {endStr}
                    </span>
                  </div>
                  {b.purpose && (
                    <p className="text-xs text-muted-foreground/80 flex items-start gap-1 bg-muted/30 p-2 rounded border border-border/40 mt-1 max-w-2xl">
                      <FileText className="size-3.5 mt-0.5 shrink-0" />
                      <span>Purpose: "{b.purpose}"</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-transparent capitalize"
                  >
                    {b.status}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* BOOK DIALOG */}
      <Dialog open={isBookOpen} onOpenChange={setIsBookOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Book Shareable Resource</DialogTitle>
            <DialogDescription>
              Schedule a specific time slot to reserve a shareable company asset.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formResourceId || !formEmployeeId || !formStartTime || !formEndTime || !formPurpose) {
                toast.error("Please fill in all fields.");
                return;
              }
              if (new Date(formStartTime) >= new Date(formEndTime)) {
                toast.error("Start time must be before end time.");
                return;
              }
              bookMutation.mutate({
                resource_id: Number(formResourceId),
                employee_id: Number(formEmployeeId),
                start_time: new Date(formStartTime).toISOString(),
                end_time: new Date(formEndTime).toISOString(),
                purpose: formPurpose.trim(),
              });
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="resource-select">Select Resource *</Label>
              <Select value={formResourceId} onValueChange={setFormResourceId}>
                <SelectTrigger id="resource-select">
                  <SelectValue placeholder="Choose a bookable resource" />
                </SelectTrigger>
                <SelectContent>
                  {bookableResources.map((res) => (
                    <SelectItem key={res.id} value={String(res.id)}>
                      {res.asset_tag} — {res.name} ({res.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employee-select">Select Employee *</Label>
              <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                <SelectTrigger id="employee-select">
                  <SelectValue placeholder="Choose employee reserving" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start-time">Start Time *</Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  required
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-time">End Time *</Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  required
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose *</Label>
              <Textarea
                id="purpose"
                required
                placeholder="e.g. Project briefing video call, client presentation, field survey work"
                value={formPurpose}
                onChange={(e) => setFormPurpose(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsBookOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={bookMutation.isPending || !formResourceId || !formEmployeeId}>
                {bookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
