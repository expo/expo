# The live test tier — runbook

**Design:** `llp/0022-live-tier.plan.md`. Read it for why this tier exists and where its line falls.
This file is the operational half: what a suite needs, what it costs, how to run one, and what green
here does and does not claim. That last part is worth reading before you quote a green run at anybody.

## What this tier is

Six jest suites that run the **published surface** of `@expo/agent-cli` — `bin/cli.js`, which loads the
ncc bundle in `build/cli/` — against **real backends**: the real npm registry and the project's own
`expo` CLI, a real Metro, a real iOS simulator running Expo Go, a real Android emulator running the
Expo Go APK, a real **development build** on that same emulator, a real Hermes debugger connection,
and the real EAS service on staging.

Nothing here is stubbed. The other two tiers are `pnpm test` (unit) and `pnpm test:e2e`, which runs
whole `@expo/agent-cli` processes against a **stub** `expo`, `eas` and dev server. This tier exists because a
stub answers whatever it was written to answer. So the stub tier proves the *shape* of an invocation
and never its *availability* (`llp/0002` §A flag is not shipped until it has run against the published
binary), and it carries no CDP inspector, so every `runtime:*` success is unreachable there
(`llp/0002` §Tier 0 doubles the dev server, not the app).

**No CI job runs this tier, and none should.** It is not in `test`, not in `test:e2e`, and not in any
workflow. It spends a simulator, an account and — once per run — a deployment.

## Prerequisites, per suite

A suite whose prerequisites are missing **skips and prints the reason**; it does not fail. That
direction is deliberate: this tier runs on the machine of whoever has the prerequisites, and a laptop
with no simulator reporting red would teach everyone to ignore it.

Everything needs the bundle built first: **`pnpm build`**.

| suite | needs |
| --- | --- |
| `live-project` | network to the npm registry. **Nothing else** — see below |
| `live-local` | macOS; a **booted** iOS simulator with **Expo Go** installed; network (npm, for the scaffold's install) |
| `live-devclient` | everything `live-android`'s `adb`/device half needs, **plus** `AGENT_CLI_LIVE_DEVCLIENT_PROJECT` naming a project that (a) depends on `expo-dev-client`, (b) declares an `expo.scheme`, (c) has its `android.package` **installed** on the attached device, and (d) has an android entry in its `.expo/agent-cli-last-build.json`. It **does not boot** and **does not build** — see below |
| `live-android` | a runnable `adb` (`ANDROID_HOME`, `ANDROID_SDK_ROOT`, `PATH`, or the SDK's default location); an **attached device or a bootable AVD**; **Expo Go** on it; network. A booted iOS simulator with Expo Go is an *optional* extra that adds three tests — see below |
| `live-eas` | `EXPO_STAGING=1`; a staging session in `~/.expo-staging/state.json`; `bunx` or `npx`; network to `staging.expo.dev`; an EAS-linked project on disk with finished builds and at least one ERRORED build (default `~/Developer/DailyWords-Grok`, override with `AGENT_CLI_LIVE_EAS_PROJECT`) |
| `live-cloud` | everything `live-eas` needs, **plus** `AGENT_CLI_LIVE_CLOUD=1` and a way to publish a local port — `tuft host`, or an origin of your own in `AGENT_CLI_LIVE_PUBLIC_ORIGIN` |

### Three things about `live-project`

**Its gate is the network, and that is the reason it is a suite rather than rows in `live-local`**
[added 2026-08-28, wave 31]. Every command in it talks to the registry, writes files, or spawns the
project's own `expo`: `install` adding a package, `agents:setup`, `skills:sync/list/show/clean`,
`inspect:config-plugins`, `start`, and the forwarded `expo` set. Not one of them touches a device.
`live-local`'s gate demands a **booted iOS simulator with Expo Go on it**, so folding these rows in
there would have made them unrunnable on every machine without a simulator. That is most machines, and
it includes exactly the ones where "does the real registry still serve this" is the question being
asked. `registryGate()` in `prereq.ts` is the gate, and it is deliberately *not* `networkGate()`.
Reaching `staging.expo.dev` is a fact about an EAS account's environment, and reaching
`registry.npmjs.org` is a fact about being online.

**The package manager it scaffolds with comes from the environment, not from this suite.**
`create-expo` reads `npm_config_user_agent`, so a run launched with `npx pnpm@10.33.0
test:live:project` scaffolds a **pnpm** project and a run launched with `npm run` scaffolds an npm
one. Both were seen in wave 31, and the difference is visible where it matters: a missing package
answers `ERR_PNPM_FETCH_404` under one and `npm error code E404` under the other. That is free extra
coverage rather than a defect, so nothing pins it. But **do not assert on a package manager's error
codes here.** Assert on the status code and the package name. The suite's own comment says so at the
one assertion that had to learn it.

**`install --check` compares `node_modules`, not `package.json`.** A mismatch made by editing the
manifest alone leaves the check honestly green; the version has to be *installed*. The suite pins an
old `expo-haptics` with `install expo-haptics@14.0.1` for this, and `install --fix` puts it back.

### Three things about `live-android`

**Its gate boots an emulator, and `live-local`'s never boots a simulator.** That is deliberate, and the
reason is about the machine rather than the tier. A booted iOS simulator is usually something the owner
of the laptop is looking at, and an Android emulator is started for a task and shut afterwards. So a
listed AVD is enough to pass the gate, `beforeAll` boots it (~40 s, printed), and the cleanup kills it
**only if this run started it**. `AGENT_CLI_LIVE_AVD` names one when there are several.

Two consequences worth knowing before you read a run:

- **A boot always uses `-ports 5554,5555`.** Without it the emulator binds ephemeral ports and
  `adb devices` does not list it *at all*. Not `offline`: absent [F62, and again on 2026-08-27]. If you
  boot one by hand before running this suite, use the same flags.
- **An AVD that boots without Expo Go on it fails the suite rather than skipping it.** By then the boot
  has been spent, and jest cannot turn a running suite into a skipped one. The message names the fix:
  `npx expo start --android` once against any project.

**The mixed-platform block is optional, and it is the valuable one.** With a booted iOS simulator that
has Expo Go on it, the suite also opens the app there and asserts that `--android` and `--ios` read two
different runtimes on one dev server. That block found **F100**, **F101** and **F105**, three commands
that were reading the iOS app while reporting about Android. None of them is visible with only one
platform attached. `beforeAll` prints which of the two runs you are getting:

```
[live] live-android: running the mixed-platform block too — iPhone 17 Pro is booted with Expo Go on it
[live] live-android: SKIPPING the mixed-platform block — no booted iOS simulator with Expo Go, …
```

So **24 tests green and 21 tests green are different claims**, and the line above says which you have.
The block terminates Expo Go on the simulator when it ends, which is worth knowing if you run
`test:live:local` straight afterwards. The app takes a few seconds to come back, and `live-local`'s
break-and-fix block reports `NO_APP_CONNECTED` at exit 1 if it starts inside that window. Run it twice
or wait. It is not a finding.

**`smoke --android` exits 22 on a working app *in Expo Go*, and the suite asserts that.** It is not a
defect and not a flake. The `runtime` phase cannot read a runtime with no debugger, and `llp/0010` §The
sixth forbids a gate that cannot measure from passing. Four phases `ok`, two `inconclusive`. A green
`live-android` therefore does **not** mean `smoke --android` passes anywhere. It means it refuses
correctly. It passes on a **development build**, which is `live-devclient`'s job to assert. The one
Android gate that does return a verdict on the app is `runtime:errors --android --fail-on-error`, which
reads the dev server's log.

### Three things about `live-devclient`

**Its prerequisite is an artifact, not a project.** Every other suite scaffolds. A development build
costs about fifteen minutes of Gradle, and no suite here may spend that. So somebody runs
`npx @expo/agent-cli dev --android --yes` in a project once. Since wave 30 that is enough on its own. The
build record is written when the app reaches the device, so a launch that then fails, or a run you
stop with Ctrl-C, still leaves a recorded build (F121). Before it you had to let the step *exit*,
which meant `npx @expo/agent-cli dev:stop` as well. The gate checks the installed package *and* the record,
and a missing record is the difference between a 25-second suite and a fifteen-minute one.

**It drives somebody else's project, in place.** It makes no EAS call, so the scratch-outside-git
rule does not apply, and what it writes is what the CLI writes to any project it serves: `.expo/`.
It runs `dev:stop` before it starts, because one detached dev server per project is the rule and
this is the only suite whose project may already have one. `AGENT_CLI_LIVE_KEEP` has nothing to keep.

**It is Android-only, and iOS is a wall rather than an omission.** On iOS 26.5 every
`xcrun simctl openurl` of a **development build**'s scheme raises `Open in "<app>"?`, on every
call, foregrounded or not, and nothing here can tap it. Expo Go's `exp://` does not. Measured
minutes apart on one simulator: Expo Go attached inside 4 s, and the dev launcher URL left 0 targets
after 24 s [wave 29, `evidence/27-clean-connect-url.png`]. The iOS rows were filled by hand with the
dialog answered and live in `llp/0019`. A suite that needed somebody at the screen would never run.

**It carried one skipped test, and wave 30 turned it into an assertion.** `F123` was `navigate`
opening `<scheme>://<route>` at an app that was not loaded, while its own payload said nothing was
connected and held the launcher URL that would load it: exit 22 after 90.6 s. The contract was decided
(launcher first, then the route link, both reported), and the test now reads `loads a development
build that is not running, then navigates it` and passes in about 3 s. The suite is **15 tests**.

### Two things about `live-cloud` that cost somebody an hour each

Both are live facts from wave 19, not preferences, and the suite is built around them.

**A tunnel is not how the dev server gets a public origin here.** A cloud simulator cannot load
`exp://127.0.0.1:<port>`, because that is the loopback of the machine that opens the link and that
machine is in a datacenter, and it cannot load a LAN address either. The documented answer is
`expo start --tunnel`, and **it does not work on this machine**. The Expo CLI logs `Tunnel URL not found
… falling back to LAN URL` twelve times and then exits 1 on `TypeError: Cannot read properties of
undefined (reading 'body')`, pointing at ngrok's status page [observed — `wave19-live/01-dev-tunnel.err`].
What works is a proxy origin:

```bash
tuft host add 8500 --name my-live-run          # → https://my-live-run.tuft.host
EXPO_PACKAGER_PROXY_URL=https://my-live-run.tuft.host \
  npx @expo/agent-cli dev --detach --wait-ready --port 8500
```

The suite does this itself, and checks the origin actually took **before** it starts anything that
bills: `navigate / --print-url` has to report `hostType: "tunnel"`. A proxied dev server prints
`Waiting on http://localhost:<port>` and names the real origin only in its manifest, which is why wave 19
taught `src/dev/advertisedUrl.ts` to read the manifest.

**A bare cloud session has no Expo Go on it, so always `--expo-go`.** A session started without it comes
up with nothing installed. `apps --platform ios` lists only the controller's own test runner, and every
`open` of an `exp://` URL fails with `LSApplicationWorkspaceErrorDomain error 115` [observed —
`wave19-live/08-open-plain.json`]. The command is also `eas simulator`, not `eas simulator:start`. That
is the name in the CLI's own manifest and the one carrying the flag.

**And `--expo-go` alone is not enough, so always `--open-url` too.** It installs and *launches* Expo Go,
and nothing has opened the **project** in it. So the first `exp://` URL goes to the system, iOS asks
"Open in 'Expo Go'?", and on a device nobody is watching that modal is the whole story: `navigate
--cloud` exit 22 after 60.9 s with the `open` verb having exited 0, then two 180 s reloads that served
no bundle [observed — this suite's first run, 2026-08-27]. With `--open-url` the runner opens the URL in
the app it just launched, and the same command exits 0 in 17.1 s with `attached: true` in 206 ms:

```bash
npx eas simulator --platform ios --type agent-device --expo-go \
  --open-url "exp://<public-host>" --non-interactive --name agent-cli-live
```

A project with a development build of its own passes `--build-id <id>` instead of `--expo-go`.

### The hard guard

`EXPO_STAGING=1` is checked at **every** EAS call site (`prereq.ts` §`assertStaging`), not once at the
top of a file, and it **throws** rather than skipping. A suite that skips because it cannot reach
staging has cost nobody anything. A suite that ran `eas deploy` against production because the variable
was dropped somewhere between the gate and the spawn has.

### Environment variables

| variable | effect |
| --- | --- |
| `EXPO_STAGING=1` | required by `live-eas` and `live-cloud`. Nothing here ever talks to production |
| `AGENT_CLI_LIVE_CLOUD=1` | the second opt-in for `live-cloud`, because its prerequisites can all hold on a machine whose owner did not mean to start a billing session |
| `AGENT_CLI_LIVE_UDID` | which booted simulator to use, when several are |
| `AGENT_CLI_LIVE_AVD` | which AVD `live-android` boots, when several are listed and none is attached |
| `AGENT_CLI_LIVE_EAS_PROJECT` | the EAS-linked project `live-eas` copies and reads builds from |
| `AGENT_CLI_LIVE_PUBLIC_ORIGIN` | an origin that already forwards to the dev-server port, for `live-cloud` on a machine without `tuft host`. Supplied origins are not torn down by the cleanup |
| `AGENT_CLI_LIVE_PORT` | first dev-server port to *try* (default `8500`); each run binds the first free one upward from there |
| `AGENT_CLI_LIVE_TEMP_DIR` | root of the scratch area (default `os.tmpdir()`). **Must be outside every git checkout** — asserted at startup, because EAS uploads walk up to the git root |
| `AGENT_CLI_LIVE_KEEP=1` | keep the scratch project after the run, for debugging |

## Running one

```bash
pnpm build                                  # the tier tests this artifact, so it must exist

pnpm test:live:project                      # ~45 s, free — needs only the network
pnpm test:live:local                        # ~1 min, free
pnpm test:live:android                      # ~2 min, free (includes an emulator boot)
AGENT_CLI_LIVE_DEVCLIENT_PROJECT=~/dev/myapp \
  pnpm test:live:devclient                  # ~25 s, free — needs a built dev client, see above
EXPO_STAGING=1 pnpm test:live:eas           # ~1 min, one web deployment
EXPO_STAGING=1 AGENT_CLI_LIVE_CLOUD=1 pnpm test:live:cloud   # bills a cloud session

pnpm test:live                              # all six; the ones that cannot run skip with a reason
```

Every suite prints a **cost line** in `afterAll`, whether it passed or failed:

```
[live] cost live-eas: 50s wall · 8 @expo/agent-cli runs · 0 scaffolds · 1 deploys · 0 cloud sessions — evidence e2e-live/.artifacts/live-eas-2026-08-27T13-58-11-431Z
```

## What each suite costs

| suite | wall time | money | what it leaves behind |
| --- | --- | --- | --- |
| `live-project` | **~44 s measured** (32 tests, 49 `@expo/agent-cli` runs, 1 scaffold) | none | nothing: the dev server is stopped and the scratch project deleted. It writes into its own scratch `node_modules` (a `SKILL.md`, because no published module ships one) and nowhere else |
| `live-local` | ~60 s (measured 58 s, 30 tests, 38 `@expo/agent-cli` runs) | none | nothing: the dev server is stopped, the app terminated, the scratch project deleted |
| `live-android` | **~103 s measured** (24 tests, 36 `@expo/agent-cli` runs) — of which ~40 s is the emulator boot; ~80 s against an emulator that was already up | none | nothing, **unless the emulator was already booted**: an emulator this run started is killed, one it found is left as it was. The dev server is stopped, Expo Go force-stopped on the emulator and terminated on the simulator, the scratch project deleted |
| `live-devclient` | **~25 s measured** (15 tests, 26 `@expo/agent-cli` runs) against an emulator that is already up and an app that is already built | none | the named project's dev server is stopped and its development build is force-stopped; the project itself, its `.expo/` and the installed app are left as they were |
| `live-eas` | ~50 s (measured, 9 tests) | one EAS Hosting preview deployment per run | one deployment under `@kudo1/livecheck`. Idempotent: EAS Hosting gives each deploy its own preview URL, so a re-run adds one and changes nothing that existed. No native build — no v1 command creates one |
| `live-cloud` | **~4 min measured** (237 s, 7 tests) — and variable: one cloud reload took 18.5 s, another 48 s, and an unproved one spent its whole 180 s `--timeout` | one EAS Simulator session, billed from `eas simulator` to `eas simulator:stop` | nothing, if `afterAll` ran: the session is stopped (with `--id`, so only this run's), the `tuft host` name released, the dev server stopped, the scratch project deleted. The session stop is unconditional, including when this process never learned the id |

## Evidence

Every invocation writes its argv, cwd, exit code, duration and full output to
`e2e-live/.artifacts/<suite>-<timestamp>/`, gitignored. A failing assertion names the artifact rather
than quoting kilobytes of a bundler's opinion into a terminal. A stub failure is reproducible from the
test file. A live failure is a fact about a moment, so the moment is kept.

## What green claims — and what it does not

**Claims.** The command ran, against the real thing, and the invariant held on this machine at this
moment: an exit code, a JSON contract shape, a file that exists, a URL that serves the bytes this
export produced, a log line that appeared inside a generous bound.

**Does not claim:**

- **Speed.** Nothing here asserts a timing. Bounds are generous on purpose, and an expiry is a
  failure. A bound met in a different number of milliseconds on a busy laptop is not a finding.
- **Any platform but these two, and on iOS only Expo Go.** `live-local` is macOS and iOS and Expo
  Go, `live-android` is an Android **emulator** and Expo Go, and `live-devclient` is that same emulator
  and a **development build**. Not run anywhere: a development build on **iOS** inside a suite (a
  wall rather than a gap, see §Three things about `live-devclient`), a **physical device**, and Windows
  (`tier0-windows` covers the `.cmd` shim half at the stub tier).
- **That any Android runtime read works *in Expo Go*.** It cannot. `runtime:eval`, `runtime:tree`,
  `runtime:tap` and `runtime:type` are asserted by `live-android` to **refuse**, `smoke --android` to
  be **22** on a working app, and a green `live-android` run is a run in which none of those five
  ever answered. **`live-devclient` is where all five answer** [wave 29]: `runtime:eval "1+1"
  --android` returns 2 and `smoke --android` exits 0 with eight phases `ok`, on the same emulator.
  The two suites together are what make the refusal a fact about Expo Go's engine rather than about
  Android.
- **Native builds.** No v1 command creates an EAS build [observed — staging-live, 2026-08-26], so
  every claim about build *creation* is untested here and cannot be tested here.
- **That an Android stop had taken effect when the command returned.** `am force-stop` is
  asynchronous. It exits as soon as ActivityManager takes the request, and `pidof` still answers for a
  beat. `runtime:stop --android` claims the stop ran and that the app was running before it, and the
  suite checks the effect inside a bound.
- **The reload broadcast on a cloud simulator.** This is narrower than S11, which said a cloud simulator
  registers zero CDP targets. It registers a debugger target *and* a command-socket client once the
  project is loaded, and `navigate --cloud` confirms the attach in ~200 ms [observed — 2026-08-27]. What
  does not work is the `/message` reload broadcast: it does not reload Expo Go there, and it takes the
  app's command-socket client with it. That is upstream. `runtime:reload --cloud` climbs to the
  relaunch, which does work, and `live-cloud` asserts that rather than a rung.
- **That the registry serves this.** This tier runs the ncc bundle from *this working tree*. It is the
  published *surface*, not a published *version*. `llp/0002`'s rule is one run of `npx <pkg>@latest` in
  a project outside this repository, before shipping. That is still a manual step, and this tier narrows
  what that step has to discover rather than replacing it.
- **Anything about a suite that skipped.** A skip is not a pass. `test:live` printing
  `5 skipped, 1 passed` means one sixth of this tier ran.
- **That an installed package works.** `live-project` asserts what an install *changed* and what the
  CLI *said about it*: the manifest, the classification, the follow-up, the config the Expo CLI
  rewrote. Nothing there loads the package into a runtime. `live-local` and `live-devclient` are the
  suites that run code.

## Known findings this tier is carrying

`live-project` arrived with five, all fixed in the same wave (31) and all asserted here and at the
stub tier. Every one of them was in the half of the work the stub could not double:

- **F130** — `install --check --json` dropped the Expo CLI's report on the only run that has an
  answer in it. The CLI prints the *passing* report on one line and the *failing* one
  pretty-printed, and the parse read one line at a time. The stub had been handed a single-line
  report for both cases, so it doubled what the code accepted rather than what the CLI writes.
- **F131** — `skills:sync --json` reported `linked: []`, `removed: []` and nothing else for a run
  that could not link a skill because the user owns the name. There is a `skipped` list now.
- **F132** — `inspect:config-plugins` said `10 (1 declared, 9 auto)` for a config declaring three,
  and named neither of the two `pluginHistory` has no entry for. `declaredNotApplied` now does.
- **F133** — a config with an unresolvable plugin was reported with a `Why:` line of pure stack
  frames. A thrown Node error puts its message *first*, and `outputTail` took the last ten lines.
- **F134** — `install expo-haptics` answered `impact: "native-module"` and "Only JavaScript
  changed" in one object. The reload rung now says which of the two reasons applies.

Two things this suite found that are **not** defects and are worth knowing:

- **No published Expo module ships `skills/*/SKILL.md`.** Ten were probed in wave 31, six installed
  in a real scaffold and four straight off the registry, and none does. So the co-located skills of
  `llp/0003` have no reach against the real registry today. The suite asserts the empty result and
  then writes a `SKILL.md` into its own scratch `node_modules` the way a module author would, which
  is the only way to exercise the discovery for real. If a module starts shipping one, the first
  test in the `skills` block is what goes red.
- **`install` does not drop the fingerprint record, and does not need to.** `@expo/agent-cli dev` clears it
  after every plan step. `install` does not, and the next `status` misses the key anyway because
  `package.json` and the lockfile are pinned sentinels. Asserted rather than assumed.

`live-android` arrived with seven of its own, six fixed in the same wave and one left open:

- **Fixed and now asserted** — **F100** (`runtime:errors` and `smoke`'s error window read the runtime
  that *answers*, which on a mixed machine is iOS), **F101** (`runtime:stop --android` force-stopped the
  iOS application id and reported success), **F102** (`wasRunning: true` on every Android stop, on no
  evidence), **F103** (three follow-up builders dropped the platform flag), **F104** (`navigate
  --android` told the caller to wait on `runtime:tree`, which cannot answer there) and **F105** (the
  dev-server-log fallback called the records "this app's errors" when either app writes to that log).
  `llp/0005-runtime-loop-tools.rfc.md` §The second Android round has the measurements.
- **F107, open and not skipped.** `smoke`'s `errors` phase has no dev-server-log fallback, so on Android
  it reports `inconclusive` where `runtime:errors --android` reports a real, symbolicated observation of
  the same window. Nothing it prints is false and the outcome would be 22 either way, so there is no
  failing test for it. What there is instead is a suite that asserts `smoke --android` cannot decide,
  and a note here that `runtime:errors --android --fail-on-error` is the Android gate that can.

Nothing is skipped today. The three findings this tier arrived with were all fixed in wave 22, and
their tests run: **F93** (the package runner's install progress reported as EAS's answer), **F94**
(every crash exiting 7, the needs-human code) and **F95** (a verification label with no evidence in its
payload). The evidence and the design each one forced are in `llp/0022-live-tier.plan.md` §The findings
this tier arrived with and `llp/0021-honest-reports.rfc.md`.

Two of them left something in place worth knowing before you read a run:

- **F94's trigger is still on this machine, and that is on purpose.** `dev:stop` hits
  `Error: setTypeOfService EINVAL` out of undici's `writeH1` during its dev-server probe on roughly half
  of runs, on Node 26.5.0 / macOS. `fetch` surfaces it as an uncaught exception no `await` could have
  caught, and a crash from inside Node's own socket layer is not something a fixture arranges. So it is
  the only test of the crash handler against a real uncaught exception. The undici bug is environmental
  and not this CLI's. With the fix, a run where it fires prints
  `[live] F94's trigger fired on dev:stop and was reported as a tool error (exit 1)` and stays green.
  The F94 test asserts exit 1 with the stack and the `UNCAUGHT_EXCEPTION` envelope, and asserts in every
  case that the run did **not** end in exit 7 with a raw stack. A green run with no such line means the
  crash simply did not fire, and the unit tests are what pin the handler.
- **`am force-stop` is asynchronous, and two Android assertions were written as if it were not.** The
  `adb shell` exits as soon as ActivityManager has taken the request, so `pidof` still answers a pid for
  a beat afterwards. The first version of the two `runtime:stop --android` tests read the device
  immediately and went red under a CLI that was behaving correctly. They wait inside a bound now. It is
  the same lesson as F95's, from the other end: a live assertion about an *effect* is a bound, never a
  read.
- **A live assertion has to name the signal's own count.** F95's test used to assert `appsReconnected > 0`
  under `verifiedBy: 'message-socket-peers'`, and those are two different signals. The reload ladder
  watches two proofs on one budget and whichever answers first ends both, so the debugger-target count is
  zero on the runs where the bundle line lands first. It was three failures in one whole-suite run and one
  in the next, under a CLI that was behaving correctly. The test now asserts
  `commandSocketChurn.reconnected`, which is what that rung establishes. If you add a live assertion on a
  verified outcome, assert the field the label names.

## When a live test fails

1. Read the artifact the message names. It has the full output.
2. Decide which of two things it is, and the answer is usually obvious from the artifact:
   - **The harness is wrong** — a scaffold changed shape, a fixture drifted, an environment leaked.
     Fix the harness. The first run of `live-local` failed this way. Jest sets `NODE_ENV=test`, and
     `@react-native/dev-middleware` refuses to start under it, so `expo start` died in a way no user
     would ever see. `utils.ts` strips it now.
   - **The CLI is wrong** — then it is a finding. Give it an F number, put the evidence in a comment on
     the test, and leave the test failing or skipped with a `TODO`. Do not adjust the assertion to
     match the defect. A live tier whose assertions are edited down to whatever the CLI currently does
     is a stub tier with a longer runtime.
