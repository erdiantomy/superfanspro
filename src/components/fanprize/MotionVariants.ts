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
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { type: "spring" as const, stiffness: 300, damping: 30 },
};
