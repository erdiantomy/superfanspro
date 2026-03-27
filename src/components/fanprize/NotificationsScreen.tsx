import { motion } from "framer-motion";
import { ArrowLeft, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  NOTIFICATION_ICONS,
} from "@/hooks/useNotifications";
import { container, item } from "./MotionVariants";

interface Props {
  onBack: () => void;
  onPreferences: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen({ onBack, onPreferences }: Props) {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead(user?.id);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      className="px-5 pt-5 pb-24 overflow-y-auto h-full no-scrollbar"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-[22px] font-black">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-[12px] text-green font-semibold"
              disabled={markAllRead.isPending}
            >
              Mark all read
            </button>
          )}
          <button onClick={onPreferences} className="text-muted-foreground">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <motion.div variants={item} className="text-center py-12">
          <div className="text-label text-[14px]">Loading...</div>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <motion.div variants={item} className="text-center py-16">
          <div className="text-[48px] mb-3">{"\uD83D\uDD14"}</div>
          <div className="text-label text-[14px]">No notifications yet</div>
          <div className="text-label text-[12px] mt-1 text-muted-foreground">
            You'll see updates about your sessions, scores, and support here.
          </div>
        </motion.div>
      )}

      {/* Notification list */}
      {notifications.map((n) => {
        const icon = NOTIFICATION_ICONS[n.type] || "\uD83D\uDD14";
        return (
          <motion.div
            key={n.id}
            variants={item}
            onClick={() => {
              if (!n.read) markRead.mutate(n.id);
            }}
            className={`flex items-start gap-3 py-3.5 border-b border-border cursor-pointer ${
              !n.read ? "bg-green/5" : ""
            }`}
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-full bg-card border border-subtle flex items-center justify-center text-[18px] flex-shrink-0 mt-0.5">
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[14px] font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                  {n.title}
                </span>
                {!n.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-green flex-shrink-0 mt-1.5" />
                )}
              </div>
              <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                {n.body}
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">
                {timeAgo(n.created_at)}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
