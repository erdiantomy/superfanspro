import { motion } from "framer-motion";
import { useIsAdmin } from "@/hooks/useAdmin";

interface Props {
  active: string;
  onNav: (id: string) => void;
}

const tabs = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "matches", icon: "⚔️", label: "Matches" },
  { id: "wallet", icon: "💰", label: "Wallet" },
  { id: "store", icon: "🎁", label: "Store" },
  { id: "profile", icon: "👤", label: "Profile" },
];

const adminTab = { id: "admin", icon: "⚙️", label: "Admin" };

export default function BottomNav({ active, onNav }: Props) {
  const { data: isAdmin } = useIsAdmin();
  const allTabs = isAdmin ? [...tabs, adminTab] : tabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40">
      <div className="max-w-md mx-auto flex">
        {allTabs.map(t => {
          const isActive = active === t.id;
          return (
            <motion.button
              key={t.id}
              onClick={() => onNav(t.id)}
              className="flex-1 flex flex-col items-center py-2.5 cursor-pointer relative"
              whileTap={{ scale: 0.75 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <motion.span
                className={`text-[20px] ${isActive ? "" : "opacity-50"}`}
                animate={isActive
                  ? { scale: [0.6, 1.35, 0.9, 1.1, 1], y: [0, -6, 0, -2, 0] }
                  : { scale: 1, y: 0 }
                }
                transition={isActive
                  ? { duration: 0.45, ease: "easeOut" }
                  : { duration: 0.2 }
                }
              >
                {t.icon}
              </motion.span>
              <motion.span
                className={`text-[9px] font-semibold mt-0.5 uppercase tracking-wider ${isActive ? "text-green" : "text-label"}`}
                animate={isActive
                  ? { opacity: [0, 1], y: [4, 0] }
                  : { opacity: 1, y: 0 }
                }
                transition={{ duration: 0.25, delay: isActive ? 0.15 : 0 }}
              >
                {t.label}
              </motion.span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-1/4 right-1/4 h-[2px] bg-green rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
