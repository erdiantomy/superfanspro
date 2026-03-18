import { useState } from "react";
import { type Match, type Player } from "@/data/constants";
import HomeScreen from "@/components/fanprize/HomeScreen";
import MatchDetail from "@/components/fanprize/MatchDetail";
import MatchResultScreen from "@/components/fanprize/MatchResultScreen";
import WalletScreen from "@/components/fanprize/WalletScreen";
import StoreScreen from "@/components/fanprize/StoreScreen";
import ProfileScreen from "@/components/fanprize/ProfileScreen";
import BottomNav from "@/components/fanprize/BottomNav";
import SupportModal from "@/components/fanprize/SupportModal";

type Screen = "home" | "matchDetail" | "matchResult" | "wallet" | "store" | "profile";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [match, setMatch] = useState<Match | null>(null);
  const [nav, setNav] = useState("home");
  const [modal, setModal] = useState<{ m: Match; p: Player } | null>(null);

  const goNav = (id: string) => {
    setNav(id);
    const map: Record<string, Screen> = { home: "home", matches: "home", wallet: "wallet", store: "store", profile: "profile" };
    setScreen(map[id] || "home");
  };

  const renderScreen = () => {
    if (screen === "matchResult" && match) {
      return (
        <MatchResultScreen
          m={match}
          onBack={() => { setScreen("home"); setNav("home"); }}
        />
      );
    }
    if (screen === "matchDetail" && match) {
      return (
        <MatchDetail
          m={match}
          onBack={() => { setScreen("home"); setNav("home"); }}
          onSupport={(m, p) => setModal({ m, p })}
        />
      );
    }
    if (screen === "wallet") return <WalletScreen />;
    if (screen === "store") return <StoreScreen />;
    if (screen === "profile") return <ProfileScreen />;
    return (
      <HomeScreen
        onPick={m => { setMatch(m); setScreen(m.status === "finished" ? "matchResult" : "matchDetail"); }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto relative overflow-hidden" style={{ height: "100dvh" }}>
      {renderScreen()}
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
