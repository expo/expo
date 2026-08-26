# 0004: Smart Start and the Project-State Engine

**Type:** RFC
**Status:** Draft
**Systems:** project-state probe (new); smart `dev` command (new, `start` until 2026-08-22); dev-server lock (new); `@expo/fingerprint`; `expo-mcp` tools
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0002-testing-and-evals]], [[0015-backend-selection-and-config]]

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

### A plan step's `reason` describes the step, not the goal

Decision [confirmed — Kudo, 2026-08-23]. The Expo Go row's only step used to carry the reason
"Opens the project in Expo Go, which needs no native build." `expo start --go` does not open the
project in Expo Go: it serves a bundle and waits. Following the plan therefore left an agent with a
dev server and no way to reach the app, and the plan itself was the thing that said otherwise — the
worst place for a wrong sentence to be, because it is what a driving agent reads _before_ it acts.

Two changes, both about the plan telling the truth about itself [observed — `src/plan/decide.ts`]:

- **A typed platform flag is in the printed argv.** `exagent dev --ios` has always forwarded `--ios`
  to `expo start` [observed — `src/dev/resolveOptions.ts`, `resolveStepArgs`], and the plan printed
  `expo start --go` regardless, so the argv an agent approved was not the argv that ran. The plan
  engine now takes `requestedPlatform` — the flag the caller _typed_ — separately from `platform`,
  which is always resolved and never appears on a command line. Only the typed one goes in the argv.
- **The reason distinguishes the two forms.** With a flag, `expo start --go --ios` really does open
  the app: it uses a booted simulator or boots one, installs Expo Go if it is missing, and sends the
  `exp://` URL [observed — `@expo/cli` `openPlatforms.ts` → `PlatformManager.openProjectInExpoGoAsync`;
  verified live 2026-08-23 against an SDK 57 app and a booted iPhone 17 Pro]. Without one, the reason
  says so and names `exagent navigate /`.
- **The plan's `reasons` list says the same thing the step's `reason` does** [added — 2026-08-23].
  The step was fixed above and the list was not, so `dev --plan --json` with no flag printed
  `"Target platform: ios."` beside `["expo","start","--go"]` — one channel honest about opening
  nothing and the other announcing a target [observed — friction run 2, 2026-08-23]. The sentence
  now carries both facts it was hiding: whether anyone *named* the platform, and whether the plan
  *acts* on it. `Target platform: ios, named on the command line.` when the flag was typed;
  `No platform was named; this host suggests ios, and the plan builds for it.` when a `run:*` step
  does; and `…, and the plan opens nothing on it — pass --ios or --android, or run
  "exagent navigate /" once the dev server is up.` when nothing does. That is why the reason list is
  built per rule rather than once before the branches: the honest sentence depends on the plan.

**Opening the app is `navigate`, and now everything says so** [observed — `src/followups/`]. The
capability was never missing — `navigate` resolves the deep link and runs `simctl openurl`, which is
exactly the manual step a friction run had to leave the CLI for — it was only never suggested. The
`dev-wait-open-app` follow-up used to answer "the bundle is built and nothing is running it" by
re-suggesting the identical wait, which is the one action that cannot change the answer; it now
names `exagent navigate /` first and the gate second. `buildStartFollowUps` gains the same step at
the head of its ladder, which the cap of three pushes the furthest rung (`eas-build`) off — the
right trade, because a dev server with no app on it cannot be shipped either.

Caveat, recorded because it decides which route to trust [observed — live, 2026-08-23]. On a Mac
with no usable GUI session, `expo start --ios` opens the app and then **kills the dev server**:
`ensureSimulatorAppRunningAsync` shells out to `osascript … tell app "System Events"`, that fails,
and the rejection is unhandled through `openPlatformsAsync` [observed — the same failure in both CI
and non-CI mode, `@expo/cli` `ensureSimulatorAppRunning.ts`]. `exagent dev` + `exagent navigate /`
has no such dependency, which is why it is the route the follow-ups name. This is an upstream
fragility, not something the wrapper works around; it belongs in llp/0010 §Upstream asks if it
persists.

## Sub-features

- **Expo Go compatibility check** [confirmed — Kudo seed, 2026-08-18]: answer "can this run in Expo Go?" with reasons — compare dependencies against `packages/expo/bundledNativeModules.json` [observed — file exists], detect config plugins and custom native code, check SDK support.
- **Post-install impact decisions** [confirmed — Kudo seed, 2026-08-18]: after `npx expo install {pkg}`: JS-only → keep dev server, maybe reload; new config plugin or native module under CNG → prebuild + new dev build; bare native dirs → pod install / gradle sync. Same classifier as the decision table, consumed at a second moment.

## `exagent status`

[confirmed — Kudo seed, 2026-08-22] A `git status`-like overview: one fast, read-only command that answers "where is this project right now, and what would happen next". Composition of existing pieces [inferred]:

- **Project**: name/slug, SDK version, CNG vs bare, dev-client/web deps.
- **Expo Go**: compatible or not, with reason count (the reasons themselves in the `probe` key of `--json`).
- **Freshness**: current fingerprint vs `.expo/exagent-last-build.json` per platform → `fresh` / `stale` / `unknown` (no fingerprint tool).
- **Dev server**: running or not, and how many CDP targets are connected (app open?). Discovery order [observed — 2026-08-22]: explicit `--dev-server-url` → the project's **dev-server lock** (below) → the port the project's own `.expo/dev/logs/start.log` names (`metro:instantiate` event; project-scoped but carries no liveness/PID, so it is probed, never trusted) → 8081 → a short scan of the ports `expo start` falls back to.
- **Skills**: agent selection cached? linked skill count vs discovered count (out-of-sync hint). **Left out of the text report entirely** when no agent is selected *and* nothing was discovered [revised — 2026-08-25]: `no agent selected · no skills discovered` is a line about two things that are not there, on a report whose every other line is a fact about the project [observed — dogfood, 2026-08-24]. The section stays in `--json` and in the `cli:status` event, where a key that is always present is the contract (llp/0006 §Output contract), and it stays in the text report the moment either half has something to say — including when the section could not be read at all, because the reason is worth printing.
- **Device**: does this machine have a booted simulator or an attached device to open the app on — `present`, `absent`, or `unknown` [added — 2026-08-25]. Its own line because it changes what every other suggestion is worth; see llp/0009 §Device-aware ladders for the probe and for why `unknown` is never rounded down to "none".
- **Dev server, where a device reaches it**: the tunnel origin, when the run has one and it is still up [added — 2026-08-25]. The `url` above is where the dev server listens *on this machine*, which for a tunnelled run is not the address any device uses; `hostType` and `tunnelUrl` ride along in `--json` and only a tunnel is worth a word in the text, because `127.0.0.1:8081` already says "this machine". See llp/0005 §Where a device reaches the dev server.
- **Next action**: the smart-start rule that would fire, as one line (e.g. "`exagent dev` → expo-go: `expo start --go`") — **unless a dev server this project can use is already answering**, in which case the line is `exagent dev:wait --require-app` with the reason why [observed — 2026-08-23, `buildNextActionStatus`]. A dev server with **no app attached and no local device to open one on** gets a third answer [revised — 2026-08-25]: the `exp://<host>` link, or `exagent navigate / --print-url` when no link can be named. See llp/0009 §Device-aware ladders. The old form recommended starting a dev server three rows under a line reporting one as healthy, which is a report disagreeing with itself; and on the busy port that second server would not have started. The rule is still reported either way — it is the project's shape, and a running server does not change it. Deliberately not `runtime:errors`: the `runtime-errors` follow-up already names it, and `next` must not repeat a follow-up, which is the whole reason `status` keeps its follow-ups off the terminal.

Contract: human-readable sections by default (like `git status` short prose), `--json` for the machine shape, exit 0 always (status is information, not judgment). Fast: no subprocess heavier than the fingerprint CLI; dev-server probe with a short timeout.

### The dev-server lock

[confirmed — Kudo, 2026-08-22: socket lock in exagent, expo-cli unchanged] The legacy `packager-info.json` is gone from the modern CLI [observed], and its replacement lives in `exagent`, not upstream: `src/devLock/`, taken by the dev-server wrapper `runDevServerAsync` and therefore by both `exagent start` and the final step of an `exagent dev` plan.

**A socket, not a JSON file** [confirmed — Kudo, 2026-08-22]. A file records a fact about a process, and that record outlives the process; every reader then has to guess whether what it read is still true, which is what made `packager-info.json` unreliable and what a `pid` field only papers over (PIDs are reused, and a liveness check is a second question with its own race). A listening socket cannot have that bug: it exists only while its owner does, so a reader that got an answer got it from a process that was alive when it answered. Zombie and out-of-date data are impossible by construction rather than by convention.

- **Address** — a pure function of the project root, because the two sides share nothing else: `projectRoot/.expo/exagent-dev-server.sock` on posix, and `\\.\pipe\exagent-dev-server-<sha1(realpath(projectRoot))[0:16]>` on Windows, where a pipe is not a project file and the project can only be in its name. Symlinks are resolved and the digest is lowercased, so one directory is one address. A posix project buried deeper than the kernel's ~104-byte cap on `sun_path` gets the same digest scheme under the temporary directory; the choice depends only on the path length, so both sides make it identically.
- **Protocol** — the server writes one JSON line (`url`, `port`, `pid`, `startedAt`, `projectRoot`) on connection and ends it. A reader connects with a ~250 ms timeout and reads to the close; a refused connection or a timeout is "no dev server", full stop.
- **Acquisition** — `EADDRINUSE` on posix means either a live owner or an orphaned socket file, and only a connection tells them apart: an answer means another `exagent` legitimately owns the project's dev server, and silence means the file is an orphan, which is unlinked before listening again. Unlinking can only lose an orphan, because a socket file carries no state and connecting to it is the only way to reach whatever made it — nothing is ever _read_ out of the file. On Windows a pipe dies with its process, so `EADDRINUSE` is a live owner by definition.
- **Release** — on the dev server's exit (the wrapper's `finally`) and on process exit, with a best-effort unlink. A leftover socket file is inert by construction: it answers nothing, so no reader is misled, and the next acquisition removes it.
- **Never load-bearing** — the dev server is the command and the lock is a convenience, so an address that cannot be taken produces one warning and a `cli:dev_lock_skipped` event, never a failure. The port published is the one the dev server itself reported in `start.log` after the spawn timestamp, falling back to `--port` and then 8081.
- **Still probed, never trusted** — the lock proves the wrapper is alive; only an HTTP probe of the URL proves the dev server behind it is. Discovery therefore uses the lock to _stop guessing which port_, not to skip the check.

Implemented [observed — 2026-08-22] in `src/devLock/` (`address.ts`, `client.ts`, `server.ts`, `port.ts`, `holdLock.ts`), held by `runDevServerAsync` in `src/start/startAsync.ts`, and read as step 0 of `discoverDevServerAsync` in `src/runtime/devServer.ts`. `runtime:eval|errors|network` went through the same discovery in the same change: they previously assumed 8081 whenever `--dev-server-url` was absent, so a dev server on any other port was invisible to them even with a lock to ask. Accepted limits: a dev server started by `expo start` directly holds no lock (the port in `start.log` plus the scan is still the answer there), and a posix project path long enough to push the socket past the kernel's cap moves it out of `.expo`, where a person looking for it will not see it.

Merged [confirmed — Kudo, 2026-08-22]: **`status` absorbs the former `exagent context`**, which is removed. `status --json` carries the raw `ProjectState` verbatim under a `probe` key, alongside the sections above — the sections round the probe off for a terminal (Expo Go as a reason _count_, the fingerprint as a hash), and `probe` is what the summarizing dropped, so a caller that wants the brief reads one command instead of two. Rationale [inferred]: the two commands shared one probe and differed only in how much of it they printed, which is a flag, not a verb; and an agent orienting in a project was reliably running both. The probe costs nothing extra here — `status` already reads it to build its sections. The `install-dev-client` follow-up moved over with it; the `project-context` follow-up that pointed at `context` is gone, because the reasons it promised are now in the same report.

Default change [confirmed — Kudo, 2026-08-22]: **smart mode is `exagent start`'s default** (the plain passthrough moves behind `--passthrough`; `--smart` stays as an alias). Human guardrail per [[0008-guardrails]]: an interactive terminal facing a plan with build-class steps gets one Y/n confirmation; non-interactive runs (agents, CI) proceed plan-first without prompting.

Renamed [confirmed — Kudo, 2026-08-22]: **the smart engine is its own verb, `exagent dev`**, and `exagent start` goes back to being `expo start`. The rule that decides this is in [[0006-agent-native-cli-surface]] §The `exagent` launcher: a command sharing a name with an `expo` command behaves like that command, so the engine that does something `expo start` does not cannot be spelled `start`. The two mode flags disappear with the rename — `--smart` had nothing left to distinguish itself from, and `--passthrough` is now the `start` command itself. Everything else about the contract above is unchanged, including the Y/n guardrail.

Implemented [observed — 2026-08-22]: `exagent status [--json] [--dev-server-url]`, ~65 ms, per-section error notes with exit 0 (argument errors exit 1); next action names `exagent dev`; project name from `package.json` (dynamic app config needs an `expo config` subprocess, same approximation as item 7 below); live-verified against a real running project.

Rename implemented [observed — 2026-08-22]: the engine is `src/dev/` (`devAsync.ts`, `confirmPlan.ts`, `resolveOptions.ts`), and `resolveDevOptions` resolves `run` with no flag and `plan` with `--plan` — the only two things the command can do. `src/start/` keeps the `expo start` wrapper: `resolveStartOptions` strips exactly two flags of its own (`--no-agent-skills`, `--no-followups`) and forwards everything else untouched, so `expo start` stays the one that rejects an argument it does not know. `dev` reuses the wrapper's `runDevServerAsync` for the dev-server step of a plan and its `resolveStartFollowUps` for the follow-ups of a run that ends in one. The guardrail lives in `src/dev/confirmPlan.ts` and is asked only when the run is interactive (`isInteractive()`: a TTY, not CI, not headless), `--yes` was not passed, `--json` was not passed (the prompt would land inside the parsed payload), and at least one step is costlier than `seconds`. A decline emits `cli:start_plan_declined`, points at `dev --plan` and `start`, and exits 0 — nothing ran, so nothing failed. It is asked after the plan is emitted and before the checkpoint is taken, so a declined plan snapshots nothing. The `cli:start_plan` event keeps its name and its `mode: 'plan' | 'smart'` field: they name the plan engine of this RFC, not the command that drives it.

## Daemonization

Decision [confirmed — friction run 4, 2026-08-24]. `exagent dev --detach [--wait-ready]` starts the
dev server in a process of its own and gives the terminal back. `exagent dev:logs` reads what it
printed.

The friction is the plainest one in the CLI, and it took four runs to write down because it is
invisible from inside: `exagent dev` runs the dev server in the *foreground* and never says so, so
the first thing a driving agent does is burn a command timeout on a command that cannot return
[observed — F46, friction run 4: a seven-minute timeout on the first attempt]. It then prints
`Suggested next: npx exagent navigate /` and holds the shell that would have run it. Every step
after it — `dev:wait`, `navigate`, `runtime:errors`, `runtime:reload` — needs a shell the dev server
is holding, so an agent has to learn to background the process from outside the CLI, which is
exactly the kind of shell incantation `dev:stop` exists to remove.

**The child is this CLI, not `expo start`.** `spawn(process.execPath, [bin, 'dev', ...argv],
{ detached: true, stdio: ['ignore', logFd, logFd] })` then `unref()`. It has to be the wrapper
because the wrapper is what takes the dev-server lock (§The dev-server lock), and a detached dev
server that published no lock would be a process nothing could find, wait on, or stop. Everything
that makes the result usable afterwards therefore already exists: the lock names its port and pid,
`dev:wait` reports its readiness, and `dev:stop` signals the pid the lock names — the detached
wrapper forwards `SIGTERM` to its `expo` child exactly as the foreground one does, so the tree goes
down together [observed — e2e `dev-detach-test.ts`: pid gone and lock silent after `dev:stop`].

**Three flags are stripped from the child's command line**, and the reasons differ: `--detach`
would detach a detached run forever; `--wait-ready` names a wait the parent performs and the child
has nobody to report to; and `--json` would both print an object nobody reads *and* switch the
plan's subprocess output to `capture`, which is the very output the log file exists to hold.
`buildDetachSpawn` is a pure function over argv for that reason — it is the half of detaching that
can be wrong in a way nothing else notices, because the parent reports success either way.

**The parent waits for the lock, not for the child.** A detached start is finished when the dev
server is *discoverable*, which is the moment the lock answers. Under `--wait-ready` it then holds
one `/status` request open (`waitForBundlerReadyAsync`, shared with `dev:wait`), so `ready` is
`true`, or the wait failed — never "unknown". Without the flag `ready` is `null`, which is the
difference between not ready and not asked.

**One detached dev server per project**, and this is the rule the original design called for: the
lock is read *before* anything is spawned, and a project that already has one gets the running
server reported back with `alreadyRunning: true` and exit 0. Idempotent rather than an error,
because the caller asked for a dev server and there is one. `acquireDevServerLockAsync` already
answers `in-use` and `holdLock.ts` deliberately swallows it — that is right for two *foreground*
servers, which people run on purpose in two terminals, and wrong for a second detached one, which
nobody could find.

**The log is one file per project, truncated per run**: `.expo/dev/logs/dev-detached.log`, in the
directory `src/utils/dotExpo.ts` already documents as per-run logs. A name carrying the port could
not be resolved by `dev:logs` before the port was known, and a file that accumulated across runs
would answer "what is my dev server doing" with what it did last week.

**`dev:logs` has no `--follow`.** A tail that never returns is the thing `--detach` exists to avoid:
it would hold the shell open again, and a stream with no end is not something a driving agent can
read. It polls instead, and each read is a bounded, quotable answer — last 100 lines by default,
ANSI stripped, fenced as untrusted per [[0008-guardrails]]. A dev server started *attached* has no
log at all, and the command says that rather than reporting an empty file: its output went to
somebody's terminal, and there was never going to be a file.

Exit codes: `dev --detach` exits `0` when a dev server is up (started or already there), `1` when
the child never published a lock, and `1` when `--wait-ready` gave up — the server is still running
there, which the message says. `dev:logs` exits `0` for a log and `1` (`NO_DEV_LOG`) when the
project has none.

## A busy port is not a step only a person can complete

Decision [confirmed — friction run 4, 2026-08-24]. When the Expo CLI stops on `Use port 8181
instead?`, `exagent dev` picks a free port itself and runs the step again — unless the caller named
`--port`, and then it is exit `20`.

This was exit `7` with `needsHuman.scenario: "expo-prompt"`, a `suggestedCommand` that re-ran the
identical failing command, and a `How:` line naming the flag the caller had just passed
[observed — F41, friction run 4]. Every part of that is wrong for this one question: no account, no
permission and no click is involved, so nothing about it needs a person.

The carve-out lives in `src/dev/portCollision.ts` and is checked *before* the needs-human
classifier, not as a negative signature in the registry: the recovery is "pick a port and run the
step again", which is the caller's to perform and cannot be expressed as a registry row.
`expo-prompt` still covers every other question the Expo CLI asks, and its `How:` no longer mentions
ports.

**A named `--port` is a requirement, not a preference.** Moving the dev server somewhere else would
leave every URL and every command the caller had already written pointing at nothing, so that case
fails with `PORT_IN_USE` and exit `20` (the outcome failed — llp/0010), naming the pid that holds
the port and recovering into a *different* command: `dev:stop --port <n> --force`, or a free port.
Never the command that just failed. When the process on that port is this project's own dev server —
the lock says so — the message says that instead, because then there is nothing to fix.

One retry per plan. A second collision means the port this CLI picked was taken between the bind
test and the dev server's own bind, and retrying forever on that is a loop nobody asked for.

## Where a build runs

Decision [confirmed — Kudo, 2026-08-24]. Every build this CLI plans, suggests, or waits on says
whether it runs **`local`** — on this machine, with this machine's toolchain — or **`eas`** — in the
cloud on EAS, with an Expo account. Two words, one module, no synonyms.

The gap was never in what the CLI *does*; it was that "build" is one word for two things that want
different things of the caller. `exagent dev` plans `expo run:ios`, which needs Xcode and about
fifteen minutes of this machine. `exagent build:wait` attaches to something running in a queue in a
data centre, which needs an account and nothing else. A reader who has one and not the other cannot
tell from the word which advice they were just given — and the plan is read *before* anything runs,
so a caller with no Xcode approved a plan, waited, and met the toolchain as a compiler error many
minutes in. The answer is not a new capability: `eas build` was always there. It is that the plan
has to name which of the two it is, and what that one costs.

**The vocabulary is a module, not a convention** [observed — `src/toolchain/runsOn.ts`]. `RunsOn`,
`LOCAL_WHERE`, `EAS_WHERE`, `EAS_REQUIREMENT`, `localTool`, `localRequirement`, `easBuildCommand`.
Everything that says any of this — plan steps, the plan table, `dev --help`, `build:wait --help`,
the `impact` report, five follow-ups — reads its wording from there, so `local` means one thing in
all of them and the EAS command is spelled one way. Two functions rather than one for the toolchain
name (`localTool` → `Xcode`, `localRequirement` → `Xcode on this machine`) because a sentence that
has already said "this machine" must not say it again: the first version of this shipped
"this machine has no the Android SDK on this machine" in two places at once, which is what one
string does when it is written for one sentence and pasted into three.

**Per step, and `null` where the question does not apply.** `PlanStep.runsOn` is
`'local' | 'eas' | null`. `expo prebuild` and `expo run:*` are `local`; `expo start` and
`expo install` are `null`, not a third value — a dev server does not run "somewhere", it runs here
and builds nothing, and answering the question anyway would blur the one distinction the key exists
to draw. Prebuild counts as a build step deliberately: it ends in a `pod install` that wants Xcode's
command line tools, and a caller who cannot build here needs to know at step 1, not step 2.

**The probe is the caller's, so the decision table stays pure.** `decideStartPlan` is a function of
*project* state, and "does this machine have Xcode" is a fact about the host, so it is two calls:
the table returns a plan whose `buildLocation` says what a local build would need (`status: null` —
nobody asked), and `applyToolchainProbe` folds in what the machine answered. The probe runs only for
a plan that contains a build, which is the only case with a question in it.

**Three answers, and `unknown` is one of them** [observed — `src/toolchain/detect.ts`]. iOS is
`xcode-select -p` and then `xcodebuild -version`, and the second is the one that matters: a machine
with only the Command Line Tools answers the first and refuses the second, and it cannot build an
app. Android is a *directory*, not a command — `ANDROID_HOME`, `ANDROID_SDK_ROOT`, then the
installer's default — because Gradle finds the SDK through a path and never through `adb`. This
machine is why that distinction is written down [observed — live, 2026-08-24]: the SDK is at
`~/Library/Android/sdk`, no environment variable names it, and `adb` is not on `PATH`. That machine
can build and cannot run one shell command, so the SDK decides the status and `adb` is reported as a
**caveat**, with the two lines that would fix the shell. A probe that could not run answers
`unknown`, never `missing`: nothing was established, and routing a caller to the cloud over a
toolchain the probe merely could not reach would be worse than the silence it replaced. Cached per
process; a probe that throws is caught, because a plan that could not be made because a probe failed
is worse than a plan that says it does not know.

**The plan says it, and does not act on it** — **superseded for detection, 2026-08-26**. The
paragraph below describes the first shipped version, where a machine with no toolchain got a local
plan and a warning above it. [[0015-backend-selection-and-config]] takes the step it stopped short
of: the backend is now chosen **while the plan is decided**, so a machine that cannot build gets
`eas build` in the plan's *steps*. The constraint this paragraph was protecting is unchanged — no
plan's steps ever change between being printed and being run — because the selection happens
strictly before the plan exists. What is left of the version below is `applyToolchainProbe`, which
still folds a probe into a plan without touching its steps and carries the probe's caveats, and the
`eas-build-instead` follow-up, which now fires only for a *local* plan somebody asked for by name on
a machine that cannot perform it. The `unknown` rule survives intact and is now load-bearing: a
probe that established nothing leaves the build here.

A missing toolchain adds two sentences to the plan's
reasons, a `Not found: … Instead: npx eas build --platform ios --profile development` line above the
`Why` list, one `Log.warn` before the confirmation, and an `eas-build-instead` follow-up at the
*head* of the ladder — the plan's steps are never rewritten. The caller may have an answer this CLI
cannot see, and a plan that quietly swapped its steps for the cloud would stop being the plan that
was approved ([[0008-guardrails]]). `unknown` gets none of that except the sentence: a warning about
a toolchain that is probably installed is noise on every run after the first.

**The reverse hint.** When this machine *can* build, the `eas-build` follow-up says why the cloud is
still worth choosing — credentials this machine does not hold, and an artifact with a URL somebody
else can install. That is the hint a developer with a working Xcode actually needs, and it is the
one nothing was saying. `impact`'s `needs-native-build` answer names both routes for the same
reason: "you need a native build" is not one instruction, and which route is right depends on what
the caller has and on what they need out of it.

Shipped in `src/toolchain/` (`runsOn.ts`, `detect.ts`, `planLocation.ts`, `types.ts`), with
`buildLocation` on `StartPlan`, on the `cli:start_plan` event and in the `--json` payload — present
and `null` for a plan that builds nothing, so a caller reads one key rather than checking for it.

## Implemented in v1 as

[observed — implementation, 2026-08-22] The engine shipped in `packages/exagent` (`src/project/`, `src/plan/`, `src/status/`, `src/dev/`, `exagent dev [--plan]`) with these deliberate approximations of the table above:

1. **No device probe.** "Go/dev client installed on the device" is unobservable without simctl/adb; those rows are dropped — `expo start` prompts for Go itself and `expo run:*` installs what it builds.
2. **No build-cache lookup.** Freshness = probe fingerprint vs `.expo/exagent-last-build.json` (written after a successful `run:*` step). Unrecorded ⇒ stale: v1 over-plans a build at worst, never under-plans. **Closed for `impact`** [added — 2026-08-24]: `eas build:list --fingerprint-hash` is a build-cache lookup, and [[0011-impact-and-freshness]] §The build-cache lookup uses it to turn "you need a native build" into "a finished build already exists for this exact fingerprint". The *plan engine* does not consult it yet, and that is the remaining half of this item.
3. The recorded hash is the pre-build probe hash (what an unchanged project re-probes to). The record now holds the whole fingerprint rather than the hash alone [added — 2026-08-24], because a hash cannot be diffed and "what changed" is the whole of what `impact` reports; a bare string still reads, as a record whose sources are null. See [[0011-impact-and-freshness]] §The record has to hold the sources, including the measurement behind storing it uncompressed.
4. The `web` rule fires only on an explicit `--web`; `ProjectState` cannot prove "web-only".
5. Bare-vs-CNG uses "any native dir present"; the argv uses the resolved platform.
6. `sdkVersion: null` never forces a rule; `expoGo.compatible` is the single Go verdict.
7. Config plugins are read from static config only (`app.json`); dynamic `app.config.js/ts` yields a debug event and best-effort skip — resolving it needs an `expo config` subprocess (follow-up). **The subprocess exists now** [added — 2026-08-24]: [[0011-impact-and-freshness]] §A fingerprint change is not "OTA-unsafe" spawns `expo config --json --type public` to resolve the `runtimeVersion` of a project whose config is code, with the static read as its fallback. The *plugins* half of this item is still static-only; what `impact` established is the mechanism and the parse (the Expo CLI writes its own event lines to stdout ahead of the answer, so the last JSON line is the one to read).

## Testing

The decision table is pure logic over probed state: exhaustively unit-tested, no model, no device (tier 0 in [[0002-testing-and-evals]]). Probe and execution paths get e2e coverage against fixtures via subprocess + JSONL assertions.
