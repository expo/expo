# mstrmnd

Tuned mastermind agent controller for Expo (SDK 57).

The full screen is a MIDI-style drum-pad grid: **12 department agents** in a **3×4** layout, with a **CONDUCTOR** main window consuming the lower third. Pads are gamified (level / XP / status) and animated so active agents feel alive.

## Stack

- Expo SDK 57 + Expo Router
- Vercel AI SDK (`ai` + `@ai-sdk/react`) with `expo/fetch` streaming
- Reanimated living pulses / orbs (shader-like motion without a heavy GL stack)
- Syne + Space Grotesk typography
- Native splash + branded boot overlay

## Run

```bash
cd mstrmnd
npm install --legacy-peer-deps
npx expo start
```

### Live streaming

1. Copy `.env.example` → `.env`
2. Set `AI_GATEWAY_API_KEY` (Vercel AI Gateway)
3. Optionally set `EXPO_PUBLIC_AI_GATEWAY_API_KEY=1` so the client prefers the API over the demo stream

Without a key, tapping **RUN** uses a local character-stream demo so the pad deck still feels alive.

## Layout

| Zone | Role |
|------|------|
| Top brand bar | `mstrmnd` identity + session LED |
| Pad deck (~2/3) | 12 department pads (STRAT → BRAND) |
| Main window (~1/3) | Active agent transcript + cue input |

Tap a pad to focus it in the main window. Tap the main header to return to **CONDUCTOR**.
