# 0020: A Directory That Is Not an Expo App

**Type:** RFC
**Status:** Draft — implemented
**Systems:** `src/project/expoApp.ts`; the `isExpoApp` field of `src/project/types.ts` and `src/project/probe.ts`; the `not-expo-app` row of `src/plan/decide.ts`; the guarded command entries (`src/dev/index.ts`, `src/start/index.ts`, `src/smoke/index.ts`, `src/navigate/index.ts`, `src/deploy/index.ts`, `src/doctor/index.ts`); `buildProjectStatus` / `buildNextActionStatus` in `src/status/sections.ts`, `projectLine` in `src/status/format.ts`, `buildStatusFollowUps` in `src/followups/status.ts`; `e2e/__tests__/project-shapes-test.ts`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26
**Related:** [[0004-smart-start-and-project-state]], [[0006-agent-native-cli-surface]], [[0010-agent-conventions]], [[0016-v1-scope]], [[0019-backend-parity-audit]]

## Summary

There are two wrong-directory failures, and this CLI only recognised one of them. `NO_PROJECT`
answers "no `package.json` anywhere above you". The other is **a `package.json` that is not an app**,
and it was not recognised at all: the decision table of [[0004-smart-start-and-project-state]]
§Decision table read *no `expo` dependency* as *lacks a dev client*, so `exagent dev` at a repository
or workspace root produced a plan reading `expo install expo-dev-client` → `expo prebuild` →
`expo run:ios` [observed — 2026-08-26, a temporary directory holding
`{"name":"plain","version":"1.0.0"}`]. An agent that ran `dev` one directory too high was handed a
plan to **install packages into the wrong repository and then build it**, with nothing anywhere in
the output saying that this directory holds no app.

The trap did not stop at `dev`. `status` in the same directory printed
`next  exagent dev → needs-dev-client: expo install expo-dev-client (+2 more steps)` and a follow-up
reading `npx exagent install expo-dev-client` — the same instruction, one hop later, from the
command an agent runs to *orient itself*.

## The decision

**A directory whose `package.json` declares no `expo` dependency is not an Expo app, and no command
may plan work that would change it without that fact being surfaced first.**

The rule is *declared*, not installed. A fresh clone with no `node_modules` is the most ordinary
state a real project is ever in; reading the installed `expo` package instead would call every one of
them "not an Expo app". `ProjectState.sdkVersion` is the installed half and stays exactly what it
was — the two fields answer two different questions, and `status` reports both.

There was no ambiguous case to defer. The v1 surface has no documented "bootstrap a bare React
Native app" flow — no LLP mentions one and no command implements one [observed — 2026-08-26, a sweep
of `llp/*.md` and `src/commandRegistry.ts`] — so `react-native` present with `expo` absent needed no
carve-out of its own: it is a package this CLI cannot act on for the same reason a plain Node package
is, and it gets the same answer.

## What each command does

The line is **what the command is for**, not whether it happens to write to disk:

| Command                                                      | In a directory that is not an Expo app                            |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `dev`, `start`, `smoke`, `navigate`, `deploy`, `doctor`        | stop with `NOT_EXPO_APP`, exit `1`, before planning or spawning     |
| `status`                                                       | report, with `project.isExpoApp: false` and a `next` that says so   |
| `typecheck`                                                    | unchanged — `checked: false`, "no TypeScript", exit `0`             |
| `install`, `new`                                               | unchanged — these are the two ways *out* of this state              |
| `dev:stop`, `dev:logs`                                         | unchanged — they act on the lock file, not on the app               |
| `login` / `logout` / `whoami` / `register`                     | unchanged — they act on `~/.expo` ([[0006-agent-native-cli-surface]]) |

Three of those rows are the ones worth arguing about.

**`status` answers rather than refusing**, and it is the only command that does. It is how a caller
*finds out* it is in the wrong place: refusing it would take away the report that diagnoses the
refusal. So it gains a field (`project.isExpoApp`), a `not an Expo app` clause on its project line,
a `next` that names neither `exagent dev` nor any plan step, and a single follow-up pointing out of
the directory instead of the four rungs that assumed an app was here.

**`doctor` stops**, which is the row that is not obvious. Left alone it exited `0` with
`passed: 0, failed: 0, parse: "failed"` and expo-doctor's own "Cannot determine the project's Expo
SDK version" buried in `raw` [observed — 2026-08-26]. An agent gating on `failed === 0` reads that as
a clean bill of health for a repository nothing checked. That is the same trap in a different coat,
and the fix is the same stop.

**`install` and `new` are never gated.** Adding Expo to this package is exactly the thing that makes
it an Expo app; a guard that refused it would leave the state it reports with no way out.

## The plan engine says so too

The stop lives at the command entry — before the probe, before the plan, before anything is spawned
— because a command that must not act here must not do work here first. But the decision table gains
a row anyway, above the web short-circuit and above every native row:

```
not-expo-app → target: none, steps: [], buildLocation: null
```

Two reasons for both halves rather than the guard alone. The engine is consumed by more than `dev`
(`status` reads it for the `next` line, and `resolveAsync` for the backend), so a table that still
answered `needs-dev-client` here would keep the trap alive in every caller that does not stop. And a
row is testable at tier 0, where the guard is not: `src/plan/__tests__/decide-test.ts` pins that no
plan of a non-app contains a step, including the two cases that used to short-circuit above the
dev-client row (a web target, and checked-in native directories).

`ProjectTarget` gains `none` for it — the one value that is not a way of running the app, because
there is no app here to run.

## The error, and why the recovery is the safe one

What / why / how, per the repo error style, because the caller does not know any of the three:

```
This directory is not an Expo app, so this command has nothing to act on.
Why: /repo/package.json declares no "expo" dependency, which is what makes a package an Expo app.
  The likeliest cause is a command run one directory too high — a repository or workspace root
  above the app.
How: change to the app's own directory and run this again; create an app here with
  "npx exagent new my-app"; or, if you really mean to add Expo to this package, run
  "npx exagent install expo" first.
Try: npx exagent new my-app
```

**Exit `1`, the same band as `NO_PROJECT`** ([[0010-agent-conventions]] §Exit codes): the tool did
not work, the call was aimed at the wrong directory, and running it again unchanged does the same
thing. Not the `20`–`29` band, which is for an operation that ran and did not succeed — nothing ran
here.

**The `Try:` line is the one recovery that changes nothing that is already here.** Three recoveries
are spelled in the `How:` sentence and only one can go on the line an agent acts on. `cd` is not a
command this CLI can name. `npx exagent install expo` writes into a repository the caller most
likely only walked past — the very mutation this whole document exists to prevent — so it stays in
the prose, where a reader who really means it will find it. Creating an app leaves everything that
is already here untouched, so that is what the machine-readable field says.

## Testing

`e2e/__tests__/project-shapes-test.ts` is where this is pinned, because every part of it is a fact
about a real filesystem and a real `cwd`: the `find-up` walk, the `package.json` read, and the
subprocess that inherits the directory. Seven rows — the `dev` plan, the one answer for all six
acting commands, the two `status` surfaces, the escape hatches, the dev-server commands, and an app
whose dependencies are not installed being planned for normally.

The last of those is the row that would catch the worst possible regression of this rule: a guard
that read `node_modules` instead of `package.json` would refuse every freshly cloned Expo app in the
world, and it would pass every other test in this file.

## What this closes

Both open items of [[0019-backend-parity-audit]] §What is still not tested. The first is this
document. The second is the `21` amendment in [[0010-agent-conventions]] §Exit codes — reserved,
emitted by no v1 command, with a source sweep in `src/__tests__/exitCodes-test.ts` keeping the
sentence true.
