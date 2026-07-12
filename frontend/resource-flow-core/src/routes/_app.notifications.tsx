import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell, Check, Loader2, Calendar, MailOpen
} from "lucide-react";
import { api, extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — AssetFlow" },
      { name: "description", content: "Stay updated on recent events, approvals, and reminders." },
    ],
  }),
  component: NotificationsPage,
});

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const { data: notifications, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications/");
      return res.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.put(`/notifications/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Notification marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      toast.error(extractApiError(err, "Failed to mark read"));
    },
  });

  const filteredNotifications = (notifications || []).filter((item) => {
    if (filter === "unread") return !item.is_read;
    if (filter === "read") return item.is_read;
    return true;
  });

  return (
    <div className="mx-auto max-w-[800px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inbox</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            System updates, pending approvals, and allocation schedules requiring your attention.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          className="h-9 px-4 text-xs font-semibold"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "ghost"}
          className="h-9 px-4 text-xs font-semibold gap-1.5"
          onClick={() => setFilter("unread")}
        >
          Unread
          {notifications && notifications.filter((n) => !n.is_read).length > 0 && (
            <Badge className="bg-primary hover:bg-primary text-primary-foreground text-[10px] size-4 p-0 flex items-center justify-center rounded-full">
              {notifications.filter((n) => !n.is_read).length}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === "read" ? "default" : "ghost"}
          className="h-9 px-4 text-xs font-semibold"
          onClick={() => setFilter("read")}
        >
          Read
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-[20vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="surface-card p-12 text-center flex flex-col items-center">
          <Bell className="size-12 text-muted-foreground opacity-50 mb-3" />
          <h3 className="text-lg font-semibold">No notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You are all caught up! No notifications match the selected status.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const timeStr = new Date(item.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <motion.div
                key={item.id}
                className={`surface-card p-4 flex items-start justify-between gap-4 transition-colors ${
                  !item.is_read ? "border-l-4 border-l-primary" : "opacity-85"
                }`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-semibold ${!item.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {item.title}
                    </h4>
                    {!item.is_read && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                    <Calendar className="size-3" /> {timeStr}
                  </span>
                </div>

                {!item.is_read && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-full hover:bg-primary-soft text-primary shrink-0"
                    onClick={() => markReadMutation.mutate(item.id)}
                    title="Mark as read"
                  >
                    <Check className="size-4" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
