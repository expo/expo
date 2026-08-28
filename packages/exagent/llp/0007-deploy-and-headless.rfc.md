# 0007: Deploy and Headless-First Development

**Type:** RFC
**Status:** Draft
**Systems:** EAS Hosting; launch.expo.dev; EAS auth; `@expo/mcp-tunnel`; `create-expo`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0006-agent-native-cli-surface]]

## Summary

Ship and develop without a terminal or a laptop. Seeds [confirmed — Kudo, 2026-08-18/19]: cross-platform deploy, headless project creation, Cloudflare Workers compatibility, and the north star of running the whole lifecycle from the Claude mobile app.

## Cross-platform `deploy`

[confirmed — Kudo seed, 2026-08-19] One command deploys every platform: web via EAS Hosting, and native platforms via launch.expo.dev. The orchestration is deterministic (export, upload, URLs back) so it works equally as a human command and as an agent tool, and agent mode returns structured URLs and status. It pairs with smart `start` ([[0004-smart-start-and-project-state]]): one command to run, one to ship.

Native rail design [confirmed — Kudo chose user-auth ("A"), 2026-08-22; grounded in a study of the expo/launch repo]. launch.expo.dev consumes **project source**, as one gzip tarball, rather than prebuilt artifacts. It generates and runs the EAS workflow itself. So `deploy --native` is three steps: pack the source under create-launch's ignore rules and its ~500 MB limit; upload with the user's own Expo session or `EXPO_TOKEN`, to the same endpoint the public `create-launch` CLI uses; then print the returned launch URL. The **browser handoff is a required UX step, not an error**, because App Store setup needs a browser Apple login and no headless path exists today [observed — expo/launch]. Launch sessions expire after 8 hours. Vendor-token capabilities such as status polling and log streaming exist server-side, but they require a shared secret that cannot ship in a public package. That is a launch-side enhancement if exagent should babysit workflows [inferred].

Shipped [observed — 2026-08-22, revised same day]: `exagent deploy --native` **delegates to `create-launch` as a subprocess** [confirmed — Kudo, 2026-08-22]. That is truer to constraint 5 than the first cut, which ported the tarball, auth and upload internals, since deleted. Details:

- Resolution order: the project bin, then PATH, then `npx create-launch@latest`. Always `--json`.
- `--upload-root <dir>` keeps exagent's meaning by running the subprocess from that directory with `--project <app>`.
- Its auth failure maps to `Try: npx expo login`. A machine-readable error object from `create-launch --json` is the recorded upstream ask, because today the auth case is scraped from stderr.
- Browser handoff and the 8 h expiry work as designed. The expiry is hardcoded, because the service returns no `expiresAt`, which is another recorded ask.
- `--platform` and `--profile` are typed errors, because a launch covers both platforms.
- The web rail is unchanged. E2E is hermetic, via a stub `create-launch` bin, and the cli-missing path is an eval scenario grading the exit code and the `cli:error` event.

### The web rail, run end to end

Until now the web rail had only ever been tested to the preflight. `deploy --web` is two subprocesses, `expo export --platform web` and then `eas deploy`, and neither had been allowed to reach the service. **It has now been run to a live deployment** [observed — 2026-08-26, staging, `@kudo1/DailyWords-Grok`]: exit **0**, and `https://dailywords-grok--pblz5fv6dc.staging.expo.app` answers `200 text/html`. The report prints the project, the targets, the export directory and the web URL. It follows up with the URL itself and `npx eas deploy --prod`, because a preview deployment is what `eas deploy` makes without `--prod`, and the follow-up says that rather than assuming it.

The failure half was exercised first, and by accident, which made it the better test. The project's export stopped on a bundler error (`Unable to resolve module ./wa-sqlite/wa-sqlite.wasm`). `deploy` reported it as `The web bundle could not be exported, so there was nothing to deploy (expo export exited with code 1)`, with a why, a how, and `Try: npx expo export --platform web`, exiting **1**. That is the right code. llp/0010 reserves **7** for a step only a person can complete, and a bundler that cannot resolve an import is a project defect its owner fixes rather than a login they must perform. The two `deploy` failures that *do* exit 7 are unchanged.

Two findings from that bundler error, neither of them this CLI's:

- **Bun does not extract every file of a package.** `expo-sqlite@57.0.1` ships `web/wa-sqlite/wa-sqlite.js` and `web/wa-sqlite/wa-sqlite.wasm` in its npm tarball [observed — `npm view … dist.tarball`, both present]. After `bun install` 1.3.14 **both are missing** from `node_modules`, while `npm install` of the same version keeps them. A Bun project therefore cannot export `expo-sqlite` for web at all, and the error names a missing file rather than a missing install.
- **Metro does not treat `.wasm` as an asset by default**, so even with the file present the import fails. The export needs `config.resolver.assetExts.push('wasm')` in `metro.config.js`.

Both are upstream asks rather than anything `deploy` can fix. What `deploy` owes is the accurate report it gave.

## Headless project creation

[confirmed — Kudo seed, 2026-08-18] `exagent new "<one-line app description>"` covers template choice, `create-expo`, git init, EAS init and a first boot check, with every step flag- or JSON-driven and zero TTY. It depends on non-interactive parity ([[0006-agent-native-cli-surface]]).

Shipped [observed — 2026-08-22]: `exagent new <dir> [--name] [--no-install] [--no-git] [--json]`. It runs `create-expo --yes` as a subprocess, does a git init when appropriate, and offers follow-ups into the new project, with zero-TTY asserted in e2e. Not yet built from this seed: EAS init, the first-boot check, and the one-line-description form.

## Cloudflare Workers compatibility (EAS Hosting)

[confirmed — Kudo seed, 2026-08-18] Expo API routes deploy to the Workers runtime, workerd. Three tools:

- _Compat preflight_: a static lint of API routes and server code, looking for Node APIs and packages absent under workerd, before any deploy.
- _Local workerd run_: execute routes under the real runtime locally, with structured errors back to the agent.
- _Fix loop_: a mapping from known incompatibility to known substitution, so the agent rewrites Node-isms and re-verifies.

## Chat-driven development — the phone is the only device

North star [confirmed — Kudo, 2026-08-18]: run the whole lifecycle from the Claude mobile app. The agent runs on a cloud machine, and the user's phone is both chat client and test device. The required pieces, most of which exist in some form:

- Remote dev server: tunnel Metro to the device through the packager proxy URL. No QR, because the agent sends an install or open link.
- Agent eyes without a laptop: cloud simulators for screenshots and automation. EAS Simulator is an experimental API today.
- Remote transport: `@expo/mcp-tunnel` already provides WebSocket MCP transport for exactly this shape [observed — expo-mcp repo].
- Delivery without a Mac: EAS Build, then TestFlight or internal distribution, then EAS Update for OTA iteration.
- F3 is the composition of the other documents' work rather than a separate system.

## EAS auth for headless agents

Decision [confirmed — Kudo, 2026-08-18]: EAS is the delivery rail. Auth today has three paths [observed — `packages/@expo/cli/src/api/user/`]: password plus OTP (`actions.ts`, `otp.ts`); browser PKCE with a **localhost redirect** (`expoSsoLauncher.ts`, client_id `expo-cli`, exchange at `auth/token`); and the `EXPO_TOKEN` environment variable (`UserSettings.ts`).

How each fits a cloud agent, meaning an approving browser on the phone and a CLI on a remote machine:

- Localhost-redirect PKCE does not work remotely. It stays for laptop-local use.
- `EXPO_TOKEN` is the pragmatic bootstrap, for CI and early chat-driven use. It is long-lived, broad in scope, and manually provisioned, which makes it the wrong end state.
- End state [inferred]: the **OAuth device authorization grant**. The agent posts a URL and code into the chat, the user approves on the phone, and the agent polls `auth/token`. It is incremental to build, since the grant exchange endpoint already exists, and www adds a `device_code` grant plus an approval page.
- Harden both with scoped, expiring, dashboard-revocable "agent sessions", with read, build, update and submit scopes.

## Open questions

1. Where does the cloud agent run, on EAS-provided machines or bring-your-own?
2. Who owns the device-code grant and agent-sessions work on the www side?
