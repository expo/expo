# 0004: Smart start and the project-state engine

**Type:** RFC
**Status:** Active
**Systems:** project-state probe (`src/project/`); plan engine (`src/plan/`); smart `dev` (`src/dev/`); `@expo/agent-cli status` (`src/status/`); dev-server lock (`src/devLock/`); `@expo/fingerprint`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20 · finalized 2026-08-28
**Revised:** 2026-08-30
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0002-testing-and-evals]], [[0008-guardrails]], [[0011-impact-and-freshness]], [[0015-backend-selection-and-config]], [[0021-honest-reports]]

## Summary

One engine answers "what must run to get this app on a device?". Three callers consume
it: the smart `dev` command, the post-install "what must rerun?" answer, and the Expo Go
compatibility check. Agents and users do not decide when to prebuild, rebuild, or just
start Metro.

Per [[0001-agentic-cli-on-expo-cli]] §Constraints, the engine invokes `expo prebuild`,
`expo run:*` and `expo start` as subprocesses and consumes their JSONL events. It does
not import `@expo/cli` internals.

`@expo/agent-cli dev` is the smart engine. `@expo/agent-cli start` is `expo start`.

## Inputs

The project-state probe reads:

- Target. Expo Go, a dev client, or web. Whether the target app is installed is a later
  question; see §Implemented in v1.
- Native state. Bare `ios/` / `android/` dirs versus CNG. An `@expo/fingerprint` hash of
  the native surface.
- Compatibility. The Expo Go check, and the post-install impact class.

## Decision table

| State                                                    | Plan                                                    |
| -------------------------------------------------------- | ------------------------------------------------------- |
| Not an Expo app (no `expo` dependency)                   | nothing. no steps                                       |
| Expo Go compatible, Go installed                         | start Metro, then open in Expo Go                       |
| Dev client installed, fingerprint matches last build     | start Metro, then open the dev client                   |
| Fingerprint changed (new native module or config plugin) | prebuild (CNG), native build, install, start            |
| Build cache hit for the current fingerprint              | download and install the cached build, then start Metro |
| Bare project, native dirs dirty                          | pod install / gradle sync, build, start                 |
| Web                                                      | start Metro for web                                     |

The first row sits above the others and above the web short-circuit. It is the fact that
there is no app. Without it, "no `expo` dependency" reads as "lacks a dev client", and
`dev` plans `expo install expo-dev-client` plus a native build for whatever repository
the caller is standing in.

Every command that would act on the plan stops before the table is reached. The row is
also what the commands that only describe the directory print, so the guard and the
engine cannot disagree.

## Not an Expo app

A directory whose `package.json` declares no `expo` dependency is not an Expo app. No
command may plan work that would change it without that fact being surfaced first.

The guard reads the _declaration_ of `expo` in `package.json`. It does not look in
`node_modules`. A fresh clone with no `node_modules` is still an Expo app.
`ProjectState.sdkVersion` is the installed half and stays what it was. The two fields
answer two different questions, and `status` reports both.

`react-native` present with `expo` absent gets the same answer. v1 has no "bootstrap a
bare React Native app" flow.

| Command                                                 | In a directory that is not an Expo app                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `dev`, `start`, `smoke`, `navigate`, `deploy`, `doctor` | stop with `NOT_EXPO_APP`, exit 1, before planning or spawning                 |
| `agents:setup`, `skills:sync` / `:list` / `:show`       | stop the same way. they read what the installed Expo packages ship            |
| `status`                                                | reports. `project.isExpoApp: false`. a `next` that says so. does not refuse   |
| `typecheck`                                             | unchanged. `checked: false`, "no TypeScript", exit 0                          |
| `install`, `new`                                        | unchanged. these are the two ways out of this state, and they are never gated |
| `dev:stop`, `dev:logs`, `skills:clean`                  | unchanged. they clean up what is here                                         |
| `runtime:*`                                             | unchanged. they need a live dev server, which the rows above deny             |
| `login` / `logout` / `whoami` / `register`              | unchanged. they act on `~/.expo`                                              |

`status` is how a caller finds out it is in the wrong place. Refusing it would take away
the report that diagnoses the refusal.

`doctor` stops. Left alone it exited 0 with `passed: 0, failed: 0`. An agent gating on
`failed === 0` reads that as a clean bill of health for a repository nothing checked.

The stop lives at the command entry, before the probe, before the plan, and before
anything is spawned. The decision table gains a row anyway, above the web short-circuit
and above every native row:

```
not-expo-app → target: none, steps: [], buildLocation: null
```

The engine is consumed by more than `dev`. `status` reads it for the `next` line, and
`resolveAsync` for the backend. `ProjectTarget` gains `none` for it. That is the one
value that is not a way of running the app.

Exit 1, the same band as `NO_PROJECT`. Nothing ran here. The recovery that mutates
nothing is the `Try:` line:

```
Try: npx @expo/agent-cli new my-app
```

`cd` is not a command this CLI can name. `npx @expo/agent-cli install expo` writes into
a repository the caller most likely only walked past, so it stays in the `How:` prose.

Pinned in `e2e/__tests__/project-shapes-test.ts`. The last row of that file is an app
whose dependencies are not installed being planned for normally. A guard that read
`node_modules` would refuse every freshly cloned Expo app.

## Plan contract

Emit the plan first as a structured event (steps, reasons, and time-class estimates),
then execute, streaming JSONL progress. `--plan` stops after emitting, so a driving
agent can present it for approval ([[0008-guardrails]]).

An interactive terminal facing a plan with build-class steps stops before those steps
and prints the command that runs them with `--yes`. Non-interactive runs proceed.
Consent is a re-run. See [[0008-guardrails]] §Consent is a re-run, never a prompt.

### A step's reason describes the step

A step's `reason` describes the step, not the goal. `expo start --go` serves a bundle
and waits. It does not open the project in Expo Go. The reason used to say otherwise,
which is the worst place for a wrong sentence, because it is what a driving agent reads
before it acts.

Two rules keep the plan honest about itself (`src/plan/decide.ts`):

- A typed platform flag goes in the printed argv. The plan engine takes
  `requestedPlatform`, the flag the caller typed, separately from `platform`, which is
  always resolved and never appears on a command line. Only the typed one goes in the
  argv. `@expo/agent-cli dev --ios` has always forwarded `--ios` to `expo start`. The
  plan used to print `expo start --go` regardless.
- The reason distinguishes the two forms. With a flag, `expo start --go --ios` really
  does open the app. It uses a booted simulator or boots one, installs Expo Go if it is
  missing, and sends the `exp://` URL. Without a flag, the reason says so and names
  `@expo/agent-cli navigate /`.

The plan's `reasons` list says the same thing the step's `reason` does. It is built per
rule rather than once before the branches, because the honest sentence depends on the
plan: whether anyone named the platform, and whether the plan acts on it.

### Opening the app is `navigate`

`navigate` resolves the deep link and runs `simctl openurl`. Follow-ups name
`@expo/agent-cli navigate /` first. A wait that only re-suggests the same wait cannot
change the answer.

## Sub-features

Expo Go compatibility check. Answer "can this run in Expo Go?" with reasons. Compare
dependencies against `packages/expo/bundledNativeModules.json`, detect config plugins
and custom native code, and check SDK support.

Post-install impact. After `npx expo install {pkg}`, JS-only means keep the dev server
and maybe reload. A new config plugin or native module under CNG means prebuild plus a
new dev build. Bare native dirs mean pod install or gradle sync. The classifier lives in
`src/project/impact.ts`. The change classifier (what a working-tree diff costs) is
[[0011-impact-and-freshness]].

## Status

`@expo/agent-cli status` is a `git status`-like overview: one fast, read-only command
that answers "where is this project right now, and what would happen next".
Human-readable sections by default. `--json` for the machine shape, with raw
`ProjectState` under a `probe` key. Exit 0 always, because status is information rather
than judgment. Argument errors still exit 1. No subprocess heavier than the fingerprint
CLI and a dev-server probe on a short timeout.

Sections:

- Project. Name or slug, SDK version, CNG versus bare, dev-client and web deps.
  `isExpoApp`.
- Expo Go. Compatible or not, with a reason count. The reasons themselves live in the
  `probe` key of `--json`.
- Freshness and impact. The current fingerprint against
  `.expo/agent-cli-last-build.json` per platform, giving `fresh`, `stale` or `unknown`.
  The impact class of everything that changed since that build sits on its own `impact`
  line (`js-only`, `dev-client-compatible`, or `needs-native-build`). See
  [[0011-impact-and-freshness]].
- EAS build. Whether EAS already has a finished build made from this exact fingerprint,
  per platform, as `found`, `none` or `unknown`. The cached answer is read always. The
  network call happens only under `--explain`. See [[0011-impact-and-freshness]] for the
  lookup, the cache key, and why a miss is never written.
- Dev server. Running or not, and how many CDP targets are connected. The discovery
  order is §Discovery ladder. `hostType` and `tunnelUrl` ride along in `--json`. Only a
  tunnel is worth a word in the text, because `127.0.0.1:8081` already says "this
  machine".
- Skills. Whether the agent selection is cached, and how the linked skill count compares
  to the discovered count. Hidden from the text report when no agent is selected and
  nothing was discovered. The section stays in `--json` and in the `cli:status` event.
  It returns to the text the moment either half has something to say, including when the
  section could not be read at all.
- Device. A booted simulator or an attached device, reported as `present`, `absent`, or
  `unknown`. `unknown` is never rounded down to "none".
- Next. The smart-start rule that would fire, as one line. The exception is a dev server
  this project can use already answering: then the line is `@expo/agent-cli smoke`. A
  dev server with no app attached and no local device to open one on names the
  `exp://<host>` link, or `@expo/agent-cli navigate / --print-url` when no link can be
  named. Deliberately not `runtime:errors`: the `runtime-errors` follow-up already names
  it, and `next` must not repeat a follow-up.

`--assert` and the OTA verdict live on this command as well. Their contracts belong to
[[0011-impact-and-freshness]].

## Discovery ladder

Five steps, in order, in `discoverDevServerAsync` (`src/runtime/devServer.ts`). Every
step probes. None trusts. The step is reported as `source`.

| #   | Step                                           | Reports   | Proves                                                              |
| --- | ---------------------------------------------- | --------- | ------------------------------------------------------------------- |
| 0   | An explicit `--dev-server-url` or `--port`     | `flag`    | the caller named it. nothing else is tried                          |
| 1   | The project's dev-server lock                  | `lock`    | an `@expo/agent-cli`-started wrapper is alive, and its URL answered |
| 2   | The port `.expo/dev/logs/start.log` last named | `log`     | this project started a server there once, and it answered now       |
| 3   | 8081                                           | `default` | Metro's default answered                                            |
| 4   | 8082-8085, in parallel                         | `scan`    | a Metro answered. not that it is this project's                     |

Nothing may be skipped on the strength of a fast path. An `expo start` a developer ran
by hand holds no lock. A project whose `.expo` was cleaned names no port. The scan is
what finds those. `default` is also the reported source when nothing answered anywhere,
because the caller still needs a URL to name in its error.

Timers must be cleared. A probe that raced `setTimeout` and left the timer running
printed a complete report in ~260 ms and then sat until the budget drained, about 1.3 s
after the print. `status` exits 0 by setting `process.exitCode` and letting the loop
drain, so the leak was paid at exit. A command that refuses goes through `process.exit`
and hid the same leak. The timer is now cleared on the way out and `unref`ed while it
runs, and the timeout aborts the request it abandoned.

An explicit URL still gets no timeout of its own. A server on another host or behind a
tunnel may legitimately be slow. The caller's `signal` is the only thing that stops it,
which is why `status` passes one.

Every caller of `discoverDevServerAsync` inherits this: `status`, `navigate`,
`preflight` and through it every `runtime:*` action, `smoke`. `dev:stop` reads the lock
directly and never enters the ladder.

## Dev-server lock

The lock lives in `@expo/agent-cli`, in `src/devLock/`. `runDevServerAsync` takes it, so
both `@expo/agent-cli start` and the final step of an `@expo/agent-cli dev` plan hold
it.

It is a listening socket. A file records a fact about a process, and that record
outlives the process. A listening socket exists only while its owner does. A reader that
got an answer got it from a process that was alive when it answered.

Address. A pure function of the project root.
`projectRoot/.expo/agent-cli-dev-server.sock` on posix.
`\\.\pipe\agent-cli-dev-server-<sha1(realpath(projectRoot))[0:16]>` on Windows, where a
pipe is not a project file. Symlinks are resolved and the digest is lowercased, so one
directory is one address. A posix project buried deeper than the kernel's ~104-byte cap
on `sun_path` gets the same digest scheme under the temporary directory. Both sides make
that choice from the path length alone.

Protocol. The server writes one JSON line (`url`, `port`, `pid`, `startedAt`,
`projectRoot`) on connection and ends it. A reader connects with a ~250 ms timeout and
reads to the close. A refused connection or a timeout is "no dev server".

Acquisition. `EADDRINUSE` on posix means either a live owner or an orphaned socket file.
Only a connection tells them apart. An answer means another `@expo/agent-cli` owns the
project's dev server. Silence means the file is an orphan, which is unlinked before
listening again. On Windows a pipe dies with its process, so `EADDRINUSE` is a live
owner by definition.

Release. On the wrapper's `finally` and on process exit, with a best-effort unlink. A
leftover socket file answers nothing. The next acquisition removes it.

Never load-bearing. An address that cannot be taken produces one warning and a
`cli:dev_lock_skipped` event, never a failure. The port published is the one the dev
server itself reported in `start.log` after the spawn timestamp, falling back to
`--port` and then 8081.

Still probed. The lock proves the wrapper is alive. Only an HTTP probe of the URL proves
the dev server behind it is. Discovery uses the lock to stop guessing which port.

Two accepted limits. A dev server started by `expo start` directly holds no lock, so the
port in `start.log` plus the scan is still the answer. A posix project path long enough
to push the socket past the kernel's cap moves it out of `.expo`.

## Daemonization

`@expo/agent-cli dev --detach [--wait-ready]` starts the dev server in a process of its
own and gives the terminal back. `@expo/agent-cli dev:logs` reads what it printed.

`--detach` spawns this CLI, not `expo start`:
`spawn(process.execPath, [bin, 'dev', ...argv], { detached: true, stdio: ['ignore', logFd, logFd] })`
then `unref()`. The wrapper is what takes the lock. A detached server that published no
lock would be a process nothing could find, wait on, or stop. The lock names its port
and pid. `dev:stop` signals that pid. The detached wrapper forwards `SIGTERM` to its
`expo` child exactly as the foreground one does.

Three flags are stripped from the child's command line. `--detach` would detach a
detached run forever. `--wait-ready` names a wait the parent performs. `--json` would
print an object nobody reads and switch the plan's subprocess output to `capture`, which
is the output the log file exists to hold. `buildDetachSpawn` is a pure function over
argv for that reason.

The parent waits for the lock, not for the child. A detached start is finished when the
lock answers. Under `--wait-ready` it then holds one `/status` request open, so `ready`
is `true` or the wait failed. Without the flag `ready` is `null`.

One detached dev server per project. The lock is read before anything is spawned. A
project that already has one gets the running server reported back with
`alreadyRunning: true` and exit 0. Two foreground servers in two terminals are a thing
people do on purpose. A second detached one is a process nobody could find.

The log is one file per project, truncated per run: `.expo/dev/logs/dev-detached.log`. A
name carrying the port could not be resolved by `dev:logs` before the port was known. A
file that accumulated across runs would answer with last week's output.

`dev:logs` has no `--follow`. A tail that never returns is the thing `--detach` exists
to avoid. It polls instead. Each read is the last 100 lines by default, ANSI stripped,
fenced as untrusted per [[0008-guardrails]]. A dev server started attached has no log at
all, and the command says that.

A detached run may not say "the dev server started on `<url>`" while the plan is still
compiling. The phase is read off the child's own log. `building` names the step.
`serving` means started. The lock is only ever taken by the plan's dev-server step, so a
log whose dev-server step is `expo run:*` is a log of a step that builds before it
serves. Whether that build has finished is the install marker below. `serving` is the
answer whenever nothing says otherwise, such as a plan whose dev-server step is a plain
`expo start`.

A `--wait-ready` failure of a building plan recovers into
`npx @expo/agent-cli dev:logs`. The exit code stays 1, because the wait really did give
up. `dev --detach --json` carries `phase`. See [[0021-honest-reports]] for the window
after a `--wait-ready` claim when the step also opens the app.

A build is recorded when the app reaches the device, whatever the launch then does
(`src/dev/buildEvidence.ts`). The install line is what is read (`› Installing …` from
`@expo/cli`). A step that failed still has its output read. Two cases are not recorded:
a build that died before the install, and anything in `inherit` output mode, where
nothing is captured.

Exit codes. `dev --detach` exits 0 when a dev server is up, whether it started one or
found one. Exit 1 when the child never published a lock, and 1 when `--wait-ready` gave
up. In that last case the server is still running, which the message says, unless the
plan is still compiling. `dev:logs` exits 0 for a log and 1 (`NO_DEV_LOG`) when the
project has none.

## A busy port

When the Expo CLI stops on `Use port 8181 instead?`, `@expo/agent-cli dev` picks a free
port itself and runs the step again. Unless the caller named `--port`. Then it is
`PORT_IN_USE`, exit 20.

This is not a needs-human. No account, no permission, and no click is involved. The
carve-out lives in `src/dev/portCollision.ts` and is checked before the needs-human
classifier. `expo-prompt` still covers every other question the Expo CLI asks.

A named `--port` is a requirement. Moving the server would leave every URL the caller
had already written pointing at nothing. The message names the pid that holds the port
and recovers into a different command: `dev:stop --port <n> --force`, or a free port.
When the process on that port is this project's own dev server, which the lock says, the
message says that instead.

One retry per plan. A second collision means the port this CLI picked was taken between
the bind test and the dev server's own bind.

## Where a build runs

Every build this CLI plans, suggests, or waits on says where it runs. `local` is on this
machine. `eas` is in the cloud on EAS. The probe, the vocabulary, and the selection of
steps from those two facts all live in [[0015-backend-selection-and-config]]. Selection
happens while the plan is decided, so a machine that cannot build gets `eas build` in
the plan's steps. The steps never change between being printed and being run.

## Implemented in v1

The engine shipped in `src/project/`, `src/plan/`, `src/status/`, `src/dev/`, as
`@expo/agent-cli dev [--plan]`, with these approximations of the table above.

1. No device probe in the plan. "Go or dev client installed on the device" is
   unobservable without simctl or adb, so those rows are dropped. `expo start` prompts
   for Go itself. `expo run:*` installs what it builds.
2. The plan engine still does not consult the EAS build cache. Freshness is the probe
   fingerprint against `.expo/agent-cli-last-build.json`, written when the app reaches
   the device. Unrecorded means stale, so v1 over-plans a build at worst. `status` and
   the change classifier do consult the cache ([[0011-impact-and-freshness]]). `dev`
   still plans a build for a project whose fingerprint EAS already has a build for.
3. The `web` rule fires only on an explicit `--web`, because `ProjectState` cannot prove
   "web-only".
4. Config plugins are read from static config only (`app.json`). A dynamic
   `app.config.js/ts` yields a debug event and a best-effort skip.
   [[0011-impact-and-freshness]] spawns `expo config --json --type public` to resolve
   `runtimeVersion`. The plugins half of this item is still static-only. The recorded
   hash is the pre-build probe hash. Bare-versus-CNG uses "any native dir present".
   `sdkVersion: null` never forces a rule. `expoGo.compatible` is the single Go verdict.

## Testing

The decision table is pure logic over probed state, so it is exhaustively unit-tested
with no model and no device (tier 0 in [[0002-testing-and-evals]]). Probe and execution
paths get e2e coverage against fixtures, via subprocess and JSONL assertions. The
not-an-Expo-app grid is `e2e/__tests__/project-shapes-test.ts`.
