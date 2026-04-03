# COMPREHENSIVE UI/UX READJUSTMENT — PLAYER PROFILES & DONATION SYSTEM

## WHY THIS CHANGE

The app just added player profile pages (superfans.games/playerslug), a fan donation system, a profile claim flow, and a player dashboard. This changes the platform identity from "venue management tool" to "player-first fan engagement platform." Every page in the app needs to reflect this shift — player names should be tappable links to their profiles, navigation needs a "My Page" entry, the homepage needs to showcase players alongside venues, and all copy/messaging must be contextually updated.

## CONTEXT

- Supabase + React + Tailwind, dark theme (CSS vars in index.css)
- Design tokens in `@/components/arena/index.tsx` — `C.bg`, `C.card`, `C.green`, `C.border`, `C.muted`, `C.fg`
- Fonts: Barlow Condensed (headings), Inter/DM Sans (body)
- Auth: `@/hooks/useAuth` → `{ user, session }`
- Venue: `@/hooks/useVenue` → `{ venue, slug }`
- Supabase client: `@/integrations/supabase/client`, use `as any` for tables not in generated types
- New tables: `player_profiles`, `donations`, views `player_profile_full`, `player_match_history`
- New RPC: `resolve_slug(slug)`, `check_slug_available(slug)`
- New pages already built: `SlugResolver`, `PlayerProfilePage`, `PlayerDashboard`, `ClaimProfileModal`, `DonationModal`
- Routes: `/:slug` now goes through SlugResolver (resolves to venue OR player), `/:slug/dashboard` is the player dashboard

## CHANGES REQUIRED — DO ALL OF THESE

---

### 1. MAKE ALL PLAYER NAMES TAPPABLE ACROSS THE ENTIRE APP

Create a reusable component `src/components/arena/PlayerLink.tsx`:

```tsx
// Props: player object (from padel_players), optional size
// Fetches player_profiles.slug for this player_id
// If profile exists → wraps name in a clickable link to /${slug}
// If no profile → renders name as plain text (no link)
// Shows avatar (Av component) + name side by side
// On tap: navigate to /${slug}
```

This component should do a lightweight lookup. Use react-query with a shared cache key `['player-slug', playerId]`:
```ts
const { data: profileSlug } = useQuery({
  queryKey: ['player-slug', playerId],
  queryFn: async () => {
    const { data } = await (supabase as any)
      .from('player_profiles')
      .select('slug')
      .eq('player_id', playerId)
      .single();
    return data?.slug ?? null;
  },
  staleTime: 5 * 60 * 1000, // cache 5 min
  enabled: !!playerId,
});
```

If slug exists, render the name as a tappable element (using `useNavigate` to go to `/${slug}`). Add a subtle green underline-on-hover or a small external-link icon to indicate it's clickable.

**Now replace plain player name text with `<PlayerLink>` in ALL these files:**

**`src/pages/RankPage.tsx`:**
- Podium section (line ~142-145): Replace `<Av initials={player.avatar} .../>` and `{player.name.split(" ")[0]}` with `<PlayerLink player={player} />` — keep the avatar size for podium (50/38px)
- Leaderboard rows (line ~211-213): Replace `<Av .../>` and `{player.name}` with `<PlayerLink player={player} />`

**`src/pages/VenuePage.tsx`:**
- Monthly leaderboard rows where player names and avatars appear — replace with `<PlayerLink>`
- Session cards where host name appears — replace with `<PlayerLink>`

**`src/pages/SessionPage.tsx`:**
- Player list in the session — every player name/avatar should use `<PlayerLink>`
- Score submission cards showing team players — use `<PlayerLink>` for each player name

**`src/pages/HostDashboard.tsx`:**
- Player roster list — every player name should use `<PlayerLink>`
- Score review cards with player names — use `<PlayerLink>`

---

### 2. HOMEPAGE — `src/pages/HomePage.tsx`

The homepage is currently a white/light theme page focused entirely on venue owners. It needs significant updates:

**A) Update hero copy:**
- Old: "Your Padel Venue. Fully Gamified."
- New: "Play. Compete. Get Supported." (or similar player-first messaging)
- Old subtitle: "Live rankings, XP points, monthly prizes, and a player support economy"
- New subtitle: "Claim your player page, climb the leaderboard, and receive support from your fans — all at your favorite padel venue."

**B) Add two CTA buttons in hero (replacing current ones):**
- Primary (green): "Claim Your Page →" → navigates to `/auth` (they need to sign in first, then claim)
- Secondary (outline): "I'm a Venue Owner →" → scrolls to venue registration section below
- Third (text link): "See a live example →" → navigates to `/tomspadel`

**C) Add "Featured Players" section BEFORE the "Active Venues" section:**
- Section title: "Top Players" with green accent
- Fetch from `player_profile_full` view, order by `lifetime_xp DESC`, limit 6
- Grid of player cards, each showing:
  - Avatar (Av component or avatar_url image)
  - Display name (tappable → links to their profile)
  - Division badge
  - Win rate + games played
  - "X Superfans" count
  - "Support →" small button → links to their profile page
- If no profiles exist yet: "Players are joining every day. Claim your page and be featured here!"

**D) Add "How Donations Work" subsection in the Support Economy area:**
- Add a brief explanation: "Fans can support any player directly. Send a donation, leave a message, and become a Superfan."
- Visual: simple 3-step flow: "Visit a player page → Choose amount → Pay with eWallet (DANA, GoPay, OVO, etc.)"

**E) Update the nav bar:**
- Keep "SUPERFANS .GAMES" branding
- Add "Sign In" button if not logged in (navigates to `/auth`)
- If logged in: show user avatar/initials + "My Page" link (if they have a profile, goes to `/${slug}`; if not, opens claim flow)
- Keep "Register Venue" button but make it secondary (outline style)

**F) Update the Features section — add two new feature cards:**
- "🧑 Player Profile Pages" / "Get your own URL at superfans.games/yourname. Share it with fans and receive support."
- "💚 Fan Donations" / "Fans send direct support via eWallet. No middleman, instant payment."

**G) Fix the footer:**
- Update: "Built for padel communities across Southeast Asia" → "Built for padel athletes and their fans"

---

### 3. RANKPAGE — `src/pages/RankPage.tsx`

**A) Fix hardcoded URL in subtitle:**
- Line ~52: Change `superfanspro.vercel.app/rank · LIVE` → `superfans.games · LIVE`

**B) Player rows are now tappable** (handled by PlayerLink above)

**C) Add "Claim Your Page" mini-banner at the bottom of the leaderboard:**
- If user is logged in but has no profile: Show a small card below the list: "You're on the leaderboard! Claim your page to let fans support you. [Claim Now →]"
- Opens ClaimProfileModal

---

### 4. VENUEPAGE — `src/pages/VenuePage.tsx`

**A) Add ClaimProfileBanner** (already built in prompt 2) at the top of the page for logged-in users without a profile:
```tsx
import ClaimProfileBanner from "@/components/profile/ClaimProfileBanner";
// ... inside the JSX, after the venue header:
{user && <ClaimProfileBanner />}
```

**B) Leaderboard player names are now tappable** (handled by PlayerLink above)

**C) Add a "Players at this Venue" section if the venue has player profiles:**
- Show players who have played sessions at this venue AND have a claimed profile
- Small horizontal scroll of avatar circles, tappable to their profile

---

### 5. AUTHSCREEN — `src/pages/AuthScreen.tsx`

**After successful sign-in, add a redirect check:**
- If user just signed in and has NO padel_player record → normal flow (existing)
- If user has a padel_player record but NO player_profile → after auth completes, show a toast: "Welcome back! 🎉 Claim your Superfans page →" with a clickable action that opens the claim flow
- This should be handled in the auth state change listener or in the component that renders after auth

---

### 6. BOTTOM NAVIGATION — All pages with bottom nav bars

Currently RankPage has a bottom nav with Home, Rankings, Sessions, Profile icons. Update across all pages:

**If user has a player profile:**
- Add/update the "Profile" icon to link to `/${userProfileSlug}` (their public profile)
- Label: "My Page"

**If user is logged in but has no profile:**
- Show "Profile" icon that opens ClaimProfileModal
- Label: "Claim Page" with a small green dot indicator

---

### 7. SESSIONPAGE — `src/pages/SessionPage.tsx`

**A) Player names tappable** (handled by PlayerLink)

**B) In the session lobby (before game starts), add a "Support a Player" prompt:**
- Small banner: "Support a player to become their Superfan! 💚"
- Only show if there are players with profiles in the session
- This is just a teaser — tapping opens the player's profile where the donation modal lives

---

### 8. GLOBAL CONSISTENCY FIXES

**A) All references to "superfanspro.vercel.app" should be "superfans.games"** — search and replace across all files.

**B) All references to "credits" in the support economy context should be distinguished from "donations":**
- Credits = in-app currency for backing players in sessions (existing system)
- Donations = real money support from fans via eWallet (new system)
- Make sure the UI never conflates these two. They are separate.

**C) OG meta tags / document.title:**
- HomePage: "SuperFans — Play. Compete. Get Supported."
- VenuePage: "{Venue Name} | SuperFans"
- RankPage: "Rankings | SuperFans"
- PlayerProfilePage: "{Player Name} | SuperFans" (already handled)

---

## WHAT NOT TO CHANGE

- Do NOT modify `SlugResolver.tsx`, `PlayerProfilePage.tsx`, `PlayerDashboard.tsx`, `DonationModal.tsx`, `ClaimProfileModal.tsx` — these are already built and working
- Do NOT change the Supabase schema, edge functions, or backend logic
- Do NOT change the routing structure in App.tsx (SlugResolver, dashboard route, etc.)
- Do NOT remove any existing functionality — only add and enhance
- Do NOT change the dark theme on venue/rank/session pages — only the HomePage has a light theme (white background), and it can stay light or be updated to dark at your discretion, but be consistent

## IMPLEMENTATION PRIORITY

1. **PlayerLink component** (everything depends on this)
2. **RankPage fixes** (URL text + PlayerLink integration)
3. **VenuePage** (ClaimBanner + PlayerLink)
4. **HomePage updates** (biggest visual change)
5. **SessionPage + HostDashboard** (PlayerLink integration)
6. **Bottom nav updates**
7. **AuthScreen post-login prompt**
8. **Global text/URL replacements**
