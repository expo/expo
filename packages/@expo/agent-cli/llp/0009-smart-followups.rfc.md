# 0009: Smart follow-ups

**Type:** RFC
**Status:** Active
**Systems:** `packages/@expo/agent-cli` (all commands, `src/followups/`); JSONL event registry
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-22
**Revised:** 2026-08-30
**Related:** [[0006-agent-native-cli-surface]], [[0004-smart-start-and-project-state]], [[0003-knowledge-tools-and-skills]]

## Summary

The CLI attaches what the agent needs to know next to its output. [confirmed, Kudo, 2026-08-22] This generalizes [[0006-agent-native-cli-surface]]'s "errors are prompts" to the success path: every command exit, success or failure, carries state-aware next actions. An agent mid-task should never have to guess the next command.

## The follow-up block

Each command may end with up to 3 follow-ups, each `{ id, command, why }`.

- Human output: a short `Next:` section, in git-style prose.
- Agent output: a `cli:followups` JSONL event with the structured list, also embedded in `--json` payloads.
- It never changes exit codes. It is suppressible (`--no-followups` / `AGENT_CLI_NO_FOLLOWUPS`).

Follow-ups are computed from the same probes the command already ran (project state, freshness, dev server, EAS config presence), so they are deterministic and unit-testable. Stable `id`s make them assertable in evals.

## Examples per command

- `start` (Metro up, Expo Go): `@expo/agent-cli navigate /` on a machine that has a device; how to open on a physical phone over the tunnel or LAN URL; `@expo/agent-cli runtime:errors` while reproducing an issue.
- `start --web` has its own ladder. Every native rung is wrong for it. There is no device to deep-link into, no phone to reach the dev server from, and no debugger target for `runtime:errors`. Its rungs: `http://localhost:<port>` (or `status --json` when nothing reported a port); `typecheck`; `@expo/agent-cli deploy --web`.
- `install <native module>` while targeting Expo Go: a warning plus `@expo/agent-cli dev`, because Go cannot load it.
- `install <js-only>`: "reload is enough"; the module's skill, or `@expo/agent-cli skills:show <pkg>`.
- `dev --plan`: `@expo/agent-cli dev` to execute; what would make the plan cheaper.
- `navigate`: a screenshot; `@expo/agent-cli runtime:errors` to check the landing.
- `new`: `@expo/agent-cli start`; `@expo/agent-cli status` to orient.
- `status`: already carries "next" by design ([[0004-smart-start-and-project-state]]).

## Where the typecheck rung goes

`@expo/agent-cli typecheck` is a rung of three existing ladders. The cap of three is what makes which rung it replaces a decision rather than an addition. [confirmed, Kudo, 2026-08-23] The gate existing is [[0010-agent-conventions]]'s problem. The gate being reachable from where the agent already is is this one's.

Three places:

- `runtime:errors` on an empty window: second rung, after `runtime-errors-reproduce`. An empty window invites the reading "the app is fine". The bug this command cannot see does not throw at all, so the contradiction belongs next to the answer that invites it. The reproduce rung stays first, because the window really may have missed a throw.
- `smoke` on a ready bundle: second rung, after the runtime-errors rung. The bundle compiling and the app not throwing are two of the three gates. This names the third.
- `install`: last, so the cap decides. A package that ships an agent skill has something to read before the code against it is written. A type check on code that does not exist yet is worth less than that. A package that ships none leaves the third slot free, which is the common case. This is the one place the rung is allowed to be crowded out.

Deliberately not added: the broken-bundle ladder, whose single rung names the file the bundler stopped in. Type-checking a file that does not parse reports the same failure plus noise.

`typecheck`'s own ladder: a clean run offers `smoke` and then `runtime:errors --fail-on-error`. A failing one offers only itself. A run that checked nothing (a project with no TypeScript) offers `smoke`, because "nothing was checked" must not read as "everything passed".

## Device-aware ladders

A rung that needs a local device is only offered to a machine that has one. `absent` is the only answer that turns one off. [confirmed, Kudo, 2026-08-25]

`src/device/localDevice.ts` runs the two probes `navigate` already had, `xcrun simctl list devices booted -j` on macOS and `adb devices` everywhere, once per process. It folds them into `present`, `absent`, or `unknown`.

`absent` may only be given by a tool that ran and reported nothing. A tool that is not installed establishes nothing: a Linux box with no `adb` is not a box with no device. `unknown` therefore leaves every ladder exactly as it was. That is also what a probe that threw or ran out of its budget reports.

`adb` is resolved through the Android SDK when `PATH` has not got it (`src/toolchain/androidSdk.ts`).

What replaces the rung is not nothing. The ladder names an address when one can be named: the `exp://<host>` link, with the tunnel host when the run has one and the LAN host otherwise. When it cannot, it names `@expo/agent-cli navigate / --print-url`. `status.next` does the same, with the same `decideExpoGoTarget` the deep link uses, so the two never disagree about which app is running.

`status` races the probe against 2.5 s and reports `unknown` if it expires. The `start` and `dev` banner races it against 1.5 s. A ladder must never be what holds a start up, so both budgets fail open.

## Implemented

The `src/followups/` engine ships a `Next:` text block, a `followups` key in every `--json` shape, and a `cli:followups` JSONL event, with `--no-followups` and `AGENT_CLI_NO_FOLLOWUPS` to suppress it, capped at 3. The eval suite asserts `cli:followups` via the jsonl-event grader.

## Testing

Follow-up computation is pure logic over already-probed state, so it is exhaustively unit-tested. Tier-1 and tier-2 evals assert that follow-up `id`s appear after key commands, and that a weak model can act on them.
