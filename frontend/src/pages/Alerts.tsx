import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarClock,
  MessageSquareText,
  UserPlus,
  Info,
  CheckCircle2,
  Check,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/useApi";
import { api } from "@/lib/api";
import { notificationTargetPath } from "@/lib/notifications";
import { Card, EmptyState, Spinner } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { AppNotification, NotificationType } from "@/types";

const ICONS: Record<NotificationType, typeof Bell> = {
  DEADLINE: CalendarClock,
  FEEDBACK: MessageSquareText,
  ASSIGNMENT: UserPlus,
  SYSTEM: Info,
  APPROVAL: CheckCircle2,
};

const ICON_STYLES: Record<NotificationType, string> = {
  DEADLINE: "bg-crimson-50 text-crimson-600",
  FEEDBACK: "bg-royal-50 text-royal-600",
  ASSIGNMENT: "bg-gold-100 text-gold-700",
  SYSTEM: "bg-slate-100 text-slate-500",
  APPROVAL: "bg-emerald-50 text-emerald-600",
};

export default function Alerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi<AppNotification[]>("/notifications");

  const notifications = data || [];
  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
    reload();
  };

  const markAll = async () => {
    await api.post("/notifications/read-all");
    reload();
  };

  const openNotification = (n: AppNotification) => {
    if (!user) return;
    const path = notificationTargetPath(n, user.role);

    if (!n.read) {
      api.patch(`/notifications/${n.id}/read`).finally(() => reload());
    }

    navigate(path);
  };

  if (loading) return <Spinner label="Loading alerts..." />;
  if (error) return <EmptyState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Alert Center</h1>
          <p className="text-sm text-slate-500">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "You're all caught up."}
          </p>
        </div>
        {unread > 0 && (
          <button type="button" className="btn-outline" onClick={markAll}>
            <Check size={16} /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="No notifications yet." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <Card
                key={n.id}
                role="link"
                tabIndex={0}
                onClick={() => openNotification(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openNotification(n);
                  }
                }}
                className={`flex cursor-pointer items-start gap-4 !p-4 transition hover:border-campus-maroon/30 hover:shadow-soft ${
                  !n.read ? "border-l-4 border-l-crimson-600" : ""
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ICON_STYLES[n.type]}`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-crimson-600" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.read && (
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-crimson-700 hover:bg-crimson-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        markRead(n.id);
                      }}
                    >
                      Mark read
                    </button>
                  )}
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
