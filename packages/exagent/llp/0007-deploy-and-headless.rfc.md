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

Native rail design [confirmed — Kudo chose user-auth ("A"), 2026-08-22; grounded in a study of the expo/launch repo]: launch.expo.dev consumes **project source** (one gzip tarball), not prebuilt artifacts — it generates and runs the EAS workflow itself. So `deploy --native` = pack source (create-launch's ignore rules, ~500 MB limit) → upload with the user's own Expo session/`EXPO_TOKEN` (the same endpoint the public `create-launch` CLI uses) → print the returned launch URL. The **browser handoff is a required UX step, not an error**: App Store setup needs a browser Apple login; no headless path exists today [observed — expo/launch]. Launch sessions expire after 8 hours. Vendor-token capabilities (status polling, log streaming) exist server-side but require a shared secret that cannot ship in a public package — a launch-side enhancement if exagent should babysit workflows [inferred].

Shipped [observed — 2026-08-22, revised same day]: `exagent deploy --native` **delegates to `create-launch` as a subprocess** [confirmed — Kudo, 2026-08-22] — truer to constraint 5 than the first cut, which ported the tarball/auth/upload internals (since deleted). Resolution: project bin → PATH → `npx create-launch@latest`; always `--json`; `--upload-root <dir>` keeps exagent's meaning by running the subprocess from that directory with `--project <app>`. Its auth failure maps to `Try: npx expo login`; a machine-readable error object from `create-launch --json` is the recorded upstream ask (today the auth case is scraped from stderr). Browser handoff + 8 h expiry as designed (expiry hardcoded — service returns no `expiresAt`, recorded ask). `--platform`/`--profile` are typed errors (a launch covers both platforms). Web rail unchanged. Hermetic e2e via a stub `create-launch` bin; the cli-missing path is an eval scenario grading exit code + the `cli:error` event.

### The web rail, run end to end

Until now the web rail had only ever been tested to the preflight: `deploy --web` is two subprocesses (`expo export --platform web`, then `eas deploy`), and neither had been allowed to reach the service. **It has now been run to a live deployment** [observed — 2026-08-26, staging, `@kudo1/DailyWords-Grok`]: exit **0**, and `https://dailywords-grok--pblz5fv6dc.staging.expo.app` answers `200 text/html`. The report prints the project, the targets, the export directory and the web URL, and follows up with the URL itself and `npx eas deploy --prod` — a preview deployment is what `eas deploy` makes without `--prod`, which the follow-up says rather than assumes.

The failure half was exercised first, and by accident, which made it the better test. The project's export stopped on a bundler error (`Unable to resolve module ./wa-sqlite/wa-sqlite.wasm`), and `deploy` reported it as `The web bundle could not be exported, so there was nothing to deploy (expo export exited with code 1)` with a why, a how, and `Try: npx expo export --platform web`, exiting **1**. That is the right code: llp/0010 reserves **7** for a step only a person can complete, and a bundler that cannot resolve an import is a project defect its owner fixes, not a login they must perform. The two `deploy` failures that *do* exit 7 are unchanged.

Two findings from that bundler error, neither of them this CLI's:

- **Bun does not extract every file of a package.** `expo-sqlite@57.0.1` ships `web/wa-sqlite/wa-sqlite.js` and `web/wa-sqlite/wa-sqlite.wasm` in its npm tarball [observed — `npm view … dist.tarball`, both present]; after `bun install` 1.3.14 **both are missing** from `node_modules`, while `npm install` of the same version keeps them. A Bun project therefore cannot export `expo-sqlite` for web at all, and the error names a missing file rather than a missing install.
- **Metro does not treat `.wasm` as an asset by default**, so even with the file present the import fails. The export needs `config.resolver.assetExts.push('wasm')` in `metro.config.js`. Both are upstream asks rather than anything `deploy` can fix; what `deploy` owes is the accurate report it gave.

## Headless project creation

[confirmed — Kudo seed, 2026-08-18] `exagent new "<one-line app description>"`: template choice, `create-expo`, git init, EAS init, first boot check — every step flag- or JSON-driven, zero TTY. Depends on non-interactive parity ([[0006-agent-native-cli-surface]]).

Shipped [observed — 2026-08-22]: `exagent new <dir> [--name] [--no-install] [--no-git] [--json]` — `create-expo --yes` as a subprocess, git init when appropriate, follow-ups into the new project; zero-TTY asserted in e2e. Not yet built from this seed: EAS init, the first-boot check, and the one-line-description form.

## Cloudflare Workers compatibility (EAS Hosting)

[confirmed — Kudo seed, 2026-08-18] Expo API routes deploy to the Workers runtime (workerd). Tools:

- _Compat preflight_: static lint of API routes and server code for Node APIs/packages absent under workerd, before any deploy.
- _Local workerd run_: execute routes under the real runtime locally; structured errors back to the agent.
- _Fix loop_: known-incompatibility → known-substitution mapping, so the agent rewrites Node-isms and re-verifies.

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
