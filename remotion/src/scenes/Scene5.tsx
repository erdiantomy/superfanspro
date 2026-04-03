import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";

const { fontFamily: display } = loadFont("normal", { weights: ["700", "800", "900"], subsets: ["latin"] });

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo
  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Big text
  const textScale = spring({ frame: frame - 30, fps, config: { damping: 15, stiffness: 120 } });
  const textOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // URL
  const urlOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlY = interpolate(spring({ frame: frame - 60, fps, config: { damping: 20 } }), [0, 1], [20, 0]);

  // Glow pulse
  const glowPulse = interpolate(Math.sin(frame * 0.06), [-1, 1], [0.6, 1]);

  // Final fade out
  const endFade = interpolate(frame, [140, 170], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: "transparent",
        opacity: endFade,
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,230,77,0.15) 0%, transparent 70%)",
          opacity: glowPulse * 0.5,
        }}
      />

      {/* Logo */}
      <Img
        src={staticFile("images/logo.png")}
        style={{
          width: 350,
          objectFit: "contain",
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          marginBottom: 30,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          fontFamily: display,
          fontSize: 64,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          lineHeight: 1.1,
          transform: `scale(${textScale})`,
          opacity: textOpacity,
          letterSpacing: 3,
        }}
      >
        SUPPORT YOUR
        <br />
        <span style={{ color: "#00E64D" }}>CHAMPION</span>
      </div>

      {/* URL */}
      <div
        style={{
          marginTop: 40,
          padding: "14px 40px",
          borderRadius: 50,
          background: "rgba(0,230,77,0.1)",
          border: "1px solid rgba(0,230,77,0.3)",
          fontFamily: display,
          fontSize: 24,
          fontWeight: 700,
          color: "#00E64D",
          letterSpacing: 2,
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
        }}
      >
        superfans.games
      </div>
    </AbsoluteFill>
  );
};
