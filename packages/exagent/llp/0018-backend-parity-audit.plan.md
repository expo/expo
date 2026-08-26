# 0018: Backend Parity — the Coverage Matrix, and What It Found

**Type:** Plan
**Status:** Draft
**Systems:** the e2e tier (`e2e/`); the EAS-backed call sites (`src/dev/devAsync.ts`, `src/impact/buildCache.ts`, `src/impact/compare.ts`, `src/status/easBuilds.ts`, `src/device/cloudSimulator.ts`, `src/passthrough/auth.ts`, `src/deploy/`); the follow-up ladders (`src/followups/`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26
**Related:** [[0002-testing-and-evals]], [[0015-backend-selection-and-config]], [[0016-v1-scope]], [[0010-agent-conventions]], [[0005-runtime-loop-tools]]

## Summary

[[0016-v1-scope]] fixed what ships. This is the audit that asks whether it is *tested* — specifically
whether the two backends behind the v1 surface are tested at comparable depth. They were not, and
the asymmetry was not random: **everything that runs on this machine had an e2e suite, and most of
what runs somewhere else had a unit test and a plan.**

Five real bugs came out of closing it, all of them in code that no test had ever executed end to
end. Four are on the EAS side; the fifth is a follow-up ladder that walked a caller off the backend
they chose.

The general shape, and the thing worth carrying forward: **a backend is not a flag, it is a second
process boundary.** A command that "supports EAS" spawns a different binary, reads a different
failure vocabulary and needs a different recovery sentence, and none of that is exercised by a test
that pins the *plan* an EAS run would produce.

## The matrix

`L` local, `E` EAS/cloud. `unit` means a test exists over the pure function; `e2e` means a whole
`exagent` process ran against a stub binary. **Bold** marks what this wave added.

| Command | Backend | Before | After |
| --- | --- | --- | --- |
| `dev` (plan decided) | L | unit + e2e | unchanged |
| `dev` (plan decided) | E | unit + e2e (`plan-test.ts`) | unchanged |
| `dev` (plan **run**) | L | unit + e2e (`dev-test.ts`) | unchanged |
| `dev` (plan **run**) | E | **nothing at any tier** | **e2e (`dev-eas-test.ts`, 13)** |
| `dev` needs-human | L | unit + e2e | unchanged |
| `dev` needs-human | E | none | **e2e — found bug 1** |
| `dev` broken CLI under the name | L | none | **e2e — found bug 2** |
| `dev` broken CLI under the name | E | none | **e2e — found bug 2** |
| `status` freshness | L | unit + e2e | unchanged |
| `status --explain` build lookup | E | unit + e2e | **+ broken-shim e2e — found bug 3** |
| `status --explain --build` | E | unit | **+ broken-shim e2e — found bug 4** |
| `status --assert` 0/20/22 | — | unit + e2e | unchanged |
| `deploy` web (EAS Hosting) | E | unit + e2e, wrapper crash included | unchanged |
| `deploy` native (launch) | E | unit + e2e | unchanged |
| `navigate --cloud` | E | unit + e2e | unchanged |
| `runtime:stop --cloud` | E | unit + e2e | unchanged |
| `runtime:reload --cloud` | E | unit | **e2e (2)** |
| `smoke --cloud` | E | unit (options only) | **e2e (2) — found bug 5** |
| `runtime:eval` | — | **nothing at the e2e tier** | **e2e (6)** |
| `runtime:errors` | — | **nothing at the e2e tier** | **e2e (6)** |
| `login`/`whoami` fallback chain | E | e2e | **+ broken-shim rung (1)** |
| `typecheck`, `doctor`, `inspect:*`, `new`, `install`, `skills:*`, `agents:setup` | — | unit + e2e | unchanged (no backend dimension) |
| project shape: space in path | — | none | **e2e (2)** |
| project shape: workspace | — | one deploy case | **e2e (2)** |
| project shape: no project | — | none | **e2e (3) — found bug 6** |
| project shape: not an Expo app | — | none | **e2e (2) + 1 skipped, see below** |

## The bugs

Each was found by a test written before the fix, and each is a case no unit test could have
produced on its own — the tool on the other side of the spawn is the variable.

1. **`dev` reported an EAS stop with the Expo CLI's code and the Expo CLI's prose.**
   `stopPromptFor` spelled `code: 'EXPO_NEEDS_INPUT'` for every recognised stop, so an `eas build`
   that stopped for a login exited 7 carrying `EXPO_NEEDS_INPUT` and a message reading *"the Expo
   CLI asks before it does something it cannot decide"* with a `How:` line about `exagent dev`
   flags. The `needsHuman` block was right — `npx eas login` — and the code and the prose beside it
   were not, which is worse than either being wrong alone. [[0015-backend-selection-and-config]]
   §Running an `eas` step is the paragraph that says these are different scenarios; the registry
   already held the right code for each. Fixed: the row's own code stands, and the sentence names
   the CLI that stopped.

2. **`dev` quoted a wrapper's panic under "What the tool printed".** `src/utils/wrapperCrash.ts`
   exists so that a shim, a stale link or a binary from another project under the name `expo` or
   `eas` is *named* rather than quoted, and `planStepFailedError` did not apply it. Fixed by
   carrying the resolved binary path on the step failure — which is the fact that resolves it, and
   which nothing had.

3. **`status --explain` reported a wrapper's panic as EAS's answer about the caller's builds.**
   `lookUpCachedBuildAsync` never fails a command; every failure is an `unknown` with a `reason`,
   and that reason is printed as what the service said. On the machine this was written on, `eas` is
   a shim, and the reason read `thread 'main' panicked at src/main.rs:41:9:`.

4. **`status --explain --build <id>` did the same, plus advice about neither problem.** The error's
   `How:` line said to check the build id and the account's sign-in.

5. **`smoke --cloud` walked the caller off the backend they chose.** `buildSmokeFollowUps` had no
   notion of `--cloud`, so a cloud run that found no session was answered with
   `npx exagent navigate / --ios` — *"this is what opens one on a booted device"* — and
   `npx exagent smoke --ios`. A host that reached for the cloud is very often a host with no booted
   device at all. `src/followups/reload.ts` already carried the flag; this did not. The rule is the
   one the `platform` field's own comment states ("a re-run that drops the platform is a different
   run", F58) applied to the other half of "which device is this run about".

6. **`NO_PROJECT` was a dead end.** The most common wrong-directory failure there is, answered with
   one clause — *"Project root directory not found"* — no reason, no next step, and a null
   `suggestedCommand`, so the `Try:` line an agent reads for its recovery was empty.

## What is still not tested, and why

Recorded rather than fixed, because each is either a design question or a boundary this tier cannot
cross.

- **`dev` in a directory that is not an Expo app plans `expo install expo-dev-client`.** The
  decision table reads "no `expo` dependency" as "lacks a dev client", so an agent that ran `dev`
  one directory too high gets a plan to install packages into the wrong repository. The failing test
  is `e2e/__tests__/project-shapes-test.ts`, skipped with a TODO. The fix is a new row at the top of
  `decideStartPlan` **and** a decision about what `dev`, `smoke` and `navigate` should each answer
  there, which belongs to the plan engine's owner.
- **Exit 21 is reserved and reachable from nothing.** `EXIT_OUTCOME_CANCELED` is defined, documented
  and used by no command; a declined plan exits 0 by explicit decision ([[0008-guardrails]] §Plan-
  with-cost dry run). Nothing is wrong, but an agent told to branch on 21 is branching on a code
  this release never emits, and the exit-code table should say so.
- **A successful `runtime:eval` is unreachable at tier 0**, unchanged from
  [[0002-testing-and-evals]] §Tier 0 doubles the dev server, not the app. What this wave *did* add is
  the third inspector state — a socket that answers every method `-32601` — which is a double for a
  runtime having no debugger rather than for a runtime, and is what makes the 22-not-0 rule testable
  at this tier.
- **No live `eas build`, `eas deploy` or simulator session runs anywhere in this suite**, which is
  the same boundary every EAS-backed command stops at. §A flag is not shipped until it has run
  against the published binary of [[0002-testing-and-evals]] is the rule that covers the gap, and it
  is a manual step.
- **The `--cloud` platform mismatch.** A session has one platform; `smoke --cloud --android` against
  an iOS session is refused by `navigate`'s own path and is not asserted for `smoke`.
- **Windows.** Everything here runs on posix in the local loop; the `tier0-windows` job is what
  covers the `.cmd` shim half, and the space-in-path suite is the one most likely to find something
  there.

## The rule this states

**Every backend a command has is a separate row of its test matrix, and the row is only filled by a
test that ran the command against a stub of that backend's binary.** A test that pins the plan, the
argv or the options an EAS run would use fills no row: the four EAS bugs above were all in code that
had a passing unit test one call frame away.
