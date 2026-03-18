import { motion } from "framer-motion";
import { Avatar, SectionHead } from "./UIElements";
import { container, item } from "./MotionVariants";

export default function ProfileScreen() {
  const stats = [
    ["🤝", "18", "Total Supports"],
    ["🪙", "5,680", "Points Earned"],
    ["👁", "34", "Matches Watched"],
    ["🎯", "72%", "Win Rate"],
  ];
  const badges = [
    ["🏆", "Top Supporter"],
    ["🔥", "On Fire"],
    ["⚡", "Early Bird"],
    ["🌟", "VIP Fan"],
  ];

  return (
    <motion.div
      className="px-5 pt-5 pb-24 overflow-y-auto h-full no-scrollbar"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Profile Header */}
      <motion.div variants={item} className="text-center mb-6">
        <div className="inline-block relative mb-3">
          <Avatar s="TR" size={72} />
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green border-2 border-background flex items-center justify-center text-[10px]">✓</div>
        </div>
        <div className="font-display text-[26px] font-black">TomRYU</div>
        <div className="text-label text-[12px]">tom@tompadel.com</div>
        <div className="inline-flex items-center gap-1.5 mt-2 bg-green/10 border border-green/40 rounded-full px-3 py-1">
          <span className="text-green text-[10px] font-semibold">RANK #4 · TOP SUPPORTER</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-2 mb-[18px]">
        {stats.map(([ic, val, lb]) => (
          <div key={lb} className="bg-card border border-subtle rounded-lg p-3.5 text-center">
            <div className="text-[20px] mb-1">{ic}</div>
            <div className="font-display text-[22px] font-black">{val}</div>
            <div className="text-label text-[10px]">{lb}</div>
          </div>
        ))}
      </motion.div>

      {/* Badges */}
      <motion.div variants={item}>
        <SectionHead title="BADGES" />
        <div className="grid grid-cols-4 gap-2 mb-5">
          {badges.map(([ic, lb]) => (
            <div key={lb} className="bg-card border border-subtle rounded-lg p-2.5 text-center">
              <div className="text-[24px] mb-1">{ic}</div>
              <div className="text-[9px] text-label">{lb}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Menu */}
      {["Edit Profile", "Referral Code", "Notifications", "Help Center", "Sign Out"].map(menuItem => (
        <motion.div key={menuItem} variants={item} className="flex items-center justify-between py-3.5 border-b border-border cursor-pointer">
          <span className="text-[14px] font-medium">{menuItem}</span>
          <span className="text-muted-foreground">›</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
