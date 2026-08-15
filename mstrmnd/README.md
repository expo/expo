# MSTRMND

Tuned mastermind agent controller for Expo (SDK 57).

Official brand mark is the metallic tetrahedron. Marketing and the native app share one **Linear** token set (true-black substrate, indigo accent, glass surfaces).

The full screen is a MIDI-style drum-pad grid: **12 department agents** in a **3×4** layout, with a **CONDUCTOR** main window consuming the lower third. Pads are gamified (level / XP / status) and animated so active agents feel alive.

## Shared design tokens

`tokens/index.ts` is the source of truth. Hex values feed:

| Surface | Consumer |
| --- | --- |
| Marketing (web) | CSS variables + `.linear-glow-card` / `.linear-text-shimmer` via `tokens/css.ts` |
| Expo app | StyleSheet + `GlassCard` (`expo-blur` on iOS/web, dark fallback on Android) + `CinematicBackground` |
| Navigation | `linearNavigationTheme` (React Navigation dark theme) |
| Tailwind / NativeWind | `tokens/nativewind.ts` + `tailwindThemeExtend` |

| Token | Hex |
| --- | --- |
| Substrate | `#000000` / `#030303` |
| Surface | `#0B0B0C` / `#121214` |
| Borders | `#1F1F23` / `#2E2E33` |
| Type | `#F5F5F7` / `#8A8A93` |
| Accent | `#5E6AD2` |

## Stack

- Expo SDK 57 + Expo Router
- Inter (UI) + Syne (wordmark)
- `expo-blur` glass + `expo-linear-gradient` cinematic glow
- Vercel AI SDK (`ai` + `@ai-sdk/react`) with `expo/fetch` streaming
- Reanimated living pulses / orbs + SVG brand mark

## Run

```bash
cd mstrmnd
npm install --legacy-peer-deps
npx expo start
```

Web loads the marketing stage (shimmer headline, glass pillar cards, token swatches) around the live phone preview. Native skips the marketing frame and opens the controller full-screen.

Regenerate splash/icon rasters after mark changes:

```bash
node scripts/generate-brand-assets.mjs
```

### Live streaming

1. Copy `.env.example` → `.env`
2. Set `AI_GATEWAY_API_KEY` (Vercel AI Gateway)
3. Optionally set `EXPO_PUBLIC_AI_GATEWAY_API_KEY=1` so the client prefers the API over the demo stream

Without a key, tapping **RUN** uses a local character-stream demo so the pad deck still feels alive.

## Layout

| Zone | Role |
|------|------|
| Top brand bar | Tetrahedron mark + `MSTRMND` + session LED |
| Pad deck (~2/3) | 12 department pads (STRAT → BRAND) |
| Main window (~1/3) | Active agent transcript + cue input |

Tap a pad to focus it in the main window. Tap the main header to return to **CONDUCTOR**.
