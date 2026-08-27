# The live test tier — runbook

**Design:** `llp/0022-live-tier.plan.md`. Read it for why this tier exists and where its line falls.
This file is the operational half: what a suite needs, what it costs, how to run one, and — the part
worth reading before you quote a green run at anybody — what green here does and does not claim.

## What this tier is

Three jest suites that run the **published surface** of `exagent` — `bin/exagent.js`, which loads the
ncc bundle in `build/cli/` — against **real backends**: a real Metro, a real iOS simulator running
Expo Go, a real Hermes debugger connection, and the real EAS service on staging.

Nothing here is stubbed. The other two tiers are: `pnpm test` (unit) and `pnpm test:e2e`, which runs
whole `exagent` processes against a **stub** `expo`, `eas` and dev server. This tier exists because a
stub answers whatever it was written to answer — so the stub tier proves the *shape* of an invocation
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
| `live-local` | macOS; a **booted** iOS simulator with **Expo Go** installed; network (npm, for the scaffold's install) |
| `live-eas` | `EXPO_STAGING=1`; a staging session in `~/.expo-staging/state.json`; `bunx` or `npx`; network to `staging.expo.dev`; an EAS-linked project on disk with finished builds and at least one ERRORED build (default `~/Developer/DailyWords-Grok`, override with `EXAGENT_LIVE_EAS_PROJECT`) |
| `live-cloud` | everything `live-eas` needs, **plus** `EXAGENT_LIVE_CLOUD=1` and a way to publish a local port — `tuft host`, or an origin of your own in `EXAGENT_LIVE_PUBLIC_ORIGIN` |

### Two things about `live-cloud` that cost somebody an hour each

Both are live facts from wave 19, not preferences, and the suite is built around them.

**A tunnel is not how the dev server gets a public origin here.** A cloud simulator cannot load
`exp://127.0.0.1:<port>` — that is the loopback of the machine that opens the link, and that machine is
in a datacenter — and cannot load a LAN address either. The documented answer is
`expo start --tunnel`, and **it does not work on this machine**: the Expo CLI logs `Tunnel URL not found
… falling back to LAN URL` twelve times and then exits 1 on `TypeError: Cannot read properties of
undefined (reading 'body')`, pointing at ngrok's status page [observed — `wave19-live/01-dev-tunnel.err`].
What works is a proxy origin:

```bash
tuft host add 8500 --name my-live-run          # → https://my-live-run.tuft.host
EXPO_PACKAGER_PROXY_URL=https://my-live-run.tuft.host \
  npx exagent dev --detach --wait-ready --port 8500
```

The suite does this itself, and checks the origin actually took — `navigate / --print-url` has to report
`hostType: "tunnel"` — **before** it starts anything that bills. A proxied dev server prints
`Waiting on http://localhost:<port>` and names the real origin only in its manifest, which is why wave 19
taught `src/dev/advertisedUrl.ts` to read the manifest.

**A bare cloud session has no Expo Go on it — always `--expo-go`.** A session started without it comes
up with nothing installed: `apps --platform ios` lists only the controller's own test runner, and every
`open` of an `exp://` URL fails with `LSApplicationWorkspaceErrorDomain error 115` [observed —
`wave19-live/08-open-plain.json`]. The command is also `eas simulator`, not `eas simulator:start` — that
is the name in the CLI's own manifest and the one carrying the flag:

```bash
npx eas simulator --platform ios --type agent-device --expo-go --non-interactive --name exagent-live
```

A project with a development build of its own passes `--build-id <id>` instead.

### The hard guard

`EXPO_STAGING=1` is checked at **every** EAS call site (`prereq.ts` §`assertStaging`), not once at the
top of a file, and it **throws** rather than skipping. A suite that skips because it cannot reach
staging has cost nobody anything; a suite that ran `eas deploy` against production because the variable
was dropped somewhere between the gate and the spawn has.

### Environment variables

| variable | effect |
| --- | --- |
| `EXPO_STAGING=1` | required by `live-eas` and `live-cloud`. Nothing here ever talks to production |
| `EXAGENT_LIVE_CLOUD=1` | the second opt-in for `live-cloud`, because its prerequisites can all hold on a machine whose owner did not mean to start a billing session |
| `EXAGENT_LIVE_UDID` | which booted simulator to use, when several are |
| `EXAGENT_LIVE_EAS_PROJECT` | the EAS-linked project `live-eas` copies and reads builds from |
| `EXAGENT_LIVE_PUBLIC_ORIGIN` | an origin that already forwards to the dev-server port, for `live-cloud` on a machine without `tuft host`. Supplied origins are not torn down by the cleanup |
| `EXAGENT_LIVE_PORT` | first dev-server port to *try* (default `8500`); each run binds the first free one upward from there |
| `EXAGENT_LIVE_TEMP_DIR` | root of the scratch area (default `os.tmpdir()`). **Must be outside every git checkout** — asserted at startup, because EAS uploads walk up to the git root |
| `EXAGENT_LIVE_KEEP=1` | keep the scratch project after the run, for debugging |

## Running one

```bash
pnpm build                                  # the tier tests this artifact, so it must exist

pnpm test:live:local                        # ~1 min, free
EXPO_STAGING=1 pnpm test:live:eas           # ~1 min, one web deployment
EXPO_STAGING=1 EXAGENT_LIVE_CLOUD=1 pnpm test:live:cloud   # bills a cloud session

pnpm test:live                              # all three; the ones that cannot run skip with a reason
```

Every suite prints a **cost line** in `afterAll`, whether it passed or failed:

```
[live] cost live-eas: 50s wall · 8 exagent runs · 0 scaffolds · 1 deploys · 0 cloud sessions — evidence e2e-live/.artifacts/live-eas-2026-08-27T13-58-11-431Z
```

## What each suite costs

| suite | wall time | money | what it leaves behind |
| --- | --- | --- | --- |
| `live-local` | ~60 s (measured 58 s, 30 tests, 38 `exagent` runs) | none | nothing: the dev server is stopped, the app terminated, the scratch project deleted |
| `live-eas` | ~50 s (measured, 9 tests) | one EAS Hosting preview deployment per run | one deployment under `@kudo1/livecheck`. Idempotent: EAS Hosting gives each deploy its own preview URL, so a re-run adds one and changes nothing that existed. No native build — no v1 command creates one |
| `live-cloud` | **not yet measured**; budget several minutes — wave 19 saw one cloud reload take 90 s and another 15 s, and this suite does two | one EAS Simulator session, billed from `eas simulator` to `eas simulator:stop` | nothing, if `afterAll` ran: the session is stopped (with `--id`, so only this run's), the `tuft host` name released, the dev server stopped, the scratch project deleted. The session stop is unconditional, including when this process never learned the id |

## Evidence

Every invocation writes its argv, cwd, exit code, duration and full output to
`e2e-live/.artifacts/<suite>-<timestamp>/`, gitignored. A failing assertion names the artifact rather
than quoting kilobytes of a bundler's opinion into a terminal. A stub failure is reproducible from the
test file; a live failure is a fact about a moment, so the moment is kept.

## What green claims — and what it does not

**Claims.** The command ran, against the real thing, and the invariant held on this machine at this
moment: an exit code, a JSON contract shape, a file that exists, a URL that serves the bytes this
export produced, a log line that appeared inside a generous bound.

**Does not claim:**

- **Speed.** Nothing here asserts a timing. Bounds are generous on purpose, and an expiry is a
  failure; a bound met in a different number of milliseconds on a busy laptop is not a finding.
- **Any platform but this one.** `live-local` is macOS and iOS and Expo Go. Android is not run, and
  neither is a development build, a physical device, or Windows (`tier0-windows` covers the `.cmd`
  shim half at the stub tier).
- **Native builds.** No v1 command creates an EAS build [observed — staging-live, 2026-08-26], so
  every claim about build *creation* is untested here and cannot be tested here.
- **The runtime loop on a cloud simulator.** S11: a cloud simulator registers zero CDP targets, so
  `live-cloud` asserts that the link was opened and is honest about not attaching. The wall is
  upstream.
- **That the registry serves this.** This tier runs the ncc bundle from *this working tree*. It is the
  published *surface*, not a published *version*. `llp/0002`'s rule — one run of `npx <pkg>@latest` in
  a project outside this repository, before shipping — is still a manual step, and this tier narrows
  what that step has to discover rather than replacing it.
- **Anything about a suite that skipped.** A skip is not a pass. `test:live` printing
  `2 skipped, 1 passed` means one third of this tier ran.

## Known findings this tier is carrying

- **F93** (`live-eas`, skipped with a `TODO`): `status --explain` runs its two per-platform lookups
  concurrently, and the loser reports the *package runner's* progress line — `Resolving dependencies`,
  which is bun installing — as what EAS said about the caller's builds. Measured 3 of 6 fresh runs
  affected. The test above it retries up to four times to make its own claim honestly; **delete the
  retry when F93 is fixed**. Details and evidence are in the comment on the skipped test.
- **F94** (`live-local`, skipped with a `TODO`): an **uncaught exception exits 7** — the code the
  protocol reserves for needs-human — with a raw Node stack, no `Try:` line and no `--json` envelope,
  because `src/utils/errors.ts:353` rethrows every non-`EMFILE` error from inside its
  `uncaughtException` handler and Node's exit code for that is 7. Proven in one line of `node -e`; see
  the comment on the skipped test.

  **You will probably see this fire.** On this machine `dev:stop` hits `Error: setTypeOfService EINVAL`
  out of undici's `writeH1` during its dev-server probe on most runs (3 of the last 3), on Node 26.5.0
  / macOS. The undici bug is environmental and not this CLI's; the exit-7-and-a-stack is. The suite is
  split along what survives the crash: a running test asserts the **effect** (the port is free
  afterwards, which holds every time) and logs `[live] F94 hit on dev:stop` when the report crashed, and
  the skipped test carries the report contract. So a green `live-local` with an `F94 hit` line in it is
  the expected output today, and the line is the thing to fix.

## When a live test fails

1. Read the artifact the message names. It has the full output.
2. Decide which of two things it is, and the answer is usually obvious from the artifact:
   - **The harness is wrong** — a scaffold changed shape, a fixture drifted, an environment leaked.
     Fix the harness. The first run of `live-local` failed this way: jest sets `NODE_ENV=test`, and
     `@react-native/dev-middleware` refuses to start under it, so `expo start` died in a way no user
     would ever see. `utils.ts` strips it now.
   - **The CLI is wrong** — then it is a finding. Give it an F number, put the evidence in a comment on
     the test, and leave the test failing or skipped with a `TODO`. Do not adjust the assertion to
     match the defect: a live tier whose assertions are edited down to whatever the CLI currently does
     is a stub tier with a longer runtime.
