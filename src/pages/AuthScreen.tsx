import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/superfans-logo.png";

export default function AuthScreen() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://game.tomspadel.com",
      },
    });
    if (error) console.error("Google sign-in error:", error);
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6"
      style={{ height: "100dvh" }}
    >
      <motion.div
        className="text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <div className="mb-8">
          <img src={logo} alt="SuperFans" className="w-80 mx-auto mb-2" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="font-display" style={{ fontSize: 28, fontWeight: 900, color: "#00E676", letterSpacing: 2, marginBottom: 6 }}>
            SIGN IN
          </div>
          <div style={{ fontSize: 13, color: "#7A8AAA", lineHeight: 1.6 }}>
            Sign in with Google to create sessions,<br />join games, and track your rankings.
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          style={{
            width: "100%", background: "#fff", border: "none",
            color: "#3c3c3c", padding: "14px 0", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, fontSize: 15, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ fontSize: 10, color: "#3A4560", marginTop: 16, lineHeight: 1.6 }}>
          By signing in you agree to Tom's Padel Arena terms.<br />
          Your Google account is linked to your player profile.
        </div>
      </motion.div>
    </div>
  );
}
