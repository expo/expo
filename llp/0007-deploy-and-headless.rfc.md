# 0007: Deploy and Headless-First Development

**Type:** RFC
**Status:** Draft
**Systems:** EAS Hosting; launch.expo.dev; EAS auth; `@expo/mcp-tunnel`; `create-expo`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0006-agent-native-cli-surface]]

## Summary

Ship and develop without a terminal or a laptop. Seeds [confirmed — Kudo, 2026-08-18/19]: cross-platform deploy, headless project creation, Cloudflare Workers compatibility, and the north star — the whole lifecycle from the Claude mobile app.

## Cross-platform `deploy`

[confirmed — Kudo seed, 2026-08-19] One command deploys every platform: web via EAS Hosting, native platforms via launch.expo.dev. Deterministic orchestration (export → upload → URLs back) so it works equally as a human command and an agent tool; agent mode returns structured URLs and status. Pairs with smart `start` ([[0004-smart-start-and-project-state]]): one command to run, one to ship.

## Headless project creation

[confirmed — Kudo seed, 2026-08-18] `exagent new "<one-line app description>"`: template choice, `create-expo`, git init, EAS init, first boot check — every step flag- or JSON-driven, zero TTY. Depends on non-interactive parity ([[0006-agent-native-cli-surface]]).

## Cloudflare Workers compatibility (EAS Hosting)

[confirmed — Kudo seed, 2026-08-18] Expo API routes deploy to the Workers runtime (workerd). Tools:

- *Compat preflight*: static lint of API routes and server code for Node APIs/packages absent under workerd, before any deploy.
- *Local workerd run*: execute routes under the real runtime locally; structured errors back to the agent.
- *Fix loop*: known-incompatibility → known-substitution mapping, so the agent rewrites Node-isms and re-verifies.

## Chat-driven development — the phone is the only device

North star [confirmed — Kudo, 2026-08-18]: run the whole lifecycle from the Claude mobile app. The agent runs on a cloud machine; the user's phone is both chat client and test device. Required pieces, most existing in some form:

- Remote dev server: tunnel Metro to the device (packager proxy URL) — no QR; the agent sends an install/open link.
- Agent eyes without a laptop: cloud simulators (EAS Simulator is an experimental API today) for screenshots/automation.
- Remote transport: `@expo/mcp-tunnel` already provides WebSocket MCP transport for exactly this shape [observed — expo-mcp repo].
- Delivery without a Mac: EAS Build → TestFlight/internal distribution → EAS Update for OTA iteration.
- F3 is the composition of the other documents' work, not a separate system.

## EAS auth for headless agents

Decision [confirmed — Kudo, 2026-08-18]: EAS is the delivery rail. Auth today [observed — `packages/@expo/cli/src/api/user/`]: password + OTP (`actions.ts`, `otp.ts`); browser PKCE with a **localhost redirect** (`expoSsoLauncher.ts`, client_id `expo-cli`, exchange at `auth/token`); `EXPO_TOKEN` env (`UserSettings.ts`).

Fit for a cloud agent (approving browser on the phone, CLI on a remote machine):

- Localhost-redirect PKCE does not work remotely; it stays for laptop-local use.
- `EXPO_TOKEN` is the pragmatic bootstrap (CI + early chat-driven use); long-lived, broad scope, manual provisioning — wrong end state.
- End state [inferred]: **OAuth device authorization grant** — agent posts URL + code into the chat; user approves on the phone; agent polls `auth/token`. Incremental to build since the grant exchange endpoint already exists; www adds a `device_code` grant + approval page.
- Harden both with scoped, expiring, dashboard-revocable "agent sessions" (read/build/update/submit scopes).

## Open questions

1. Where does the cloud agent run — EAS-provided machines or bring-your-own?
2. Who owns the device-code grant + agent-sessions work on the www side?
