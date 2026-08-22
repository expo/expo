# 0005: Runtime Loop Tools — Seeing and Driving the Running App

**Type:** RFC
**Status:** Draft
**Systems:** `expo-mcp` tools; `@expo/cli` CDP debugging layer; LogBox
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]]

## Summary

Tools that let a driving agent observe and manipulate the running app, closing the verify loop that text-only agents cannot close. Ship as self-serve `exagent` CLI commands [confirmed — Kudo, 2026-08-22]; `expo-mcp` is not a dependency. All items [inferred] unless tagged; the named runtime hooks exist today [observed where noted].

## Candidates

- **Runtime eval.** The CLI already speaks CDP to the app (`packages/@expo/cli/src/start/server/metro/debugging/messageHandlers/`: `VscodeRuntimeEvaluate`, `VscodeRuntimeCallFunctionOn`, `VscodeRuntimeGetProperties` [observed]). Expose as a tool: run JS inside the live app, read state, trigger navigation, assert on values. Turns "I think the fix works" into "I evaluated it in the app". Note: reaching the CDP endpoint from outside the CLI process must respect the process boundary — connect over the dev server's protocol, not via imports.
- **Structured red-screen feed.** LogBox symbolication exists in the CLI (`log-box/LogBoxSymbolication.ts` [observed]). Deliver every runtime error as a structured event: message, symbolicated stack, source file/line.
- **Network inspection.** A CDP `NetworkResponse` handler exists [observed]. Expose the app's network log so failing API calls are debuggable without guessing.
- **Deep-link navigation.** Combine `expo_router_sitemap` [observed — existing expo-mcp tool] with URI-scheme launching: "open route /profile/42 on the simulator". Enables per-route verification and screenshot sweeps.
- **Performance probe.** `expo-app-metrics` / `expo-insights` exist as packages [observed]. Startup time, slow frames, re-render counts — "why is this list janky" starts from data.
- **Cross-platform verification sweep.** Boot iOS + Android + web in parallel, screenshot the same routes, report divergence. Uniquely valuable for a universal framework.

## Composite loops these enable

- **Log triage** [confirmed — feature list, 2026-08-18]: red screen → `collect_app_logs` / red-screen feed → symbolicated source location → agent fixes → verify by screenshot.
- **Verified UI changes** [confirmed — feature list, 2026-08-18]: edit → reload → `automation_take_screenshot` → compare against the request → iterate.

## Implemented in v1 as

Home correction [confirmed — Kudo, 2026-08-22]: these are **self-serve in `packages/exagent`** as CLI commands — the expo-mcp implementation round was abandoned unpushed and the code ported over. Ported surface [observed — 2026-08-22]: `exagent runtime eval <expr>` (app exception ⇒ exit 1), `exagent runtime errors [--duration]`, `exagent navigate <route> [--scheme] [--ios|--android]`; 149 new jest tests (431 total). Live-verified twice — as MCP-shaped tools and again as exagent commands against a real SDK 57 app (eval value/exception, error collection with bundle-mapped stacks, deep-link navigation). Original build + live verification notes [observed — 2026-08-22]:

- `runtime_evaluate` — `CdpClient.evaluateAsync` (Runtime.evaluate, returnByValue + awaitPromise + exceptionDetails); app output fenced with untrusted-content markers per [[0008-guardrails]], including marker-forgery neutralization.
- `read_runtime_errors` — `CdpRuntimeErrorCollector` capturing `Runtime.exceptionThrown` + console.error over a window; distinguishes "no errors" from "app unreachable".
- `navigate_to_route` — device-side deep link (`simctl openurl` / `adb am start`), static scheme resolution from app.json with Expo Go `exp://<host>/--/<route>` support and explicit `scheme` override.

64 new unit tests (122 total in the package) against MockWebSocket / mocked spawns.

**Verified live** [observed — 2026-08-22, SDK 57 app in Expo Go on an iOS 26.5 simulator]: `evaluateAsync` returned real values/state/exceptions from Hermes; the error collector captured an injected uncaught error (delivered via RN's console path, not `Runtime.exceptionThrown` — having both capture sources is required); deep-link navigation landed the app on the `/explore` route (screenshot-confirmed). The live round also found and fixed a blocking bug the unit tests could not see: **Metro's inspector proxy rejects CDP WebSocket handshakes without a same-origin `Origin` header (401)** — all default connection paths now send it (`createInspectorWebSocket`).

**Network inspection** [observed — 2026-08-22]: `exagent runtime network` (CDP Network domain collector; request/response/failure correlated by requestId; three outcomes counted — answered / failed / never-answered, because RN never sends `Network.loadingFailed` for a refused connection [observed, SDK 57/RN 0.86]). Live-verified on iOS (200/404/refused).

**Android pass** [observed — 2026-08-22, headless emulator + Expo Go 57 APK]: `navigate --android` works end-to-end (adb reverse + `exp://` deep link, screenshot-confirmed). Hard finding: **Expo Go for Android ships a Hermes without any CDP debugger** ("HermesRuntime[RNBridgeless] does not support debugging over the Chrome DevTools Protocol" [observed via Log.entryAdded]) — `Runtime.enable`/`Network.enable` merely ack; no evaluate, no console/network capture. The target selector no longer drops such targets (skip only on transport failure; -32601 targets rank behind answering ones), `runtime eval` explains it with `RUNTIME_EVALUATE_UNSUPPORTED`, and errors/network connect but report empty windows there. Runtime capture on Android needs a development build [inferred — not yet verified].

Still open: Android capture via a dev build, distinguishing "no traffic" from silently-unsupported Network domain (an enable-ack proves nothing), performance probe, cross-platform sweep.

## Testing

Each tool: schema unit tests + tier-0 e2e coverage against a fixture app on a simulator ([[0002-testing-and-evals]]; scripted MCP replay is optional/deferred there). The composite loops are tier-1/2 eval scenarios.
