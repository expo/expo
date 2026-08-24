# 0009: Smart Follow-Ups — Every Output Tells the Agent What It Can Do Next

**Type:** RFC
**Status:** Draft
**Systems:** `packages/exagent` (all commands); JSONL event registry
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-22
**Related:** [[0006-agent-native-cli-surface]], [[0004-smart-start-and-project-state]], [[0003-knowledge-tools-and-skills]]

## Summary

Seed [confirmed — Kudo, 2026-08-22]: the CLI should be smart about attaching what the agent needs to know next to its output — e.g. after `start`, how to test on a real device or kick off a production build. This generalizes [[0006-agent-native-cli-surface]]'s "errors are prompts" to the success path: **every command exit — success or failure — carries state-aware next actions.** An agent mid-task should never have to guess the next command.

## Design [inferred]

**The follow-up block.** Each command may end with up to ~3 follow-ups, each `{ id, command, why }`:

- Human output: a short `Next:` section (git-style prose).
- Agent output: a `cli:followups` JSONL event with the structured list; also embedded in `--json` payloads.
- Never changes exit codes; suppressible (`--no-followups` / `EXAGENT_NO_FOLLOWUPS`).

**State-derived, not static.** Follow-ups are computed from the same probes the command already ran (project state, freshness, dev server, EAS config presence), so they are deterministic and unit-testable. Stable `id`s make them assertable in evals ("after start, follow-ups include `eas-build`").

## Examples per command

- `start` (Metro up, Expo Go): → `exagent navigate /`, the one step between "the dev server is up" and anything verifiable; → real device: how to open on a physical phone (tunnel/LAN URL); → `exagent runtime:errors` while reproducing an issue; → production: `eas build --profile production` (only when `eas.json` exists, else `eas build:configure` first), which the cap of three now drops.
- `start --web` **has its own ladder** [revised — 2026-08-23]. Every rung above is native: there is no device to deep-link into, no phone to reach the dev server from, and no debugger target for `runtime:errors` to read, because a web app runs in a browser and does not attach. The web run was inheriting them anyway, so it offered `runtime:errors` and `eas build:configure` — a cloud *native* build the run did not need — and named neither the site nor a way to check it [observed — friction run 2, 2026-08-23]. Its rungs are the three that exist for it: → `http://localhost:<port>`, the page a browser opens (or `exagent status --json` when nothing reported a port — a guessed URL is how this CLI once handed an agent another project's dev server); → `exagent dev:wait --platform web`, which builds the web entry bundle and is the only check the browser tab cannot give you (llp/0010 §The web target answers the same question with different documents); → `exagent deploy --web`, which is where a web build ships.
- `install <native module>` while targeting Expo Go: → warning + `exagent dev` (Go cannot load it) — the impact classifier already knows this.
- `install <js-only>`: → "reload is enough"; → the module's skill was dumped to context / `exagent skills:show <pkg>`.
- `dev --plan`: → `exagent dev` to execute; → what would make the plan cheaper ("record a build to make ios fresh").
- `navigate`: → `xcrun simctl io … screenshot` or the screenshot tool; → `exagent runtime:errors` to check the landing.
- `run/build success`: → freshness recorded; → `eas build` to ship, `eas update` for OTA.
- `new`: → `exagent start`; → `exagent status` to orient.
- `status`: already carries "next" by design ([[0004-smart-start-and-project-state]]).

## Wider ideas from the same angle [inferred — brainstorm]

1. **Agent-aware rendering.** `agent-cli-detector` is already a dependency: when a known agent drives the CLI, render follow-ups machine-tight (exact commands, no prose); for humans, friendlier text.
2. **State deltas.** git-status-style change awareness: "fingerprint changed since the last recorded build → the next start rebuilds" — surfacing _why_ the world moved under the agent.
3. **Teachable warnings.** When a command detects a mismatch (installing an unbundled native module while targeting Expo Go; navigating with no dev server), attach the correction as a follow-up rather than only failing later.
4. **Version-pinned doc pointers.** Follow-ups may reference the installed module's co-located skill or SDK-pinned docs ([[0003-knowledge-tools-and-skills]]) — "read `exagent skills:show expo-camera` before using it".
5. **Escalation ladders.** Each follow-up can name the next rung: dev (simulator) → real device (dev build/tunnel) → internal distribution (EAS) → store. The agent always knows the path upward without knowing EAS.
6. **First-run richness.** Optionally richer follow-ups the first time a command runs in a project (seen-state in `.expo/`), terse afterwards — agents don't need repetition. (May be overkill; measure in evals first.)

## Implemented in v1 as

[observed — 2026-08-22] `src/followups/` engine with 18 stable ids across start/plan/install/status/context/navigate/runtime-errors/skills-sync; `Next:` text block, `followups` key in every `--json` shape, `cli:followups` JSONL event; `--no-followups` + `EXAGENT_NO_FOLLOWUPS`; capped at 3. The eval suite asserts `cli:followups` via the jsonl-event grader (which had never matched a real event before — `2g` writes names to `_e`; fixed).

## Testing

Follow-up computation is pure logic over already-probed state → exhaustively unit-tested. Tier-1/2 evals assert follow-up `id`s appear after key commands and that a weak model can act on them (the real test of "smart context").

## Open questions

1. Do follow-ups also surface in `expo`-family subprocess output that exagent relays, or only for exagent's own commands (v1: own commands only)?
2. Should the escalation ladder consult EAS state (logged in? project configured?) — needs `eas` subprocess probes with graceful degradation.
