import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { type Match, type Player } from "@/hooks/useData";
import logo from "@/assets/superfans-logo.png";
import { AnimatePresence, motion } from "framer-motion";
import { screenTransition, directionalTransition } from "@/components/fanprize/MotionVariants";
import AuthScreen from "@/pages/AuthScreen";
import HomeScreen from "@/components/fanprize/HomeScreen";
import MatchDetail from "@/components/fanprize/MatchDetail";
import MatchResultScreen from "@/components/fanprize/MatchResultScreen";
import WalletScreen from "@/components/fanprize/WalletScreen";
import StoreScreen from "@/components/fanprize/StoreScreen";
import ProfileScreen from "@/components/fanprize/ProfileScreen";
import AdminPanel from "@/pages/AdminPanel";
import BottomNav from "@/components/fanprize/BottomNav";
import SupportModal from "@/components/fanprize/SupportModal";

type Screen = "home" | "matchDetail" | "matchResult" | "wallet" | "store" | "profile" | "admin";

const NAV_ORDER: Record<string, number> = { home: 0, matches: 0, wallet: 1, store: 2, profile: 3, admin: 4 };

const Index = () => {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [match, setMatch] = useState<Match | null>(null);
  const [nav, setNav] = useState("home");
  const [direction, setDirection] = useState(0);
  const [modal, setModal] = useState<{ m: Match; p: Player } | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || loading) {
    return (
      <AnimatePresence>
        {(showSplash || loading) && (
          <motion.div
            key="splash"
            className="min-h-screen bg-background flex flex-col items-center justify-center gap-6"
            style={{ height: "100dvh" }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <motion.img
              src={logo}
              alt="SuperFans"
              className="w-64"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            />
            <motion.div
              className="flex gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-green"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const goNav = (id: string) => {
    const oldOrder = NAV_ORDER[nav] ?? 0;
    const newOrder = NAV_ORDER[id] ?? 0;
    setDirection(newOrder >= oldOrder ? 1 : -1);
    setNav(id);
    const map: Record<string, Screen> = { home: "home", matches: "home", wallet: "wallet", store: "store", profile: "profile", admin: "admin" };
    setScreen(map[id] || "home");
  };

  const renderScreen = () => {
    if (screen === "matchResult" && match) {
      return (
        <MatchResultScreen
          key="matchResult"
          m={match}
          onBack={() => { setScreen("home"); setNav("home"); }}
        />
      );
    }
    if (screen === "matchDetail" && match) {
      return (
        <MatchDetail
          key="matchDetail"
          m={match}
          onBack={() => { setScreen("home"); setNav("home"); }}
          onSupport={(m, p) => setModal({ m, p })}
        />
      );
    }
    if (screen === "admin") return <AdminPanel key="admin" onBack={() => { setScreen("home"); setNav("home"); }} />;
    if (screen === "wallet") return <WalletScreen key="wallet" />;
    if (screen === "store") return <StoreScreen key="store" />;
    if (screen === "profile") return <ProfileScreen key="profile" />;
    return (
      <HomeScreen
        key="home"
        onPick={m => { setMatch(m); setScreen(m.status === "finished" ? "matchResult" : "matchDetail"); }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto relative overflow-hidden" style={{ height: "100dvh" }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          className="h-full"
          {...directionalTransition(direction)}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      <BottomNav active={nav} onNav={goNav} />
      {modal && (
        <SupportModal
          m={modal.m}
          p={modal.p}
          onClose={() => setModal(null)}
          onConfirm={() => setModal(null)}
        />
      )}
    </div>
  );
};

export default Index;
