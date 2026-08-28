# 0017: The Deferred Commands — The Designs Held on the Reference Shelf

**Type:** Reference
**Status:** Deferred — reference
**Systems:** the reference shelf (`src/deferred/dev-wait/`, `src/deferred/checkpoint/`, `src/deferred/build-wait/`, `src/deferred/runtime-network/`, `src/deferred/doctor-fix/`); the JSONL event declarations these commands left behind in `src/events.ts`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26 (single-home consolidation 2026-08-28) · finalized 2026-08-28
**Related:** [[0016-v1-scope]], [[0010-agent-conventions]], [[0008-guardrails]], [[0005-runtime-loop-tools]], [[0004-smart-start-and-project-state]], [[0006-agent-native-cli-surface]], [[0009-smart-followups]], [[0012-build-explain]], [[0002-testing-and-evals]]

## What this document is

**This is the single home for every deferred command's design.** [[0016-v1-scope]] took five areas
out of the v1 surface and moved their code, verbatim, to `src/deferred/<area>/`. Their design lives
here: one section per area, each carrying what was built, why it left, what would bring it back, and
which directory holds the code. Anywhere else in the corpus, a deferred command gets a one-line
pointer to this document and nothing more.

It is one document rather than five banners for one reason. A deferral read as a note at the top of
a live LLP is a note a reader skips on the way to the part that ships, and five of them across four
documents made "is this command real?" a question the corpus answered in five places. Here the
answer is the document: **nothing described below is a command this CLI has.** A restored command is
restored from its shelf directory *and* its section here. The code is the mechanism; this is why the
mechanism is the shape it is.

| Section                     | The command                          | Code                        | Why it left v1                        |
| --------------------------- | ------------------------------------ | --------------------------- | ------------------------------------- |
| §`dev:wait`                 | `@expo/agent-cli dev:wait`                   | `src/deferred/dev-wait/`    | `smoke` asks its questions and three more |
| §The checkpoint system      | `@expo/agent-cli checkpoint[:list\|:undo]`   | `src/deferred/checkpoint/`  | agents manage git themselves          |
| §`build:wait`               | `@expo/agent-cli build:wait <id>`            | `src/deferred/build-wait/`  | wants to be `build --wait`, not a command |
| §`runtime:network`          | `@expo/agent-cli runtime:network`            | `src/deferred/runtime-network/` | the CDP Network domain is unstable and absent on Expo Go |
| §`doctor:fix`               | `@expo/agent-cli doctor:fix`                 | `src/deferred/doctor-fix/`  | the check half is the v1 answer       |

**What is not here, and this is the one exception to the rule above.** A deferred area's findings
that still govern **live** code stayed in the LLP that made them, and every section below names which
and where. That split is the whole care this consolidation takes. `dev:wait`'s bundle check is
`smoke`'s bundle check, and moving its design onto a shelf would have shelved a document that
describes running code.

**The events stayed too.** `cli:dev_wait`, `cli:runtime_network`, `cli:build_wait*` and
`cli:doctor_fix_*` are still declared in `src/events.ts`, each annotated with its deferral
([[0016-v1-scope]] §Deferred is a place, not a deletion). A deferral is not a schema change. The
command comes back emitting those fields, or it comes back as something else. Nothing emits them
now.

**This document is not verified.** Nothing type-checks the shelf and nothing runs its tests
([[0016-v1-scope]] §What this costs), so both the code and the prose here rot at the rate the tree
around them moves. Read a path as where a thing was on 2026-08-26, not as where it is.

## `dev:wait`

`@expo/agent-cli dev:wait` waited for this project's dev server to be ready, proved the dev server was
**this** project's, and built the entry bundle to prove the project compiles. Code:
`src/deferred/dev-wait/` (`wait.ts`, `waitAsync.ts`, `resolveWaitOptions.ts`, `waitFormat.ts`,
`followups.ts`, and the tier-0 eval scenario `dev-wait-no-dev-server.eval.json`).

**Why it left** [confirmed — Kudo, 2026-08-26]: two commands answered the same question with
different amounts of it. `dev:wait` proved the bundler was ready, the dev server was this project's,
and the entry bundle compiled. `smoke` proves those, then opens the app, evaluates in it and
collects what it threw. An agent that ran the smaller one and believed it had a verdict is the
failure mode [[0010-agent-conventions]] is about, and the answer is one gate rather than a choice
between two.

**Where each of its jobs went, in v1:**

| what it was reached for         | the v1 answer                            |
| ------------------------------- | ---------------------------------------- |
| the gate before reading the app | `@expo/agent-cli smoke`                          |
| app health over a window        | `@expo/agent-cli runtime:errors --fail-on-error` |
| readiness at start              | `@expo/agent-cli dev --detach --wait-ready`      |

Every one of these had to be a command that exists, because a suggestion is a command the reader runs
([[0009-smart-followups]], and the rule as [[0016-v1-scope]] states it).

`status`'s `next` line is the one worth naming. It was `@expo/agent-cli dev:wait --require-app` and is now
`@expo/agent-cli smoke`, which is a *larger* command than the one it replaces. That is the point of the
deferral rather than a cost of it: the reason `dev:wait` went is that the smaller gate invited an
agent to believe it had a verdict.

**Re-entry criteria:** `smoke` is observed being too much for a case that only needs the bundler
question, a CI job with no device for instance, and the cheaper wait cannot be had by flags on
`smoke`. What returns is the command layer below. The library it called never left.

### Its library internals stayed, and so did their design

This is the section of this document with the least in it, and that is the finding rather than an
omission. `src/runtime/waitReady.ts` and `src/runtime/bundleCheck.ts` are what `smoke`,
`runtime:reload` and `dev --detach --wait-ready` call, so **every question `dev:wait` settled is
still asked**, by `smoke`, which asks all of them and three more in one command. Their design
therefore stayed in [[0010-agent-conventions]], where it still governs live code:

- §The second: the readiness gate. A dev server that proved it serves another project exits `20`
  with `ok: false`, and `null` is not `false`.
- §The gate has to ask about the _project_, not only the dev server. The two-request entry-bundle
  check, and the four decisions inside it.
- §The web target answers the same question with different documents, and §What app counting can
  and cannot see. The web bundle check, and `appsConnected: null`.
- §One error, one shape, whichever document answered, and §`checked` and `ok` move together. The
  payload shape both channels report.

The prose there names `dev:wait` throughout, because that is the command the findings were made
against. Read those mentions as the historical record of where a live rule came from.

### What is on the shelf

The command layer, and only that: option resolution (`--timeout`, `--require-app`,
`--no-bundle-check`, `--platform`, `--json`), the human report, the exit-code mapping onto the
outcome band, and the follow-up ladder. `bundleToJson` and its payload type went the other way on
the day of the deferral, *into* `src/runtime/bundleCheck.ts`, beside the check they describe, as
`BundleCheckJson`, with the JSON keys unchanged ([[0016-v1-scope]] §Deferred is a place).

Its tier-0 eval scenario `dev-wait-no-dev-server` was replaced by `smoke-no-dev-server`, which asks
the same thing of the command that answers it now.

## The checkpoint system

`@expo/agent-cli checkpoint [--label]`, `@expo/agent-cli checkpoint:list` and `@expo/agent-cli checkpoint:undo [--id]`, plus
the automatic snapshots that `install`, `agents:setup` and a prebuilding `dev` plan took. Code:
`src/deferred/checkpoint/` (`create.ts`, `restore.ts`, `store.ts`, `integration.ts`, `events.ts`,
`followups.ts`, `types.ts`, `index.ts`).

**Why it left** [confirmed — Kudo, 2026-08-26]: **agents manage git themselves.** The premise of the
feature was that a driving agent has no undo, and that stopped being true. The agents this CLI is
built for commit, branch and revert as a matter of course. A second snapshot mechanism beside
git, one that writes unreferenced objects a `git gc` can reap and that no `git log` shows, is a
second thing to reason about rather than a safety net. The honest version of this guardrail is
"commit before you start", which needs no command.

**Re-entry criteria:** a driving agent is observed losing work this would have held. That means a
case where the agent's own git was not enough, not merely a case where a snapshot would also have
worked. The mechanism below is what it returns as, and `checkpoint:undo`'s documented limit, that it
never deletes files created after the snapshot, is the first thing to revisit if it does.

### What was built

[observed — 2026-08-22]

**Checkpoints/undo** was one colon group, per [[0006-agent-native-cli-surface]] §The `@expo/agent-cli` launcher: `@expo/agent-cli checkpoint [--label]`, where the bare group takes the snapshot; `@expo/agent-cli checkpoint:list`; and `@expo/agent-cli checkpoint:undo [--id]`. The top-level `@expo/agent-cli undo` and its `--list` flag are gone [confirmed — Kudo, 2026-08-22].

- **When one was taken.** Automatically before `expo install`, before `agents:setup`'s AGENTS.md write, and before an `@expo/agent-cli dev` plan containing prebuild. `--no-checkpoint` or `AGENT_CLI_NO_CHECKPOINT` skipped it.
- **The snapshot.** A temp-index `git add -A .`, then `write-tree`, then a parent-linked `commit-tree` written as an **unreferenced object**. HEAD, branches, the index and the reflog are untouched. Ids live in `.expo/agent-cli-checkpoints.json`, capped at 20.
- **The restore.** `read-tree` plus `checkout-index -a -f`. It restores everything the checkpoint holds, including since-deleted files, and reports restored and kept counts. Documented limit: it **never deletes** files created after the snapshot.
- **What it never held.** Gitignored files are in no checkpoint, which is why the `install-dependencies` follow-up exists. And `git gc --prune=now` can reap old snapshots, which `CHECKPOINT_OBJECT_MISSING` names.

`src/checkpoint/git.ts` split on the way to the shelf. `runGitAsync` and `resolveWorkTreeAsync` are
how `src/impact/` reads a diff, so they are `src/utils/git.ts` now and are live. The snapshot
plumbing is what moved ([[0016-v1-scope]] §Deferred is a place). The suites moved with the code to
`src/deferred/checkpoint/__tests__/` and are not run.

### Deleting what a checkpoint cannot hold

[added — 2026-08-24, with `@expo/agent-cli doctor:fix`; see §`doctor:fix`. Both commands are deferred, so
nothing below is shipped. The **general rule** this section produced is not about checkpoints and
stayed live, in [[0008-guardrails]] §A command whose targets are gitignored.]

The line above, *gitignored files are in no checkpoint*, has been true since the first snapshot, and it read as a footnote for as long as every mutating command's damage was to tracked files. `doctor:fix` is the first command whose **whole subject** is gitignored. `node_modules`, `ios/Pods`, `.expo` and the Metro caches are exactly the files a checkpoint does not hold, so `checkpoint:undo` after one will restore nothing it deleted.

So the honesty had to travel with the artifact rather than stay in a document. Two things follow, and both were built:

- **A checkpoint is still taken before `doctor:fix --apply` at `moderate` and above**, because it protects the one thing it can: a bare project's tracked `ios/` and `android/`, and a tracked `Podfile.lock` that `pod install` is about to rewrite. The `safe` tier takes none, because it deletes nothing tracked, so there would be nothing for one to hold.
- **The snapshot ships with the sentence that says what it is not**, on the human output and as `checkpoint.note` in `--json`. That is not a disclaimer. An agent that reads `Checkpoint 22a3cfd9` and infers a safety net will run the aggressive tier believing an undo exists for `node_modules`, and there is none. What actually puts those files back is the plan's own reinstall steps, and the note says so.

### What stayed in [[0008-guardrails]]

The other three guardrails of that document are unaffected and ship: the plan-with-cost dry run
(`@expo/agent-cli dev --plan` and `src/dev/confirmPlan.ts`), the permission tiers, and the
untrusted-content marking the runtime commands do. So does the general rule the section above
produced, which is about gitignored targets rather than about snapshots.

## `build:wait`

`@expo/agent-cli build:wait <id>` attached to an EAS build that already existed — one started by CI, by the
dashboard, or by another agent — polled it, and left with what the build did. Code:
`src/deferred/build-wait/` (`buildWaitAsync.ts`, `waitAsync.ts`, `status.ts`, `parseView.ts`,
`resolveOptions.ts`, `format.ts`, `followups.ts`, `types.ts`, `index.ts`).

**Why it left** [confirmed — Kudo, 2026-08-26]: the shape is wrong rather than the work. A caller
who wants to wait on a build has already run a build command, and `@expo/agent-cli build:wait <id>` asks
them to carry an id from one command to another, while `npx eas build --wait` does the whole thing
in one. The answer is a **`--wait` flag on a build verb this CLI owns**, not a command of its own.

**Re-entry criteria:** `@expo/agent-cli build` exists as a verb with local and EAS parity, meaning the same
flag waits on a local `expo run:ios` and on an EAS build, so that `@expo/agent-cli build --wait` is one answer
rather than two commands wearing one name. The table below is what it returns as.

**What stayed in [[0010-agent-conventions]]:** three things, all in §Exit codes there. The `20`–`29`
outcome band itself, which this command was the first into and which every command that stayed still
uses. The rule that no `eas --json` payload can contain a `null`. And the rule that the convention
does not reach a forwarded exit code.

### The exit-code mapping

[observed — 2026-08-23, now `src/deferred/build-wait/`] This was the first command whose whole answer is its exit code, and it is what the `20`–`29` band was reserved for. It polls `eas build:view <id> --json` and leaves with what the build did:

| Code | The build                                          | Where it is decided            |
| ---- | -------------------------------------------------- | ------------------------------ |
| `0`  | `FINISHED`                                         | `src/deferred/build-wait/status.ts` |
| `20` | `ERRORED`                                          | `src/deferred/build-wait/status.ts` |
| `21` | `CANCELED`, **or this wait was interrupted**       | `src/deferred/build-wait/status.ts` |
| `22` | still running when `--timeout` elapsed             | `src/deferred/build-wait/waitAsync.ts` |
| `7`  | nobody is signed in, so no build is visible        | `src/needsHuman/assertAuth.ts` |
| `1`  | not readable: bad id, no `eas`, three failed polls | `CommandError`                 |

**The table has now been run against live builds** [observed — 2026-08-26, staging, `@kudo1/DailyWords-Grok`]. `ERRORED` → **20** and `CANCELED` → **21** were both produced by real builds rather than by fixtures: an iOS build that failed in `INSTALL_PODS`, and an Android build cancelled mid-flight with `eas build:cancel`. The service spells it **`CANCELED`**, with one `l`. `CANCELLED` stays in the table as a spelling that costs nothing to accept and would hang a wait if the service ever used it. The non-terminal statuses a wait polls through are `IN_QUEUE` and `IN_PROGRESS`, both now recorded as fixtures (`src/__fixtures__/eas/README.md`). `NEW` and `PENDING_CANCEL` were still not seen: `NEW` is held for less than one poll interval, and `PENDING_CANCEL` needs a cancellation to be caught in flight.

Four details of the mapping are decisions rather than transcription:

- **An unrecognized status is not terminal.** The status enum belongs to a service that ships without this CLI, so a status the table has never seen keeps the wait polling. Ending on it would report an outcome nobody observed. The timeout is what stops a wait that is wrong about this, and `22` says "inconclusive" rather than claiming a result. `PENDING_CANCEL` is the concrete case: a cancellation asked for and not yet happened, which still resolves to `CANCELED` or `FINISHED`.
- **An interrupted wait exits `21`, not `130`.** The definition of `21` above is "canceled by the caller (a declined prompt, `SIGINT`) or by the service", and a Ctrl-C is the caller cancelling. `130` would have been a second convention for the same fact. The two are told apart on the event stream (`cli:build_wait.interrupted`) rather than in the `--json` payload, whose key set is fixed.
- **Three failed polls is `1`, not an outcome.** A wait that cannot read the build has not learned anything about it, so it is a tool failure. Its _prose_ names `eas workflow:status <id> --wait --json`, because a build id and a workflow id look alike and come from the same places. Its `Try:` line does not [revised — 2026-08-23]. The `How:` sentence states a condition, "_if_ it names a workflow run", and the last line of a failure is what a driving agent acts on. Putting the workflow command there strips the condition and sends the agent to run something that fails again for the same reason [observed — friction run, 2026-08-23: signed out, and `Try:` recommended the workflow command for an id that was obviously not a build]. `Try:` is now `<the eas that ran> whoami`, which is worth running whatever the cause.
- **Signed out is `7`, and it is asked before the first poll** [added — 2026-08-23]. The auth preflight of [[0010-agent-conventions]] §Needs-human protocol runs first. A wait that nobody is signed in for cannot see any build, so its three polls are three doomed subprocesses ending in a "gave up waiting" that names the wrong cause. A preflight answering `null`, which covers no EAS CLI, a timeout, or a binary under that name that is not the CLI, is **not** "signed out", and the wait proceeds exactly as before.

Progress goes to the `LOG_EVENTS` JSONL stream as `cli:build_wait_poll`, never to stdout, so `--json` still prints exactly one object ([[0006-agent-native-cli-surface]] §Output contract).

### What it said about `inspect:build-log`, and what it did not

[moved here from [[0012-build-explain]], 2026-08-28. The command it names was `build:explain` when
this was decided, and is `inspect:build-log` now ([[0016-v1-scope]]).]

`build:wait`'s errored ladder gains a rung naming `npx @expo/agent-cli build:explain --file <path>`, and its `why` says the step in between out loud: _"Once the log above is saved to a file, this locates the failing line in it and names the fix. Nothing here can download it for you yet."_

That wording is the decision. The obvious rung would have been `npx @expo/agent-cli build:explain <build-id>`, because the wait has the id and handing it straight over is the loop an agent wants. It is also the one form that does not work, so the rung would have sent an agent to a command that errors, one hop after a command that worked. [[0009-smart-followups]]'s contract is that a follow-up is the next thing to _run_, and a rung that cannot be run is worse than no rung. Submissions do not get it at all: a submission log is not a native build log, and the rule table was written against those.

What stayed in [[0012-build-explain]] is the argument this fed: the reserved `<build-id>` form exists because fetching, decompressing and expiring a log are three things a reader should not have to get right by hand.

## `runtime:network`

`@expo/agent-cli runtime:network` collected the running app's network traffic over the CDP Network domain.
Code: `src/deferred/runtime-network/` (`runtimeNetworkAsync.ts`, `networkCollector.ts`,
`resolveOptions.ts`, `format.ts`, `followups.ts`, `help.ts`).

**Why it left** [confirmed — Kudo, 2026-08-26]: the CDP Network domain is unstable in React Native
and effectively unavailable on Expo Go. The two refusals below are the usual answer there rather than
edge cases, so the command's most common outcome was an explanation of why it could not answer.

**Re-entry criteria:** React Native ships network inspection outside
`InspectorFlags::getNetworkInspectionEnabled()`, or Expo Go carries a runtime that implements the
domain, so that a default `@expo/agent-cli runtime:network` run against a default project returns a request
log rather than `NETWORK_DOMAIN_UNAVAILABLE`.

**What stayed in [[0005-runtime-loop-tools]]:** three things. The §Candidates bullet that proposed it,
as the record of what was asked for. The shared runtime target selection and the Expo-Go-for-Android
finding of §Android, which are `runtime:eval` and `runtime:errors`' concern too. And the rule of
[[0010-agent-conventions]] §The third, *a command that reports on the app does not gate on what it
reported*, which was written against this command and outlived it.

### What was built and verified

[observed — 2026-08-22]: `@expo/agent-cli runtime network`, a CDP Network domain collector. It correlated request, response and failure by requestId, and counted three outcomes: answered, failed, and never-answered. The third exists because RN never sends `Network.loadingFailed` for a refused connection [observed, SDK 57/RN 0.86]. Live-verified on iOS against 200, 404 and refused.

**Two refusals, not one** [observed — `ReactCommon/jsinspector-modern/HostAgent.cpp`, React Native 0.86, 2026-08-23]. `Network.enable` fails for two unrelated reasons, and the command must not report either as the other:

- `registeredHostsCount > 1` gives a JSON-RPC *internal error*, `"The Network domain is unavailable when multiple React Native hosts are registered."` This is about the state of the app process, because the domain attaches only while exactly one React Native host is registered. So it clears when the app is relaunched with only this project loaded, and stopping another dev server does nothing for it. Expo Go reaches it by holding a host for a project it loaded earlier.
- `InspectorFlags::getNetworkInspectionEnabled()` off means the method is never handled, and the dispatcher answers `-32601`. This is about how the runtime was built, and it never clears. Expo Go for Android answers every method this way.

The classification is by the runtime's own answer: `classifyNetworkDomainRefusal` reads the quoted message, then the JSON-RPC code, and the why and how branch on it. The `unstable_enableNetworkPanel=true` flag on the target describes what the debugger frontend would show, so it is named only in the `-32601` case, where it genuinely contradicts the runtime. Recommending an SDK upgrade for a multiple-hosts refusal was the shipped bug this replaced [friction run 2, F24].

## `doctor:fix`

`@expo/agent-cli doctor:fix` reset the caches and build state an Expo project accumulates, from a table an
agent could read before it ran anything. Code: `src/deferred/doctor-fix/` (`fix.ts`, `fixAsync.ts`,
`fixPlan.ts`, `fixApply.ts`, `fixSteps.ts`, `fixSafety.ts`, `fixFormat.ts`, `fixTypes.ts`,
`packageManager.ts`, `resolveFixOptions.ts`, `followups.ts`), with `src/deferred/checkpoint/git.ts`.
This section was llp/0013 until 2026-08-26; the document was folded in here whole and deleted.

**Why it left** [confirmed — Kudo, 2026-08-26]: the split it opens with, expo-doctor diagnoses and
`@expo/agent-cli` acts, is real, but only the diagnosing half earns a place in a first surface. What
`doctor:fix` deletes is caches and build state, and every one of them is something an agent can
delete with the tool it already has. `rm -rf node_modules && npx expo prebuild --clean` is one line
an agent writes without help. The command's value is the *table* and the safety rules around it,
which is worth shipping later, once the surface it sits in is settled, rather than shipping a
deleting command in a first release for the sake of completeness. `doctor` and `doctor:check` ship
unchanged and are still the v1 answer to "what is wrong with this project".

**Re-entry criteria:** two things. The v1 surface has been used enough to say which resets agents
actually reach for, so a tier table can be cut down to those. And the checkpoint question is
answered, because this command's whole subject is gitignored and no checkpoint holds it (§Deleting
what a checkpoint cannot hold, above). It returns as an action of the `doctor` group, with the dry-run
default unchanged.

**What stayed in [[0010-agent-conventions]]:** its two upstream asks, `expo cache:clear` and
`expo-doctor --json` with stable check ids. Both are recorded in §Upstream asks there, and both are
worth asking for whether or not this command comes back.

### The split, and the asymmetry it is arranged around

`expo-doctor` diagnoses and `@expo/agent-cli` acts. `doctor:check` was the first half of that split ([[0010-agent-conventions]] §Exit codes). This is the second: one command that resets the caches and build state an Expo project accumulates, from a table an agent can read before it runs anything.

The whole command is arranged around one asymmetry. Every other mutating command in this CLI **adds**, whether an install, a prebuild or a build, and the expensive mistake there is a prompt nobody can answer. This one **deletes**, and the expensive mistake is a plan nobody read.

### Dry run is the default, and `--apply` is what executes

Decision [confirmed — Kudo, 2026-08-24]. `@expo/agent-cli doctor:fix` prints what it would do and touches nothing. `--apply` runs it.

This is the opposite of `@expo/agent-cli dev`, which runs the plan it prints ([[0004-smart-start-and-project-state]]), and the difference is worth stating rather than discovering. `dev` is asked for an outcome, getting this app onto a device, and a plan is how it explains itself on the way. `doctor:fix` is asked for a *deletion*, and a deletion has no partial answer to fall back on. A driving agent that misreads `dev` loses a few minutes of prebuild. One that misreads this loses `node_modules` and a `Podfile.lock`.

The default costs one round trip and buys the property the tests are written around: **a `doctor:fix` with no `--apply` on it cannot delete anything, whatever else is wrong with the invocation.** The first e2e test plants every cache the safe tier looks for, runs the dry run, and asserts each planted path is still on disk. A test on the exit code alone would pass for a command that deleted everything and said it had not.

### The tier table

Tiers are **cumulative**: `moderate` includes every `safe` step, and `aggressive` includes both. `src/deferred/doctor-fix/fixSteps.ts` is the table, and it is data. A step names its targets from a *description* of the machine (`FixStepContext`) rather than by looking at one, so the whole table, including the platform filtering, is unit-testable with no filesystem.

**`safe`**: project-scoped, seconds, nothing to reinstall.

| id | What it removes | Evidence |
| --- | --- | --- |
| `expo-web-cache` | `<project>/.expo/web/cache` | observed in a real project |
| `expo-dev-logs` | `<project>/.expo/dev/logs` | observed; truncated on each run anyway, so this is cosmetic |
| `node-modules-cache` | `<project>/node_modules/.cache` | observed; presence-checked before it is planned |
| `metro-file-map` | `$TMPDIR/metro-file-map-expo-<md5 of the project root>-*` | §The file map is project-scoped, and provably so |
| `watchman-project` | `watchman watch-del <projectRoot>` | the project-scoped form of the `watch-del-all` the docs name |

**`moderate`**: a reinstall, minutes.

| id | What it removes | Evidence |
| --- | --- | --- |
| `metro-transform-cache` | `$TMPDIR/metro-cache`. **Machine-wide** | `packages/@expo/metro-config/src/ExpoMetroConfig.ts` joins `os.tmpdir()` with a fixed name, so every project on the machine shares it |
| `node-modules` | delete, then install with the lockfile's package manager | `docs/pages/troubleshooting/clear-cache-macos-linux.mdx` |
| `ios-pods` | `ios/Pods` and `ios/Podfile.lock`, then `pod install` | bare projects only; for CNG, `expo prebuild` runs `pod install` itself [observed — `packages/@expo/cli/src/utils/cocoapods.ts`] |
| `android-build` | `android/build`, `android/app/build`, `android/.gradle` | standard Gradle layout [inferred] |

**`aggressive`**: regenerates, or reaches outside the project.

| id | What it does | Evidence |
| --- | --- | --- |
| `prebuild-clean` | `expo prebuild --clean --platform <p>`. CNG only | `--clean` is the default and `--no-clean` opts out [observed — `packages/@expo/cli/src/prebuild/index.ts`]. Refused on a project with checked-in native directories |
| `derived-data` | `~/Library/Developer/Xcode/DerivedData/<scheme>-*`. **Machine-wide** | the scheme is read from the `.xcodeproj` on disk, and the hash suffix is Xcode's, so the match is by prefix |
| `watchman-all` | `watchman watch-del-all`. **Machine-wide** | the docs' reset sequence |

**Deliberately excluded, and named in `--help` as excluded**: `npm cache clean --force` and `yarn cache clean`. Both are machine-wide, both cost minutes of re-downloading, and a corrupt package-manager cache is not what a stale bundle is. The troubleshooting page lists them, so a reader who knows the page has to be told the omission was a decision. `EXCLUDED_STEPS` is that list, printed by `--help`.

Two deviations from the plan this was built from, both recorded rather than silent:

- **`watchman-all` is `watch-del-all` only**, not `watch-del-all` *and* `shutdown-server`. One `argv` per step keeps a step's invocation a single readable thing, and the documented reset sequence names only the first. `shutdown-server` is the heavier hammer the EMFILE handler reaches for [observed — `src/utils/errors.ts`], which is a different problem.
- **The DerivedData directory is named from the `.xcodeproj` on disk**, not from the app config. The directory is `<scheme>-<hash>`, the scheme comes from the generated Xcode project, and a name guessed from `app.json` would match a directory belonging to somebody else's app.

#### The file map is project-scoped, and provably so

[observed — live on this machine, 2026-08-24] `@expo/metro-file-map` names its cache
`<prefix>-expo-<rootDirHash>-<relativeConfigHash>`, where `rootDirHash` is the **md5 of the project root** with posix separators [observed — `DiskCacheManager.getCacheFilePath` and `lib/rootRelativeCacheKeys.ts`]. Computing that md5 for four real project roots on this machine reproduced four of the five `metro-file-map-expo-*` directories in `$TMPDIR` byte for byte.

That is what lets the step be `scope: 'project'` despite living in a directory every program on the machine shares. The project root is *in the name*, so the target is this project's alone and needs no `--allow-machine-wide`. Only the trailing config hash is unknowable from outside, so the target is a prefix rather than a path. Both runtime prefixes are matched, because the Bun fork of the serializer gets a cache of its own.

**The documented reset clears nothing.** `docs/pages/troubleshooting/clear-cache-macos-linux.mdx` still tells users to `rm -fr $TMPDIR/haste-map-*`. There is no such file on this machine and has not been for years. Recorded below as an upstream ask.

### Ordering, derived rather than listed

Four rules. `planOrder` in `fixSteps.ts` computes them from what a step *declares it is*, meaning its `phase` and its `scope`, so a step somebody adds next year cannot be left out of a hand-kept list:

1. every deletion runs before any reinstall;
2. `node_modules` is reinstalled before `ios/Pods`, because the Podfile reads from it;
3. `prebuild-clean` runs after `node_modules`, because prebuild reads the installed packages;
4. machine-wide steps run last, so a failure there leaves the project steps already done.

**Rule 4 wins over rule 1** where they disagree, and that is a decision. A machine-wide deletion after a project reinstall costs nothing, and a machine-wide failure before one would have cost the reinstall. The unit tests assert all four on every tier, and the e2e test asserts the first from outside the process: the stub package manager records whether `node_modules` existed when it ran, and a log line saying the directory was already gone is the only proof from there that the install came second.

**A failed step stops the run.** The steps after it read what it was meant to produce, so continuing runs a step against a project in a state nobody planned for and reports whatever it does as if it meant something. The remaining steps are reported as `skipped` with the reason rather than silently dropped.

### Path safety

`rejectUnsafeTarget(target, context)` in `src/deferred/doctor-fix/fixSafety.ts` is the one predicate every target passes through: once into the plan, and **again immediately before `rm`**. The second check is not redundancy for its own sake. Between the plan and the deletion a symlink can appear where a cache directory was, and this is the last thing that happens before an `rm -rf`.

It refuses nine things, in order: a relative path; the filesystem root; `$HOME`; `$TMPDIR` itself; the project root; a machine-wide target with no `--allow-machine-wide`; a target outside every root its declared scope allows; a symlink; and a target whose realpath escapes the root it was allowed under. It reads its answer from its arguments and from `lstat` and `realpath`, and nothing in it touches `process.env`, so the table test describes a machine instead of running on one.

Three details are decisions rather than transcription:

- **The predicate takes the step's `scope`, which the plan this was built from did not have it take.** It has to. `metro-file-map` is outside the project directory and project-scoped, and `metro-transform-cache` is in the same directory and machine-wide. Location alone cannot tell those apart, and the plan's own example payload marks a `/var/folders/…` target `"scope": "project"`.
- **A symlink is refused, never followed.** Nothing in the table is one, so a target that is one means the machine is not in the state the table describes. Resolving it would be the command guessing about the difference between the path a reader sees and the bytes `rm -rf` reaches.
- **The root is resolved too, and the live run is what taught it.** macOS answers `os.tmpdir()` with `/var/folders/…`, `/var` is a symlink to `/private/var`, and comparing a resolved target against an unresolved root makes every target under a symlinked root look like an escape. The first live run of this command refused its own Metro file map for leaving a directory it had never left [observed — 2026-08-24].

**A machine-wide step without the flag is `skipped`, not an error.** A step a caller did not opt into is a step this run does not want, and the skip reason names the flag that would include it. `DOCTOR_FIX_UNSAFE_PATH` is reserved for a target the table named and the predicate refused, which means a bug in this CLI or a link planted where a cache should be. Its message says exactly that rather than blaming the project.

#### Uncommitted native work refuses the whole plan

`DOCTOR_FIX_DIRTY_NATIVE`, exit `1`, raised at **plan time** — so a dry run reports the refusal, which is what a dry run is for.

A step declares `touchesNative`. A tier holding one of those, for a native directory the project has checked in, asks git whether that directory has uncommitted **tracked** changes (`git status --porcelain --untracked-files=no -- ios android`, via `dirtyTrackedPathsAsync`). `--untracked-files=no` is the whole point: a native directory is full of build output that is *supposed* to be untracked, and counting `??` entries would report every project as dirty.

Two reasons, and the second is the one that matters. The obvious one is that a checkpoint holds only tracked files (§Checkpoints do not protect this command, and it says so, below), so a dirty native directory is where this command's deletions and the user's unrecorded work sit next to each other. The one that decides it is that `pod install` and `prebuild --clean` both **rewrite tracked files**, meaning `Podfile.lock` and the generated projects. That mixes machine output into a diff the user can no longer separate from their own edits.

Three details:

- **Exit `1`, not `20`.** Nothing was attempted and no operation started, which is the same reasoning that makes "no dev server" a `1` for `runtime:reload` ([[0010-agent-conventions]] §The fifth). The recovery is a command the caller runs: commit, stash, or `--tier safe`. Both spellings are in the `How:` line.
- **The message names the directory git reported on**, not the ones it was asked about. A run that asked about `ios` and `android` and got one back must not name the clean one as dirty.
- **A project outside git answers `[]`.** Nothing has been *shown* to be at risk, and refusing on an unanswerable question would stop the command on every project without a repository.

### Checkpoints do not protect this command, and it says so

This is the honest half of [[0008-guardrails]] applied to the one command it does not cover.

A checkpoint holds only git-tracked files (§The checkpoint system), and **every headline target of this command is gitignored**. `node_modules`, `ios/Pods`, `.expo` and the Metro caches are in no checkpoint, and `checkpoint:undo` will not bring them back.

One is still taken before `--apply` at `moderate` and above, because it protects the one thing it can: a bare project's tracked `ios/` and `android/`, and a tracked `Podfile.lock` that `pod install` is about to rewrite. It goes through `checkpointBeforeAsync`, which never fails the command it guards.

And it ships with the sentence that says what it is not (`CHECKPOINT_NOTE`), on the human output and in the `--json` payload's `checkpoint.note`. That sentence is not a disclaimer. An agent that reads `Checkpoint 22a3cfd9` and infers a safety net will run the aggressive tier believing an undo exists for `node_modules`, and there is none. The **safe** tier takes no checkpoint at all, because it deletes nothing tracked, so there is nothing for one to hold.

### Confirmation

At `moderate` and above, an interactive terminal is asked once, `Run this <tier> reset?`, after the plan is on screen, so the person answering has read what they are answering about. The pattern is `src/dev/confirmPlan.ts`'s, including who is never asked: `--yes`, `--json`, and every non-interactive run ([[0008-guardrails]] §Plan-with-cost dry run).

The trigger is the **tier**, not the time class the `dev` prompt uses. Everything in `safe` is regenerated by the next command, which is what the tier means, and a Y/n on deleting `.expo/web/cache` is a prompt people learn to answer without reading.

### Exit codes

| Code | The run |
| --- | --- |
| `0` | a dry run, an apply whose steps all worked, and a declined confirmation |
| `20` | an applied step failed; the payload's `results` says which and why |
| `1` | a bad argument, `DOCTOR_FIX_DIRTY_NATIVE`, or `DOCTOR_FIX_UNSAFE_PATH` |

**`20` for a failed step is a deliberate deviation** from the plan this was built from, which said `1`. Per [[0010-agent-conventions]] §Exit codes, `1` means *the tool did not work*, and a `doctor:fix` whose `pod install` failed did its job perfectly. It planned correctly, deleted correctly, and reported the subject's failure. `1` there would send an agent to fix its own invocation, and there is nothing to fix.

A declined confirmation exits `0`, matching `@expo/agent-cli dev`. Nothing ran because nobody asked for it to, which is not a failure of anything.

New codes: `DOCTOR_FIX_UNSAFE_PATH`, `DOCTOR_FIX_DIRTY_NATIVE`.

### The payload, and the events

`--json` prints one object whose key set never varies ([[0006-agent-native-cli-surface]] §Output contract): `projectRoot`, `tier`, `applied`, `platforms`, `packageManager`, `steps`, `skipped`, `results`, `checkpoint`, `followups`. `results` and `checkpoint` are `null` on a dry run rather than absent.

A `FixStep` reuses `PlanStep`'s `{ id, reason, timeClass }` triple and its `TimeClass` verbatim ([[0004-smart-start-and-project-state]], `src/project/types.ts`). An agent already reads that shape from `@expo/agent-cli dev --plan`, and a second spelling of "what will run and how long it costs" would make it read two. What it adds is what a reset has and a start plan does not: `targets`, `scope`, `bytes`, `recoverable`.

- **`bytes` is `null` when it was not measured.** The walk stops at 20 000 entries, because a dry run has to be fast and `node_modules` is a hundred thousand files. `null` means the walk stopped. Printing `0 B` for a directory that is 400 MB would be the one number a reader must not be given.
- **`skipped` carries a reason, always.** "This step was not planned" is a fact an agent has to act on, and the reason is what makes it actionable: `No ios/Podfile. This is a CNG project…`, `Affects every project on this machine. Pass --allow-machine-wide…`, `Nothing to delete: <the exact paths>`.

Events: `cli:doctor_fix_plan` once, before anything is applied, with the step **ids** and the flags; then `cli:doctor_fix_step` per step as it finishes. Ids and counts only, because the targets are absolute paths on the user's machine, and they are printed on the command's own output where the caller asked for them.

### Package-manager detection

`detectPackageManager` reads the lockfile, walking **up** from the project. A package of a monorepo has no lockfile of its own, and `npm install` run inside one writes a second lockfile there instead of installing the workspace. The install therefore runs in the lockfile's directory, carried on the step as `cwd`, while the deletion stays scoped to the project's own `node_modules`.

The names, the per-directory precedence and the npm fallback mirror `@expo/package-manager`'s `resolvePackageManager` [observed — `packages/@expo/package-manager/src/utils/nodeManagers.ts`], so a reset reinstalls with the tool `expo prebuild` would have used. It is a copy of a *decision* rather than an import, because the process boundary of [[0001-agentic-cli-on-expo-cli]] constraint 5 rules out reaching into that package. `lockfile: null` in the payload says the manager was a fallback rather than a reading.

### Follow-ups

Per [[0009-smart-followups]]. A dry run with steps offers `doctor:fix --tier <the caller's tier> --apply`, spelled so the next command is a paste. A dry run with **no** steps offers `doctor:check` and the next tier up, because "this tier found nothing" and "nothing is wrong" are different answers. A successful apply offers `@expo/agent-cli dev`, plus `doctor:check` when the packages were reinstalled. A failed apply names the step that failed and offers the re-run. It deliberately does *not* offer `dev`, because the reset did not finish.

### Testing

Per [[0002-testing-and-evals]]. All of it moved to `src/deferred/doctor-fix/__tests__/` with the
code and **is not run** — jest's `testPathIgnorePatterns` names the shelf. What follows is what the
suites asserted when they last ran, 2026-08-26.

Unit: `rejectUnsafeTarget` against the full table over memfs, including the symlinked-root case the live run found; the step table's invariants (unique ids, one way to act per kind, exactly three machine-wide steps, and a reason and a recovery on every row); the four ordering rules on every tier; the Windows- and Linux-filtered table; `metroFileMapPrefixes` pinned against a hash verified live; `planFixAsync` over memfs fixtures (CNG, bare, a project with no caches, each tier); `detectPackageManager` against each of the five lockfiles, none, a monorepo, and a two-lockfile tie; the flag resolvers; and the follow-up builder.

E2E through the published bin, with a `$TMPDIR` of its own per test so the machine's real Metro caches are never in reach: the dry run asserting every planted path survives; the apply asserting exactly the planned paths are gone and the directories they lived in are not; the machine-wide flag; the reinstall order read off a stub package manager; exit `20` with the following steps skipped; the checkpoint and its note; `--no-checkpoint`; `DOCTOR_FIX_DIRTY_NATIVE` on a git fixture with a dirty tracked `ios/`; a rejected tier, platform and positional argument; and the `--help` naming the exclusions.

Live verification, 2026-08-24, on a scratch copy of a real SDK 57 app. The dry run left all four planted caches on disk. `--apply --yes --tier safe` removed exactly those four and left `node_modules`, `.expo` and the sources. `--tier moderate --apply` ran the three deletions and then `npm install`, with the stub recording that `node_modules` was already gone when it ran. And a bare fixture with a dirty tracked `ios/` exited `1` with `DOCTOR_FIX_DIRTY_NATIVE`, then ran the safe tier on the same project without complaint.

### Upstream asks

Both are already in [[0010-agent-conventions]] §Upstream asks, and this command is what they are for:

1. **`expo cache:clear`**: one supported way to clear the caches whose staleness a wrapper is otherwise reduced to guessing at. It would move `metro-transform-cache` and `metro-file-map` from deletions this CLI performs to a subprocess it calls, which is where the process boundary wants them.
2. **`expo-doctor --json` with stable check ids**: it would let `doctor:check` feed `doctor:fix` a targeted plan instead of a tier (§Open questions).

One documentation bug, found on the way and new here. `docs/pages/troubleshooting/clear-cache-macos-linux.mdx` tells users to delete `$TMPDIR/haste-map-*`. The modern name is `$TMPDIR/metro-file-map-expo-<hash>-<hash>`, verified live, so the documented command clears nothing.

### Open questions

1. Should `doctor:fix` gain a `--from-check` mode that plans only the steps the last `doctor:check` implicates? It needs the `expo-doctor --json` ask first.
2. Should the safe tier run automatically as the recovery hop after a bundler failure in `@expo/agent-cli dev`? That is a [[0009-smart-followups]] follow-up rather than a default.
3. `derived-data` matches by scheme prefix, so two projects with the same scheme name have directories with the same prefix. The flag and the listed matches are the mitigation today, and nothing short of a build tells them apart [inferred].

