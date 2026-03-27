import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotificationPreferences,
  useUpsertNotificationPreferences,
  type NotificationPreferences as Prefs,
} from "@/hooks/useNotifications";
import { container, item } from "./MotionVariants";

interface Props {
  onBack: () => void;
}

const TOGGLES: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "score_approved", label: "Score & XP Results", desc: "When a match score is approved and XP credited" },
  { key: "support_payout", label: "Support Payouts", desc: "When your backed player wins or loses" },
  { key: "division_promotion", label: "Division Promotions", desc: "When you rank up to a new division" },
  { key: "session_approved", label: "Session Approvals", desc: "When your session is approved or rejected" },
  { key: "join_request", label: "Join Requests", desc: "When players request to join or you're accepted" },
  { key: "payment_completed", label: "Payments", desc: "When credits are added to your wallet" },
  { key: "monthly_prize", label: "Monthly Prizes", desc: "When monthly leaderboard prizes are awarded" },
];

export default function NotificationPreferences({ onBack }: Props) {
  const { user } = useAuth();
  const { data: prefs } = useNotificationPreferences(user?.id);
  const upsert = useUpsertNotificationPreferences();

  // Auto-create preferences row on first visit
  useEffect(() => {
    if (user?.id && prefs === null) {
      upsert.mutate({ user_id: user.id });
    }
  }, [user?.id, prefs]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key: keyof Prefs, value: boolean) => {
    if (!user?.id) return;
    upsert.mutate({ user_id: user.id, [key]: value });
  };

  const inAppEnabled = prefs?.in_app_enabled ?? true;

  return (
    <motion.div
      className="px-5 pt-5 pb-24 overflow-y-auto h-full no-scrollbar"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-[22px] font-black">Notification Settings</h1>
      </motion.div>

      {/* Master Toggle */}
      <motion.div variants={item} className="bg-card border border-subtle rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">In-App Notifications</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Show notifications in the app
            </div>
          </div>
          <Switch
            checked={inAppEnabled}
            onCheckedChange={(v) => toggle("in_app_enabled", v)}
          />
        </div>
      </motion.div>

      {/* Email Toggle (Coming Soon) */}
      <motion.div variants={item} className="bg-card border border-subtle rounded-lg p-4 mb-6 opacity-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">
              Email Notifications
              <span className="ml-2 text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                COMING SOON
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Get notified via email
            </div>
          </div>
          <Switch checked={false} disabled />
        </div>
      </motion.div>

      {/* Type Toggles */}
      <motion.div variants={item} className="mb-3">
        <div className="text-[11px] text-muted-foreground font-semibold tracking-wide mb-3">
          NOTIFICATION TYPES
        </div>
      </motion.div>

      {TOGGLES.map((t) => {
        const value = prefs ? (prefs[t.key] as boolean) : true;
        return (
          <motion.div
            key={t.key}
            variants={item}
            className="flex items-center justify-between py-3.5 border-b border-border"
          >
            <div className="flex-1 mr-3">
              <div className="text-[13px] font-medium">{t.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
            </div>
            <Switch
              checked={inAppEnabled && value}
              disabled={!inAppEnabled}
              onCheckedChange={(v) => toggle(t.key, v)}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
