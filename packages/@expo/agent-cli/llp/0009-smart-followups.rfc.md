# 0009: Smart Follow-Ups — Every Output Tells the Agent What It Can Do Next

**Type:** RFC
**Status:** Final
**Systems:** `packages/@expo/agent-cli` (all commands, `src/followups/`); JSONL event registry
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-22 · finalized 2026-08-28
**Related:** [[0006-agent-native-cli-surface]], [[0004-smart-start-and-project-state]], [[0003-knowledge-tools-and-skills]]

## Summary

Seed [confirmed — Kudo, 2026-08-22]: the CLI should attach what the agent needs to know next to its output. After `start`, for example, how to test on a real device or kick off a production build. This generalizes [[0006-agent-native-cli-surface]]'s "errors are prompts" to the success path: **every command exit, success or failure, carries state-aware next actions.** An agent mid-task should never have to guess the next command.

## Design [inferred]

**The follow-up block.** Each command may end with up to about 3 follow-ups, each `{ id, command, why }`:

- Human output: a short `Next:` section, in git-style prose.
- Agent output: a `cli:followups` JSONL event with the structured list, also embedded in `--json` payloads.
- It never changes exit codes, and it is suppressible (`--no-followups` / `AGENT_CLI_NO_FOLLOWUPS`).

**State-derived, not static.** Follow-ups are computed from the same probes the command already ran (project state, freshness, dev server, EAS config presence), so they are deterministic and unit-testable. Stable `id`s make them assertable in evals, as in "after start, follow-ups include `eas-build`".

## Examples per command

- `start` (Metro up, Expo Go): → `@expo/agent-cli navigate /`, the one step between "the dev server is up" and anything verifiable, and only on a machine that has a device (§Device-aware ladders); → real device, meaning how to open on a physical phone over the tunnel or LAN URL; → `@expo/agent-cli runtime:errors` while reproducing an issue; → production, `eas build --profile production`, only when `eas.json` exists and otherwise `eas build:configure` first, which the cap of three now drops.
- `start --web` **has its own ladder** [revised — 2026-08-23]. Every rung above is native. There is no device to deep-link into, no phone to reach the dev server from, and no debugger target for `runtime:errors` to read, because a web app runs in a browser and does not attach. The web run was inheriting them anyway, so it offered `runtime:errors` and `eas build:configure`, a cloud *native* build the run did not need, and named neither the site nor a way to check it [observed — friction run 2, 2026-08-23]. Its rungs are the three that exist for it: → `http://localhost:<port>`, the page a browser opens, or `@expo/agent-cli status --json` when nothing reported a port, because a guessed URL is how this CLI once handed an agent another project's dev server; → the web entry-bundle check, which is the only check the browser tab cannot give you (llp/0010 §The web target answers the same question with different documents); → `@expo/agent-cli deploy --web`, which is where a web build ships. The middle rung was `dev:wait --platform web` until that command was deferred, and it names `typecheck` now, a weaker answer honestly labelled ([[0016-v1-scope]] §What this costs, and see [[0017-deferred-commands]]).
- `install <native module>` while targeting Expo Go: → a warning plus `@expo/agent-cli dev`, because Go cannot load it. The impact classifier already knows this.
- `install <js-only>`: → "reload is enough"; → the module's skill was dumped to context, or `@expo/agent-cli skills:show <pkg>`.
- `dev --plan`: → `@expo/agent-cli dev` to execute; → what would make the plan cheaper, as in "record a build to make ios fresh".
- `navigate`: → `xcrun simctl io … screenshot` or the screenshot tool; → `@expo/agent-cli runtime:errors` to check the landing.
- `run/build success`: → freshness recorded; → `eas build` to ship, or `eas update` for OTA.
- `new`: → `@expo/agent-cli start`; → `@expo/agent-cli status` to orient.
- `status`: already carries "next" by design ([[0004-smart-start-and-project-state]]).

## Where the typecheck rung goes

Decision [confirmed — Kudo, 2026-08-23]. `@expo/agent-cli typecheck` is a rung of three existing ladders,
and the cap of three is what makes *which* rung it replaces a decision rather than an addition.

The finding [observed — friction run 3, F34]: a feature was finished with `dev:wait` at 0,
`runtime:errors --fail-on-error` at 0 and `doctor` at 21/21. Then `npx tsc --noEmit` found seven
errors, including `Spacing.md` on a constant that has no `md` among them. That is `undefined` at
runtime, so the screen rendered with `padding: undefined` and text flush to the edge. Nothing threw,
so `runtime:errors` was right to report nothing. Nothing failed to transform, so `dev:wait` was right
too. An agent following the CLI's own follow-ups would have shipped it, and that is the half this
document owns. The gate existing is [[0010-agent-conventions]]'s problem. The gate being
*reachable from where the agent already is* is this one's.

Three places, and the reason is different in each:

- **`runtime:errors` on an empty window**: second rung, after `runtime-errors-reproduce`. This is
  where the rung earns the most. An empty window means "nothing happened while I watched", and the
  reading it invites is "the app is fine". The bug this command cannot see does not throw at all,
  so the contradiction belongs next to the answer that invites it. The reproduce rung stays first,
  because the window really may have missed a throw, and that is the cheaper thing to rule out.
- **`dev:wait` on a ready bundle**: second rung, after `dev-wait-runtime-errors`. Nothing is
  replaced, because that ladder had one rung and room for three. The bundle compiling and the app not
  throwing are two of the three gates, and this names the third.
- **`install`**: **last**, so the cap decides. A package that ships an agent skill has something to
  read *before* the code against it is written, and a type check on code that does not exist yet is
  worth less than that. A package that ships none leaves the third slot free, which is the common
  case, so the rung usually appears. This is the one place the rung is *allowed* to be crowded out,
  and the ordering is what expresses that.

Deliberately **not** added: the `dev:wait` broken-bundle ladder, whose single rung names the file
the bundler stopped in. Type-checking a file that does not parse reports the same failure plus
noise, and a ladder whose first rung is not the one thing worth doing is a ladder an agent stops
reading.

`typecheck`'s own ladder is the escalation ladder of §Wider ideas, spelled out for the three gates.
A clean run offers the bundle gate and then `runtime:errors --fail-on-error`. A failing one offers
only itself. A run that checked nothing, meaning a project with no TypeScript, offers the bundle gate,
because "nothing was checked" must not read as "everything passed".

The `dev:wait` in the three paragraphs above is the command those decisions were made against. It was
deferred out of v1 on 2026-08-26, `smoke` is the gate now, and the rung placements are unchanged. See
[[0017-deferred-commands]].

## Device-aware ladders

Decision [confirmed — Kudo, 2026-08-25]. A rung that needs a **local** device is only offered to a
machine that has one, and `absent` is the only answer that turns one off.

The finding [observed — dogfood, 2026-08-24]. Expo Go was driven on a **cloud** EAS simulator
through a tunnel, from a laptop with no simulator booted and no device attached
(`EXPO_STAGING=1 EXPO_UNSTABLE_TUNNEL_V2=1 @expo/agent-cli start --tunnel --go`). With the dev server up and
zero apps connected, `status.next` said `@expo/agent-cli navigate /`, and the start banner said it first, for
two hours. `navigate` drives `xcrun simctl openurl` or `adb shell am start`, and neither can reach a
device this machine does not have. Every rung above it inherits the same assumption, including the
screenshot follow-up and `dev:wait --require-app`. The CLI had no way to know, because it had never
asked.

**The probe, and why three answers.** `src/device/localDevice.ts` runs the two probes `navigate`
already had, `xcrun simctl list devices booted -j` on macOS and `adb devices` everywhere, once per
process. It folds them into `present`, `absent` or `unknown`. `absent` may only be given by a tool
that **ran** and reported nothing. A tool that is not installed establishes nothing: a Linux box
with no `adb` is not a box with no device, and turning a working suggestion off on the strength of a
missing binary is the same mistake backwards. `unknown` therefore leaves every ladder exactly as it
was, and that is also what a probe that threw or ran out of its budget reports.

`adb` is resolved through the Android SDK when `PATH` has not got it (`src/toolchain/androidSdk.ts`,
shared with the build-location probe). That gap is real on this machine. Android Studio's SDK is
where the installer put it, no environment variable names it, and `adb` is not on `PATH`, so a
`PATH`-only probe reported "no device" with an emulator running [observed — 2026-08-25].

**What replaces the rung.** Not nothing. The thing that has to happen next still has to happen; it
just happens somewhere else. So the ladder names an **address** when one can be named: the
`exp://<host>` link, with the tunnel host when the run has one and the LAN host otherwise. When it
cannot, it names `@expo/agent-cli navigate / --print-url`, which covers every development build, whose scheme
lives in the project config, and every host with no LAN address. `status.next` does the same, with the
same `decideExpoGoTarget` the deep link uses, so the two never disagree about which app is running.

**Where it is paid for.** `status` races the probe against 2.5 s and reports `unknown` if it
expires. The `start` and `dev` banner races it against 1.5 s, on the last line before the bundler
takes the terminal. Measured at 260 ms for a cold `xcrun simctl list devices booted -j` and 2 ms for
`adb devices` [observed — 2026-08-25]. A ladder must never be what holds a start up, so both
budgets fail open.

## Wider ideas from the same angle [inferred — brainstorm]

1. **Agent-aware rendering.** `agent-cli-detector` is already a dependency. When a known agent drives the CLI, render follow-ups machine-tight, with exact commands and no prose. Humans get friendlier text.
2. **State deltas.** git-status-style change awareness, as in "fingerprint changed since the last recorded build, so the next start rebuilds". It surfaces _why_ the world moved under the agent.
3. **Teachable warnings.** When a command detects a mismatch, such as installing an unbundled native module while targeting Expo Go, or navigating with no dev server, attach the correction as a follow-up rather than only failing later.
4. **Version-pinned doc pointers.** Follow-ups may reference the installed module's co-located skill or SDK-pinned docs ([[0003-knowledge-tools-and-skills]]), as in "read `@expo/agent-cli skills:show expo-camera` before using it".
5. **Escalation ladders.** Each follow-up can name the next rung: dev on a simulator, then a real device via a dev build or tunnel, then internal distribution on EAS, then the store. The agent always knows the path upward without knowing EAS.
6. **First-run richness.** Optionally richer follow-ups the first time a command runs in a project, with seen-state in `.expo/`, and terse ones afterwards, because agents do not need repetition. This may be overkill, so measure it in evals first.

## Implemented in v1 as

[observed — 2026-08-22] The `src/followups/` engine, with 18 stable ids across start, plan, install, status, context, navigate, runtime-errors and skills-sync. It ships a `Next:` text block, a `followups` key in every `--json` shape, and a `cli:followups` JSONL event, with `--no-followups` and `AGENT_CLI_NO_FOLLOWUPS` to suppress it, capped at 3. The eval suite asserts `cli:followups` via the jsonl-event grader, which reads event names out of the `_e` field the `2g` logger writes them to.

## Testing

Follow-up computation is pure logic over already-probed state, so it is exhaustively unit-tested. Tier-1 and tier-2 evals assert that follow-up `id`s appear after key commands, and that a weak model can act on them. That second one is the real test of "smart context".

## Open questions

1. Do follow-ups also surface in `expo`-family subprocess output that @expo/agent-cli relays, or only for @expo/agent-cli's own commands? v1 does own commands only.
2. Should the escalation ladder consult EAS state, such as whether anybody is logged in and whether the project is configured? That needs `eas` subprocess probes with graceful degradation.
