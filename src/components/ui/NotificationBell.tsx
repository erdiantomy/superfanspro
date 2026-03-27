import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount, useNotificationRealtime } from "@/hooks/useNotifications";

interface NotificationBellProps {
  onClick?: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const { user } = useAuth();
  const { data: count = 0 } = useUnreadCount(user?.id);

  // Subscribe to realtime notifications (toast + cache invalidation)
  useNotificationRealtime(user?.id);

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-[34px] h-[34px] rounded-full bg-card border border-subtle"
      aria-label="Notifications"
    >
      <Bell className="w-4 h-4 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
