# 0004: Smart Start and the Project-State Engine

**Type:** RFC
**Status:** Final
**Systems:** project-state probe (new); smart `dev` command (new, `start` until 2026-08-22); dev-server lock (new); `@expo/fingerprint`; `expo-mcp` tools
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20 · finalized 2026-08-28
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0002-testing-and-evals]], [[0015-backend-selection-and-config]]

## Summary

One deterministic engine answers "what must run to get this app on a device?". Three callers consume it [confirmed — Kudo, 2026-08-19; spelled `start` until 2026-08-22, `dev` since; see §`exagent status`, Renamed]: a single smart command, the post-install "what must rerun?" answer, and the Expo Go compatibility check. Neither agents nor users decide when to prebuild, rebuild, or just start Metro.

Per [[0001-agentic-cli-on-expo-cli]] §Constraints, the engine _invokes_ `expo prebuild`, `expo run:*` and `expo start` as subprocesses and consumes their JSONL events. It does not import `@expo/cli` internals.

## Inputs (project-state probe)

- Target: Expo Go, dev client, or web; is the target app installed on the device/simulator?
- Native state: bare `ios/`/`android/` dirs vs CNG; `@expo/fingerprint` hash of the native surface [observed — package exists; the CLI's build-cache providers already compute `calculateFingerprintHashAsync`, `packages/@expo/cli/src/utils/build-cache-providers/index.ts`].
- Compatibility: Expo Go check; post-install impact classification (below).

## Decision table (sketch)

| State                                                   | Plan                                            |
| ------------------------------------------------------- | ----------------------------------------------- |
| **Not an Expo app** (no `expo` dependency)              | **nothing — no steps** ([[0020-not-an-expo-app]]) |
| Expo Go compatible, Go installed                        | start Metro → open in Expo Go                   |
| Dev client installed, fingerprint matches last build    | start Metro → open dev client                   |
| Fingerprint changed (new native module / config plugin) | prebuild (CNG) → native build → install → start |
| Build cache hit for current fingerprint                 | download/install cached build → start Metro     |
| Bare project, native dirs dirty                         | pod install / gradle sync → build → start       |
| Web                                                     | start Metro for web                             |

The first row sits above the others, and above the web short-circuit, for the reason
[[0020-not-an-expo-app]] records. It is not a fact about how the app runs. It is the fact that there
is no app. Without it the table read "no `expo` dependency" as "lacks a dev client", then planned
`expo install expo-dev-client` plus a native build for whatever repository the caller was standing in
[observed — 2026-08-26]. Every command that would *act* on the plan stops before the table is
reached. The row is what the commands that only *describe* the directory print, so the guard and the
engine can never disagree.

## Contract

Emit the plan first as a structured event (steps, reasons, and time-class estimates), then execute, streaming JSONL progress. `--plan` stops after emitting, so a driving agent can present it for approval ([[0008-guardrails]]). The surface is identical as a CLI command for humans and as an MCP tool for agents.

### A plan step's `reason` describes the step, not the goal

Decision [confirmed — Kudo, 2026-08-23]. The Expo Go row's only step used to carry the reason
"Opens the project in Expo Go, which needs no native build." `expo start --go` does not open the
project in Expo Go. It serves a bundle and waits. Following the plan therefore left an agent with a
dev server and no way to reach the app, and the plan itself was the thing that said otherwise. That is
the worst place for a wrong sentence to be, because it is what a driving agent reads _before_ it acts.

Two changes, both about the plan telling the truth about itself [observed — `src/plan/decide.ts`]:

- **A typed platform flag is in the printed argv.** `exagent dev --ios` has always forwarded `--ios`
  to `expo start` [observed — `src/dev/resolveOptions.ts`, `resolveStepArgs`], and the plan printed
  `expo start --go` regardless, so the argv an agent approved was not the argv that ran. The plan
  engine now takes `requestedPlatform`, the flag the caller _typed_, separately from `platform`,
  which is always resolved and never appears on a command line. Only the typed one goes in the argv.
- **The reason distinguishes the two forms.** With a flag, `expo start --go --ios` really does open
  the app. It uses a booted simulator or boots one, installs Expo Go if it is missing, and sends the
  `exp://` URL [observed — `@expo/cli` `openPlatforms.ts` → `PlatformManager.openProjectInExpoGoAsync`;
  verified live 2026-08-23 against an SDK 57 app and a booted iPhone 17 Pro]. Without one, the reason
  says so and names `exagent navigate /`.
- **The plan's `reasons` list says the same thing the step's `reason` does** [added — 2026-08-23].
  The step was fixed above and the list was not, so `dev --plan --json` with no flag printed
  `"Target platform: ios."` beside `["expo","start","--go"]`. One channel was honest about opening
  nothing and the other announced a target [observed — friction run 2, 2026-08-23]. The sentence
  now carries both facts it was hiding: whether anyone *named* the platform, and whether the plan
  *acts* on it. It reads `Target platform: ios, named on the command line.` when the flag was typed;
  `No platform was named; this host suggests ios, and the plan builds for it.` when a `run:*` step
  does; and `…, and the plan opens nothing on it — pass --ios or --android, or run
  "exagent navigate /" once the dev server is up.` when nothing does. That is why the reason list is
  built per rule rather than once before the branches: the honest sentence depends on the plan.

**Opening the app is `navigate`, and now everything says so** [observed — `src/followups/`]. The
capability was never missing. `navigate` resolves the deep link and runs `simctl openurl`, which is
exactly the manual step a friction run had to leave the CLI for. It was only never suggested. The
`dev-wait-open-app` follow-up used to answer "the bundle is built and nothing is running it" by
re-suggesting the identical wait, the one action that cannot change the answer. It now
names `exagent navigate /` first and the gate second. `buildStartFollowUps` gains the same step at
the head of its ladder, and the cap of three pushes the furthest rung (`eas-build`) off. That is the
right trade, because a dev server with no app on it cannot be shipped either.

Caveat, recorded because it decides which route to trust [observed — live, 2026-08-23]. On a Mac
with no usable GUI session, `expo start --ios` opens the app and then **kills the dev server**.
`ensureSimulatorAppRunningAsync` shells out to `osascript … tell app "System Events"`, that fails,
and the rejection is unhandled through `openPlatformsAsync` [observed — the same failure in both CI
and non-CI mode, `@expo/cli` `ensureSimulatorAppRunning.ts`]. `exagent dev` plus `exagent navigate /`
has no such dependency, which is why it is the route the follow-ups name. This is an upstream
fragility rather than something the wrapper works around. It belongs in llp/0010 §Upstream asks if it
persists.

## Sub-features

- **Expo Go compatibility check** [confirmed — Kudo seed, 2026-08-18]: answer "can this run in Expo Go?" with reasons. Compare dependencies against `packages/expo/bundledNativeModules.json` [observed — file exists], detect config plugins and custom native code, and check SDK support.
- **Post-install impact decisions** [confirmed — Kudo seed, 2026-08-18]: after `npx expo install {pkg}`, JS-only means keep the dev server and maybe reload; a new config plugin or native module under CNG means prebuild plus a new dev build; bare native dirs mean pod install or gradle sync. Same classifier as the decision table, consumed at a second moment.

## `exagent status`

[confirmed — Kudo seed, 2026-08-22] A `git status`-like overview: one fast, read-only command that answers "where is this project right now, and what would happen next". Composition of existing pieces [inferred]:

- **Project**: name/slug, SDK version, CNG vs bare, dev-client/web deps.
- **Expo Go**: compatible or not, with reason count (the reasons themselves in the `probe` key of `--json`).
- **Freshness**: the current fingerprint against `.expo/exagent-last-build.json` per platform, giving `fresh`, `stale` or `unknown` (no fingerprint tool). **And what that costs** [added — 2026-08-26]: the impact class of everything that changed since that build, on its own `impact` line, computed in process from two fingerprints already in hand so it costs no subprocess. `stale` is a fact; this is what to do about it. See §The impact headline is free, the explanation is not.
- **EAS build**: whether EAS already has a *finished* build made from this exact fingerprint, per platform, as `found`, `none` or `unknown` [added — 2026-08-26]. This is the other half of the freshness question. `freshness` asks whether the app **this machine** built still matches, and a `stale` there used to mean a rebuild. This asks whether anybody has already built exactly this, where the answer is a download. The cached answer is read always, and the network call happens only under `--explain`. See §The EAS build lookup, and why it is opt-in for the measurements that decided that, and for why the cache key is exact.
- **Dev server**: running or not, and how many CDP targets are connected (is the app open?). Discovery order [observed — 2026-08-22]: an explicit `--dev-server-url`, then the project's **dev-server lock** (below), then the port the project's own `.expo/dev/logs/start.log` names (the `metro:instantiate` event, which is project-scoped but carries no liveness or PID, so it is probed and never trusted), then 8081, then a short scan of the ports `expo start` falls back to.
- **Skills**: is the agent selection cached, and how does the linked skill count compare to the discovered count (an out-of-sync hint). **Left out of the text report entirely** when no agent is selected *and* nothing was discovered [revised — 2026-08-25]. `no agent selected · no skills discovered` is a line about two things that are not there, on a report whose every other line is a fact about the project [observed — dogfood, 2026-08-24]. The section stays in `--json` and in the `cli:status` event, where a key that is always present is the contract (llp/0006 §Output contract). It returns to the text report the moment either half has something to say, including when the section could not be read at all, because the reason is worth printing.
- **Device**: does this machine have a booted simulator or an attached device to open the app on? Reported as `present`, `absent`, or `unknown` [added — 2026-08-25]. It gets its own line because it changes what every other suggestion is worth. See llp/0009 §Device-aware ladders for the probe, and for why `unknown` is never rounded down to "none".
- **Dev server, where a device reaches it**: the tunnel origin, when the run has one and it is still up [added — 2026-08-25]. The `url` above is where the dev server listens *on this machine*, which for a tunnelled run is not the address any device uses. `hostType` and `tunnelUrl` ride along in `--json`, and only a tunnel is worth a word in the text, because `127.0.0.1:8081` already says "this machine". See llp/0005 §Where a device reaches the dev server.
- **Next action**: the smart-start rule that would fire, as one line (for example "`exagent dev` → expo-go: `expo start --go`"). The exception is **a dev server this project can use already answering**, and then the line is `exagent smoke` with the reason why [observed — 2026-08-23, `buildNextActionStatus`; the command it names became `smoke` on 2026-08-26 when `dev:wait` was deferred, see [[0017-deferred-commands]]]. A dev server with **no app attached and no local device to open one on** gets a third answer [revised — 2026-08-25]: the `exp://<host>` link, or `exagent navigate / --print-url` when no link can be named. See llp/0009 §Device-aware ladders. The old form recommended starting a dev server three rows under a line reporting one as healthy, which is a report disagreeing with itself. On a busy port that second server would not have started either. The rule is still reported either way, because it is the project's shape and a running server does not change it. Deliberately not `runtime:errors`: the `runtime-errors` follow-up already names it, and `next` must not repeat a follow-up. That is the whole reason `status` keeps its follow-ups off the terminal.

Contract: human-readable sections by default, like `git status` short prose; `--json` for the machine shape; exit 0 always, because status is information rather than judgment. It stays fast, with no subprocess heavier than the fingerprint CLI and a dev-server probe on a short timeout.

### The discovery ladder

[added — 2026-08-27] The five steps, in order, in `discoverDevServerAsync` (`src/runtime/devServer.ts`),
with what each one proves and the `source` it reports:

| # | Step | Reports | Proves |
| - | ---- | ------- | ------ |
| 0 | An explicit `--dev-server-url` or `--port` | `flag` | the caller named it; nothing else is tried |
| 1 | The project's dev-server lock | `lock` | an `exagent`-started wrapper is alive **and** its URL answered |
| 2 | The port `.expo/dev/logs/start.log` last named | `log` | this project started a server there once, and it answered now |
| 3 | 8081 | `default` | Metro's default answered |
| 4 | 8082–8085, in parallel | `scan` | *a* Metro answered; not that it is this project's |

Steps 1 and 2 are the fast paths and step 4 is the completeness guarantee. The order is the whole
design: a hit at 1 or 2 names a server on purpose, while 3 and 4 are guesses that happened to answer.
That is why the step is reported rather than kept private. **Nothing may be skipped on the strength of
a fast path.** An `expo start` a developer ran by hand holds no lock, and a project whose `.expo` was
cleaned names no port, so the scan is what finds it. Every step probes and none trusts. `default` is
also the reported source when nothing answered anywhere, because the caller still needs a URL to name
in its error.

#### The ladder was never the cost — the timers it left running were

llp/0023 §What it bought, reading 2, closed with the port scan as "the largest single cost in a default
`status`, at about 1.3 s". That was right about the 1.3 s and wrong about what was spending it. Measured
end to end [observed — `friction/run7/tapapp`, 2026-08-27], a default `status` printed a complete report
at **263 ms** and the process exited at **1584 ms**. Naming a dead port with `--dev-server-url` printed
at 290 ms and exited at **296 ms**. The work either way is the same 270-odd milliseconds. What differed
was 1.3 s of nothing, after the answer.

Two things outlive a probe nobody cleans up after. A Node process exits when its event loop empties,
so both were paid at exit rather than in the answer:

1. **The timeout's own timer.** Each candidate was raced against a `setTimeout` that was neither
   cleared when the race resolved nor `unref`ed. The probes answer in about a millisecond, because
   `ECONNREFUSED` on localhost is immediate, so every probe left its whole budget pending. This is
   the 1.3 s, and it is the *budget* rather than the number of probes: a **lock hit, which probes
   exactly once and skips the scan entirely, cost the same 1.58 s** as a five-port scan. That
   measurement is why none of the obvious optimisations was implemented. Parallelising the scan (it
   was already parallel), consulting the lock first (it already did), caching the last-seen port (a
   cache hit is one probe, which is what the lock hit already was): every one of them would have
   removed probes that cost nothing and left the 1.3 s where it was.
2. **The request the timeout gave up on.** `no answer within Nms` was a claim about the report and not
   about the socket. Against a dev server that accepts the connection and then never answers, which is
   how a Metro mid-restart looks from the client's side, the report was complete at 3.07 s and the
   process was **still alive at 45 s**, waiting out undici's 300 s header timeout. It now exits at
   3.12 s [observed — 2026-08-27].

Both fixed in `discoverDevServerAsync`: the timer is cleared on the way out and `unref`ed while it
runs, and the timeout aborts the request it abandoned. `probeDevServerAsync` takes an optional
`signal` for that, and `status` passes one of its own so its outer deadline reaches the socket too
(`src/status/statusAsync.ts`).

What a default `status` costs now, five runs each, alternating between the two builds so machine drift
cancels [observed — 2026-08-27, ports 8081–8085 otherwise idle]:

| Scenario | Discovery step | Before | After |
| -------- | -------------- | ------ | ----- |
| Dead port named with `--dev-server-url` (the floor: no discovery at all) | `flag` | 0.28–0.30 s | 0.27–0.34 s |
| No dev server anywhere; project's `start.log` names a dead port (6 probes) | `default` | 1.59–1.60 s | **0.27–0.32 s** |
| An `exagent dev --detach` server on 8399 (1 probe) | `lock` | 1.58–1.59 s | **0.31–0.33 s** |
| A hand-started `expo start --port 8083`, no lock | `log` | 1.57–1.58 s | **0.29–0.33 s** |
| The same, with `start.log` emptied so nothing knows the port | `scan` | 1.57–1.62 s | **0.29–0.42 s** |
| A hand-started `expo start` on 8081, no state anywhere | `default` | 1.57–1.59 s | **0.27–0.32 s** |
| Nothing on any port, project with no `.expo` at all (5 probes) | `default` | 1.58–1.62 s | **0.29–0.32 s** |

Two readings, and the second is the one worth keeping:

- **A default `status` is about 1.3 s faster, and now costs what naming the dev server costs.** The
  discovery ladder is inside the noise of a single run: 0.29 s against the 0.28 s floor.
- **The time to the *report* did not move.** It was 260–320 ms before and 260–320 ms after, in every
  row. Nothing was made faster. Something was stopped from being paid twice. The report was always
  this quick and the command was not, which is why no output and no test caught it. Only the exit did.

#### Everyone who discovers pays it, and it was one function

Every caller of `discoverDevServerAsync` inherits the fix: `status`, `navigate` (`openRoute.ts`),
`preflight.ts` and through it every `runtime:*` action, `smoke`, and the deferred `dev:wait`.
`dev:stop` does not. It reads the lock directly (`readDevServerLockAsync`) and never enters the
ladder, so it never paid this.

The tail was only ever *visible* on `status`, and the reason is worth writing down because it is what
kept the bug hidden. A command that refuses ends through `logCmdError`, which calls `process.exit`, and
that discards pending timers. `status` exits 0 by contract, and a success path sets `process.exitCode`
and lets the loop drain. So `runtime:errors` with no dev server exited in 58 ms with the leak intact,
while `status` sat for 1.3 s. Measured on the shared function alone at its default 800 ms budget: the
answer arrived at 13 ms and the process exited at **813 ms** before, and at **13 ms** after
[observed — 2026-08-27]. Every discovery caller was paying its whole budget on every success.

#### Two limits, stated

- **An explicit URL still gets no timeout of its own**, and that is deliberate. A dev server on another
  host or behind a tunnel may legitimately be slow, and cutting it off would report a running server as
  unreachable. The caller's `signal` is the only thing that stops it, which is why `status` passes one.
- **An abort does not free a socket that is still connecting.** `fetch` rejects immediately, but undici
  leaves the `ConnectWrap` in place until its own 10 s connect ceiling. So
  `status --dev-server-url http://240.0.0.1:8081`, against a host that drops packets rather than
  refusing, still prints at 3.1 s and still exits at 10.6 s, unchanged by this wave
  [observed — 2026-08-27]. Nothing in the ladder can meet that case, because the ladder only ever
  probes localhost, where a refusal is immediate. Fixing it needs a connect timeout undici does not
  expose to `fetch`, or a `net.connect` pre-check with a budget of our own.

### The dev-server lock

[confirmed — Kudo, 2026-08-22: socket lock in exagent, expo-cli unchanged] The legacy `packager-info.json` is gone from the modern CLI [observed], and its replacement lives in `exagent`, not upstream: `src/devLock/`, taken by the dev-server wrapper `runDevServerAsync` and therefore by both `exagent start` and the final step of an `exagent dev` plan.

**A socket, not a JSON file** [confirmed — Kudo, 2026-08-22]. A file records a fact about a process, and that record outlives the process. Every reader then has to guess whether what it read is still true. That is what made `packager-info.json` unreliable, and what a `pid` field only papers over: PIDs are reused, and a liveness check is a second question with its own race. A listening socket cannot have that bug. It exists only while its owner does, so a reader that got an answer got it from a process that was alive when it answered. Zombie and out-of-date data are impossible by construction rather than by convention.

- **Address**: a pure function of the project root, because the two sides share nothing else. `projectRoot/.expo/exagent-dev-server.sock` on posix, and `\\.\pipe\exagent-dev-server-<sha1(realpath(projectRoot))[0:16]>` on Windows, where a pipe is not a project file and the project can only be in its name. Symlinks are resolved and the digest is lowercased, so one directory is one address. A posix project buried deeper than the kernel's ~104-byte cap on `sun_path` gets the same digest scheme under the temporary directory. The choice depends only on the path length, so both sides make it identically.
- **Protocol**: the server writes one JSON line (`url`, `port`, `pid`, `startedAt`, `projectRoot`) on connection and ends it. A reader connects with a ~250 ms timeout and reads to the close. A refused connection or a timeout is "no dev server", full stop.
- **Acquisition**: `EADDRINUSE` on posix means either a live owner or an orphaned socket file, and only a connection tells them apart. An answer means another `exagent` legitimately owns the project's dev server. Silence means the file is an orphan, which is unlinked before listening again. Unlinking can only lose an orphan, because a socket file carries no state and connecting to it is the only way to reach whatever made it. Nothing is ever _read_ out of the file. On Windows a pipe dies with its process, so `EADDRINUSE` is a live owner by definition.
- **Release**: on the dev server's exit (the wrapper's `finally`) and on process exit, with a best-effort unlink. A leftover socket file is inert by construction. It answers nothing, so no reader is misled, and the next acquisition removes it.
- **Never load-bearing**: the dev server is the command and the lock is a convenience, so an address that cannot be taken produces one warning and a `cli:dev_lock_skipped` event, never a failure. The port published is the one the dev server itself reported in `start.log` after the spawn timestamp, falling back to `--port` and then 8081.
- **Still probed, never trusted**: the lock proves the wrapper is alive, and only an HTTP probe of the URL proves the dev server behind it is. Discovery therefore uses the lock to _stop guessing which port_, not to skip the check.

Implemented [observed — 2026-08-22] in `src/devLock/` (`address.ts`, `client.ts`, `server.ts`, `port.ts`, `holdLock.ts`), held by `runDevServerAsync` in `src/start/startAsync.ts`, and read as step 0 of `discoverDevServerAsync` in `src/runtime/devServer.ts`. `runtime:eval|errors|network` went through the same discovery in the same change. They previously assumed 8081 whenever `--dev-server-url` was absent, so a dev server on any other port was invisible to them even with a lock to ask. Two accepted limits: a dev server started by `expo start` directly holds no lock, where the port in `start.log` plus the scan is still the answer; and a posix project path long enough to push the socket past the kernel's cap moves it out of `.expo`, where a person looking for it will not see it.

Merged [confirmed — Kudo, 2026-08-22]: **`status` absorbs the former `exagent context`**, which is removed. `status --json` carries the raw `ProjectState` verbatim under a `probe` key, alongside the sections above. The sections round the probe off for a terminal, giving Expo Go as a reason _count_ and the fingerprint as a hash, and `probe` is what the summarizing dropped. A caller that wants the brief therefore reads one command instead of two. Rationale [inferred]: the two commands shared one probe and differed only in how much of it they printed, which is a flag rather than a verb, and an agent orienting in a project was reliably running both. The probe costs nothing extra here, because `status` already reads it to build its sections. The `install-dev-client` follow-up moved over with it. The `project-context` follow-up that pointed at `context` is gone, because the reasons it promised are now in the same report.

Default change [confirmed — Kudo, 2026-08-22]: **smart mode is `exagent start`'s default.** The plain passthrough moves behind `--passthrough`, and `--smart` stays as an alias. Human guardrail per [[0008-guardrails]]: an interactive terminal facing a plan with build-class steps gets one Y/n confirmation, and non-interactive runs (agents, CI) proceed plan-first without prompting.

Renamed [confirmed — Kudo, 2026-08-22]: **the smart engine is its own verb, `exagent dev`**, and `exagent start` goes back to being `expo start`. The rule that decides this is in [[0006-agent-native-cli-surface]] §The `exagent` launcher: a command sharing a name with an `expo` command behaves like that command, so the engine that does something `expo start` does not cannot be spelled `start`. The two mode flags disappear with the rename. `--smart` had nothing left to distinguish itself from, and `--passthrough` is now the `start` command itself. Everything else about the contract above is unchanged, including the Y/n guardrail.

Implemented [observed — 2026-08-22]: `exagent status [--json] [--dev-server-url]`, at about 65 ms, with per-section error notes and exit 0 (argument errors exit 1). The next action names `exagent dev`. The project name comes from `package.json`, because dynamic app config needs an `expo config` subprocess, the same approximation as item 7 below. Live-verified against a real running project.

Rename implemented [observed — 2026-08-22]: the engine is `src/dev/` (`devAsync.ts`, `confirmPlan.ts`, `resolveOptions.ts`), and `resolveDevOptions` resolves `run` with no flag and `plan` with `--plan`, the only two things the command can do. `src/start/` keeps the `expo start` wrapper: `resolveStartOptions` strips exactly two flags of its own (`--no-agent-skills`, `--no-followups`) and forwards everything else untouched, so `expo start` stays the one that rejects an argument it does not know. `dev` reuses the wrapper's `runDevServerAsync` for the dev-server step of a plan, and its `resolveStartFollowUps` for the follow-ups of a run that ends in one.

The guardrail lives in `src/dev/confirmPlan.ts`. It is asked only when four things hold: the run is interactive (`isInteractive()`, meaning a TTY, not CI, not headless), `--yes` was not passed, `--json` was not passed (the prompt would land inside the parsed payload), and at least one step is costlier than `seconds`. A decline emits `cli:start_plan_declined`, points at `dev --plan` and `start`, and exits 0, because nothing ran so nothing failed. It is asked after the plan is emitted and before any step runs, so a declined plan changes nothing. Until 2026-08-26 a prebuilding plan also took a checkpoint here, between the two; that whole system is deferred, see [[0016-v1-scope]] and [[0017-deferred-commands]]. The `cli:start_plan` event keeps its name and its `mode: 'plan' | 'smart'` field, because they name the plan engine of this RFC rather than the command that drives it.

## The EAS build lookup, and why it is opt-in

Decision [confirmed — Kudo, 2026-08-26]. `exagent status` reports whether **EAS already has a
finished build made from this project's current fingerprint**, per platform, in three states:
`found`, `none` or `unknown`, each with a reason. The **cached** answer is read on every run because it
costs nothing and is exact. The **network** call that produces it happens only under `--explain`.

The ask was "`status` could find available build on eas? using fingerprint", and the lookup already
existed: [[0011-impact-and-freshness]] §The build-cache lookup has run
`eas build:list --fingerprint-hash` since 2026-08-24. So the feature is not the query. It is
reconciling the query with the one thing this command promises, which is that `status` is *instant*.
Its dev-server readiness probe is capped at 400 ms. Its cloud-session check is a `stat` rather than an
`eas simulator:get` for exactly this reason. It drops the fingerprint's ~25 KB of `sources` from
`probe` to stay small. A section that added a second or more to every run would contradict all
three.

**Two costs, measured, not estimated** [observed — live against `apps/observe-tester`, a linked
project of the `expo` account, `eas-cli/22.4.0`, 2026-08-26]:

- `eas build:list --platform ios --fingerprint-hash <hash> --status finished --limit 1 --json
  --non-interactive` takes **1.10–1.33 s** over five runs, a hit and a miss alike, with a warm CLI.
  (`eas --version` returns in 0.07 s, so this is the network rather than process start-up. That
  matters, because a start-up cost would have been amortizable and a round trip is not.)
- **The hash `status` has is the wrong hash.** Its probe runs `fingerprint:generate` with *no*
  `--platform`, which hashes both platforms together. That is the right answer for freshness, and it
  is a hash no build carries, because a build is made for one platform. On one working tree:
  `031f6b0c…` for the project and `8ce1acfb…` for iOS. So asking EAS costs a **second** fingerprint
  run first (**1.24 s**) before the network call.

Together that is ~2.4 s per platform, against a `status` that measures ~65 ms on a fixture and
1.58 s on that real project. So option (b) from the design space, always on with a hard deadline like
the auth preflight's, is not available. Any deadline short enough to keep the report instant is
*below the floor* of a real lookup, so it would answer `unknown` on every run, and a section that is
always unknown is worse than no section. Option (a) alone, a flag and nothing else, works but leaves
the good answer behind a flag nobody remembers to pass.

**The cache is what makes the hybrid exact rather than approximate**, and this is the argument the
whole design rests on. The whole-project hash **dominates** the per-platform ones, because
`--platform` filters the same source list, so an unchanged project hash implies unchanged
per-platform hashes. The converse does not hold and is not needed: a moved project hash simply
misses, which costs a lookup and never a wrong answer. That makes the hash `status` already computes
for free a *sound* key for an answer about a hash it does not have. A hit costs one `readFileSync`
and is as true as the lookup that wrote it. It is not a stale approximation like the cloud-session
`stat`, which is tolerated because it is cheap. This one is kept because it is right.

- **`.expo/exagent-eas-builds.json`**, one entry per platform: the `projectHash` it was true for,
  the `fingerprintHash` that was actually asked about, `checkedAt`, and the build. An entry that
  cannot name both hashes and a build id is dropped on read rather than repaired, because the entire
  value of this cache is that a hit is exact.
- **Only a hit is written.** A `none` goes out of date on the ordinary timeline of the workflow this
  serves: you start a build, it finishes fifteen minutes later, and a cached "there is no build"
  would then be wrong exactly when it mattered. A hit only goes stale when somebody deletes a build,
  which is rare and which the download command reports for itself. The asymmetry is the policy.
- Consequently an `--explain` run that finds a build makes every later `status` free until the
  project changes, and one that finds none leaves the next run saying "not asked". Both are
  honest.

**Section isolation, and where the reasons come from.** Six things can go wrong here: no EAS CLI, no
`@expo/fingerprint`, a project with no EAS link, a network that refused, a payload in an unrecognised
shape, or the deadline expiring. Every one is an `unknown` carrying its reason, the command still
exits 0, and no other line of the report is affected. Two of those are worth writing down:

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
version of this shipped its own flag. The section below folded it into `--explain` before either was
released, because two flags that both mean "you may pay for a subprocess" is not one story, and a
reader deciding what a run will cost should have one thing to decide. `--eas` was rejected outright
on the way past: `dev --eas` and `dev --local` already name a build *backend*, so a `status --eas`
meaning "you may call EAS" would be a second sense of the same word one command apart.

**The line is printed only when it says something**, which is the rule the `skills` line follows too.
Three cases qualify: a build was found; the caller passed `--explain` and is owed the answer whatever
it is; or the section could not be read at all. A default run with an empty cache prints nothing,
because "nobody asked" is not a fact about the project. The key is always present in `--json`
(llp/0006 §Output contract), and the `cli:status` event gains `easBuilds` and `easBuildsAsked`.

**The follow-up is shared with `impact`, and gated on this project's own freshness.**
`status-cached-build` fires only when a platform is `found` *and* that platform's freshness is
`stale`, the case where the alternative was a fifteen-minute rebuild. `fresh` needs nothing, and
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
run: `js-only`, `dev-client-compatible` or `needs-native-build`, with the one sentence that says what
carried it. `status --explain` adds the three things that cost a subprocess or a round trip.
`exagent impact` stays, and stays a *gate* — *for about an hour; it was removed the same day, and
§The fold: `exagent impact` is removed says where each of its capabilities went.*

**The git analogy is the whole design.** `status` is the **reflex**. You run it constantly, so it has
to be instant, and it has to answer rather than judge. `impact` is the **gate**. You run it when a
decision turns on the answer, so it may take its time, and it must exit non-zero when the answer is
not the one you asserted. The mistake this closes is that `status` was reporting `stale`, which is a
fact, and leaving the reader to run a second command for what to *do* about it. That is the same
shape as a `git status` that told you a file had changed and made you run a second tool to see the
diff.

**Why the headline can be free, which is the part that had to be checked rather than assumed.** Two
inputs are already in memory by the time the freshness line is built:

- the working tree's fingerprint **with its sources** — the probe computed them to get its hash, and
  `statusAsync` was already throwing them away before writing `report.probe`;
- the sources of the last build this CLI ran — `.expo/exagent-last-build.json` has held the whole
  fingerprint since the v2 record ([[0011-impact-and-freshness]] §The record has to hold the
  sources), and reading it was already one file read.

What was missing was the diff. `impact` gets it from `fingerprint:diff`, which is a **subprocess over
two temporary files**. That is the right price for a command somebody ran to ask this question, and
the wrong one for a line on a report that promises to be instant. So the diff is done in process
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
one hash covers both platforms. That is right for freshness, and it is why a change under `ios/` moves
the android answer too. The headline inherits that. `ios` and `android` differ here only when their
recorded builds were made at different moments, and the report prints one line for both when they
agree rather than padding itself with the same sentence twice. **This limit survived the fold.** The
per-platform fingerprint went with `exagent impact`, so nothing resolves an `ios/`-only change from
an `android/`-only one any more. It is the one thing the fold cost. It is cheap to restore, at one
`fingerprint:generate --platform` per platform on the `--explain` side of the line, and nobody has
yet met a case that needed it.

**`--explain` adds three things and pays for two of them.** The per-source change list is free,
because the headline diffed locally and the list is a by-product. It is withheld by default because a
headline with fifty rows attached is not a headline, and because `status --json` is deliberately
small: it drops the fingerprint's own `sources` for exactly this reason. The two that cost are the
OTA verdict, which spawns `expo config --json --type public` to resolve the `runtimeVersion` policy,
and the EAS build lookup, which makes its network call. Measured live on the same project: **1.57 s**
becomes **3.29 s**.

The name is Kudo's and it harmonises with `inspect:build-log` (then `build:explain`): both mean "give me the why". It also
absorbed the `--builds` flag of the section above before either shipped — one flag for "you may pay",
not two.

**`--assert` deliberately does not come along** — *reversed the same day; see §An explicit flag
turns the report into a gate.* The paragraph below was the argument for keeping the two commands
apart, and the thing it got wrong is named there.

> `status` exits 0 always, by a contract older than this section, and a flag whose entire purpose is
> a non-zero exit cannot live on a command that has none. That is not a limitation to work around;
> it is the line between the two commands.

**The one place the two commands answer differently, and why that is correct.** Where nothing could
be classified, meaning no recorded build, a v1 record holding only a hash, or no fingerprint tool,
`status` answers `class: null` and `impact` answers `needs-native-build`. `impact` has to name a class
because `--assert` compares against one and "unknown" cannot be gated on, so its rule is the
conservative one and over-plans at worst. `status` must not. Every other line of it treats `unknown`
as its own answer that is never rounded down (`auth`, `device`, the bundler's readiness), and a class
it did not establish has no business sitting beside ones it did. The text report prints no `impact`
line at all in that case, because the `freshness` line above it has already said why. See
[[0011-impact-and-freshness]] §Two commands, one classifier.

Shipped in `src/project/localDiff.ts`, `src/impact/fromRecord.ts`,
`FreshnessImpact` on `PlatformFreshness` and `ota` on `FreshnessStatus`
(`src/status/types.ts`), the `impact`/`ota`/per-source lines in `src/status/format.ts`, and
`exagent status [--explain]`.

**The third class needed a `git` call, and is worth it** [added — 2026-08-26]. The fingerprint
cannot tell "Fast Refresh picks it up" from "restart Metro", because both leave the native surface
untouched. Without the file-level view the headline's three-class vocabulary is really a two-class
one, and a `metro.config.js` edit reads `js-only` while the reader reloads forever waiting for a
change the dev server read once at start-up. That is a *wrong* headline rather than a coarse one, so
`listChangedFilesAsync` runs in the free tier. It runs only when the fingerprint says the surface did
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
principle and is a category error. The contract is about what a *report* does, and `--assert` is a
caller saying "do not report to me, judge for me". The precedent was already in this CLI and already
documented: `runtime:errors --fail-on-error` is an information command that exits 20 only when a flag
converts what it found into a verdict. So the shape is not new, and the safety comes from the same
place it does there. **Nothing changes unless the caller types the flag.** A run without `--assert`
is byte for byte the report it was.

**Three outcomes, and the middle one is why it is not two.** `20` is llp/0010's "the tool worked and
the operation it performed failed", never `1`, which would send an agent looking for a usage mistake
it did not make. `22` is "nothing was shown to be wrong and nothing was proved right", and
`runtime:errors --fail-on-error` already uses it for the identical situation: an empty window from a
runtime that cannot report anything. The two need different fixes. `20` means change the code or
raise the assertion; `22` means give the gate something to measure. That is the whole reason for
spending a second code on it.

**The report stays honest under the gate.** `--assert` does *not* make `status` name a class it
could not establish. `FreshnessImpact.class` is still `null` and the `impact` line is still absent.
What the flag does is **refuse to pass**, which is a different thing and is the safe one: a gate
that returned 0 because nothing was measured would not be a gate. So the reflex/gate distinction of
[[0011-impact-and-freshness]] §Two commands, one classifier survives the merge intact. It just
stopped being a distinction between two *commands* and became one between a report and a verdict
over the same report.

**Two kinds of "no class", and the gate has to tell them apart.** The report says `class: null` both for a platform that was never built
here and for one that was built and cannot be measured. Treating them alike made `--assert`
permanently inconclusive: an ordinary project builds for one platform, so the other has no record
and the strictest reading dragged the whole answer to `22`. The rule is now:

- **No record at all**: nothing this CLI built exists for that platform, so there is no installed
  app the change could break. Skipped.
- **A record that cannot be measured** (a v1 hash-only record, or a fingerprint with no sources):
  that platform *is* in play and its cost is unknown, so the whole answer is unknown. Never skipped.

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

**`--build` requires `--explain`**, and says so rather than implying it. The flag fetches a
fingerprint from the service, and `--explain` is the one word in this surface that means "this run
may spend a round trip". A `--build` that turned that on by itself would put the cost back where the
design took it out of.

**`--build` replaces the headline's base and leaves `fresh`/`stale` alone.** `eas
fingerprint:compare --build-id` takes no platform, because a build was made for exactly one and which
one is a fact about the build. So the one answer goes on every platform, and `freshness.comparison`
names what it was measured against. The `fresh`/`stale` states keep meaning "does the app *I* built
here still match", because that is a different question, and one of the two silently changing meaning
would be worse than reporting both. Verified live against a real EAS build [observed — 2026-08-26]:
`impact  vs EAS build 21d7d434-… · needs-native-build`, twelve changed sources listed, `freshness`
still `fresh`, exit 0. With `--assert js-only` beside it, exit 20.

**One rename fell out of the fold.** The follow-up ids `impact-*` named a command nobody can run any
more, so they are `change-*`. They describe what a *change* costs, which is a section of `status`
now. `impact-cached-build` and `status-cached-build` were the same sentence reached from two
directions, and with one caller left they are one builder and one id, `cached-build`. The
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
invisible from inside. `exagent dev` runs the dev server in the *foreground* and never says so, so
the first thing a driving agent does is burn a command timeout on a command that cannot return
[observed — F46, friction run 4: a seven-minute timeout on the first attempt]. It then prints
`Suggested next: npx exagent navigate /` and holds the shell that would have run it. Every step
after it (`dev:wait`, `navigate`, `runtime:errors`, `runtime:reload`) needs a shell the dev server
is holding. So an agent has to learn to background the process from outside the CLI, which is
exactly the kind of shell incantation `dev:stop` exists to remove.

**The child is this CLI, not `expo start`.** `spawn(process.execPath, [bin, 'dev', ...argv],
{ detached: true, stdio: ['ignore', logFd, logFd] })` then `unref()`. It has to be the wrapper
because the wrapper is what takes the dev-server lock (§The dev-server lock), and a detached dev
server that published no lock would be a process nothing could find, wait on, or stop. Everything
that makes the result usable afterwards therefore already exists. The lock names its port and pid,
`dev:wait` reports its readiness, and `dev:stop` signals the pid the lock names. The detached
wrapper forwards `SIGTERM` to its `expo` child exactly as the foreground one does, so the tree goes
down together [observed — e2e `dev-detach-test.ts`: pid gone and lock silent after `dev:stop`].

**Three flags are stripped from the child's command line**, and the reasons differ. `--detach`
would detach a detached run forever. `--wait-ready` names a wait the parent performs, and the child
has nobody to report to. `--json` would both print an object nobody reads *and* switch the
plan's subprocess output to `capture`, which is the very output the log file exists to hold.
`buildDetachSpawn` is a pure function over argv for that reason. It is the half of detaching that
can be wrong in a way nothing else notices, because the parent reports success either way.

**The parent waits for the lock, not for the child.** A detached start is finished when the dev
server is *discoverable*, which is the moment the lock answers. Under `--wait-ready` it then holds
one `/status` request open (`waitForBundlerReadyAsync`, shared with `dev:wait`), so `ready` is
`true`, or the wait failed — never "unknown". Without the flag `ready` is `null`, which is the
difference between not ready and not asked.

**And a `--wait-ready` run whose step also opens the app holds its claim open for a moment
afterwards** [added 2026-08-28, for F140]. `expo start --ios` is one subprocess that
serves *and* drives Simulator.app, and the macOS Automation refusal that ends it arrives about a
quarter of a second after `/status` answers — after the readiness wait and after the liveness recheck
that F61 added. The design, the measurement and the reason a positive "the app opened" signal does not
exist are in [[0021-honest-reports]] §The window after the claim; `dev --detach --wait-ready` without
a platform flag is unaffected and pays nothing.

**One detached dev server per project.** The
lock is read *before* anything is spawned, and a project that already has one gets the running
server reported back with `alreadyRunning: true` and exit 0. That is idempotent rather than an error,
because the caller asked for a dev server and there is one. `acquireDevServerLockAsync` already
answers `in-use` and `holdLock.ts` deliberately swallows it. That is right for two *foreground*
servers, which people run on purpose in two terminals, and wrong for a second detached one, which
nobody could find.

**The log is one file per project, truncated per run**: `.expo/dev/logs/dev-detached.log`, in the
directory `src/utils/dotExpo.ts` already documents as per-run logs. A name carrying the port could
not be resolved by `dev:logs` before the port was known, and a file that accumulated across runs
would answer "what is my dev server doing" with what it did last week.

**`dev:logs` has no `--follow`.** A tail that never returns is the thing `--detach` exists to avoid.
It would hold the shell open again, and a stream with no end is not something a driving agent can
read. It polls instead, and each read is a bounded, quotable answer: the last 100 lines by default,
ANSI stripped, fenced as untrusted per [[0008-guardrails]]. A dev server started *attached* has no
log at all, and the command says that rather than reporting an empty file. Its output went to
somebody's terminal, and there was never going to be a file.

Exit codes: `dev --detach` exits `0` when a dev server is up, whether it started one or found one;
`1` when the child never published a lock; and `1` when `--wait-ready` gave up. In that last case the
server is still running, which the message says, unless the plan is still compiling, and then the
message says that instead (see §What a development build costs the plan, the phase decision).
`dev:logs` exits `0` for a log and `1` (`NO_DEV_LOG`) when the project has none.

## What a development build costs the plan, and two ways it reported wrong

[added 2026-08-28, from the first live pass over `expo-dev-client`. Both are about a plan
whose last step is a **build** rather than a dev server, which is the shape every dev-client plan
has and no Expo Go plan does. Both are fixed; the decision is at the end of each part, and what
precedes it is the observation as it was measured.]

**F121 (MAJOR) — a build that succeeded and installed the app is not recorded, so the next plan
builds again.** `recordBuildOf` runs only after a step exits 0, and `expo run:*` is one subprocess
that builds, installs *and* serves. So a run whose compiler finished, whose app is on the device and
whose launch step then failed leaves `.expo/exagent-last-build.json` untouched, and the next
`exagent dev` plans another fifteen minutes for an app that is installed and current
[observed — `05-dev-build-ios.log`: `Build Succeeded`, `Installing on iPhone 17 Pro`, then exit 7 on
the Automation grant; `08-plan-after-successful-build.txt`: `rule: bare-stale`, one `expo run:ios`
step, *"No development build recorded for ios, so a build is needed"*]. Two things sharpen it:

- **The report's own follow-up is falsified by the run that just happened** — "a build made by
  exagent is recorded, so the next plan skips it" — and it was.
- **The needs-human recovery walks into it.** `macos-automation`'s `How:` says to drop `--ios` and
  run `npx exagent dev --yes`, which on this rule is not a dev server: it is the same build again.

The rule the fix needs is what "a build happened" may be read off, and none of the three candidates
is free: the artifact on disk; the app on the device, which is a probe the plan engine deliberately
does not have (§Implemented in v1 as, item 1); or `Build Succeeded` in a subprocess's output. What is
*observed* and worth carrying either way: the record is
written when the **dev server stops**, not when the compiler finishes, because the `run:*` step is
the dev-server step. So `exagent dev --android` followed by `exagent dev:stop` does record the build,
and that is the sequence that makes a second run cheap.

### Decision: a build is recorded when the app reaches the device, whatever the launch then does

[decided 2026-08-28. Implemented in `src/dev/buildEvidence.ts` and
`devAsync.ts §recordBuildReachedDevice`.]

The record is written at **build-step success**, and a launch failure afterwards is its own reported
fact. A step that failed still has its output read, and a build whose app got onto the device is
recorded before the step failure — or the needs-human handoff — is thrown.

**The install line is what is read, not the compiler's.** Of the three candidates above, the one
that matches what the record *means* is the app being on the device. `resolveBuildPlatform` already
refuses to record an `eas build` because "a cloud build ends in an artifact that nothing here has
installed", and `› Build Succeeded` on its own is a claim about a build directory. The install
always follows a build that worked, so reading it asserts both facts at once. The lines belong to
`@expo/cli` and are pinned against the source that prints them: ``Log.log(chalk.gray`› Installing
${binaryPath}`)`` in `run/ios/launchApp.ts` and `run/android/runAndroidAsync.ts`, plus
`› Failed to locate binary file, installing with Gradle...` for an APK the CLI could not name. The
`›` prefix is the whole guard against `Installing Android SDK Build-Tools 36 in …`, which the Gradle
toolchain download prints and which says nothing about this project.

Two consequences, both stated out loud in the report because nothing in the tool's own output says
them:

- the step failure gains `Note: the app it built is installed on the device, so that build is
  recorded — the next "npx exagent dev" starts a dev server for it instead of building again`;
- `macos-automation`'s handoff gains the same sentence, on the line whose `How:` sends the reader to
  `npx exagent dev --yes`. Without it, that recovery walks back into the fifteen minutes.

**What is deliberately not recorded.** Two cases. A build that compiled and died before the install,
because the record would then say a device has an app it has not got. And anything in `inherit`
output mode, where nothing is captured: that is the one mode with a person watching the build happen,
and it keeps the behaviour it had.

**F125 (MODERATE) — `dev --detach --wait-ready` reports a dev server that is still compiling.** The
lock is taken by the wrapper at the *start* of its step, and for a `run:*` step that step is a
ten-minute Gradle build. So the lock answers a second in, publishing its fallback port, the parent
stops waiting for it, and `--wait-ready` then fails against a port nothing listens on. It says
`The dev server started on http://127.0.0.1:8081 (pid 29996), but --wait-ready gave up before its
bundler answered … The dev server is still running — this is about the wait, not about the server.`
Nothing is listening and nothing was started [observed — `10-dev-detach-android.json`]. The exit is
1 and the child does keep building, so the *effect* is right and the report is not. The lock's
published port is a fallback for when the dev server has not named one yet, and this path collapses
two facts into one: "the lock is held" and "a dev server is listening".

### Decision: the wording tracks the plan's phase

[decided 2026-08-28. Implemented in `src/dev/childVerdict.ts
§parseDetachedChildPhase` and `detachAsync.ts §stillBuildingError`; see also
[[0021-honest-reports]] §Readiness is a claim about now.]

A detached run may not say "the dev server started on `<url>`" while the plan is still compiling.
`building` means say building, and name the step. `serving` means started. The phase is read off the
**child's own log**, the channel already open for its verdict rather than a second
one, and it needs no new output. The log holds the plan table this CLI printed, and:

- the lock is only ever taken by the plan's **dev-server step** (`isDevServerStep`), so a log whose
  dev-server step is `expo run:*` is a log of a step that builds before it serves;
- whether that build has finished is the **install marker of F121 above** — the next thing
  `expo run:*` does. Before it, `building`; after it, `serving`.

`serving` is the answer whenever nothing says otherwise, such as a log with no plan in it or a plan
whose dev-server step is a plain `expo start`. Guessing `building` would put a sentence about a
compiler into the report of a dev server that never had one.

The `--wait-ready` failure of a building plan says what is happening and names the step. It drops two
things that were wrong for it: `npx exagent smoke`, which cannot measure a bundler that has not
started, and the split-stack `lsof` note, which is about two listeners on a port nothing is
listening on yet. It recovers into `npx exagent dev:logs`. The exit code does not change, because the
wait really did give up.

The same fact reaches the report of a run that asked for no readiness. `dev --detach --json` carries
`phase`, and its human line reads `<url> · not listening yet — the plan is still building` in place
of `· detached`. `--wait-ready` is the path the finding was filed against, and a caller reading
`url` alone is misled by exactly the same amount without it.

## A busy port is not a step only a person can complete

Decision [confirmed — friction run 4, 2026-08-24]. When the Expo CLI stops on `Use port 8181
instead?`, `exagent dev` picks a free port itself and runs the step again — unless the caller named
`--port`, and then it is exit `20`.

This was exit `7` with `needsHuman.scenario: "expo-prompt"`, a `suggestedCommand` that re-ran the
identical failing command, and a `How:` line naming the flag the caller had just passed
[observed — F41, friction run 4]. Every part of that is wrong for this one question. No account, no
permission and no click is involved, so nothing about it needs a person.

The carve-out lives in `src/dev/portCollision.ts` and is checked *before* the needs-human
classifier rather than as a negative signature in the registry. The recovery is "pick a port and run
the step again", which is the caller's to perform and cannot be expressed as a registry row.
`expo-prompt` still covers every other question the Expo CLI asks, and its `How:` no longer mentions
ports.

**A named `--port` is a requirement, not a preference.** Moving the dev server somewhere else would
leave every URL and every command the caller had already written pointing at nothing. So that case
fails with `PORT_IN_USE` and exit `20`, the outcome-failed code of llp/0010. It names the pid that
holds the port and recovers into a *different* command: `dev:stop --port <n> --force`, or a free
port. Never the command that just failed. When the process on that port is this project's own dev
server, which the lock says, the message says that instead, because then there is nothing to fix.

One retry per plan. A second collision means the port this CLI picked was taken between the bind
test and the dev server's own bind, and retrying forever on that is a loop nobody asked for.

## Where a build runs

Decision [confirmed — Kudo, 2026-08-24]. Every build this CLI plans, suggests, or waits on says
where it runs. **`local`** is on this machine, with this machine's toolchain. **`eas`** is in the
cloud on EAS, with an Expo account. Two words, one module, no synonyms.

The gap was never in what the CLI *does*. It was that "build" is one word for two things that want
different things of the caller. `exagent dev` plans `expo run:ios`, which needs Xcode and about
fifteen minutes of this machine. `exagent build:wait` attaches to something running in a queue in a
data centre, which needs an account and nothing else. A reader who has one and not the other cannot
tell from the word which advice they were just given. The plan is read *before* anything runs, so a
caller with no Xcode approved a plan, waited, and met the toolchain as a compiler error many minutes
in. The answer is not a new capability, because `eas build` was always there. It is that the plan
has to name which of the two it is, and what that one costs.

**The vocabulary is a module, not a convention** [observed — `src/toolchain/runsOn.ts`]. `RunsOn`,
`LOCAL_WHERE`, `EAS_WHERE`, `EAS_REQUIREMENT`, `localTool`, `localRequirement`, `easBuildCommand`.
Everything that says any of this reads its wording from there: plan steps, the plan table,
`dev --help`, `build:wait --help`, the `impact` report, and five follow-ups. So `local` means one
thing in all of them, and the EAS command is spelled one way. The toolchain name gets two functions
rather than one (`localTool` gives `Xcode`, `localRequirement` gives `Xcode on this machine`) because
a sentence that has already said "this machine" must not say it again. One string written for one
sentence and pasted into three gives "this machine has no the Android SDK on this machine".

**Per step, and `null` where the question does not apply.** `PlanStep.runsOn` is
`'local' | 'eas' | null`. `expo prebuild` and `expo run:*` are `local`. `expo start` and
`expo install` are `null` rather than a third value: a dev server does not run "somewhere", it runs
here and builds nothing, and answering the question anyway would blur the one distinction the key
exists to draw. Prebuild counts as a build step deliberately. It ends in a `pod install` that wants
Xcode's command line tools, and a caller who cannot build here needs to know at step 1, not step 2.

**The probe is the caller's, so the decision table stays pure.** `decideStartPlan` is a function of
*project* state, and "does this machine have Xcode" is a fact about the host, so it is two calls.
The table returns a plan whose `buildLocation` says what a local build would need, with
`status: null` meaning nobody asked. Then `applyToolchainProbe` folds in what the machine answered.
The probe runs only for a plan that contains a build, which is the only case with a question in it.

**Three answers, and `unknown` is one of them** [observed — `src/toolchain/detect.ts`]. iOS is
`xcode-select -p` and then `xcodebuild -version`, and the second is the one that matters: a machine
with only the Command Line Tools answers the first, refuses the second, and cannot build an
app. Android is a *directory* rather than a command (`ANDROID_HOME`, `ANDROID_SDK_ROOT`, then the
installer's default), because Gradle finds the SDK through a path and never through `adb`. This
machine is why that distinction is written down [observed — live, 2026-08-24]: the SDK is at
`~/Library/Android/sdk`, no environment variable names it, and `adb` is not on `PATH`. That machine
can build and cannot run one shell command, so the SDK decides the status and `adb` is reported as a
**caveat**, with the two lines that would fix the shell. A probe that could not run answers
`unknown`, never `missing`. Nothing was established, and routing a caller to the cloud over a
toolchain the probe merely could not reach would be worse than the silence it replaced. The answer is
cached per process, and a probe that throws is caught, because a plan that could not be made because
a probe failed is worse than a plan that says it does not know.

**Android needs a second answer, and it is a command** [F122, added 2026-08-27]. The paragraph above
is right that the *SDK* is a directory, and the SDK is not the whole question.
`gradlew` is a Java program, so a machine with the entire SDK and no JVM cannot
build. The same machine is again the example: the SDK is where the installer put it, and
`expo run:android` died in three seconds on `Unable to locate a Java Runtime` under a plan that had
just printed *"Building on this machine: this machine has the Android SDK"*
[observed — live, `wave29-devclient/evidence/10-dev-detach-android.json`]. macOS is what makes the
file check useless in the one direction that matters. It ships a `/usr/bin/java` shim that exists,
is on `PATH`, and exits 1 saying there is no runtime behind it, so **every** answer available from
the disk says yes on a machine that cannot build. The probe is therefore one spawn:
`$JAVA_HOME/bin/java -version` when `JAVA_HOME` names a `java` that is really there, and
`java -version` otherwise. The three bands are the module's own: a spawn error or a non-zero exit is
`missing`, a killed probe is `unknown`, and only exit 0 is `present`. The SDK question is settled
**first**, so a host with neither is told about the SDK and pays for no subprocess.

Two consequences worth stating, because both are about what the report *says* rather than what it
found. The detail names the SDK it did find before it names the runtime it did not, because "you have
no Android SDK" would send somebody to install one that is on the disk. And `localTool('android')` is
`the Android SDK and a JDK` rather than `the Android SDK`, because the sentences that string goes
into are all of the form "this machine does not have X" (`src/toolchain/selectBackend.ts`,
`src/followups/start.ts`, `src/followups/change.ts`, `warnUnbuildable`), and every one of them was
false of exactly this machine.

**The plan says it, and does not act on it** — **superseded for detection, 2026-08-26**. The
paragraph below describes the first shipped version, where a machine with no toolchain got a local
plan and a warning above it. [[0015-backend-selection-and-config]] takes the step it stopped short
of: the backend is now chosen **while the plan is decided**, so a machine that cannot build gets
`eas build` in the plan's *steps*. The constraint this paragraph was protecting is unchanged, because
no plan's steps ever change between being printed and being run. The selection happens strictly
before the plan exists. Two things are left of the version below. `applyToolchainProbe` still folds a
probe into a plan without touching its steps and carries the probe's caveats. And the
`eas-build-instead` follow-up now fires only for a *local* plan somebody asked for by name, on a
machine that cannot perform it. The `unknown` rule survives intact and is now load-bearing: a probe
that established nothing leaves the build here.

A missing toolchain adds four things: two sentences to the plan's
reasons, a `Not found: … Instead: npx eas build --platform ios --profile development` line above the
`Why` list, one `Log.warn` before the confirmation, and an `eas-build-instead` follow-up at the
*head* of the ladder. The plan's steps are never rewritten. The caller may have an answer this CLI
cannot see, and a plan that quietly swapped its steps for the cloud would stop being the plan that
was approved ([[0008-guardrails]]). `unknown` gets none of that except the sentence, because a
warning about a toolchain that is probably installed is noise on every run after the first.

**The reverse hint.** When this machine *can* build, the `eas-build` follow-up says why the cloud is
still worth choosing: credentials this machine does not hold, and an artifact with a URL somebody
else can install. That is the hint a developer with a working Xcode actually needs, and it is the
one nothing was saying. `impact`'s `needs-native-build` answer names both routes for the same
reason. "You need a native build" is not one instruction, and which route is right depends on what
the caller has and on what they need out of it.

Shipped in `src/toolchain/` (`runsOn.ts`, `detect.ts`, `planLocation.ts`, `types.ts`), with
`buildLocation` on `StartPlan`, on the `cli:start_plan` event and in the `--json` payload. It is
present and `null` for a plan that builds nothing, so a caller reads one key rather than checking for
it.

## Implemented in v1 as

[observed — implementation, 2026-08-22] The engine shipped in `packages/exagent` (`src/project/`, `src/plan/`, `src/status/`, `src/dev/`, `exagent dev [--plan]`) with these deliberate approximations of the table above:

1. **No device probe.** "Go or dev client installed on the device" is unobservable without simctl or adb, so those rows are dropped. `expo start` prompts for Go itself, and `expo run:*` installs what it builds.
2. **No build-cache lookup.** Freshness is the probe fingerprint against `.expo/exagent-last-build.json`, written after a successful `run:*` step. Unrecorded means stale, so v1 over-plans a build at worst and never under-plans. **Closed for `impact`** [added — 2026-08-24]: `eas build:list --fingerprint-hash` is a build-cache lookup, and [[0011-impact-and-freshness]] §The build-cache lookup uses it to turn "you need a native build" into "a finished build already exists for this exact fingerprint". **Closed for `status` too** [added — 2026-08-26]: see §The EAS build lookup, and why it is opt-in, which also records why the answer is cached rather than always fetched. The *plan engine* still does not consult it, and that is the remaining half of this item: `exagent dev` plans a build for a project whose fingerprint EAS already has a build for.
3. The recorded hash is the pre-build probe hash, which is what an unchanged project re-probes to. The record now holds the whole fingerprint rather than the hash alone [added — 2026-08-24], because a hash cannot be diffed and "what changed" is the whole of what `impact` reports. A bare string still reads, as a record whose sources are null. See [[0011-impact-and-freshness]] §The record has to hold the sources, including the measurement behind storing it uncompressed.
4. The `web` rule fires only on an explicit `--web`, because `ProjectState` cannot prove "web-only".
5. Bare-vs-CNG uses "any native dir present". The argv uses the resolved platform.
6. `sdkVersion: null` never forces a rule, and `expoGo.compatible` is the single Go verdict.
7. Config plugins are read from static config only (`app.json`). A dynamic `app.config.js/ts` yields a debug event and a best-effort skip, because resolving it needs an `expo config` subprocess (follow-up). **The subprocess exists now** [added — 2026-08-24]: [[0011-impact-and-freshness]] §A fingerprint change is not "OTA-unsafe" spawns `expo config --json --type public` to resolve the `runtimeVersion` of a project whose config is code, with the static read as its fallback. The *plugins* half of this item is still static-only. What `impact` established is the mechanism and the parse: the Expo CLI writes its own event lines to stdout ahead of the answer, so the last JSON line is the one to read.

## Testing

The decision table is pure logic over probed state, so it is exhaustively unit-tested with no model and no device (tier 0 in [[0002-testing-and-evals]]). Probe and execution paths get e2e coverage against fixtures, via subprocess and JSONL assertions.
