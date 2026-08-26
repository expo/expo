# 0013: `doctor:fix` — A Deterministic Cache and Build-State Reset

**Type:** RFC
**Status:** Deferred — reference (2026-08-26)
**Systems:** `exagent doctor:fix` (`src/doctor/fix.ts`, `fixAsync.ts`, `fixPlan.ts`, `fixApply.ts`, `fixSteps.ts`, `fixSafety.ts`, `fixFormat.ts`, `fixTypes.ts`, `packageManager.ts`, `resolveFixOptions.ts`); `src/checkpoint/git.ts`; `src/followups/doctor.ts`; the JSONL event registry
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-24
**Related:** [[0008-guardrails]], [[0010-agent-conventions]], [[0006-agent-native-cli-surface]], [[0004-smart-start-and-project-state]], [[0009-smart-followups]], [[0016-v1-scope]]

> **Status:** Deferred — reference (2026-08-26)
>
> `doctor:fix` is out of the v1 surface. Its code is on the reference shelf at
> `src/deferred/doctor-fix/`, imported by nothing; `doctor` / `doctor:check` ship unchanged and are
> still the v1 answer to "what is wrong with this project".
>
> **Why:** the split this document opens with — expo-doctor diagnoses, `exagent` acts — is real, but
> only the diagnosing half earns a place in a first surface. What `doctor:fix` deletes is caches and
> build state, and every one of them is something an agent can delete with the tool it already has:
> `rm -rf node_modules && npx expo prebuild --clean` is one line an agent writes without help. The
> command's value is the *table* and the safety rules around it, which is worth shipping — later,
> once the surface it sits in is settled — rather than shipping a deleting command in a first
> release for the sake of completeness.
>
> **Re-entry criteria:** the v1 surface has been used enough to say which resets agents actually
> reach for, and a tier table can be cut down to those; and the checkpoint question is answered,
> because this command's whole subject is gitignored and no checkpoint holds it
> ([[0008-guardrails]] §Deleting what a checkpoint cannot hold). It returns as an action of the
> `doctor` group, with the dry-run default unchanged.

## Summary

`expo-doctor` diagnoses and `exagent` acts. `doctor:check` was the first half of that split ([[0010-agent-conventions]] §Exit codes); this is the second: one command that resets the caches and build state an Expo project accumulates, from a table an agent can read before it runs anything.

The whole command is arranged around one asymmetry. Every other mutating command in this CLI **adds** — an install, a prebuild, a build — and the expensive mistake there is a prompt nobody can answer. This one **deletes**, and the expensive mistake is a plan nobody read.

## Dry run is the default, and `--apply` is what executes

Decision [confirmed — Kudo, 2026-08-24]. `exagent doctor:fix` prints what it would do and touches nothing. `--apply` runs it.

This is the opposite of `exagent dev`, which runs the plan it prints ([[0004-smart-start-and-project-state]]), and the difference is worth stating rather than discovering: `dev` is asked for an outcome — get this app onto a device — and a plan is how it explains itself on the way. `doctor:fix` is asked for a *deletion*, and a deletion has no partial answer to fall back on. A driving agent that misreads `dev` loses a few minutes of prebuild; one that misreads this loses `node_modules` and a `Podfile.lock`.

The default costs one round trip and buys the property the tests are written around: **a `doctor:fix` with no `--apply` on it cannot delete anything, whatever else is wrong with the invocation.** The first e2e test plants every cache the safe tier looks for, runs the dry run, and asserts each planted path is still on disk — a test on the exit code alone would pass for a command that deleted everything and said it had not.

## The tier table

Tiers are **cumulative**: `moderate` includes every `safe` step and `aggressive` includes both. `src/doctor/fixSteps.ts` is the table, and it is data — a step names its targets from a *description* of the machine (`FixStepContext`) rather than by looking at one, so the whole table including the platform filtering is unit-testable with no filesystem.

**`safe`** — project-scoped, seconds, nothing to reinstall.

| id | What it removes | Evidence |
| --- | --- | --- |
| `expo-web-cache` | `<project>/.expo/web/cache` | observed in a real project |
| `expo-dev-logs` | `<project>/.expo/dev/logs` | observed; truncated on each run anyway, so this is cosmetic |
| `node-modules-cache` | `<project>/node_modules/.cache` | observed; presence-checked before it is planned |
| `metro-file-map` | `$TMPDIR/metro-file-map-expo-<md5 of the project root>-*` | §The file map is project-scoped, and provably so |
| `watchman-project` | `watchman watch-del <projectRoot>` | the project-scoped form of the `watch-del-all` the docs name |

**`moderate`** — a reinstall, minutes.

| id | What it removes | Evidence |
| --- | --- | --- |
| `metro-transform-cache` | `$TMPDIR/metro-cache`. **Machine-wide** | `packages/@expo/metro-config/src/ExpoMetroConfig.ts` joins `os.tmpdir()` with a fixed name, so every project on the machine shares it |
| `node-modules` | delete, then install with the lockfile's package manager | `docs/pages/troubleshooting/clear-cache-macos-linux.mdx` |
| `ios-pods` | `ios/Pods` and `ios/Podfile.lock`, then `pod install` | bare projects only; for CNG, `expo prebuild` runs `pod install` itself [observed — `packages/@expo/cli/src/utils/cocoapods.ts`] |
| `android-build` | `android/build`, `android/app/build`, `android/.gradle` | standard Gradle layout [inferred] |

**`aggressive`** — regenerates or reaches outside the project.

| id | What it does | Evidence |
| --- | --- | --- |
| `prebuild-clean` | `expo prebuild --clean --platform <p>`. CNG only | `--clean` is the default and `--no-clean` opts out [observed — `packages/@expo/cli/src/prebuild/index.ts`]. Refused on a project with checked-in native directories |
| `derived-data` | `~/Library/Developer/Xcode/DerivedData/<scheme>-*`. **Machine-wide** | the scheme is read from the `.xcodeproj` on disk, and the hash suffix is Xcode's, so the match is by prefix |
| `watchman-all` | `watchman watch-del-all`. **Machine-wide** | the docs' reset sequence |

**Deliberately excluded, and named in `--help` as excluded**: `npm cache clean --force` and `yarn cache clean`. Both are machine-wide, both cost minutes of re-downloading, and a corrupt package-manager cache is not what a stale bundle is. The troubleshooting page lists them, so a reader who knows the page has to be told the omission was a decision (`EXCLUDED_STEPS`, printed by `--help`).

Two deviations from the plan this was built from, both recorded rather than silent:

- **`watchman-all` is `watch-del-all` only**, not `watch-del-all` *and* `shutdown-server`. One `argv` per step keeps a step's invocation a single readable thing, and the documented reset sequence names only the first. `shutdown-server` is the heavier hammer the EMFILE handler reaches for [observed — `src/utils/errors.ts`], which is a different problem.
- **The DerivedData directory is named from the `.xcodeproj` on disk**, not from the app config. The directory is `<scheme>-<hash>`, the scheme comes from the generated Xcode project, and a name guessed from `app.json` would match a directory belonging to somebody else's app.

### The file map is project-scoped, and provably so

[observed — live on this machine, 2026-08-24] `@expo/metro-file-map` names its cache
`<prefix>-expo-<rootDirHash>-<relativeConfigHash>`, where `rootDirHash` is the **md5 of the project root** with posix separators [observed — `DiskCacheManager.getCacheFilePath` and `lib/rootRelativeCacheKeys.ts`]. Computing that md5 for four real project roots on this machine reproduced four of the five `metro-file-map-expo-*` directories in `$TMPDIR` byte for byte.

That is what lets the step be `scope: 'project'` despite living in a directory every program on the machine shares: the project root is *in the name*, so the target is this project's alone and needs no `--allow-machine-wide`. Only the trailing config hash is unknowable from outside, so the target is a prefix rather than a path. Both runtime prefixes are matched, because the Bun fork of the serializer gets a cache of its own.

**The documented reset clears nothing.** `docs/pages/troubleshooting/clear-cache-macos-linux.mdx` still tells users to `rm -fr $TMPDIR/haste-map-*`. There is no such file on this machine and has not been for years. Recorded below as an upstream ask.

## Ordering, derived rather than listed

Four rules, and `planOrder` in `fixSteps.ts` computes them from what a step *declares it is* — its `phase` and its `scope` — so a step somebody adds next year cannot be left out of a hand-kept list:

1. every deletion runs before any reinstall;
2. `node_modules` is reinstalled before `ios/Pods`, because the Podfile reads from it;
3. `prebuild-clean` runs after `node_modules`, because prebuild reads the installed packages;
4. machine-wide steps run last, so a failure there leaves the project steps already done.

**Rule 4 wins over rule 1** where they disagree, and that is a decision: a machine-wide deletion after a project reinstall costs nothing, and a machine-wide failure before one would have cost the reinstall. The unit tests assert all four on every tier, and the e2e test asserts the first from outside the process — the stub package manager records whether `node_modules` existed when it ran, and a log line saying the directory was already gone is the only proof from there that the install came second.

**A failed step stops the run.** The steps after it read what it was meant to produce, so continuing runs a step against a project in a state nobody planned for and reports whatever it does as if it meant something. The remaining steps are reported as `skipped` with the reason, not silently dropped.

## Path safety

`rejectUnsafeTarget(target, context)` in `src/doctor/fixSafety.ts` is the one predicate every target passes through — once into the plan, and **again immediately before `rm`**. The second check is not redundancy for its own sake: between the plan and the deletion a symlink can appear where a cache directory was, and this is the last thing that happens before an `rm -rf`.

It refuses, in order: a relative path; the filesystem root; `$HOME`; `$TMPDIR` itself; the project root; a machine-wide target with no `--allow-machine-wide`; a target outside every root its declared scope allows; a symlink; and a target whose realpath escapes the root it was allowed under. It reads its answer from its arguments and from `lstat`/`realpath`, and nothing in it touches `process.env`, so the table test describes a machine instead of running on one.

Three details are decisions rather than transcription:

- **The predicate takes the step's `scope`, which the plan this was built from did not have it take.** It has to: `metro-file-map` is outside the project directory and project-scoped, and `metro-transform-cache` is in the same directory and machine-wide. Location alone cannot tell those apart, and the plan's own example payload marks a `/var/folders/…` target `"scope": "project"`.
- **A symlink is refused, never followed.** Nothing in the table is one, so a target that is one means the machine is not in the state the table describes, and resolving it would be the command guessing about the difference between the path a reader sees and the bytes `rm -rf` reaches.
- **The root is resolved too, and the live run is what taught it.** macOS answers `os.tmpdir()` with `/var/folders/…`, `/var` is a symlink to `/private/var`, and comparing a resolved target against an unresolved root makes every target under a symlinked root look like an escape. The first live run of this command refused its own Metro file map for leaving a directory it had never left [observed — 2026-08-24].

**A machine-wide step without the flag is `skipped`, not an error.** A step a caller did not opt into is a step this run does not want, and the skip reason names the flag that would include it. `DOCTOR_FIX_UNSAFE_PATH` is reserved for a target the table named and the predicate refused, which is a bug in this CLI or a link planted where a cache should be — and its message says exactly that rather than blaming the project.

### Uncommitted native work refuses the whole plan

`DOCTOR_FIX_DIRTY_NATIVE`, exit `1`, raised at **plan time** — so a dry run reports the refusal, which is what a dry run is for.

A step declares `touchesNative`, and a tier holding one of those for a native directory the project has checked in asks git whether that directory has uncommitted **tracked** changes (`git status --porcelain --untracked-files=no -- ios android`, `dirtyTrackedPathsAsync`). `--untracked-files=no` is the whole point: a native directory is full of build output that is *supposed* to be untracked, and counting `??` entries would report every project as dirty.

Two reasons, and the second is the one that matters. The obvious one is that a checkpoint holds only tracked files (§Checkpoints do not protect this command below), so a dirty native directory is where this command's deletions and the user's unrecorded work sit next to each other. The one that decides it is that `pod install` and `prebuild --clean` both **rewrite tracked files** — `Podfile.lock`, the generated projects — which mixes machine output into a diff the user can no longer separate from their own edits.

Three details:

- **Exit `1`, not `20`.** Nothing was attempted and no operation started, which is the same reasoning that makes "no dev server" a `1` for `runtime:reload` ([[0010-agent-conventions]] §The fifth). The recovery is a command the caller runs — commit, stash, or `--tier safe` — and both spellings are in the `How:` line.
- **The message names the directory git reported on**, not the ones it was asked about. A run that asked about `ios` and `android` and got one back must not name the clean one as dirty.
- **A project outside git answers `[]`.** Nothing has been *shown* to be at risk, and refusing on an unanswerable question would stop the command on every project without a repository.

## Checkpoints do not protect this command, and it says so

This is the honest half of [[0008-guardrails]] applied to the one command it does not cover.

A checkpoint holds only git-tracked files [[0008-guardrails]] §Implemented in v1 as, and **every headline target of this command is gitignored**: `node_modules`, `ios/Pods`, `.expo`, and the Metro caches are in no checkpoint, and `checkpoint:undo` will not bring them back.

One is still taken before `--apply` at `moderate` and above, because it protects the one thing it can: a bare project's tracked `ios/` and `android/`, and a tracked `Podfile.lock` that `pod install` is about to rewrite. It goes through `checkpointBeforeAsync`, which never fails the command it guards.

And it ships with the sentence that says what it is not (`CHECKPOINT_NOTE`), on the human output and in the `--json` payload's `checkpoint.note`. That sentence is not a disclaimer: an agent that reads `Checkpoint 22a3cfd9` and infers a safety net will run the aggressive tier believing an undo exists for `node_modules`, and there is none. The **safe** tier takes no checkpoint at all — it deletes nothing tracked, so there is nothing for one to hold.

## Confirmation

At `moderate` and above, an interactive terminal is asked once — `Run this <tier> reset?` — after the plan is on screen, so the person answering has read what they are answering about. The pattern is `src/dev/confirmPlan.ts`'s, including who is never asked: `--yes`, `--json`, and every non-interactive run ([[0008-guardrails]] §Plan-with-cost dry run).

The trigger is the **tier**, not the time class the `dev` prompt uses. Everything in `safe` is regenerated by the next command, which is what the tier means, and a Y/n on deleting `.expo/web/cache` is a prompt people learn to answer without reading.

## Exit codes

| Code | The run |
| --- | --- |
| `0` | a dry run, an apply whose steps all worked, and a declined confirmation |
| `20` | an applied step failed; the payload's `results` says which and why |
| `1` | a bad argument, `DOCTOR_FIX_DIRTY_NATIVE`, or `DOCTOR_FIX_UNSAFE_PATH` |

**`20` for a failed step is a deliberate deviation** from the plan this was built from, which said `1`. Per [[0010-agent-conventions]] §Exit codes, `1` means *the tool did not work*, and a `doctor:fix` whose `pod install` failed did its job perfectly — it planned correctly, deleted correctly, and reported the subject's failure. `1` there would send an agent to fix its own invocation, and there is nothing to fix.

A declined confirmation exits `0`, matching `exagent dev`: nothing ran because nobody asked for it to, which is not a failure of anything.

New codes: `DOCTOR_FIX_UNSAFE_PATH`, `DOCTOR_FIX_DIRTY_NATIVE`.

## The payload, and the events

`--json` prints one object whose key set never varies ([[0006-agent-native-cli-surface]] §Output contract): `projectRoot`, `tier`, `applied`, `platforms`, `packageManager`, `steps`, `skipped`, `results`, `checkpoint`, `followups`. `results` and `checkpoint` are `null` on a dry run rather than absent.

A `FixStep` reuses `PlanStep`'s `{ id, reason, timeClass }` triple and its `TimeClass` verbatim ([[0004-smart-start-and-project-state]], `src/project/types.ts`), because an agent already reads that shape from `exagent dev --plan` and a second spelling of "what will run and how long it costs" would make it read two. What it adds is what a reset has and a start plan does not: `targets`, `scope`, `bytes`, `recoverable`.

- **`bytes` is `null` when it was not measured.** The walk stops at 20 000 entries, because a dry run has to be fast and `node_modules` is a hundred thousand files. `null` means the walk stopped; printing `0 B` for a directory that is 400 MB would be the one number a reader must not be given.
- **`skipped` carries a reason, always.** "This step was not planned" is a fact an agent has to act on, and the reason is what makes it actionable: `No ios/Podfile. This is a CNG project…`, `Affects every project on this machine. Pass --allow-machine-wide…`, `Nothing to delete: <the exact paths>`.

Events: `cli:doctor_fix_plan` once, before anything is applied, with the step **ids** and the flags; `cli:doctor_fix_step` per step as it finishes. Ids and counts only — the targets are absolute paths on the user's machine, and they are printed on the command's own output where the caller asked for them.

## Package-manager detection

`detectPackageManager` reads the lockfile, walking **up** from the project: a package of a monorepo has no lockfile of its own, and `npm install` run inside one writes a second lockfile there instead of installing the workspace. The install therefore runs in the lockfile's directory, carried on the step as `cwd`, while the deletion stays scoped to the project's own `node_modules`.

The names, the per-directory precedence and the npm fallback mirror `@expo/package-manager`'s `resolvePackageManager` [observed — `packages/@expo/package-manager/src/utils/nodeManagers.ts`], so a reset reinstalls with the tool `expo prebuild` would have used. It is a copy of a *decision*, not an import: the process boundary of [[0001-agentic-cli-on-expo-cli]] constraint 5 rules out reaching into that package. `lockfile: null` in the payload says the manager was a fallback rather than a reading.

## Follow-ups

Per [[0009-smart-followups]]. A dry run with steps offers `doctor:fix --tier <the caller's tier> --apply`, spelled so the next command is a paste. A dry run with **no** steps offers `doctor:check` and the next tier up, because "this tier found nothing" and "nothing is wrong" are different answers. A successful apply offers `exagent dev`, plus `doctor:check` when the packages were reinstalled. A failed apply names the step that failed and offers the re-run, and deliberately does *not* offer `dev`: the reset did not finish.

## Testing

Per [[0002-testing-and-evals]].

Unit — `rejectUnsafeTarget` against the full table over memfs, including the symlinked-root case the live run found; the step table's invariants (unique ids, one way to act per kind, exactly three machine-wide steps, a reason and a recovery on every row); the four ordering rules on every tier; the Windows- and Linux-filtered table; `metroFileMapPrefixes` pinned against a hash verified live; `planFixAsync` over memfs fixtures (CNG, bare, a project with no caches, each tier); `detectPackageManager` against each of the five lockfiles, none, a monorepo, and a two-lockfile tie; the flag resolvers; the follow-up builder.

E2E through the published bin, with a `$TMPDIR` of its own per test so the machine's real Metro caches are never in reach: the dry run asserting every planted path survives; the apply asserting exactly the planned paths are gone and the directories they lived in are not; the machine-wide flag; the reinstall order read off a stub package manager; exit `20` with the following steps skipped; the checkpoint and its note; `--no-checkpoint`; `DOCTOR_FIX_DIRTY_NATIVE` on a git fixture with a dirty tracked `ios/`; a rejected tier, platform and positional argument; and the `--help` naming the exclusions.

Live verification, 2026-08-24, on a scratch copy of a real SDK 57 app: the dry run left all four planted caches on disk; `--apply --yes --tier safe` removed exactly those four and left `node_modules`, `.expo` and the sources; `--tier moderate --apply` ran the three deletions and then `npm install`, with the stub recording that `node_modules` was already gone when it ran; and a bare fixture with a dirty tracked `ios/` exited `1` with `DOCTOR_FIX_DIRTY_NATIVE`, then ran the safe tier on the same project without complaint.

## Upstream asks

Both are already in [[0010-agent-conventions]] §Upstream asks, and this command is what they are for:

1. **`expo cache:clear`** — one supported way to clear the caches whose staleness a wrapper is otherwise reduced to guessing at. It would move `metro-transform-cache` and `metro-file-map` from deletions this CLI performs to a subprocess it calls, which is where the process boundary wants them.
2. **`expo-doctor --json` with stable check ids** — it would let `doctor:check` feed `doctor:fix` a targeted plan instead of a tier (§Open questions).

One documentation bug, found on the way and new here: `docs/pages/troubleshooting/clear-cache-macos-linux.mdx` tells users to delete `$TMPDIR/haste-map-*`. The modern name is `$TMPDIR/metro-file-map-expo-<hash>-<hash>`, verified live; the documented command clears nothing.

## Open questions

1. Should `doctor:fix` gain a `--from-check` mode that plans only the steps the last `doctor:check` implicates? It needs the `expo-doctor --json` ask first.
2. Should the safe tier run automatically as the recovery hop after a bundler failure in `exagent dev`? A [[0009-smart-followups]] follow-up, not a default.
3. `derived-data` matches by scheme prefix, so two projects with the same scheme name have directories with the same prefix. The flag and the listed matches are the mitigation today; nothing short of a build tells them apart [inferred].
