

## Plan: Framer Motion Animations

### Overview
Add framer-motion for three animation systems: staggered card entrances on all screens, spring-based screen transitions, and a mechanical odometer (rolling digit) effect for the prize pool counter.

### Changes

**1. Install framer-motion** — Add `framer-motion` dependency.

**2. Create `src/components/fanprize/Odometer.tsx`**
- A rolling-digit counter component that animates each digit independently
- Each digit column scrolls vertically using `motion.div` with spring physics
- Accepts a numeric value; when it changes, digits roll to new positions
- Handles commas/dots in the formatted IDR string as static characters

**3. Update `src/pages/Index.tsx`** — Screen transitions
- Wrap `renderScreen()` output in `<AnimatePresence mode="wait">` with a keyed `motion.div`
- Each screen gets a spring fade+slide transition: `initial={{ opacity: 0, x: 30 }}`, `animate={{ opacity: 1, x: 0 }}`, `exit={{ opacity: 0, x: -30 }}` with `type: "spring", stiffness: 300, damping: 30`

**4. Update `src/components/fanprize/HomeScreen.tsx`** — Staggered entrances
- Wrap the main container content in a `motion.div` with `staggerChildren: 0.08`
- Wrap each card (live hero, upcoming items, leaderboard items) in `motion.div` children with `variants` for fade-in-up entrance
- Replace the prize pool `{idr(pool)}` text with the new `<Odometer value={pool} />` component

**5. Update `src/components/fanprize/MatchDetail.tsx`** — Staggered entrances
- Wrap content sections (players card, pool info, recent supporters, support buttons) in staggered `motion.div` containers
- Replace prize pool display with `<Odometer value={pool} />`

**6. Update `src/components/fanprize/MatchResultScreen.tsx`** — Staggered entrances
- Wrap celebration section, score card, payout breakdown, support outcome in staggered `motion.div`

**7. Update remaining screens** (`WalletScreen`, `StoreScreen`, `ProfileScreen`)
- Add staggered card entrance animations to list items and cards

### Odometer Detail
- Format number as string (e.g. "Rp 2.450.000")
- For each character: if digit, render a column of 0-9 stacked vertically, animate `y` to show correct digit; if non-digit, render static
- Use `motion.div` with `type: "spring", stiffness: 200, damping: 20` for the rolling effect
- Wrap in a fixed-height container with `overflow: hidden`

### Stagger Pattern (reusable)
```tsx
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
```

Applied consistently across all screens for card/list items.

