# 0004: Smart Start and the Project-State Engine

**Type:** RFC
**Status:** Draft
**Systems:** project-state probe (new); smart `dev` command (new, `start` until 2026-08-22); `@expo/fingerprint`; `expo-mcp` tools
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0002-testing-and-evals]]

## Summary

One deterministic engine answers "what must run to get this app on a device?" — consumed as a single smart command [confirmed — Kudo, 2026-08-19; spelled `start` until 2026-08-22, `dev` since — see §`exagent status` — Renamed], as the post-install "what must rerun?" answer, and as an Expo Go compatibility check. Neither agents nor users decide when to prebuild, rebuild, or just start Metro.

Per [[0001-agentic-cli-on-expo-cli]] §Constraints, the engine _invokes_ `expo prebuild` / `expo run:*` / `expo start` as subprocesses and consumes their JSONL events; it does not import `@expo/cli` internals.

## Inputs (project-state probe)

- Target: Expo Go, dev client, or web; is the target app installed on the device/simulator?
- Native state: bare `ios/`/`android/` dirs vs CNG; `@expo/fingerprint` hash of the native surface [observed — package exists; the CLI's build-cache providers already compute `calculateFingerprintHashAsync`, `packages/@expo/cli/src/utils/build-cache-providers/index.ts`].
- Compatibility: Expo Go check; post-install impact classification (below).

## Decision table (sketch)

| State                                                   | Plan                                            |
| ------------------------------------------------------- | ----------------------------------------------- |
| Expo Go compatible, Go installed                        | start Metro → open in Expo Go                   |
| Dev client installed, fingerprint matches last build    | start Metro → open dev client                   |
| Fingerprint changed (new native module / config plugin) | prebuild (CNG) → native build → install → start |
| Build cache hit for current fingerprint                 | download/install cached build → start Metro     |
| Bare project, native dirs dirty                         | pod install / gradle sync → build → start       |
| Web                                                     | start Metro for web                             |

## Contract

Emit the plan first as a structured event (steps + reasons + time-class estimates), then execute, streaming JSONL progress. `--plan` stops after emitting so a driving agent can present it for approval ([[0008-guardrails]]). Exposed identically as a CLI command for humans and an MCP tool for agents.

## Sub-features

- **Expo Go compatibility check** [confirmed — Kudo seed, 2026-08-18]: answer "can this run in Expo Go?" with reasons — compare dependencies against `packages/expo/bundledNativeModules.json` [observed — file exists], detect config plugins and custom native code, check SDK support.
- **Post-install impact decisions** [confirmed — Kudo seed, 2026-08-18]: after `npx expo install {pkg}`: JS-only → keep dev server, maybe reload; new config plugin or native module under CNG → prebuild + new dev build; bare native dirs → pod install / gradle sync. Same classifier as the decision table, consumed at a second moment.

## `exagent status`

[confirmed — Kudo seed, 2026-08-22] A `git status`-like overview: one fast, read-only command that answers "where is this project right now, and what would happen next". Composition of existing pieces [inferred]:

- **Project**: name/slug, SDK version, CNG vs bare, dev-client/web deps.
- **Expo Go**: compatible or not, with reason count (the reasons themselves in the `probe` key of `--json`).
- **Freshness**: current fingerprint vs `.expo/exagent-last-build.json` per platform → `fresh` / `stale` / `unknown` (no fingerprint tool).
- **Dev server**: running or not (probe the configured/default port), and how many CDP targets are connected (app open?).
- **Skills**: agent selection cached? linked skill count vs discovered count (out-of-sync hint).
- **Next action**: the smart-start rule that would fire, as one line (e.g. "`exagent dev` → expo-go: start Metro and open in Expo Go").

Contract: human-readable sections by default (like `git status` short prose), `--json` for the machine shape, exit 0 always (status is information, not judgment). Fast: no subprocess heavier than the fingerprint CLI; dev-server probe with a short timeout.

Merged [confirmed — Kudo, 2026-08-22]: **`status` absorbs the former `exagent context`**, which is removed. `status --json` carries the raw `ProjectState` verbatim under a `probe` key, alongside the sections above — the sections round the probe off for a terminal (Expo Go as a reason _count_, the fingerprint as a hash), and `probe` is what the summarizing dropped, so a caller that wants the brief reads one command instead of two. Rationale [inferred]: the two commands shared one probe and differed only in how much of it they printed, which is a flag, not a verb; and an agent orienting in a project was reliably running both. The probe costs nothing extra here — `status` already reads it to build its sections. The `install-dev-client` follow-up moved over with it; the `project-context` follow-up that pointed at `context` is gone, because the reasons it promised are now in the same report.

Default change [confirmed — Kudo, 2026-08-22]: **smart mode is `exagent start`'s default** (the plain passthrough moves behind `--passthrough`; `--smart` stays as an alias). Human guardrail per [[0008-guardrails]]: an interactive terminal facing a plan with build-class steps gets one Y/n confirmation; non-interactive runs (agents, CI) proceed plan-first without prompting.

Renamed [confirmed — Kudo, 2026-08-22]: **the smart engine is its own verb, `exagent dev`**, and `exagent start` goes back to being `expo start`. The rule that decides this is in [[0006-agent-native-cli-surface]] §The `exagent` launcher: a command sharing a name with an `expo` command behaves like that command, so the engine that does something `expo start` does not cannot be spelled `start`. The two mode flags disappear with the rename — `--smart` had nothing left to distinguish itself from, and `--passthrough` is now the `start` command itself. Everything else about the contract above is unchanged, including the Y/n guardrail.

Implemented [observed — 2026-08-22]: `exagent status [--json] [--dev-server-url]`, ~65 ms, per-section error notes with exit 0 (argument errors exit 1); next action names `exagent dev`; project name from `package.json` (dynamic app config needs an `expo config` subprocess, same approximation as item 7 below); live-verified against a real running project.

Rename implemented [observed — 2026-08-22]: the engine is `src/dev/` (`devAsync.ts`, `confirmPlan.ts`, `resolveOptions.ts`), and `resolveDevOptions` resolves `run` with no flag and `plan` with `--plan` — the only two things the command can do. `src/start/` keeps the `expo start` wrapper: `resolveStartOptions` strips exactly two flags of its own (`--no-agent-skills`, `--no-followups`) and forwards everything else untouched, so `expo start` stays the one that rejects an argument it does not know. `dev` reuses the wrapper's `runDevServerAsync` for the dev-server step of a plan and its `resolveStartFollowUps` for the follow-ups of a run that ends in one. The guardrail lives in `src/dev/confirmPlan.ts` and is asked only when the run is interactive (`isInteractive()`: a TTY, not CI, not headless), `--yes` was not passed, `--json` was not passed (the prompt would land inside the parsed payload), and at least one step is costlier than `seconds`. A decline emits `cli:start_plan_declined`, points at `dev --plan` and `start`, and exits 0 — nothing ran, so nothing failed. It is asked after the plan is emitted and before the checkpoint is taken, so a declined plan snapshots nothing. The `cli:start_plan` event keeps its name and its `mode: 'plan' | 'smart'` field: they name the plan engine of this RFC, not the command that drives it.

## Implemented in v1 as

[observed — implementation, 2026-08-22] The engine shipped in `packages/exagent` (`src/project/`, `src/plan/`, `src/status/`, `src/dev/`, `exagent dev [--plan]`) with these deliberate approximations of the table above:

1. **No device probe.** "Go/dev client installed on the device" is unobservable without simctl/adb; those rows are dropped — `expo start` prompts for Go itself and `expo run:*` installs what it builds.
2. **No build-cache lookup.** Freshness = probe fingerprint vs `.expo/exagent-last-build.json` (written after a successful `run:*` step). Unrecorded ⇒ stale: v1 over-plans a build at worst, never under-plans.
3. The recorded hash is the pre-build probe hash (what an unchanged project re-probes to).
4. The `web` rule fires only on an explicit `--web`; `ProjectState` cannot prove "web-only".
5. Bare-vs-CNG uses "any native dir present"; the argv uses the resolved platform.
6. `sdkVersion: null` never forces a rule; `expoGo.compatible` is the single Go verdict.
7. Config plugins are read from static config only (`app.json`); dynamic `app.config.js/ts` yields a debug event and best-effort skip — resolving it needs an `expo config` subprocess (follow-up).

## Testing

The decision table is pure logic over probed state: exhaustively unit-tested, no model, no device (tier 0 in [[0002-testing-and-evals]]). Probe and execution paths get e2e coverage against fixtures via subprocess + JSONL assertions.
