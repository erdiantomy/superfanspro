import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { type Match, type Player } from "@/hooks/useData";
import logo from "@/assets/superfans-logo.png";
import { AnimatePresence, motion } from "framer-motion";
import { screenTransition } from "@/components/fanprize/MotionVariants";
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

const Index = () => {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [match, setMatch] = useState<Match | null>(null);
  const [nav, setNav] = useState("home");
  const [modal, setModal] = useState<{ m: Match; p: Player } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ height: "100dvh" }}>
        <img src={logo} alt="SuperFans" className="h-12" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const goNav = (id: string) => {
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
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="h-full"
          {...screenTransition}
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
