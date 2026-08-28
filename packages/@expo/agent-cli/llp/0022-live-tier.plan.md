# 0022: The Live Tier — Making "Tested" Mean "Ran For Real"

**Type:** Plan
**Status:** Open — five of the six suites have run green; `live-cloud` has not been seen 7/7 (§What this does not close)
**Systems:** the live tier (`e2e-live/`); the jest projects (`jest.config.js`, `e2e/jest.config.js`); `package.json` scripts; the coverage matrix of [[0019-backend-parity-audit]]
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-27 · finalized 2026-08-28
**Related:** [[0002-testing-and-evals]], [[0019-backend-parity-audit]], [[0016-v1-scope]], [[0005-runtime-loop-tools]], [[0015-backend-selection-and-config]], [[0021-honest-reports]]

## Summary

**Six suites** — `live-project`, `live-local`, `live-android`, `live-devclient`, `live-eas`,
`live-cloud`. Counts in the prose below that name fewer are about the suites they name.

[[0002-testing-and-evals]] already states the rule this document makes executable: **a flag is not
shipped until it has run against the published binary.** It states it as a *manual* step, and a manual
step that costs an hour is a step that gets skipped and then quoted as if it had not been.

So the rule gets a tier. `e2e-live/` runs the published surface against real backends, repeatably, in
a minute per suite. The question it answers for every row of the v1 surface is not "does a test
exist" but **"has this ever run for real, and where is the evidence".**

It found two bugs on the way in, which is the usual rate for a new tier and the argument for having
built it. Neither is reachable from any tier below, which is the sharper argument. §The findings this
tier arrived with has both: **F93**, `status --explain` reporting bun's install progress as EAS's
answer about the caller's builds, on 3 of 6 runs; and **F94**, every uncaught exception exiting with a
raw Node stack and the code 7, which the protocol reserves for needs-human.

It has kept doing that as it has grown. The fourth suite, `live-android`, added one
platform to a tier that already had one and found **six defects and one open gap**. Three of the six were
commands reading the iOS app while reporting about Android. §live-android, and
[[0005-runtime-loop-tools]] §The second Android round for what each was.

The sixth, `live-project`, found **five**, F130 to F134, in the commands
[[0019-backend-parity-audit]] had written off as *"argv assembly or filesystem work with no second
process boundary"*. §live-project has the measurements. The lesson generalises the one above. A
"no second boundary" claim is about the *shape* of the call, and every one of those five defects is in
**reading what came back**.

## Why the two tiers below it cannot do this

Both limits are already written down; this section only puts them side by side, because together they
are the shape of the hole.

1. **A stub answers whatever it was written to answer.** [[0002-testing-and-evals]] §A flag is not
   shipped: a stub `fingerprint` accepts `--preset` because the fixture accepts it, so the e2e tier
   proves the *shape* of an invocation and never its *availability*, and the two look identical in a
   passing test. The incident that named the rule was a flag that existed in this monorepo and not in
   the version every real project resolves, and every unit and e2e test passed.
2. **The stub dev server carries no inspector.** [[0002-testing-and-evals]] §Tier 0 doubles the dev
   server, not the app: no CDP target, so nothing downstream of a debugger connection is reachable.
   That makes every *successful* `runtime:eval`, `runtime:tap`, `runtime:type` and `--verify` diff
   untestable at tier 0 by construction. [[0019-backend-parity-audit]] records "a successful
   `runtime:eval` is unreachable at tier 0" as an open row for exactly this reason.

And there is the row [[0019-backend-parity-audit]] left open in as many words: **"no live `eas build`,
`eas deploy` or simulator session runs anywhere in this suite"**. It names §A flag is not shipped as
the rule that covers the gap, and notes that it is a manual step. This is that row.

## A jest project of its own, run by nothing else

`e2e-live/jest.config.js` is a fourth jest project beside the unit config and `e2e/`. It is reachable
only through `test:live`, `test:live:local`, `test:live:android`, `test:live:devclient`,
`test:live:eas` and `test:live:cloud`. No `test`, no
`test:e2e`, no CI workflow names it, and none should: every suite spends a real simulator, a real
account or a real deployment, and a tier that can bill money must be asked for by name.

`maxWorkers: 1`. Two suites cannot share one simulator, one dev-server port range or one cloud
session, and a live tier that raced itself would report the race as the CLI's fault. This tier made
that mistake once already, in the other direction. §The finding this tier arrived with.
`live-android` makes the constraint sharper rather than looser: it drives the *same* iOS simulator
`live-local` does, for its mixed-platform block, and it terminates the app on it when that block ends.

`typecheck` gained a third `tsc` invocation, so the suites are type-checked with everything else.

## A suite that cannot run refuses, and says what is missing

Two directions, and the asymmetry is the design:

- **A missing prerequisite skips**, and prints a sentence saying what to install or boot. This tier
  runs on the machine of whoever has the prerequisites, and a laptop with no simulator reporting a red
  suite would train everyone to ignore the whole tier.
- **A prerequisite that is present and wrong throws.** The case is `EXPO_STAGING` being unset while an
  EAS suite is about to write. `assertStaging` is called at **every** EAS call site rather than once in
  a `beforeAll`, because "one call site forgot" is the entire failure mode it exists for, and no gate
  at the top of a file prevents a spawn further down.

Every gate is synchronous, which is a constraint rather than a style. Jest decides which suites exist
while the module body runs, so `describe.skip` needs its answer before any `beforeAll` could have
awaited one. Each gate is therefore a `statSync` or one short `execFileSync`, and each returns a
sentence rather than a boolean, because a skipped live suite whose reason is `false` tells a reader
nothing.

## What a live assertion is allowed to be

Here is the rule, and it is the difference between a tier people trust and one they re-run until it
goes green: **invariants, never timings.**

Allowed: an exit code; the shape of a `--json` contract; a file that exists and is not empty; a URL
that serves the bytes this export produced; a log line that appeared within a *generous* bound.

Not allowed: how long anything took. `waitForAsync` is the only timing primitive in the harness and
it takes a **bound**, not an expectation. A bound that expires is a real failure. A bound met in a
different number of milliseconds on a laptop compiling something else is not a finding about the CLI,
and an assertion that says otherwise is a false positive generator.

The corollary is the part that takes discipline. An assertion that holds on half the runs is **worse
than no assertion**. It makes the suite a coin toss and teaches everyone to re-run it. When F93 made
"at least one platform reached an answer" a 50/50 claim, the claim moved out of that test into a
retrying test that says what is true, and the defect moved into a named skipped test. §The finding
this tier arrived with.

## Every suite cleans up after itself, and reports what it spent

Cleanups register **before** the thing that needs them, and run newest-first in `afterAll` whatever
happened, each one's failure printed and the rest still run. The reason a run went red is very often
also the reason one of its cleanups will. The ordering has a trap in it that this tier hit on its
second run: the cleanup that deletes the directory the other cleanups run *in* has to be registered
first so that it runs last, or both of them answer `spawn node ENOENT`.

Every suite prints a **cost line**: wall time, `exagent` runs, scaffolds, deploys, cloud sessions,
and where the evidence went. The audience is somebody deciding whether to run this tier, and the
numbers that matter to them are the ones with a price.

Evidence is kept per run, per invocation, gitignored. A stub failure is reproducible from the test
file. A live failure is a fact about a moment, so the moment is written down. A failing assertion
names its artifact rather than quoting kilobytes of a bundler's opinion into a jest message.

## live-project: the commands whose backend is the project

[added 2026-08-28] **32 tests, 44 s, 49 `exagent` runs, one scaffold, free.** One project
scaffolded by `exagent new`, and the commands that act on *it* rather than on a device: `install`
adding a package, `agents:setup`, `skills:sync/list/show/clean`, `inspect:config-plugins`, `start`,
and the forwarded `expo` set.

**Its gate is the network, and that is why it is a suite.** `registryGate()`, which asks whether
`registry.npmjs.org` answers, and nothing else. Deliberately not `networkGate()`, which asks whether
`staging.expo.dev` answers: that is a fact about an EAS account's environment, and this suite makes no
EAS call. Nor is it rows inside `live-local`, whose gate demands **a booted iOS simulator with Expo Go
on it**. Not one command here touches a device, so folding them in would have gated them on hardware
they do not use, on the machines where "does the real registry still serve this" is the question being
asked. §A suite that cannot run refuses, and says what is missing is the rule. This is the first suite
whose gate a Linux box can pass.

### What it found

Five, all fixed, and the pattern is the point: **four are in reading what came back, and
none is in the argv.** [[0019-backend-parity-audit]] §Still stub-only, by choice has them one by
one. The two that say something about this tier rather than about the CLI are these.

- **F130 is the cleanest case of a stub doubling the code instead of the tool.** The Expo CLI prints
  the *passing* `--check` report on one line and the *failing* one pretty-printed
  [`@expo/cli` `src/install/checkPackages.ts`, SDK 57]. The wrapper parsed one line at a time, so it
  read the report that says nothing and dropped the only one with content. The stub had been handed a
  single-line report for **both** cases, because whoever wrote it wrote it from what the parse
  accepted. Two tiers agreed with each other and neither had asked the tool.
- **F133 is the same shape as this document's F93, one process further in.** A thrown Node error
  writes its message *first* and its frames after it, and `outputTail` kept the last ten lines. So a
  config with an unresolvable plugin was answered with ten frames and no cause, while the sentence
  naming the plugin sat on line 1 of the same stream. F93's lesson was *the reason a lookup prints is
  whatever the tool on the other side of the spawn last said*. F133's is that **"last" is the wrong
  end of a stack.**

And two facts about the world that no stub has. A real `expo install` of a config plugin **rewrites
the caller's `app.json`**, which is the only way the impact classifier's `is listed in the app.json
plugins` reason is reachable. And a real `bundledNativeModules.json` is what makes `expo-haptics` a
`native-module` whose action is `reload`, the row that made F134's sentence a contradiction inside one
payload.

**It also found a feature with no reach.** Ten packages were probed for `skills/*/SKILL.md`, six
installed in the scaffold and four straight off the registry, and none ships one. So every real
`skills:list` today answers `{"skills": []}`. That is not a defect: the producing half of
[[0003-knowledge-tools-and-skills]] is unmerged by decision. The suite asserts the empty result first
and then writes a `SKILL.md` into its own scratch `node_modules` the way a module author would, which
is the only honest way to exercise the discovery. It is real autolinking over a real dependency graph,
with the one synthetic part being the file a package would have shipped.

**Two things about its environment are worth knowing before reading a run.** The package manager it
scaffolds with comes from `npm_config_user_agent`, so a run launched through `npx pnpm` scaffolds a
pnpm project and one launched through `npm run` scaffolds an npm project. That is free extra coverage,
and it is the reason no assertion here may name a package manager's error codes. The second is that
`install --check` compares `node_modules` rather than `package.json`, so a mismatch has to be
*installed* to exist.

## live-local: the whole loop, on a real simulator

One project scaffolded by `exagent new` into a scratch directory, and the v1 local loop run against it
on a booted iOS simulator running Expo Go. 30 tests, ~60 s, free.

The scratch directory must be **outside every git checkout**, and the harness asserts it by walking up
looking for `.git`. That is not a preference. `eas deploy` and `eas build` upload the project by
walking up to the nearest git root, so a scratch project inside this monorepo uploads the monorepo.
The trap is silent, because the upload *succeeds*. It just uploads the wrong tree.

Here is what this suite reaches that nothing below it can.

- **The generated-types gate.** A brand-new project fails `typecheck` because `tsconfig.json`
  references `expo-env.d.ts` and the Expo CLI writes that file on the first `expo start` (F64). The
  suite asserts the failure *and its `generatedTypes` block*, runs `dev --detach --wait-ready`, and
  asserts the same command is green. A stub `expo` writes no such file, so the whole cycle is invisible
  to the tier below.
- **The inspector.** `runtime:eval` returning `2`, `runtime:tap --verify` seeing a text diff,
  `runtime:errors` reporting `runtimeReadable: true`. Each of these is an [[0019-backend-parity-audit]]
  row that said "unreachable at tier 0".
- **`--verify` on interpolated text.** The lab fixture carries `count: {count}` and
  `` {`count is ${count}`} `` side by side, which is the pair that found F63. Only the single-string
  child was extracted, so a working tap was reported as "nothing changed". That is the dangerous
  direction, because it pushes an agent to revert a change that worked. Both must appear in the diff.
- **The break-and-fix cycle.** A syntax error in a screen; `smoke`, `runtime:tree`, `runtime:tap`,
  `runtime:type`, `runtime:reload` and `typecheck` all refusing at 20 with the file named (F62); the
  error undone; the same commands green with no restart. The stub tier can pin the refusal. It cannot
  pin that Metro agrees, that the bundle read is the one on disk, or that recovery needs no restart,
  because its bundle response is whatever the fixture returns.

The break is a **syntax error** and never a dead statement. `exagent new` scaffolds
`experiments.reactCompiler: true`, and the React Compiler deletes unreachable statements out of a
render body. So `(undefined as any).boom` is compiled away and every gate stays honestly green
[observed — friction run 7 §5]. Someone loses an hour to this once per project, and it is written here
so it is once.

## live-android: the platform the other suites do not run

The fourth suite [added 2026-08-27]. Same scaffold, same loop, on a real Android emulator
running the real Expo Go APK. **24 tests, 103 s including a 40-second emulator boot, free.**

It is not `live-local` with a different device, and the reason is one measured fact: **Expo Go for
Android ships a Hermes built without the Chrome DevTools Protocol debugger**
([[0005-runtime-loop-tools]] §The CDP-less runtime, corrected). So five of the seven runtime commands
cannot answer there, and what this suite asserts is what they do instead. Three things it reaches that
nothing else does.

- **The refusal, from Hermes rather than from a double.** `e2e/utils.ts` has an `inspectorSocket:
  'no-debugger'` mode that answers every method `-32601`, and it is a good double *written from a
  measurement of this runtime*. What a double cannot establish is that the measurement still holds,
  and the exit-code contract turns on it: exit **1** for the four reading commands (nothing was
  attempted, so there is no outcome to report), **0** for `runtime:errors` without a gate flag, **20**
  when the log fallback caught something inside the window, and **22** when there was no log to read.
  All four bands, from the published bundle, against the engine the stub was modelled on.
- **A reload verified with no debugger anywhere in it.** Expo Go for Android holds a client on the dev
  server's `/message` socket, so `runtime:reload --android` stops on rung 1 and both of its proofs are
  non-CDP facts: a socket id the dev server's counter had not used, and a bundle it was seen to serve
  for `android`. That is the exact opposite of `live-cloud`, where the broadcast does not reload the app
  and the ladder has to climb. The two suites together are what make the ladder a claim about the
  socket rather than about the device's location.
- **Two platforms on one dev server.** This is the block that matters most, and the one that is
  *conditional*: it runs only when a booted iOS simulator with Expo Go is there as well. Nothing in
  `/json/list` names a platform, and the default target selector deliberately prefers a runtime that
  answers. So on a machine with both, an unscoped read lands on iOS every time and looks like an
  answer. Three commands were unscoped. This block is what found them (F100, F101, F105), and it is
  the reason the suite was worth writing rather than deducing.

**Its gate boots, and `live-local`'s does not.** That asymmetry is a machine fact rather than a
preference. A booted iOS simulator is usually something the owner of the laptop is looking at, and an
Android emulator is started for a task and shut afterwards. Requiring one to be up already would mean
this suite never ran. So a listed AVD passes the gate, `beforeAll` boots it with `-ports 5554,5555`,
and the cleanup kills it **only if this suite started it**. Without those ports the emulator binds
ephemeral ones and `adb` never lists it at all (F62, and again on 2026-08-27).

One consequence has to be stated because it breaks the tier's own rule. A machine whose AVD boots
without Expo Go on it **fails** rather than skipping. By then the boot has been spent, and a suite
cannot become skipped after it has started. The message names the one command that fixes it.

**What `smoke --android` is, and why the row is an assertion rather than a gap.** Exit **22 on a
working app**. The `runtime` phase cannot measure, and [[0010-agent-conventions]] §The sixth says a
gate that cannot measure must not pass. The suite asserts that, phase by phase: `dev-server`,
`bundler-ready`, `bundle` for android, `app` and `screenshot` all `ok`, with `runtime` and `errors`
`inconclusive` and the reason naming the engine. A broken Android bundle is still 20 with the later
phases skipped. So `smoke --android` is not a green light on Expo Go, and this tier says so in a test
rather than in a caveat.

**The break is platform-resolved, not a syntax error in a screen.** `live-local` breaks `lab.tsx`,
which breaks both platforms. This suite copies a broken `platform-note.android.ts` over a good one
beside an `.ios.ts` that parses. That is the break F53 was found with, and the only kind that tells
"checked the right platform" apart from "checked something". A no-flag `runtime:reload` then has to
refuse at 20 with `bundlePlatformSource: "connected-app"`, which is the assertion.

**Two preconditions this suite needs and `live-local`'s do not fit.** Its `waitForLabScreenAsync` polls
`runtime:tree`, which is the first thing Android refuses. The Android equivalents are
`waitForAndroidRuntimeAsync` and `waitForExpoGoStoppedAsync`. The first is a zero-length
`runtime:errors --android` window, which establishes both that a target is listed *and* that something
is behind it, because a reload leaves the old page listed for a second with nothing there (F56). The
second exists because **`am force-stop` is asynchronous**, and `pidof` still answers for a beat after
the `adb shell` exits.

## live-devclient: the app the other four suites do not run

The fifth suite [added 2026-08-28]. **15 tests, 25 s, free**, which is 14 plus the one that
carried F123 as a skipped finding, unskipped once the contract was decided and green since.
It runs the v1 runtime loop against a real **development build** on the emulator `live-android` uses.
It is also the suite that answers a question this document had been asking of itself since §What this
does not close was written: *"a development build on either platform — which on Android is the one
thing that would give it a debugger, so every refusal `live-android` asserts is a property of Expo Go
and not of Android."*

**It is.** Same emulator, same dev server, same project, one minute apart. `runtime:eval "1+1"
--android` is exit 1 `RUNTIME_EVALUATE_UNSUPPORTED` in Expo Go and **exit 0 with `value: 2`** in a
development build. `smoke --android` is **22 on a working app** in Expo Go and **0 with all eight
phases `ok`** in a development build. [[0005-runtime-loop-tools]] §The wall was Expo Go's, not
Android's has the command-by-command table. Nothing in the CLI changed for that. The refusal is
reached by *asking* the runtime rather than by knowing the platform, which is the design being
vindicated rather than a fix.

**It does not scaffold, and that is the design.** Every other suite here makes its own project in
`beforeAll` because `exagent new` costs seconds. A development build costs about **fifteen minutes**
of Gradle or Xcode, and the sibling rule of §What a live assertion is allowed to be, that a suite must
be runnable in a minute, makes that impossible. So the artifact is the *prerequisite*, the way
`live-eas` treats an EAS-linked project. `EXAGENT_LIVE_DEVCLIENT_PROJECT` names a project somebody
has already built, and the gate is two facts rather than one:

- the project's `android.package` is installed on the attached device (`pm list packages`), and
- `.expo/exagent-last-build.json` records an android build.

The second half is not belt and braces. `exagent dev` plans a **build** for a platform with no
recorded fingerprint, so a project whose app is installed and whose record is missing would send
`beforeAll` into the fifteen minutes the gate exists to avoid. The two really are separable, which is
what F121 was about. The record is written when the **app reaches the device**, so
`npx exagent dev --android --yes` alone is enough to satisfy the gate. Before it, the
`expo run:android` step had to *exit*, which meant stopping its dev server too.

**It uses the project in place.** The scratch-outside-git rule exists because `eas deploy` and
`eas build` upload by walking to the git root, and this suite makes no EAS call at all. What it
writes to somebody's project is what the CLI writes to any project it serves: `.expo/`. It also
`dev:stop`s before it starts, because one detached dev server per project is the rule and this is
the first suite whose project may already have one.

**iOS is measured, by hand, and is deliberately not in the suite.** Every way this CLI opens an app
on a local iOS simulator is `xcrun simctl openurl`, and on iOS 26.5 that raises `Open in "<app>"?`
for a **development build**'s scheme. It raises it on every call, not only the first, foregrounded or
not, and nothing in this tier can answer it. The contrast was measured on one simulator minutes apart:
`exp://127.0.0.1:<port>` launched Expo Go and registered a target inside 4 s, while the dev launcher
URL left the springboard with **0 targets after 24 s**. A suite that needed somebody to tap Open would
be a suite that never runs. So the iOS rows are filled by hand in [[0019-backend-parity-audit]] with
their evidence, and the wall is recorded in [[0005-runtime-loop-tools]] §The wall was Expo Go's, not
Android's. That is the same shape as `dev --tunnel`: a row this tier cannot reach on this machine,
written down rather than left blank.

### What it found

Six findings, three fixed in the wave and three reported. **All three of the reported ones were
decided and fixed** [2026-08-28], and each is marked below. The three fixed on the spot
are the ones whose rule was already written down somewhere and simply not applied:

- **F120 MODERATE, fixed** — `dev` warned `these options were not passed on: --port 8901` and then
  printed a development-build connect URL naming **8901**, for a plan whose `expo run:ios` was about
  to serve on 8081. The follow-ups read the caller's raw arguments. They read the plan's own last
  step now, which is [[0015-backend-selection-and-config]] §The plan approved is the plan run applied
  one call further out. Only a dev-client plan can see it, because an Expo Go plan ends in
  `expo start` and there the two lists are the same.
- **F122 MODERATE, fixed** — the Android toolchain probe answered `present` on a machine with the
  whole SDK and **no JVM**, and `expo run:android` died in three seconds on `Unable to locate a Java
  Runtime` under a plan that had just said "this machine has the Android SDK". macOS is what made
  every file-level check useless: it ships a `/usr/bin/java` that exists, is on `PATH`, and exits 1.
  [[0004-smart-start-and-project-state]] §Where a build runs.
- **F126 MAJOR, fixed** — `runtime:reload --ios` exited 0 quoting `Android Bundled 42ms …`. The
  bundle proof kept the reporter's platform tag and filtered on nothing, so the *other* app on the
  same dev server proved this one's reload. It is F53 and F100's shape, one signal further out. With
  the filter the same command is 22 with the reason naming what did bundle, which is the honest
  answer.
- **F123 MAJOR, fixed** — `navigate` opens the *route* link at an app that is not loaded,
  having said in the same payload that nothing is connected and having computed the launcher URL that
  would load it. Exit 22 after 90.6 s on Android, where no dialog can be blamed. It was reported
  rather than fixed on the spot because the recovery is a two-open ladder with contract questions in
  it. The answers are [[0005-runtime-loop-tools]] §On a development build, `navigate` goes
  launcher-first. The skipped test this suite carried is now the assertion it was written to be:
  **exit 0 in 3.0 s**.
- **F121 MAJOR, fixed** and **F125 MODERATE, fixed** — a build that succeeded
  and installed is not recorded when the launch step fails, so the next plan rebuilds; and
  `dev --detach --wait-ready` reports "the dev server started on <url>" while the plan is still
  compiling. Both decisions are in [[0004-smart-start-and-project-state]] §What a development build
  costs the plan.

**What those three fixes share, and it is not incidental.** All three read a fact off a
**subprocess's output** that no exit code carries: the install line that says the app reached the
device (F121), the same line reused to say a compiler has finished (F125), and, for F123, the
device's own answer that a link was delivered to the wrong activity. The dev-client shape is what
made all three visible, and §What it found's structural note below is the reason.

Three of the six are only reachable through a dev-client plan, and the reason is structural rather
than incidental: **a development build makes the plan's last step a build rather than a dev server.**
Every assumption the `dev` command makes about that step is an Expo Go assumption. It forwards
`expo start` options, it publishes a usable lock in a second, and finishing it means an app exists.
This is the first tier that ever ran a step that is none of those things.

## live-eas: the read side, and exactly one write

Against staging and nothing else. ~50 s.

- **Reads, repeated freely:** `whoami` (and that its `sessionFile` is the staging one, S6), `status`
  agreeing with `whoami` about who is signed in (F65), `status --explain` against the real builds of a
  real project, `status --explain --build` echoing the id it was given (F66), and `inspect:build-log`
  on a log EAS actually served.
- **One write, idempotent:** `deploy --web` of a five-dependency fixture. EAS Hosting gives each deploy
  its own preview URL, so a re-run adds a deployment and changes nothing that existed, which is what
  makes it safe on every green build. The assertion is not "something answered". The HTML is fetched,
  its title checked, the entry bundle it points at fetched, and the fixture's marker string found in
  it. The bytes this export produced are the bytes that address serves.
- **No native build.** No v1 command creates one [observed — staging-live, 2026-08-26], so there is
  nothing here to test and no EAS build worker for this suite to spend.

The read side reads a **copy**, asserted rather than intended. The copy gets a `node_modules`, a
`.expo` and whatever else the CLI writes, and the original is somebody's working tree.

`inspect:build-log` is tested as a **pair**, which is the shape the finding it closes has. First the
log as EAS serves it: brotli, so binary, so exit 22, because "no error located" for binary reads as a
build that passed (S8). Then the same log decoded, which is exit 0 with the failing phase located and
the reported line checked back against the file. One real artifact, two answers, both of them the
point.

## live-cloud: written, gated, and now run

It was written and **not run by its author**. Until it had run, its rows were marked `runnable`
rather than filled, and nothing in the file could be read as evidence. That is the rule this whole
document is about, applied to itself. §What the first four runs of it found is what running it three
times cost and bought.

**Every expectation in it comes from a live run rather than from a type definition.**
[[0019-backend-parity-audit]]'s cloud rows moved under this suite, and the suite
was written against `wave19-live/`'s captured JSON rather than against the shape the source suggested. That is
the same distinction §Why the two tiers below it cannot do this is about, one level in: a test written
from a type is a test of what somebody meant, and a test written from a captured payload is a test of
what happened.

Three facts from that run decide what the suite does and what it may claim.

**1. A tunnel is not how the dev server gets a public origin, not on this machine.** A cloud simulator
cannot load `exp://127.0.0.1:<port>`, because the loopback named there is a datacenter's, and it cannot
load a LAN address either. `expo start --tunnel` is the documented answer and it **fails here**:
`Tunnel URL not found … falling back to LAN URL` twelve times, then exit 1 on `TypeError: Cannot read
properties of undefined (reading 'body')` and a pointer at ngrok's status page
[observed — `wave19-live/01-dev-tunnel.err`, 2026-08-27]. What works is a **proxy origin**: a public
name for the port (`tuft host add`) and `EXPO_PACKAGER_PROXY_URL` so the dev server advertises it. So
the prerequisite gate is not "is ngrok installed". It is "is there a way to publish a local port", with
`EXAGENT_LIVE_PUBLIC_ORIGIN` as the escape hatch for a machine with a different one.

This also moved where the address is read from. A proxied dev server prints
`Waiting on http://localhost:<port>` and names the real origin only in its manifest's `launchAsset.url`.
So reading the log gave `hostType: localhost` and a refusal to open the app on a simulator that could
have loaded it, which is S3's second face. `src/dev/advertisedUrl.ts` prefers the
manifest when it names a tunnel, and the suite checks the origin took (`navigate / --print-url` must
report `hostType: "tunnel"`) **before** it starts anything that bills.

**2. A bare cloud session has no app on it.** Started without `--expo-go` a session comes up with
nothing installed. `apps --platform ios` lists only the controller's own test runner, and every `open` of
an `exp://` URL fails with `LSApplicationWorkspaceErrorDomain error 115`, because the simulator has
nothing registered for the scheme [observed — `wave19-live/08-open-plain.json`]. The command is also
`eas simulator` rather than `eas simulator:start`. That is the name in the CLI's own manifest and the one
carrying the flag. A project with a development build of its own passes `--build-id <id>` instead.

**3. A cloud reload is a relaunch, proved on the dev server.** This suite asserts the contract
field by field: `method: "device"`, `verifiedBy: "dev-server-bundle"`,
`bundlesAfterReload.observed: true` with the bundler's own line as the evidence, and the `dev-server`
attempt recorded as **not tried** with a reason. The field that makes it legible is
`commandSocketClients` beside `appsConnected`, because the two disagree exactly here. An app bundling
over a proxy is in the debugger list and holds *zero* clients on the command socket, so `Apps connected
1` above a broadcast that reached nobody described two different worlds with one number
([[0005-runtime-loop-tools]] §Two lists, one question). The suite asserts it is a *number* rather than a
value, because "nobody asked" and "nobody is registered" are the two answers that field exists to keep
apart.

**What the suite still may not assert: `attached`.** S11 says a cloud simulator registers zero CDP
targets over both the local and the proxy origin, so `navigate --cloud` asserts the link was opened and
nothing more. Exit 22 with `attached: false` is the honest outcome, and a test demanding
`attached: true` would be asserting a fix nobody has made. There is deliberately no
`runtime:eval --cloud` test, because the flag does not exist, correctly. What the suite pins is that
the CLI is honest about a wall upstream of it, and the branch that would notice the wall moving is
written into the test.

It is gated **twice**: on prerequisites, like every suite, and on `EXAGENT_LIVE_CLOUD=1`, because its
prerequisites can all hold on a machine whose owner did not mean to start a billing session from a test
run. Cleanup ends the expensive thing first. The session is stopped unconditionally, with `--id` so
that only this run's is touched, and it does not read the id first, because the failure worth guarding
is a session that started and whose id this process never learned. Then the public name is released,
the dev server stopped, the directory deleted.

### What the first four runs of it found

[2026-08-27, staging, project `@kudo1/livecheck`.] Run 1 is the first gated run; runs 2–4 are the
three sessions that were the whole budget. The suite went **4/7 → 4/7 → 6/7 → 6/7**,
and every red was a defect rather than a flake. Three of the four facts above turned out to be about
*one session's state* rather than about cloud sessions, and that is the result worth keeping. A suite
written from one captured run is far better than one written from a type, and it is still a suite
written from one run.

| Run | Result | What the reds were |
| --- | --- | --- |
| 1 | 4/7 | `smoke --cloud` exit 1 refusing its own dev server (F96); both reloads exit 22 after their full 180 s |
| 2 | 4/7 | with the session started on the project, both reloads exit **20** in 9 s (F97); `smoke` reporting `deviceBackend: null` (F98) |
| 3 | 6/7 | one reload exit 22 after 180 s while the next one exited 0 in 18.5 s — the pair that is F99 |
| 4 | 6/7 | the command exits 0 in 48 s; the red is this suite's **own** assertion, written between runs 2 and 3 and made obsolete by the climb it described |

**Fact 2 was incomplete, and that is what cost run 1.** `--expo-go` installs and launches Expo Go, and
nothing has opened the *project* in it. So the first `exp://` URL goes to the **system**, iOS asks
"Open in 'Expo Go'?", and nobody answers. That is `navigate --cloud` at exit 22 after 60.9 s with the
`open` verb having exited 0, then two 180 s reloads that served no bundle.
`eas simulator … --open-url exp://<host>` is the runner opening the URL in the app it just launched,
which is the state the first *working* session was in before any exagent command touched it. With it,
the same command is exit 0 in 17.1 s with `attached: true` in 206 ms. [[0005-runtime-loop-tools]] §The
dialog nobody is there to answer records the layered fix.

**Fact 3 was one session's state, and S11 with it.** With the project actually loaded, the same commands
reported `appsConnected: 1` **and** `commandSocketClients: 1`. The app registers a debugger target and
a command-socket client through the proxy, both of which S11 said it would not, and `navigate --cloud`
confirmed the attach in 206 ms. So `method: "device"` was never a property of a cloud session. It was a
property of a session whose app had never loaded. The suite now asserts the **ladder** rather than the
state of one session: rung 1 is always taken and always reports what the socket held, and the relaunch
is what reloads a cloud session from either state.

**S11 is amended, not closed.** What remains true is narrower and belongs upstream. The `/message`
reload broadcast does not reload Expo Go on a cloud simulator over a proxied origin, and it takes the
app's command-socket client with it. That is the wall, and the CLI's answer to it is F99, the ladder
climbing to the rung that works ([[0005-runtime-loop-tools]] §The ladder climbs).

**The four defects, all fixed in this wave**, recorded in [[0021-honest-reports]] (§One URL source, two
callers, §The device a run used) and [[0005-runtime-loop-tools]] (§A broadcast that was delivered is a
mechanism that ran, §The ladder climbs):

- **F96 MAJOR** — `smoke --cloud` built its device URL from the dev server's *listening* address while
  `navigate`, on the same dev server minutes earlier, built it from the manifest. One option was
  carrying both a URL and the claim that a caller had named it.
- **F97 MAJOR** — a broadcast delivered to a registered client, with no churn inside its window, was
  reported as "no mechanism ran". That is exit 20, and the two observations that answer that state were
  skipped outright.
- **F98 MODERATE** — `smoke --json` reported `deviceBackend: null` beside the `eas simulator:exec …
  screenshot` that had just photographed a billed session.
- **F99 MAJOR** — `auto` stopped at a rung it had tried. The next command, finding the socket empty,
  climbed and exited 0 in 18.5 s on the state its predecessor had failed on.

**What run 3's one red was.** `method` pinned to `dev-server` whenever the socket held a client. That
assertion was written between run 2 and run 3, before the ladder learned to climb, and made obsolete by
the climb it was written to describe. It is corrected against run 3's own artifact. **The corrected
suite has not been re-run live.** The session budget was three and it spent three, so the row
that says 7/7 is the next run's to write, and nothing here claims it.

## The findings this tier arrived with

All three were found on 2026-08-27, on this suite's first working runs, and all three are **fixed**. The design each one forced is recorded in [[0021-honest-reports]] (§The runner is not the
service, §A crash is a tool error, §An observed signal, or the band). The findings are kept here in
full because what this tier is *for* is the class of defect it can reach, and these three are the
evidence. None of them was reachable by a unit or a stub test, and each had a passing test one call
frame away.

### F93 — MAJOR: the package runner's install progress, reported as EAS's answer

`status --explain` reports the package runner's install progress as what EAS said about the caller's
builds.

`readEasBuildsStatusAsync` runs its two per-platform lookups concurrently (`Promise.all`). In a project
that does not pin `eas-cli`, which is the common case and the only rung, each lookup
spawns `bunx eas-cli@latest`, and both share one per-spec scratch directory
(`$TMPDIR/bunx-501-eas-cli@latest`). Started milliseconds apart they collide. The loser exits 1 with
empty stdout, and `describeLookupFailure` then reports the first line of its stderr, **bun's own
progress output**, as the reason.

Observed over six runs against a fresh copy of one project with no `.expo` cache: both platforms
poisoned 2/6, one platform 1/6, clean 3/6. The reason printed is `Resolving dependencies`. The
identical argv run on its own exits 0 with the correct payload every time, and inserting a ~50 ms skew
between the two spawns made the collision disappear.

This is [[0019-backend-parity-audit]] bug 3 one process boundary further out. There, a wrapper's panic
was reported as EAS's answer. Here it is the package runner's progress line, and the difference is
that the runner is *this CLI's own choice* rather than something it found on the machine. It is not
untrusted output from somebody else's binary. It is noise from a tool this CLI decided to use, quoted
back to the caller as a service's answer.

**Reported and not worked around**, by the tier's own rule: a live tier that edits its
assertions down to whatever the CLI currently does is a stub tier with a longer runtime. The test was
skipped with the evidence and a `TODO`, and the neighbouring test retried up to four times with a
comment saying the retry was scaffolding for a defect.

**Fixed** ([[0021-honest-reports]] §The runner is not the service). The fix is a per-spec
mutex in the spawn layer (`src/utils/runnerLock.ts`), applied in all three helpers that can start a
runner, plus a guard that will not let a runner's line be quoted as the service's answer for the
collisions no mutex in this process can prevent. The live test runs, and the retry is gone with the
defect it was scaffolding for. The deterministic reproduction is an e2e test whose stub runner holds
its scratch directory the way a real one does, red on the code as it shipped with one platform
`unknown`.

Both halves were then demonstrated live and **independently**, with the mutex switched off in the
bundle [2026-08-27]. The collision reproduced on 2 of 3 attempts, and the reason each poisoned platform
reported was `"bunx eas-cli@latest" failed to deliver the eas CLI: it exited 1 having printed only its
own install progress ("Resolving dependencies")`, which is the guard standing where the raw line used
to be. With the mutex on, five consecutive runs answered both platforms from `eas`.

One thing about the test itself is worth carrying, because it is the shape a live test fails in
silently. The F93 test **deletes `.expo/exagent-eas-builds.json` first**. Without that, the tests above
it have warmed the cache, iOS answers from one `readFileSync`, and the concurrent pair the defect needs
never exists. The test passed while exercising a single lookup [observed — 2026-08-27: `source:
"cache"` for ios, `"eas"` for android]. A live test whose subject is a *race* has to assert that both
sides raced.

### F94 — MAJOR: an uncaught exception exits 7, which is the needs-human code

`src/utils/errors.ts:353` registers `process.on('uncaughtException', handleTooManyOpenFileErrors)`, and
that handler recognises macOS `EMFILE` and **rethrows everything else**. Node's exit code for an
exception thrown from inside an `uncaughtException` handler is **7**, "Internal Exception Handler
Run-Time Failure", which is exactly the code [[0010-agent-conventions]] §Exit codes reserves for
needs-human. Proven with no exagent involved:

```
node -e "process.on('uncaughtException',(e)=>{throw e}); setImmediate(()=>{throw new Error('x')})"
→ exit 7
```

So **every unexpected crash in this CLI is reported to an agent as "a person must intervene"**, and it
carries none of the three things that code promises. No `needsHuman` block, no `needs_human` event, no
`--json` envelope, just a raw Node stack. It is the inverse of F61: there a failure was reported as
success, and here a crash is reported as the one outcome an agent is told it cannot recover from on its
own. An unexpected crash is a *tool error*, which the table already spells 1.

Here is how the suite met it. `dev:stop` dies with `Error: setTypeOfService EINVAL` out of undici's
`writeH1`, during the `fetch` that probes the dev server, on Node 26.5.0 / macOS. `fetch` surfaces it
as an uncaught exception rather than a rejected promise, so no `await` in the command could have caught
it. It is intermittent but common: 3 of the last 3 whole-suite runs, and roughly half of the ones
before [observed — 2026-08-27]. **The undici bug is environmental and not this CLI's.** What is this
CLI's is the handler above it, and no unit or stub test can produce the input, because a crash from
inside Node's own socket layer is not a thing a fixture arranges. The two are separable. Fix the
handler and this same crash becomes exit 1 with a printed cause and a JSON envelope, which an agent can
act on.

The command's *effect* survives the crash. The dev server is already dead when the probe dies, and the
cleanup `dev:stop` a moment later reports `not-running`. So `dev:stop` does its job and then fails to
say so, and the suite was split along exactly that line: a running test asserting the effect (the port
is free), and a skipped F94 test carrying the report.

**Fixed** ([[0021-honest-reports]] §A crash is a tool error). The handler prints the crash
with its stack and exits 1, and emits the `--json` envelope. The live test runs, and the trigger is left
in place deliberately. An environmental crash from inside Node's own socket layer is not a thing a
fixture arranges, so it is the only test of this handler against a real uncaught exception. It asserts
one thing whatever undici does this run: never exit 7 with a raw stack. When the crash does fire it
asserts the report, which is exit 1, the stack and `code: "UNCAUGHT_EXCEPTION"`, and logs that it
fired. `looksLikeUnreportedCrash` is the regression tripwire for the old signature (exit 7 plus a
`Node.js v…` footer), which `expectExit` names in any failure message. `looksLikeUncaughtException` now
matches the shape the fixed handler prints, so any test that meets a crash knows it learnt nothing
about what it was asking.

### F95 — MAJOR: a verification label with no evidence in the payload

`runtime:reload --json` reported `verifiedBy: "message-socket-peers"` beside `appsReconnected: 0`.
Observed twice on the merged tree via `test:live:local`, and flaky in the way that matters: three
failures in one whole-suite run and one in the next.

Both numbers were true of the run. The peer churn had fired, and the label was earned. What was wrong
is that **`appsReconnected` is a different signal's evidence** (it counts debugger targets, which
`fresh-debugger-target` rests on) and the churn's own count was nowhere in the payload. So the report
named a signal a reader had no way to check, and the reconciliation it invited was a contradiction.

The flakiness is the ladder working as designed. The two proofs share one budget and whichever
answers first ends both, so whether the debugger target arrives before the `Bundled` line is a property
of the moment. That made a live assertion on `appsReconnected` a coin toss under a run that was, itself,
correct.

Only this tier could have found it. The stub tier pins `appsReconnected` for each rung with a fixture
that decides the race, so both orderings pass there and neither is the one a real app takes.

**Fixed** ([[0021-honest-reports]] §An observed signal, or the band). Every label names a
field of the payload, the label is chosen through that table rather than checked after the fact, and a
zero on either count carries the sentence saying which of three facts it is. The live test now asserts
the label's own count, which is the claim the rung actually establishes.

## What this does not close

- **It is the published *surface*, not a published *version*.** These suites run the ncc bundle from
  this working tree. [[0002-testing-and-evals]] §A flag is not shipped still asks for one
  `npx <package>@latest` run in a project outside this repository before shipping, and this tier
  narrows what that run has to discover rather than replacing it. The `foreignFlags` snapshot is still
  the countable surface that says where a run is owed.
- **Two platforms and two apps, all on this machine.** macOS with iOS and Android emulators
  [narrowed 2026-08-28]. A **development build** is the one thing that gives Android a debugger, and
  `live-devclient` runs one. So what is still not run anywhere is a **physical device**, Windows, and a
  development build on **iOS** *inside a suite* (§live-devclient: measured by hand, blocked from
  automation by an iOS confirmation dialog nothing here can answer).
- **Anything about Android **in Expo Go** that needs a runtime read.** `runtime:tap`'s three refusal
  bands, `--verify` diffs and a successful `runtime:eval` are `unreachable` in the `live-android`
  column rather than `open`, and `smoke --android` is asserted there to be **22 on a working app**
  rather than expected to pass. A reader quoting "the live tier is green on Android" from that suite
  alone is quoting a suite in which the gate never passes. **`live-devclient` fills every one of
  those cells** on the same emulator. That is what makes the `live-android` rows a claim
  about Expo Go's engine rather than about the platform, and why both suites are worth keeping.
- **Whether an Android app was really stopped, at the instant the command returned.** `am force-stop`
  is asynchronous, and exits as soon as ActivityManager takes the request. `runtime:stop --android`
  claims the stop ran and, since F102, that the app *was* running. The suite checks the effect within
  a bound because that is the only honest form of the assertion. That bound has been observed exceeded
  [2026-08-28: the same tree went 21/24, then failed this check again, then 24/24, across three
  consecutive runs, the first minutes after an emulator boot, with the command's own payload correct
  in every failing artifact]. So a red in this suite's mixed-platform block on the first run after a
  boot is re-run once before it is read as a regression.
- **Build creation.** Impossible in v1, so it is unreachable here rather than untested here.
- **Speed, of anything.** §What a live assertion is allowed to be.
- **A skip is not a pass.** `test:live` printing `2 skipped, 1 passed` means a third of this tier ran,
  and the cost line of a suite that did not run is absent rather than zero.
- **A green run is not a green machine.** F94's trigger is an undici bug on this Node and this macOS,
  and its live test passes on a run where the crash never fires. The unit tests are what pin the
  handler; the live test is what proves the handler meets a crash it could not have been given by a
  fixture. Neither is the other's substitute.
- **The Android mixed-platform block is conditional, so a green `live-android` may be 21 tests or 24.**
  Three of the seven findings that suite produced are only visible with an app on both platforms at
  once, and a machine with no booted simulator runs neither those tests nor anything that replaces
  them. The suite prints which of the two runs it is doing, in `beforeAll`, for exactly this reason.
- **live-cloud has not been seen 7/7.** The last runs took it to 6/7 and corrected the last assertion
  against that run's own artifact, with the session budget spent. The corrected suite is a suite that has not
  been run, which is precisely the state this document refuses to call evidence. So the next run of
  `test:live:cloud` is what closes it, and it is one session.
- **A suite written from one live run carries that run's state as if it were a law.** Three of
  live-cloud's four founding facts were about a session whose app had never loaded, and two of them were
  wrong about cloud sessions in general, including one, S11, that a whole document had been built on.
  A captured payload is the right source for a live assertion (§What a live assertion is allowed to be)
  and it is still one sample. Where a fact could be a *state* rather than a property, assert the rule
  that chose it and read the state out of the same report.

## The rule this states

**A row of the matrix is filled by the tier that could have falsified it.** A stub run fills the row
"this argv is assembled correctly" and no other. A live run fills "this command does its job against
the thing it is for". The two are different claims about the same command, and a test suite that
reports one number over both of them is reporting the weaker claim under the stronger name.
