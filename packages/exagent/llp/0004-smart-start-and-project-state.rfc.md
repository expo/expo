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
- **Freshness**: current fingerprint vs `.expo/exagent-last-build.json` per platform → `fresh` / `stale` / `unknown` (no fingerprint tool). **And what that costs** [added — 2026-08-26]: the impact class of everything that changed since that build, on its own `impact` line, computed in process from two fingerprints already in hand so it costs no subprocess. `stale` is a fact; this is what to do about it. See §The impact headline is free, the explanation is not.
- **EAS build**: whether EAS already has a *finished* build made from this exact fingerprint, per platform — `found` / `none` / `unknown` [added — 2026-08-26]. The other half of the freshness question: `freshness` asks whether the app **this machine** built still matches, and a `stale` there used to mean a rebuild; this asks whether anybody has already built exactly this, where the answer is a download. Cached answer always, network call only under `--explain`; see §The EAS build lookup, and why it is opt-in for the measurements that decided that and for why the cache key is exact.
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

Rename implemented [observed — 2026-08-22]: the engine is `src/dev/` (`devAsync.ts`, `confirmPlan.ts`, `resolveOptions.ts`), and `resolveDevOptions` resolves `run` with no flag and `plan` with `--plan` — the only two things the command can do. `src/start/` keeps the `expo start` wrapper: `resolveStartOptions` strips exactly two flags of its own (`--no-agent-skills`, `--no-followups`) and forwards everything else untouched, so `expo start` stays the one that rejects an argument it does not know. `dev` reuses the wrapper's `runDevServerAsync` for the dev-server step of a plan and its `resolveStartFollowUps` for the follow-ups of a run that ends in one. The guardrail lives in `src/dev/confirmPlan.ts` and is asked only when the run is interactive (`isInteractive()`: a TTY, not CI, not headless), `--yes` was not passed, `--json` was not passed (the prompt would land inside the parsed payload), and at least one step is costlier than `seconds`. A decline emits `cli:start_plan_declined`, points at `dev --plan` and `start`, and exits 0 — nothing ran, so nothing failed. It is asked after the plan is emitted and before any step runs, so a declined plan changes nothing. (Until 2026-08-26 a prebuilding plan also took a checkpoint here, between the two; that whole system is deferred — [[0016-v1-scope]].) The `cli:start_plan` event keeps its name and its `mode: 'plan' | 'smart'` field: they name the plan engine of this RFC, not the command that drives it.

## The EAS build lookup, and why it is opt-in

Decision [confirmed — Kudo, 2026-08-26]. `exagent status` reports whether **EAS already has a
finished build made from this project's current fingerprint**, per platform, in three states —
`found` / `none` / `unknown` with a reason. The **cached** answer is read on every run because it
costs nothing and is exact; the **network** call that produces it happens only under `--explain`.

The ask was "`status` could find available build on eas? using fingerprint", and the lookup already
existed — [[0011-impact-and-freshness]] §The build-cache lookup has run
`eas build:list --fingerprint-hash` since 2026-08-24. So the feature is not the query. It is
reconciling the query with the one thing this command promises: `status` is *instant*. Its
dev-server readiness probe is capped at 400 ms; its cloud-session check is a `stat` rather than an
`eas simulator:get` for exactly this reason; it drops the fingerprint's ~25 KB of `sources` from
`probe` to stay small. A section that added a second or more to every run would contradict all
three.

**Two costs, measured, not estimated** [observed — live against `apps/observe-tester`, a linked
project of the `expo` account, `eas-cli/22.4.0`, 2026-08-26]:

- `eas build:list --platform ios --fingerprint-hash <hash> --status finished --limit 1 --json
  --non-interactive` takes **1.10–1.33 s** over five runs, a hit and a miss alike, with a warm CLI.
  (`eas --version` returns in 0.07 s, so this is the network, not process start-up — which matters,
  because a start-up cost would have been amortizable and a round trip is not.)
- **The hash `status` has is the wrong hash.** Its probe runs `fingerprint:generate` with *no*
  `--platform`, which hashes both platforms together — the right answer for freshness, and a hash no
  build carries, because a build is made for one platform. On one working tree: `031f6b0c…` for the
  project and `8ce1acfb…` for iOS. So asking EAS costs a **second** fingerprint run first
  (**1.24 s**) before the network call.

Together that is ~2.4 s per platform, against a `status` that measures ~65 ms on a fixture and
1.58 s on that real project. Option (b) from the design space — always on, with a hard deadline like
the auth preflight's — is therefore not available: any deadline short enough to keep the report
instant is *below the floor* of a real lookup, so it would answer `unknown` on every run, and a
section that is always unknown is worse than no section. Option (a) alone — a flag and nothing else
— works but leaves the good answer behind a flag nobody remembers to pass.

**The cache is what makes the hybrid exact rather than approximate**, and this is the argument the
whole design rests on. The whole-project hash **dominates** the per-platform ones: `--platform`
filters the same source list, so an unchanged project hash implies unchanged per-platform hashes.
(The converse does not hold, and is not needed: a moved project hash simply misses, which costs a
lookup and never a wrong answer.) That makes the hash `status` already computes for free a *sound*
key for an answer about a hash it does not have. A hit costs one `readFileSync` and is as true as
the lookup that wrote it — not a stale approximation like the cloud-session `stat`, which is
tolerated because it is cheap; this one is kept because it is right.

- **`.expo/exagent-eas-builds.json`**, one entry per platform: the `projectHash` it was true for,
  the `fingerprintHash` that was actually asked about, `checkedAt`, and the build. An entry that
  cannot name both hashes and a build id is dropped on read rather than repaired — the entire value
  of this cache is that a hit is exact.
- **Only a hit is written.** A `none` goes out of date on the ordinary timeline of the workflow this
  serves: you start a build, it finishes fifteen minutes later, and a cached "there is no build"
  would then be wrong exactly when it mattered. A hit only goes stale when somebody deletes a build,
  which is rare and which the download command reports for itself. The asymmetry is the policy.
- Consequently an `--explain` run that finds a build makes every later `status` free until the
  project changes, and one that finds none leaves the next run saying "not asked". Both are
  honest.

**Section isolation, and where the reasons come from.** No EAS CLI, no `@expo/fingerprint`, a
project with no EAS link, a network that refused, a payload in an unrecognised shape, the deadline
expiring — every one is an `unknown` carrying its reason, the command still exits 0, and no other
line of the report is affected. Two of those are worth writing down:

- **A signed-out machine is never probed twice.** The `auth` section has already answered, so
  `loggedIn: false` short-circuits the lookup with a reason naming it. `loggedIn: null` is *not*
  treated as signed out — nothing was established — so the lookup runs.
- **The reason of a refusal is read off stdout, before stderr**, which is the opposite of the usual
  order and is what the CLI actually does: an unlinked project gets `EAS project not configured…`
  and both `eas init` forms on **stdout**, with only `Error: build:list command failed.` on stderr
  [observed — live against the unlinked `notesapp`, 2026-08-26; recorded as
  `src/__fixtures__/eas/build-list-unconfigured.json`]. Reading stderr first would have reported the
  one sentence with nothing in it.

**The flag it hides behind is `--explain`, and it was `--builds` for about an hour.** The first
version of this shipped its own flag; the section below folded it into `--explain` before either was
released, because two flags that both mean "you may pay for a subprocess" is not one story, and a
reader deciding what a run will cost should have one thing to decide. `--eas` was rejected outright
on the way past: `dev --eas` and `dev --local` already name a build *backend*, and a `status --eas`
meaning "you may call EAS" would be a second sense of the same word one command apart.

**The line is printed only when it says something**, the same rule the `skills` line follows: a
build was found, or the caller passed `--explain` and is owed the answer whatever it is, or the
section could not be read at all. A default run with an empty cache prints nothing, because "nobody
asked" is not a fact about the project. The key is always present in `--json` (llp/0006 §Output
contract), and the `cli:status` event gains `easBuilds` and `easBuildsAsked`.

**The follow-up is shared with `impact`, and gated on this project's own freshness.**
`status-cached-build` fires only when a platform is `found` *and* that platform's freshness is
`stale` — the case where the alternative was a fifteen-minute rebuild. `fresh` needs nothing, and
`unknown` establishes nothing about which app is installed, so a download there would be a guess.
The sentence lives in `src/followups/cachedBuild.ts` beside `impact`'s, because it is the reason the
whole build-cache lookup exists and two copies of it would drift.

**What is still not closed.** This is `status` reporting the answer, not the *plan engine* consuming
it — item 2 of §Implemented in v1 as still has that half open. `exagent dev` continues to plan a
build for a project whose fingerprint EAS already has a build for.

Shipped as `src/status/easBuilds.ts`, `BuildLookupOutcome` in
`src/impact/buildCache.ts` (the three-state form; `findCachedBuildAsync` is now the two-state
wrapper `impact` reads), and `src/followups/cachedBuild.ts`.

## The impact headline is free, the explanation is not

Decision [confirmed — Kudo, 2026-08-26]. `exagent status` reports **what a change costs** on every
run — `js-only`, `dev-client-compatible`, `needs-native-build`, with the one sentence that says what
carried it — and `status --explain` adds the three things that cost a subprocess or a round trip.
`exagent impact` stays, and stays a *gate* — *for about an hour; it was removed the same day, and
§The fold: `exagent impact` is removed says where each of its capabilities went.*

**The git analogy is the whole design.** `status` is the **reflex**: you run it constantly, so it has
to be instant and it has to answer, not judge. `impact` is the **gate**: you run it when a decision
turns on the answer, so it may take its time and it must exit non-zero when the answer is not the one
you asserted. The mistake this closes is that `status` was reporting `stale` — a fact — and leaving
the reader to run a second command for what to *do* about it, which is the same shape as a `git
status` that told you a file had changed and made you run a second tool to see the diff.

**Why the headline can be free, which is the part that had to be checked rather than assumed.** Two
inputs are already in memory by the time the freshness line is built:

- the working tree's fingerprint **with its sources** — the probe computed them to get its hash, and
  `statusAsync` was already throwing them away before writing `report.probe`;
- the sources of the last build this CLI ran — `.expo/exagent-last-build.json` has held the whole
  fingerprint since the v2 record ([[0011-impact-and-freshness]] §The record has to hold the
  sources), and reading it was already one file read.

What was missing was the diff. `impact` gets it from `fingerprint:diff`, which is a **subprocess over
two temporary files** — the right price for a command somebody ran to ask this question, and the
wrong one for a line on a report that promises to be instant. So the diff is done in process
(`src/project/localDiff.ts`) and the classifier is reused unchanged. Measured live on
`apps/observe-tester`, a real 210-source project: `status` took **1.58 s** before the headline
existed and **1.57 s** after, on the same tree, with the headline naming the exact module that
differed [observed — 2026-08-26]. Free is a measurement here, not a claim.

**The port is a port, and llp/0001's constraint is intact.** Nothing is imported from
`@expo/fingerprint`. What is reproduced is a set difference over two lists of `{identity, hash}`,
and the only thing borrowed is the *identity* rule that `Sort.ts` `compareSource` spells out. Two
things keep it honest:

- **A keyed join, not a merge over sorted lists.** Upstream walks two lists in `compareSource` order,
  which is correct and depends on both sides still being sorted that way. A map keyed on the same
  identity gets the same answer and cannot be broken by a re-ordering, so the one way the port could
  silently disagree is closed by construction rather than by vigilance.
- **A recorded pair of real fingerprints and the real CLI's answer for them**
  (`src/__fixtures__/fingerprint/`). Twelve real sources spanning all four types, diffed by the
  actual `fingerprint:diff`, asserted item for item. It caught the rule a reimplementation would most
  plausibly get wrong: a `package` is identified by `name@version`, so a **version bump is a removal
  and an addition, never a change**.

**What the free tier cannot resolve, said plainly.** The probe fingerprints with no `--platform`, so
one hash covers both platforms — which is right for freshness and is why a change under `ios/` moves
the android answer too. The headline inherits that: `ios` and `android` differ here only when their
recorded builds were made at different moments, and the report prints one line for both when they
agree rather than padding itself with the same sentence twice. **This limit survived the fold**: the
per-platform fingerprint went with `exagent impact`, so nothing resolves an `ios/`-only change from
an `android/`-only one any more. It is the one thing the fold cost, it is cheap to restore (one
`fingerprint:generate --platform` per platform, on the `--explain` side of the line), and nobody has
yet met a case that needed it.

**`--explain` adds three things and pays for two of them.** The per-source change list is free — the
headline diffed locally, so the list is a by-product — and is withheld by default because a headline
with fifty rows attached is not a headline, and because `status --json` is deliberately small (it
drops the fingerprint's own `sources` for exactly this reason). The two that cost: the OTA verdict
spawns `expo config --json --type public` to resolve the `runtimeVersion` policy, and the EAS build
lookup makes its network call. Measured live on the same project: **1.57 s** → **3.29 s**.

The name is Kudo's and it harmonises with `build:explain`: both mean "give me the why". It also
absorbed the `--builds` flag of the section above before either shipped — one flag for "you may pay",
not two.

**`--assert` deliberately does not come along** — *reversed the same day; see §An explicit flag
turns the report into a gate.* The paragraph below was the argument for keeping the two commands
apart, and the thing it got wrong is named there.

> `status` exits 0 always, by a contract older than this section, and a flag whose entire purpose is
> a non-zero exit cannot live on a command that has none. That is not a limitation to work around;
> it is the line between the two commands.

**The one place the two commands answer differently, and why that is correct.** Where nothing could
be classified — no recorded build, a v1 record holding only a hash, no fingerprint tool — `status`
answers `class: null` and `impact` answers `needs-native-build`. `impact` has to name a class because
`--assert` compares against one and "unknown" cannot be gated on, so its rule is the conservative one
and over-plans at worst. `status` must not, because every other line of it treats `unknown` as its
own answer that is never rounded down (`auth`, `device`, the bundler's readiness), and a class it did
not establish has no business sitting beside ones it did. The text report prints no `impact` line at
all in that case: the `freshness` line above it has already said why. See
[[0011-impact-and-freshness]] §Two commands, one classifier.

Shipped in `src/project/localDiff.ts`, `src/impact/fromRecord.ts`,
`FreshnessImpact` on `PlatformFreshness` and `ota` on `FreshnessStatus`
(`src/status/types.ts`), the `impact`/`ota`/per-source lines in `src/status/format.ts`, and
`exagent status [--explain]`.

**The third class needed a `git` call, and is worth it** [added — 2026-08-26]. The fingerprint
cannot tell "Fast Refresh picks it up" from "restart Metro": both leave the native surface
untouched. Without the file-level view the headline's three-class vocabulary is really a two-class
one, and a `metro.config.js` edit reads `js-only` while the reader reloads forever waiting for a
change the dev server read once at start-up. That is a *wrong* headline rather than a coarse one, so
`listChangedFilesAsync` runs in the free tier — but only when the fingerprint says the surface did
not move, which is the one case where it can change the answer. `git status --porcelain` measured
20–240 ms live, against a `status` that measures 1.58 s on the same project [observed —
2026-08-26], and a deadline keeps a pathological repository from holding the report. A project
outside git is an ordinary case and simply keeps the fingerprint's own answer.

## An explicit flag turns the report into a gate

Decision [confirmed — Kudo, 2026-08-26]. `exagent status --assert <class>` exits **20** when the
change costs more than the class named, and **22** when no class could be established. Without the
flag the command exits 0, exactly as before. **`exagent impact` is removed**; its surface is now
`status`, and its modules are the engine underneath.

This reverses the paragraph above it, and the argument that changed is worth keeping. "A command
that exits 0 by contract cannot carry a flag whose purpose is a non-zero exit" sounds like a
principle and is a category error: the contract is about what a *report* does, and `--assert` is a
caller saying "do not report to me, judge for me". The precedent was already in this CLI and
already documented — `runtime:errors --fail-on-error` is an information command that exits 20 only
when a flag converts what it found into a verdict — so the shape is not new, and the safety comes
from the same place it does there: **nothing changes unless the caller types the flag.** A run
without `--assert` is byte for byte the report it was.

**Three outcomes, and the middle one is why it is not two.** `20` is llp/0010's "the tool worked and
the operation it performed failed" — never `1`, which would send an agent looking for a usage
mistake it did not make. `22` is "nothing was shown to be wrong and nothing was proved right", and
`runtime:errors --fail-on-error` already uses it for the identical situation: an empty window from a
runtime that cannot report anything. The two need different fixes — `20` means change the code or
raise the assertion, `22` means give the gate something to measure — which is the whole reason for
spending a second code on it.

**The report stays honest under the gate.** `--assert` does *not* make `status` name a class it
could not establish; `FreshnessImpact.class` is still `null` and the `impact` line is still absent.
What the flag does is **refuse to pass**, which is a different thing and is the safe one: a gate
that returned 0 because nothing was measured would not be a gate. So the reflex/gate distinction of
[[0011-impact-and-freshness]] §Two commands, one classifier survives the merge intact — it just
stopped being a distinction between two *commands* and became one between a report and a verdict
over the same report.

**Two kinds of "no class", and the gate has to tell them apart** [observed — the first version
failed every real project]. The report says `class: null` both for a platform that was never built
here and for one that was built and cannot be measured, and treating them alike made `--assert`
permanently inconclusive: an ordinary project builds for one platform, so the other has no record
and the strictest reading dragged the whole answer to `22`. The rule is now:

- **No record at all** — nothing this CLI built exists for that platform, so there is no installed
  app the change could break. Skipped.
- **A record that cannot be measured** (a v1 hash-only record, a fingerprint with no sources) — that
  platform *is* in play and its cost is unknown, so the whole answer is unknown. Never skipped.

`recordedHash` is what separates them, and it was already in the report.

### The fold: `exagent impact` is removed

Its four capabilities land as follows, and the accounting is exact because one of them turned out
never to have worked:

| `impact` had | now |
| --- | --- |
| the class | the always-on `impact` line |
| `--assert <class>` | `status --assert <class>` |
| `--build <id>` | `status --explain --build <id>` |
| the OTA verdict | `status --explain` |
| the build-cache lookup | the `eas build` section |
| `--base`/`--head` | **nothing was lost** — the mode threw `IMPACT_MODE_UNAVAILABLE` on every run |
| `--preset`, `--profile` | **dropped.** Both only ever reached the fingerprint run and the caveat list, and `status`'s probe takes neither. Recorded here rather than quietly left out. |

**`--build` requires `--explain`**, and says so rather than implying it: the flag fetches a
fingerprint from the service, and `--explain` is the one word in this surface that means "this run
may spend a round trip". A `--build` that turned that on by itself would put the cost back where the
design took it out of.

**`--build` replaces the headline's base and leaves `fresh`/`stale` alone.** `eas
fingerprint:compare --build-id` takes no platform, because a build was made for exactly one and
which one is a fact about the build, so the one answer goes on every platform and
`freshness.comparison` names what it was measured against. The `fresh`/`stale` states keep meaning
"does the app *I* built here still match", because that is a different question and one of the two
silently changing meaning would be worse than reporting both. Verified live against a real EAS build
[observed — 2026-08-26]: `impact  vs EAS build 21d7d434-… · needs-native-build`, twelve changed
sources listed, `freshness` still `fresh`, exit 0; and with `--assert js-only` beside it, exit 20.

**One rename fell out of the fold.** The follow-up ids `impact-*` named a command nobody can run
any more, so they are `change-*` — they describe what a *change* costs, which is a section of
`status` now. `impact-cached-build` and `status-cached-build` were the same sentence reached from
two directions; with one caller left they are one builder and one id, `cached-build`. The
suggested-command lint (`src/lint/`) is what caught the stray `npx exagent impact …` strings, and
what caught `status` printing a `--build` its own parse did not accept.

Shipped in `src/status/assert.ts`, `src/status/resolveOptions.ts`, `AssertStatus` on
`StatusReport`, `FreshnessComparison` and `changedFiles` on `FreshnessStatus`, the `assert` and
`files` lines in `src/status/format.ts`, and `src/followups/change.ts`.

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
2. **No build-cache lookup.** Freshness = probe fingerprint vs `.expo/exagent-last-build.json` (written after a successful `run:*` step). Unrecorded ⇒ stale: v1 over-plans a build at worst, never under-plans. **Closed for `impact`** [added — 2026-08-24]: `eas build:list --fingerprint-hash` is a build-cache lookup, and [[0011-impact-and-freshness]] §The build-cache lookup uses it to turn "you need a native build" into "a finished build already exists for this exact fingerprint". **Closed for `status` too** [added — 2026-08-26]: see §The EAS build lookup, and why it is opt-in, which also records why the answer is cached rather than always fetched. The *plan engine* still does not consult it, and that is the remaining half of this item — `exagent dev` plans a build for a project whose fingerprint EAS already has a build for.
3. The recorded hash is the pre-build probe hash (what an unchanged project re-probes to). The record now holds the whole fingerprint rather than the hash alone [added — 2026-08-24], because a hash cannot be diffed and "what changed" is the whole of what `impact` reports; a bare string still reads, as a record whose sources are null. See [[0011-impact-and-freshness]] §The record has to hold the sources, including the measurement behind storing it uncompressed.
4. The `web` rule fires only on an explicit `--web`; `ProjectState` cannot prove "web-only".
5. Bare-vs-CNG uses "any native dir present"; the argv uses the resolved platform.
6. `sdkVersion: null` never forces a rule; `expoGo.compatible` is the single Go verdict.
7. Config plugins are read from static config only (`app.json`); dynamic `app.config.js/ts` yields a debug event and best-effort skip — resolving it needs an `expo config` subprocess (follow-up). **The subprocess exists now** [added — 2026-08-24]: [[0011-impact-and-freshness]] §A fingerprint change is not "OTA-unsafe" spawns `expo config --json --type public` to resolve the `runtimeVersion` of a project whose config is code, with the static read as its fallback. The *plugins* half of this item is still static-only; what `impact` established is the mechanism and the parse (the Expo CLI writes its own event lines to stdout ahead of the answer, so the last JSON line is the one to read).

## Testing

The decision table is pure logic over probed state: exhaustively unit-tested, no model, no device (tier 0 in [[0002-testing-and-evals]]). Probe and execution paths get e2e coverage against fixtures via subprocess + JSONL assertions.
