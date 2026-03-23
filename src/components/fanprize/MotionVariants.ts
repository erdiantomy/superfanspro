export const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export const screenTransition = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 26, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

/** Direction-aware slide: pass direction 1 (right) or -1 (left) */
export const directionalTransition = (direction: number) => ({
  initial: { opacity: 0, x: direction * 60, scale: 0.96 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 280, damping: 28, mass: 0.7 },
  },
  exit: {
    opacity: 0,
    x: direction * -40,
    scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
});
