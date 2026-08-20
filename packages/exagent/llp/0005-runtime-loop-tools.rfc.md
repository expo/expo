# 0005: Runtime Loop Tools — Seeing and Driving the Running App

**Type:** RFC
**Status:** Draft
**Systems:** `expo-mcp` tools; `@expo/cli` CDP debugging layer; LogBox
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]]

## Summary

Tools that let a driving agent observe and manipulate the running app, closing the verify loop that text-only agents cannot close. All ship as `expo-mcp` tools (per the reuse decision in [[0001-agentic-cli-on-expo-cli]]). All items [inferred] unless tagged; the named runtime hooks exist today [observed where noted].

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

## Testing

Each tool: schema unit tests + tier-0 e2e coverage against a fixture app on a simulator ([[0002-testing-and-evals]]; scripted MCP replay is optional/deferred there). The composite loops are tier-1/2 eval scenarios.
