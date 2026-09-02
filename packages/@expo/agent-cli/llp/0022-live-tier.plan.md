# 0022: The live tier

**Type:** Plan
**Status:** Active
**Systems:** the live tier (`e2e-live/`); the jest projects (`jest.config.js`, `e2e/jest.config.js`); `package.json` scripts
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-27 · finalized 2026-08-28
**Revised:** 2026-08-30
**Related:** [[0002-testing-and-evals]], [[0005-runtime-loop-tools]], [[0016-v1-scope]], [[0021-honest-reports]]

## Summary

Six suites: `live-project`, `live-local`, `live-android`, `live-devclient`, `live-eas`,
`live-cloud`.

[[0002-testing-and-evals]] already states the rule this document makes executable: a
flag is not shipped until it has run against the published binary. It states it as a
manual step. A manual step that costs an hour is a step that gets skipped and then
quoted as if it had not been.

So the rule gets a tier. `e2e-live/` runs the published surface against real backends,
repeatably, in a minute per suite. The question it answers for every row of the v1
surface is not "does a test exist". It is "has this ever run for real, and where is the
evidence".

## Why the live tier exists

Both limits are already in [[0002-testing-and-evals]]. Together they are the hole.

A stub answers whatever it was written to answer. A stub `fingerprint` accepts
`--preset` because the fixture accepts it, so the e2e tier proves the shape of an
invocation and never its availability. The two look identical in a passing test. The
incident that named the rule was a flag that existed in this monorepo and not in the
version every real project resolves.

The stub dev server carries no inspector. [[0002-testing-and-evals]] §Tier 0 doubles the
dev server, not the app: no CDP target, so nothing downstream of a debugger connection
is reachable. That makes every successful `runtime:eval`, `runtime:tap`, `runtime:type`
and `--verify` diff untestable at tier 0 by construction.

## A backend is a second process boundary

A test that only pins the plan does not cover spawning that binary. "Argv assembly or
filesystem work with no second process boundary" is a claim about the shape of the call.
Reading what came back is a different claim, and it is only testable against the real
tool.

That is why `live-project` exists as its own suite, and why a green unit test of
`decideStartPlan` does not fill a live cell for `dev`.

## A jest project of its own

`e2e-live/jest.config.js` is a fourth jest project beside the unit config and `e2e/`. It
is reachable only through `test:live`, `test:live:local`, `test:live:android`,
`test:live:devclient`, `test:live:eas` and `test:live:cloud`. No `test`, no `test:e2e`,
no CI workflow names it. Every suite spends a real simulator, a real account, or a real
deployment. A tier that can bill money must be asked for by name.

`maxWorkers: 1`. Two suites cannot share one simulator, one dev-server port range, or
one cloud session. A live tier that raced itself would report the race as the CLI's
fault. `live-android` drives the same iOS simulator `live-local` does for its
mixed-platform block, and it terminates the app on it when that block ends.

`typecheck` gained a third `tsc` invocation, so the suites are type-checked with
everything else.

## A suite that cannot run refuses

A missing prerequisite skips, and prints a sentence saying what to install or boot. A
laptop with no simulator reporting a red suite would train everyone to ignore the whole
tier.

A prerequisite that is present and wrong throws. The case is `EXPO_STAGING` being unset
while an EAS suite is about to write. `assertStaging` is called at every EAS call site
rather than once in a `beforeAll`, because "one call site forgot" is the failure mode it
exists for.

Every gate is synchronous. Jest decides which suites exist while the module body runs,
so `describe.skip` needs its answer before any `beforeAll` could have awaited one. Each
gate is a `statSync` or one short `execFileSync`, and each returns a sentence rather
than a boolean.

## What a live assertion may be

Invariants, never timings.

Allowed: an exit code. The shape of a `--json` contract. A file that exists and is not
empty. A URL that serves the bytes this export produced. A log line that appeared within
a generous bound.

Not allowed: how long anything took. `waitForAsync` is the only timing primitive in the
harness and it takes a bound, not an expectation. A bound that expires is a real
failure. A bound met in a different number of milliseconds on a laptop compiling
something else is not a finding about the CLI.

An assertion that holds on half the runs is worse than no assertion. It makes the suite
a coin toss and teaches everyone to re-run it.

## Cleanup, cost, evidence

Cleanups register before the thing that needs them, and run newest-first in `afterAll`
whatever happened. Each one's failure is printed and the rest still run. The cleanup
that deletes the directory the other cleanups run in has to be registered first so that
it runs last.

Every suite prints a cost line: wall time, `@expo/agent-cli` runs, scaffolds, deploys,
cloud sessions, and where the evidence went. The audience is somebody deciding whether
to run this tier.

Evidence is kept per run, per invocation, gitignored. A stub failure is reproducible
from the test file. A live failure is a fact about a moment, so the moment is written
down. A failing assertion names its artifact rather than quoting kilobytes of a
bundler's opinion into a jest message.

The scratch directory must be outside every git checkout for any suite that might call
`eas deploy` or `eas build`. Those commands upload by walking up to the nearest git
root. A scratch project inside this monorepo uploads the monorepo. The trap is silent,
because the upload succeeds.

## The six suites

### live-project

The commands whose backend is the project: `install`, `agents:setup`, `skills:sync` /
`:list` / `:show` / `:clean`, `inspect:config-plugins`, `start`, and the forwarded
`expo` set. One project scaffolded by `@expo/agent-cli new`. No device.

Its gate is whether `registry.npmjs.org` answers. Deliberately not `networkGate()`,
which asks whether `staging.expo.dev` answers: that is a fact about an EAS account, and
this suite makes no EAS call. Folding these rows into `live-local` would gate them on a
booted iOS simulator they do not use. This is the first suite whose gate a Linux box can
pass.

What it proves: the real `expo` CLI's reports, a real `expo install` rewriting
`app.json` for a config plugin, and real autolinking over a real dependency graph. No
published module ships a `SKILL.md` today, so the suite asserts the empty result first
and then writes one into its own scratch `node_modules`.

### live-local

The v1 local loop on a booted iOS simulator running Expo Go. One project scaffolded by
`@expo/agent-cli new` into a scratch directory. About 60 s, free.

What it proves: the generated-types gate (a brand-new project fails `typecheck` until
the first `expo start` writes `expo-env.d.ts`). A successful `runtime:eval`. A
`runtime:tap --verify` text diff that includes interpolated text. `runtime:errors` with
`runtimeReadable: true`. The break-and-fix cycle: a syntax error in a screen, six gates
refusing at 20 with the file named, the error undone, the same commands green with no
restart.

The break is a syntax error, never a dead statement. `@expo/agent-cli new` scaffolds
`experiments.reactCompiler: true`, and the React Compiler deletes unreachable statements
out of a render body.

### live-android

The same loop on a real Android emulator running the real Expo Go APK. It is not
`live-local` with a different device. Expo Go for Android ships a Hermes built without
the Chrome DevTools Protocol debugger ([[0005-runtime-loop-tools]]). Five of the seven
runtime commands cannot answer there. What this suite asserts is what they do instead.

What it proves: the refusal from real Hermes (exit 1 for the four reading commands, 0
for `runtime:errors` without a gate flag, 20 when the log fallback caught something, 22
when there was no log). A reload verified with no debugger anywhere in it, via the
`/message` socket. Two platforms on one dev server, which is the block that is
conditional on a booted iOS simulator being there as well. `smoke --android` exits 22 on
a working Expo Go app: the `runtime` phase cannot measure, and a gate that cannot
measure must not pass.

Its gate boots. A listed AVD passes, `beforeAll` boots it with `-ports 5554,5555`, and
cleanup kills it only if this suite started it. A machine whose AVD boots without Expo
Go on it fails rather than skipping. By then the boot has been spent.

The break is platform-resolved: a broken `platform-note.android.ts` beside an `.ios.ts`
that parses.

### live-devclient

The v1 runtime loop against a real development build on the emulator `live-android`
uses. Same emulator, same dev server, same project, one minute apart.
`runtime:eval "1+1" --android` is exit 1 `RUNTIME_EVALUATE_UNSUPPORTED` in Expo Go and
exit 0 with `value: 2` in a development build. `smoke --android` is 22 on a working app
in Expo Go and 0 with all eight phases `ok` in a development build. The refusal is
reached by asking the runtime rather than by knowing the platform.

It does not scaffold. A development build costs about fifteen minutes of Gradle or
Xcode, and a suite must be runnable in a minute. `AGENT_CLI_LIVE_DEVCLIENT_PROJECT`
names a project somebody has already built. The gate is two facts: the project's
`android.package` is installed on the attached device, and
`.expo/agent-cli-last-build.json` records an android build. The second half is required
because `@expo/agent-cli dev` plans a build for a platform with no recorded fingerprint.

It uses the project in place. This suite makes no EAS call, so the scratch-outside-git
rule does not apply. It `dev:stop`s before it starts, because one detached dev server
per project is the rule and this is the first suite whose project may already have one.

iOS is measured by hand, and is deliberately not in the suite. Every way this CLI opens
an app on a local iOS simulator is `xcrun simctl openurl`, and on iOS 26.5 that raises
`Open in "<app>"?` for a development build's scheme, on every call. A suite that needed
somebody to tap Open would be a suite that never runs. Those rows are `by hand` in the
matrix.

### live-eas

Against staging and nothing else. About 50 s.

Reads, repeated freely: `whoami` (and that its `sessionFile` is the staging one),
`status` agreeing with `whoami` about who is signed in, `status --explain` against the
real builds of a real project, `status --explain --build` echoing the id it was given,
and `inspect:build-log` on a log EAS actually served.

One write, idempotent: `deploy --web` of a five-dependency fixture. EAS Hosting gives
each deploy its own preview URL, so a re-run adds a deployment and changes nothing that
existed. The HTML is fetched, its title checked, the entry bundle it points at fetched,
and the fixture's marker string found in it.

No native build. No v1 command creates one, so there is nothing here to test and no EAS
build worker for this suite to spend.

`inspect:build-log` is tested as a pair. First the log as EAS serves it: brotli, so
binary, so exit 22. Then the same log decoded: exit 0 with the failing phase located.

The read side reads a copy. The original is somebody's working tree.

### live-cloud

A real EAS Simulator session. Gated twice: on prerequisites, like every suite, and on
`AGENT_CLI_LIVE_CLOUD=1`, because its prerequisites can all hold on a machine whose
owner did not mean to start a billing session from a test run.

A tunnel is not how the dev server gets a public origin on this machine.
`expo start --tunnel` fails here (`Tunnel URL not found`, then a TypeError out of
ngrok). What works is a proxy origin: a public name for the port and
`EXPO_PACKAGER_PROXY_URL` so the dev server advertises it. The suite checks the origin
took (`navigate / --print-url` must report `hostType: "tunnel"`) before it starts
anything that bills.

A cloud reload is a relaunch, proved on the dev server. The suite asserts the ladder
rather than the state of one session: rung 1 is always taken and always reports what the
socket held, and the relaunch is what reloads a cloud session from either state.

What the suite still may not assert: `attached` as a requirement. `navigate --cloud`
asserts the link was opened. There is no `runtime:eval --cloud` test, because the flag
does not exist.

Cleanup ends the expensive thing first. The session is stopped unconditionally, with
`--id` so that only this run's is touched.

## Coverage matrix

Cell vocabulary:

- `filled`. Asserted by a run somebody has seen green.
- `runnable`. The test exists and nobody has run it. Not evidence.
- `open`. This tier could test it and does not yet. The reason is in the cell.
- `n/a`. The command has no such backend, so the column is not a gap.
- `unreachable`. The tier cannot cross the boundary, with the reason in the cell. These
  are the rows that matter most, because they are the ones a "fully tested" claim would
  be quietly wrong about.
- `by hand`. Measured live once, by a person, and no suite asserts it. Weaker than
  `filled`.

This table is abbreviated. The source of truth is the tests under `e2e-live/`.

| Command                         | project                                   | local                                    | android                                   | eas                                       | cloud                                | devclient                         |
| ------------------------------- | ----------------------------------------- | ---------------------------------------- | ----------------------------------------- | ----------------------------------------- | ------------------------------------ | --------------------------------- |
| `login` / `logout` / `register` | unreachable (mutates the machine session) | unreachable                              | unreachable                               | unreachable                               | n/a                                  | unreachable                       |
| `inspect:build-log <build-id>`  | n/a                                       | n/a                                      | n/a                                       | unreachable (eas-cli has no `build:logs`) | n/a                                  | n/a                               |
| native EAS build creation       | n/a                                       | n/a                                      | n/a                                       | unreachable in v1                         | n/a                                  | n/a                               |
| `deploy --native`               | n/a                                       | n/a                                      | n/a                                       | open (bills a worker)                     | n/a                                  | n/a                               |
| `dev --tunnel`                  | n/a                                       | unreachable (`@expo/ngrok` exits 1 here) | n/a (emulator uses `adb reverse`)         | n/a                                       | n/a (uses a proxy origin)            | n/a                               |
| `runtime:eval`                  | n/a                                       | filled (returns `2`)                     | filled (exit 1, no debugger)              | n/a                                       | unreachable (no `--cloud` on `eval`) | filled (exit 0, `value: 2`)       |
| `runtime:tap --verify`          | n/a                                       | filled                                   | unreachable (no debugger)                 | n/a                                       | unreachable                          | filled                            |
| `smoke` (pass)                  | n/a                                       | filled (8 phases)                        | unreachable (22 on a working Expo Go app) | n/a                                       | n/a                                  | filled (0, all eight phases `ok`) |
| `smoke --cloud`                 | n/a                                       | n/a                                      | n/a                                       | n/a                                       | filled                               | n/a                               |
| `navigate --cloud`              | n/a                                       | n/a                                      | n/a                                       | n/a                                       | filled                               | n/a                               |
| `runtime:stop --cloud`          | n/a                                       | n/a                                      | n/a                                       | n/a                                       | runnable                             | n/a                               |
| `navigate --print-url`          | n/a                                       | open                                     | open                                      | n/a                                       | runnable                             | open                              |
| iOS development build           | n/a                                       | n/a                                      | n/a                                       | n/a                                       | n/a                                  | by hand                           |

`live-android` is Expo Go. `live-devclient` is the app that has a debugger. Every
`unreachable` (no debugger) cell in the android column has a `filled` cell in the
devclient column. That is why both suites are worth keeping.

A row is filled by the tier that could have falsified it. A stub run fills "this argv is
assembled correctly" and no other. A live run fills "this command does its job against
the thing it is for". The two are different claims about the same command.

## Limits

- `live-cloud` has not been seen 7/7. The last runs took it to 6/7 and corrected the
  last assertion against that run's own artifact. The corrected suite has not been run.
  The next run of `test:live:cloud` is what closes it, and it is one session.
- These suites run the ncc bundle from this working tree. [[0002-testing-and-evals]] §A
  flag is not shipped still asks for one `npx <package>@latest` run in a project outside
  this repository before shipping. This tier narrows what that run has to discover. It
  does not replace it.
- A physical device, Windows, and a development build on iOS inside a suite. The iOS
  case is blocked by a confirmation dialog nothing here can answer.
- Build creation. Impossible in v1, so it is unreachable here rather than untested here.
- A skip is not a pass. `test:live` printing `2 skipped, 1 passed` means a third of this
  tier ran.
- The Android mixed-platform block is conditional, so a green `live-android` may be 21
  tests or 24. The suite prints which of the two runs it is doing, in `beforeAll`.
