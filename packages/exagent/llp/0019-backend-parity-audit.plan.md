# 0019: Backend Parity — the Coverage Matrix, and What It Found

**Type:** Plan
**Status:** Draft
**Systems:** the e2e tier (`e2e/`); the live tier (`e2e-live/`); the EAS-backed call sites (`src/dev/devAsync.ts`, `src/impact/buildCache.ts`, `src/impact/compare.ts`, `src/status/easBuilds.ts`, `src/device/cloudSimulator.ts`, `src/passthrough/auth.ts`, `src/deploy/`); the follow-up ladders (`src/followups/`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26 (live columns added 2026-08-27)
**Related:** [[0002-testing-and-evals]], [[0022-live-tier]], [[0015-backend-selection-and-config]], [[0016-v1-scope]], [[0010-agent-conventions]], [[0005-runtime-loop-tools]], [[0008-guardrails]]

## Summary

[[0016-v1-scope]] fixed what ships. This is the audit that asks whether it is *tested*. The question
is narrower than it sounds: are the two backends behind the v1 surface tested at comparable depth.
They were not, and the asymmetry was not random. **Everything that runs on this machine had an e2e
suite, and most of what runs somewhere else had a unit test and a plan.**

Five real bugs came out of closing it, all of them in code that no test had ever executed end to
end. Four are on the EAS side. The fifth is a follow-up ladder that walked a caller off the backend
they chose.

The general shape is the thing worth carrying forward: **a backend is not a flag, it is a second
process boundary.** A command that "supports EAS" spawns a different binary, reads a different
failure vocabulary and needs a different recovery sentence. A test that pins the *plan* an EAS run
would produce exercises none of that.

## The matrix

`L` local, `E` EAS/cloud. `unit` means a test exists over the pure function; `e2e` means a whole
`exagent` process ran against a stub binary. **Bold** marks what this wave added.

| Command | Backend | Before | After |
| --- | --- | --- | --- |
| `dev` (plan decided) | L | unit + e2e | unchanged |
| `dev` (plan decided) | E | unit + e2e (`plan-test.ts`) | unchanged |
| `dev` (plan **run**) | L | unit + e2e (`dev-test.ts`) | unchanged |
| `dev` (plan **run**) | E | **nothing at any tier** | **e2e (`dev-eas-test.ts`, 13)** |
| `dev` needs-human | L | unit + e2e | unchanged |
| `dev` needs-human | E | none | **e2e — found bug 1** |
| `dev` broken CLI under the name | L | none | **e2e — found bug 2** |
| `dev` broken CLI under the name | E | none | **e2e — found bug 2** |
| `status` freshness | L | unit + e2e | unchanged |
| `status --explain` build lookup | E | unit + e2e | **+ broken-shim e2e — found bug 3** |
| `status --explain --build` | E | unit | **+ broken-shim e2e — found bug 4** |
| `status --assert` 0/20/22 | — | unit + e2e | unchanged |
| `deploy` web (EAS Hosting) | E | unit + e2e, wrapper crash included | unchanged |
| `deploy` native (launch) | E | unit + e2e | unchanged |
| `navigate --cloud` | E | unit + e2e | unchanged |
| `runtime:stop --cloud` | E | unit + e2e | unchanged |
| `runtime:reload --cloud` | E | unit | **e2e (2)** |
| `smoke --cloud` | E | unit (options only) | **e2e (2) — found bug 5** |
| `runtime:eval` | — | **nothing at the e2e tier** | **e2e (6)** |
| `runtime:errors` | — | **nothing at the e2e tier** | **e2e (6)** |
| `login`/`whoami` fallback chain | E | e2e | **+ broken-shim rung (1)** |
| `typecheck`, `doctor`, `inspect:*`, `new`, `install`, `skills:*`, `agents:setup` | — | unit + e2e | unchanged (no backend dimension) |
| project shape: space in path | — | none | **e2e (2)** |
| project shape: workspace | — | one deploy case | **e2e (2)** |
| project shape: no project | — | none | **e2e (3) — found bug 6** |
| project shape: not an Expo app | — | none | **e2e (2) + 1 skipped, see below; closed by [[0020-not-an-expo-app]] — 9 rows now** |

## The live matrix

[added 2026-08-27, wave 20 — [[0022-live-tier]]] The matrix above asks whether a command ran against a
**stub** of its backend's binary. This one asks the next question, the one §What is still not tested
left open in as many words: **has it ever run for real, and where is the evidence.**

One row per v1 command, seven columns. Here is what each cell means, and the distinctions are
load-bearing.

- **`stub-e2e`** — a whole `exagent` process ran against a stub `expo`/`eas`/dev server (`e2e/`).
- **`live-project`** [added 2026-08-28, wave 31] — ran against the **real npm registry** and the
  project's **own `expo` CLI**, and against no device at all. That is the whole gate: `registryGate()`
  and nothing else. The column exists because the row it fills, the commands whose backend is the
  project on disk, was `open — stub-only, by choice` in every other column. The claim behind that
  ("argv assembly or filesystem work with no second process boundary") turned out to be wrong in five
  places. A cell reading `n/a — no device` means the command's answer is about a runtime, which this
  suite has none of.
- **`live-local`** — ran against a real Metro, a real booted iOS simulator, real Expo Go, real Hermes.
- **`live-devclient`** [added 2026-08-28, wave 29] — ran against a real Metro and a real
  **development build** on a real Android emulator. `by hand` in this column means the row was
  measured live in wave 29 and no suite asserts it. That is what every iOS development-build row is,
  because `simctl openurl` of a dev build's scheme raises a confirmation dialog nothing here can
  answer.
- **`live-android`** [added 2026-08-27, wave 25] — ran against a real Metro and the real Expo Go APK on
  a real Android emulator. It is not a duplicate of the column to its left. Expo Go for Android has no
  CDP debugger, so every cell here is either a **refusal** the iOS column cannot reach or a claim about
  a platform-scoped read that only a machine with two platforms attached can put at risk. A cell
  reading `open — same reason as the column left` means the command has no platform dimension and
  running it twice would prove nothing.
- **`live-eas`** — ran against the real EAS service on staging.
- **`live-cloud`** — ran against a real EAS Simulator session.
- **`filled`** — asserted by a run somebody has seen green. Green means green on macOS/iOS/Expo Go.
- **`runnable`** — the test exists and nobody has run it. **Not evidence.** Every `live-cloud` cell is
  this today: the suite was written in wave 20 and the staging cloud-session budget belonged to another
  wave. It becomes `filled` when the lead runs it.
- **`open`** — this tier could test it and does not yet. The reason is in the cell.
- **`n/a`** — the command has no such backend, so the column is not a gap.
- **`unreachable`** — the tier cannot cross the boundary, with the reason in the cell. These are the
  rows that matter most, because they are the ones a "fully tested" claim would be quietly wrong
  about. `smoke (pass)` under `live-android` is the clearest of them: the gate is *asserted* to exit
  22 on a working app, because a runtime it cannot read is a phase it may not pass.

[**A sixth column, 2026-08-28, wave 29.** `live-devclient` runs a real **development build** on the
emulator `live-android` uses. It is not a duplicate of the column to its left, and it is the reason
that column reads the way it does. `live-android` is Expo Go, whose Android engine carries no CDP
debugger, and `live-devclient` is the app that does. Every `unreachable — no debugger` cell in the
`live-android` column has a **filled** cell here, which turns those refusals from a claim about the
platform into a claim about the app. The column is **Android only**, and the reason is a wall rather
than a gap. On iOS 26.5 every `simctl openurl` of a development build's scheme raises
`Open in "<app>"?`, on every call, and nothing in this tier can answer it. So the iOS development
build rows say `by hand` with their evidence, which is a weaker claim than `filled` and is said so.]

[**The column order below is the order the cells are in**, and it is not the order this header was
written in until wave 36. `live-devclient` was appended as the last column when wave 29 added it,
and `live-project` was inserted as the second when wave 31 added its, so the header read
`… live-android | live-devclient | live-eas | live-cloud` over a body whose fifth cell is the EAS
one. Nothing in the body moved; the header row is corrected. The rows that make it unambiguous are
`whoami` (fifth cell names the **staging** session file) and `runtime:eval` (last cell is the
development build returning `2`, which is wave 29's whole result).]

| Command | stub-e2e | live-project | live-local | live-android | live-eas | live-cloud | live-devclient |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `new` | filled | **filled** — every test below runs against its scaffold | **filled** — scaffolds + installs, per run | **filled** — the same scaffold, per run | n/a | runnable (its own scaffold) | n/a — the artifact is the prerequisite; this suite never scaffolds |
| `install --check` | filled | **filled** — the real report on **both** sides of a mismatch, and the `--fix` round trip (**found F130**) | **filled** — real registry resolution, `check.report` non-null (F76) | open — no platform dimension; `live-local` proves the wrapper | n/a | n/a | open — same reason as the columns left |
| `install` (adds a package) | filled | **filled — the cell this suite was built for.** Four classes on real `node_modules`: `native-module` Expo Go carries → `reload` (**found F134**), a config plugin the Expo CLI **wrote into `app.json`** itself, a package outside `bundledNativeModules.json` → `prebuild-and-build`, and a dev dependency. Plus a package the registry does not have, and the fingerprint record surviving an install whose key misses anyway | open — every run would install from the registry; the `--check` path proves the wrapper | open — same reason as the column left | n/a | n/a | open — same reason as the columns left |
| `typecheck` (fresh project) | unit only — a stub `expo` writes no `expo-env.d.ts` | open — asserted in a column right | **filled** — exit 20 + `generatedTypes` naming the file (F64) | open — F64 is about a file `expo start` writes, which has no platform | n/a | n/a | n/a — the named project is not fresh |
| `typecheck` (after `dev`) | filled | open — asserted in a column right | **filled** — same command, exit 0, `generatedTypes: null` | **filled** — exit 0 with the emulator attached, which is the claim that it has no platform dimension | n/a | n/a | open — proved twice already, and it has no app dimension |
| `doctor` | filled | open — asserted in a column right | **filled** — real expo-doctor, `parse: "full"`, 21 checks, protocol exit code (F68) | **filled** — `parse: "full"`, 21 checks, protocol exit code, emulator attached | n/a | n/a | open — no app dimension |
| `status` (report) | filled | **filled** — `hashSource` cold, warm, and computed again after an install | **filled** — real 40-hex fingerprint from the resolved `@expo/fingerprint` | **filled** — `device.devices` names `emulator-5554` beside the simulator (**found F106**) | **filled** — `auth` agrees with `whoami` (F65) | n/a | **filled** — `devServer.openUrls` is the dev launcher URL and **only** that, `target: "dev-build"`, no `exp://` anywhere |
| `status --assert` | filled | open — asserted in a column right | **filled** — 22 on a project with no recorded build | open — freshness is per platform in the report and the assert path has no device dimension | n/a | n/a | open — same reason as the columns left |
| `status --explain` (build lookup) | filled | n/a | n/a | n/a | **filled** — real build found by fingerprint, **+ found F93** | n/a | n/a |
| `status --explain --build <id>` | filled | n/a | n/a | n/a | **filled** — the id is echoed (F66) | n/a | n/a |
| `dev --detach --wait-ready` | filled | n/a — no device | **filled** — and the port still answers 8 s later (F61) | **filled** — same server, and the port still answers | n/a | n/a | **filled** — `ready: true` on `expo start --dev-client --android`, which also opens the installed build on the emulator. **F125** is the same command on a plan that still has a build in it |
| `dev` (attached, blocking) | filled | open — `start` is the attached shape this suite runs, one row down | open — the suite has no use for a foreground server; `--detach` is the agent-facing shape | open — same reason as the column left | n/a | n/a | open — same reason as the columns left |
| `dev` (EAS plan run) | filled (wave 19) | n/a | n/a | unreachable — same reason | unreachable — the plan's EAS step is a native build, which no v1 command creates | n/a | n/a |
| `dev --tunnel` | filled | n/a | **unreachable on this machine** — `@expo/ngrok` exits 1 (`Tunnel URL not found` ×12, then `Cannot read properties of undefined`) [wave19-live] | n/a — an emulator reaches this machine through `adb reverse`, not a tunnel | n/a | n/a — `live-cloud` uses a **proxy origin** (`EXPO_PACKAGER_PROXY_URL` + `tuft host`) instead, which is the path wave 19 proved | n/a |
| `dev` with a **proxy origin** | none — a stub dev server advertises nothing | n/a | open — `live-local` has no use for a public origin | open — `adb reverse` is the local answer and it is asserted by the `navigate` row | n/a | **runnable** — `EXPO_PACKAGER_PROXY_URL` + `tuft host add`, and the origin is checked before a session is billed | open — `adb reverse` is the local answer here too |
| cloud session start (`--expo-go`) | n/a | n/a | n/a | n/a | n/a | **runnable** — `eas simulator … --expo-go`; without the flag the session has no app and every `open` is `LSApplicationWorkspaceErrorDomain error 115` [wave19-live] | n/a |
| `dev:logs` | filled | n/a — no device | **filled** — reads the real bundler error the gates refused on | **filled** — carries the `Android Bundled` line, and the `.android.ts` break | n/a | n/a | open — read by the reload proof rather than asserted directly |
| `dev:stop` | filled | **filled** — the cleanup, and the stop that ends the `start` test | **filled** — process gone, port free after | **filled** — port free after; F94's trigger tolerated the same way | n/a | n/a | **filled** — run twice per suite. It used to be what wrote the build record after a `run:*` step; since wave 30 the record is written when the app reaches the device, so a stop is no longer part of it (F121) |
| `start` | filled | **filled** — a real Metro answering 200 on its port, the ladder printed **before** the bundler took the terminal, and the skill sync 3 s later (llp/0003 §Migration item 1, measured for the first time) | open — `expo start` verbatim; `dev` covers the same subprocess with a plan around it | open — same reason as the column left | n/a | n/a | open — same reason as the columns left |
| `navigate` (local) | filled | n/a — no device | **filled** — `simctl openurl`, route check, `attached: true` | **filled** — `reversedPort` (F50), `attached: true`, the resolved `adb` in the command (F49), and the wait it names is one Android can run (**found F104**) | n/a | n/a | **filled** — `dcapp://explore`, `target` naming the development build, and `runtime:tree` reporting `focusedScreen: "explore"` **after** it, which is the check `navigate` does not make for itself. **F123** is the same command with nothing connected — since wave 30 it opens the launcher URL first and is `filled` too: `launch.attached: true` in 2.6 s, then `attached: true` on the route link |
| `navigate` (bad route) | filled | n/a — no device | **filled** — exit 1, `ROUTE_NOT_FOUND`, real sitemap in the message | open — the sitemap has no platform; asserted once, in the column left | n/a | n/a | open — the sitemap has no app dimension |
| `navigate --print-url` | filled | n/a — no device | open — the URL is asserted by the `navigate` row; `--print-url` adds no backend | open — same reason as the column left | n/a | **runnable** — `beforeAll` uses it to prove the public origin took (`hostType: "tunnel"`) before billing a session | open — asserted by the `status` row |
| `navigate --cloud` | filled | n/a | n/a | n/a | n/a | **filled** — `deviceBackend: "cloud"`, the URL on the public origin, the `open` at exit 0, and `attached: true` in 206 ms on a session started with `--open-url` [2026-08-27]. `attached` is asserted permissively — a cold first bundle over a proxy may outlive the wait — but a run that does not attach must have looked for the S10 dialog | n/a |
| `runtime:eval` | filled (6, failure paths only) | n/a — no device | **filled** — returns `2` from real Hermes; the row §What is still not tested called unreachable | **filled** — exit 1 `RUNTIME_EVALUATE_UNSUPPORTED` from real Hermes, naming the wall and no `--timeout` | n/a | unreachable — no `--cloud` on `eval` (correct), and S11 anyway | **filled — exit 0, `value: 2`.** The cell this whole suite exists for: `live-android` asserts exit 1 for the identical command, and the difference is the app |
| `runtime:errors` | filled (6) | n/a — no device | **filled** — `runtimeReadable: true` from a real debugger | **filled** — `runtimeReadable: false`, the log fallback read (F52), 20 for an error caught in the window, **22 with no log** — and the mixed block **found F100 and F105** | n/a | unreachable — same | **filled** — `runtimeReadable: true` and the dev-server-log fallback correctly **not** read, which is the exact inverse of the cell to its left |
| `runtime:tree` | filled | n/a — no device | **filled** — `disabled`, `groupSize`, `placeholder` on real nodes (F69, F70) | **filled** — the same refusal, exit 1 | n/a | unreachable — same | **filled** — the screen read, `bundle.platform: "android"`, `disabled`/`editable` bands on real nodes |
| `runtime:tap` (3 refusal bands) | filled | n/a — no device | **filled** — disabled / ambiguous / no-handler, all 20 | **filled** — the refusal only; the three bands need a runtime to read | n/a | unreachable — same | **filled** — disabled / ambiguous / no-handler, all 20, on Android for the first time |
| `runtime:tap --verify` | unreachable — no CDP at tier 0 | n/a — no device | **filled** — interpolated **and** single-string Text in the diff (F63) | unreachable — no debugger, so nothing can be tapped or diffed | n/a | unreachable — same | **filled** — F63’s interpolated **and** single-string pair, both in the diff, on Android |
| `runtime:type` | filled | n/a — no device | **filled** — types into a real input; `editable={false}` → 20 | **filled** — the refusal only, same reason | n/a | unreachable — same | **filled** — types into a real input; `editable={false}` → 20 `disabledOn: "editable"` |
| `runtime:reload` (local) | filled | n/a — no device | **filled** — `verifiedBy: "message-socket-peers"`, real reconnect | **filled** — rung 1, `commandSocketClients: 2`, `verifiedBy: "message-socket-peers"`, `Android Bundled` — verified with no CDP at all | n/a | n/a | **filled** — rung 1 in 1.3–2.4 s, and the bundle proof asserted to be `Android Bundled …` rather than any bundle (**found F126**) |
| `runtime:reload --cloud` | filled (wave 19) | n/a | n/a | n/a | n/a | **filled** — exit 0, `verifiedBy: "dev-server-bundle"`, `iOS Bundled 40ms`, in 18.5 s and 48 s on two runs [2026-08-27]. **Not** wave 19's field-by-field contract: `method: "device"` was that session's state, and the assertion is now the *ladder* — rung 1 always taken and always reporting what the socket held, the relaunch reloading from either state | n/a |
| `runtime:reload --cloud --route` | filled | n/a | n/a | n/a | n/a | **filled** — `exp://<public-host>/--/lab` opened and echoed, exit 0 in 18.5 s and 26.5 s [2026-08-27]. The landing open of a socket-rung reload goes through the third URL path F96's audit found, so this row is what would have caught it | n/a |
| `runtime:stop` (local) | filled | n/a — no device | **filled** — `wasRunning: true`, Expo Go terminated on the named udid | **filled** — Android's own application id, `wasRunning` from a `pidof`, and the device asked afterwards (**found F101 and F102**) | n/a | n/a | **filled** — the project’s **own** package from `bundleIdSource: "dev-server"`, and the effect read off `pidof` inside a bound. Sharper than the cell left: this app has the *same* id on both platforms, so no id comparison could catch an unscoped read |
| `runtime:stop --cloud` | filled | n/a | n/a | n/a | n/a | **runnable** — `wasRunning` may be null and that is honest (S13), and the session is still listed afterwards (S12) | n/a |
| `smoke` (pass) | unreachable — the runtime and screenshot phases need an app | n/a — no device | **filled** — 8 phases, screenshot on disk | **unreachable — and that is the answer.** 22 on a working app: the `runtime` phase cannot measure, so llp/0010 §The sixth forbids a pass. Four phases `ok`, two `inconclusive`, asserted phase by phase | n/a | n/a | **filled — exit 0, `outcome: "passed"`, all eight phases `ok`.** The cell that overturns "`smoke --android` is not a green light and never will be": it is one, on this app |
| `smoke` (broken bundle) | filled | n/a — no device | **filled** — 20, later phases skipped, `lab.tsx` named | **filled** — 20, later phases skipped, the `.android.ts` file named | n/a | n/a | open — the break is platform-resolved and asserted in the column left; nothing about it has an app dimension |
| `smoke --cloud` | filled (2) | n/a | n/a | n/a | n/a | **filled** — exit 22 at the `runtime` phase, `deviceBackend: "cloud"`, a 64 KB PNG through the session's controller, every follow-up on `--cloud` [2026-08-27]. It found F96 (exit 1 refusing its own dev server) and F98 (`deviceBackend: null` beside that PNG) | n/a |
| break-and-fix cycle (6 gates) | partial — the refusal only | n/a — no device | **filled** — 6 gates to 20 and back to green, no restart (F62) | partial — the **platform-resolved** break instead: an `.android.ts` that does not parse beside an `.ios.ts` that does, which is what F53 needed and `live-local` cannot make | n/a | n/a | open — the suite drives somebody else’s project and must not break their source |
| `deploy --web` | filled | n/a | n/a | n/a | **filled** — URL 200, HTML title, entry bundle serves the fixture's marker | n/a | n/a |
| `deploy --native` (launch) | filled | n/a | n/a | n/a | open — it runs `eas build`, which bills a worker; one deploy per run is the budget | n/a | n/a |
| `whoami` | filled | **filled** — the bare form forwarded, `--json` answered by this CLI as one object | n/a | n/a | **filled** — staging session file named (S6), `--json` object | n/a | n/a |
| `login` / `logout` / `register` | filled | unreachable — same reason: they mutate the machine session | unreachable — they mutate the machine's session, which a test suite must not | unreachable — same reason | unreachable — same | n/a | unreachable — same reason |
| `inspect:build-log` (binary in) | filled | n/a | n/a | n/a | **filled** — a real brotli-served EAS log → 22 (S8) | n/a | n/a |
| `inspect:build-log` (decoded) | filled | n/a | n/a | n/a | **filled** — same log decoded → phase located, line checked back against the file | n/a | n/a |
| `inspect:build-log <build-id>` | n/a | n/a | n/a | n/a | unreachable — reserved; eas-cli has no `build:logs` | n/a | n/a |
| `inspect:config-plugins` | filled | **filled** — the real introspected config on a plain scaffold, on one with a plugin added, and on a **broken plugin entry** (**found F132 and F133**) | open — no backend dimension, and the stub tier runs the real config loader already | open — same reason as the column left | n/a | n/a | open — same reason as the columns left |
| `skills:*`, `agents:setup` | filled | **filled** — all four skill actions against real autolinking, `agents:setup` idempotent and respecting a user-edited `AGENTS.md`, and the wave-16 `clean` guard (**found F131**, and the finding that **no published module ships a skill**) | open — filesystem only; nothing about them is a second process boundary | open — same reason as the column left | n/a | n/a | open — same reason as the columns left |
| forwarded `expo` set | filled | **filled** — `config --json` **byte-identical** to `expo config --json`, a rejected flag keeping the Expo CLI's own words and code, the space form forwarded (rule 2), and one forward that really runs (`export --platform web` → a `dist/index.html`) | open — a forward is argv assembly, which is what the stub tier is for | open — same reason as the column left | n/a | n/a | **this is where F120 was found** — a plan ending in `expo run:*` forwards nothing, and the follow-ups were quoting the caller’s arguments anyway |
| native EAS build **creation** | n/a | n/a | n/a | n/a | **unreachable in v1** — verified: no v1 command creates one. `deploy --native` runs create-launch; `inspect:build-log` takes no id | n/a | n/a |
| Android, anywhere | filled (posix) | n/a — no device dimension at all, which is this column's whole gate | **unreachable today** — the suite is iOS/Expo Go; the harness has no Android gate yet | **this column** — `live-android`, 24 tests, 103 s including the emulator boot [2026-08-27]. What is still not run on Android: a **development build** (which is what would give it a debugger), a **physical device**, and `--tunnel` | n/a | n/a | **this column** — 15 tests, 25 s, on a development build. What is still not run: a development build on **iOS** inside a suite, and a physical device |
| Windows | filled (`tier0-windows`) | unreachable — nobody has run this suite there, and it is the one suite that could | unreachable — no simulator, and this tier is macOS-gated | unreachable — the emulator and `adb` exist there, and nobody has run this suite on one | unreachable — same gate | unreachable — same | unreachable — same gate |
| CDP on a cloud simulator | n/a | n/a | n/a | n/a | n/a | **S11 amended, 2026-08-27** — the app registers a debugger target *and* a command-socket client once the project is loaded, so CDP is reachable there; `smoke --cloud`'s `runtime` phase still answered `No target found.` at that moment, which is a timing question rather than the wall S11 described. What is upstream and unreachable is narrower: the `/message` reload broadcast does not reload Expo Go there, and takes the app's socket client with it | n/a |

### The iOS development build, measured by hand

[2026-08-28, wave 29. iPhone 17 Pro `C159CF99-…`, iOS 26.5, an SDK 57 project built with
`npx expo run:ios`, dev server on 8901. Evidence under `wave29-devclient/evidence/`.]

These rows are **`by hand`**, which is a weaker claim than `filled` and is written as one. They were
run live, once, by a person answering a springboard dialog, and no suite asserts them. The reason
there is no suite is in `live-devclient`'s header and in [[0005-runtime-loop-tools]] §The wall was
Expo Go's, not Android's. `xcrun simctl openurl` of a development build's scheme raises
`Open in "<app>"?` on **every** call, and this tier cannot tap.

| Command | Result |
| --- | --- |
| `install expo-dev-client` | exit 0, `impact: native-module`, `action: prebuild-and-build`, and the next `dev --plan` moves from `expo-go` to `dev-client-stale` |
| `dev --ios` (the real build) | `Build Succeeded`, installed on the simulator, then exit **7** `macos-automation` at `expo run:ios`'s own `osascript` — and no build recorded, which is **F121**. Fixed in wave 30: the same run records the build and the handoff says so |
| `status` | `openUrls` is the dev launcher URL only, `target: "dev-build"` |
| `navigate /` (nothing connected) | exit **22** after 45.4 s, `url: "dcapp://"` — **F123**. Fixed in wave 30; the iOS dialog still stands in front of the launcher open here, and the Android measurement is in `live-devclient` |
| `navigate /lab` (app connected) | exit **0**, `attached: true` in 79 ms, and the app **did not move** — the dialog was on screen and `attached` was satisfied by the target that was already there |
| `runtime:eval "1+1"` | exit 0, `value: 2` |
| `runtime:tree` | exit 0, 10 nodes, `disabled` / `disabledOn: "editable"` |
| `runtime:tap inc-btn --verify` | exit 0, `counter-interp` **and** `counter-str` in the diff |
| `runtime:tap` disabled / dup / plain | 20 / 20 / 20 |
| `runtime:type` | exit 0; `ro-input` → 20 `disabledOn: "editable"` |
| `runtime:errors` | exit 0, `runtimeReadable: true` |
| `runtime:reload` | exit 0 against a **detached** dev server; exit 22 after 30 s against a foreground one, because a dev client re-registers under the page id it had (`appsReconnected: 0`) and the bundle proof needs a captured log |
| `smoke --ios` | exit **0**, `outcome: passed`, all eight phases `ok` |
| `runtime:stop --ios` | exit 0, `bundleId: com.kudochien.dcapp` from `bundleIdSource: "dev-server"` |

Two rows are worth reading twice. **`navigate /lab` at exit 0 having navigated nothing** is F123's
other face. `attached: true` is satisfied by an app that was connected *before* the command ran, so
on a platform where the open silently does nothing the command has no evidence left that is about
itself. The second is that **`commandSocketClients` climbs on a dev client**: 7, then 8, then 9
across three reloads, where Expo Go held a steady 2. That is the number the reload ladder picks its
rung on ([[0005-runtime-loop-tools]] §One ladder, chosen by the command socket). Nothing was observed
to go wrong because of it. It is written down because the ladder reads that count as "somebody is
listening".

### What this matrix was used for, in wave 36

[added 2026-08-28] [[0016-v1-scope]] §The graduation review is the first decision made **out of**
this table rather than recorded into it. Its criterion (b) — live evidence on every platform and
runtime a command claims — is these columns, and the `filled` / `runnable` / `by hand` split is what
made the criterion decidable: five of the six `[experimental]` commands graduated on cells somebody
had seen green, and the sixth, `inspect:config-plugins`, kept the mark because its only live cell is
`live-project` and it is five waves old.

The split earned its keep a second time here. A review that counted `runnable` as evidence would
have graduated on a suite nobody has run, which is the exact failure the column vocabulary exists to
prevent.

### What the live columns changed

**The feature with no reach, found by trying to test it** [added 2026-08-28, wave 31]. `skills:*`
distributes the skills that **SDK packages ship** ([[0003-knowledge-tools-and-skills]] §Skills shipped
from Expo modules). Ten packages were probed against the registry and a real scaffold: `expo-camera`,
`@expo/ui`, `expo-router`, `expo-image`, `expo-build-properties`, `react-native-mmkv`, `expo-sqlite`,
`expo-notifications`, `expo-updates` and `expo-audio`. **Not one ships `skills/*/SKILL.md`.** So
every live `skills:list` in a real project today answers `{"skills": []}`, and the four commands have
nothing to act on.

That is not a defect in this CLI and it is not a gap in this tier. The four reference PRs are
unmerged by decision ([[0003]] §Resolved item 2), so the *producing* half of the feature has not
shipped anywhere. It is recorded here because a matrix cell reading `filled` for `skills:sync` would
otherwise imply the feature does something in a real project, and today it does not. `live-project`
asserts the empty result **first**, then writes a `SKILL.md` into its own scratch `node_modules` the
way a module author would, which is the only way to exercise the discovery for real. If a published
module starts shipping one, that first test is what goes red.

**Provably real now, and was stub-only before.** 23 cells, four of which could not have been
reached at any lower tier at all: a successful `runtime:eval`; `--verify` seeing a text diff;
`runtime:errors` proving a runtime answered rather than that a list was empty; and `smoke` passing with
a screenshot on disk. [[0002-testing-and-evals]] §Tier 0 doubles the dev server, not the app named all
four as the cost of that boundary, and this is the tier that pays it.

**~~Still stub-only, by choice~~ — the claim, and what happened when somebody ran it** [rewritten
2026-08-28, wave 31]. This paragraph used to read: *`install` adding a package, `start`, `dev`
attached, `inspect:config-plugins`, `skills:*`, `agents:setup`, the forwarded set. Each is argv
assembly or filesystem work with no second process boundary, which is exactly what the stub tier is
good at. These are `open`, not gaps.* Every one of them is `filled` now, in the `live-project`
column. The paragraph was wrong in a way worth keeping on the page, because it is the same mistake
this whole document is about, one boundary further in.

**Five findings, F130–F134, and none of them is in the argv.** The premise was that these commands
*assemble* rather than *converse*, so a stub is a faithful double. What the runs showed is that four
of the five defects are in **reading what came back**, and the fifth is in a sentence about what the
reading meant.

- **F130.** `install --check --json` dropped the Expo CLI's report on the only run that has an answer
  in it. The CLI prints the *passing* report on one line and the *failing* one pretty-printed, and the
  parse read one line at a time. The stub had been handed a single-line report for **both** cases, so
  the double was of what this code accepted rather than of what the CLI writes. That is the sharpest
  instance of §The rule this states in the whole file: the fixture was written from the type, and the
  tool on the other side has two shapes.
- **F131.** `skills:sync --json` answered `linked: []`, `removed: []` for a run that could not link a
  skill because the user owns the name. The warning was prose on stderr, and the object read as
  "nothing to do".
- **F132.** `inspect:config-plugins` reported `1 declared` for a config declaring three, naming
  neither of the two `_internal.pluginHistory` has no entry for.
- **F133.** The same command answered a broken plugin entry with a `Why:` line of pure stack frames,
  because a thrown Node error puts its message first and the tail heuristic took the last ten lines.
- **F134.** `install expo-haptics` printed `impact: "native-module"`, `ships an ios/ directory`, and
  "Only JavaScript changed" in one object.

**And two facts a stub could not have had.** A real `expo install expo-build-properties` **rewrites
the caller's `app.json`** ("Added config plugin: expo-build-properties"), which is the only way the
classifier's own `is listed in the app.json plugins` reason is reachable at all. And a real
`bundledNativeModules.json` is what makes `expo-haptics` a `native-module` whose action is `reload`,
the exact row that made F134's sentence a contradiction. Neither is argv.

**What is genuinely `open` in this column now** is `dev` attached, which `start` covers with the same
subprocess and a smaller wrapper, and the rows whose answer is about a runtime (`n/a — no device`).

**Unreachable, and worth saying out loud.** Build creation, which is impossible in v1.
`login`/`logout`/`register`, because a suite must not mutate the machine's session. The `/message`
reload broadcast on a cloud simulator, which is upstream and is the narrowed remains of S11.
`expo start --tunnel` on this machine at all, because `@expo/ngrok` exits 1. And Windows at the live
tier. A claim that the v1 surface is "fully tested live" would be wrong about every one of these,
which is why they have rows.

**The Android column split in two, and the half that was missing was the app** [added 2026-08-28,
wave 29]. `live-android` said `unreachable — no debugger` in nine cells, and that was read for three
waves as a fact about Android. It is a fact about **Expo Go**. The same nine commands on a
development build on the same emulator are `filled` in the `live-devclient` column: `runtime:eval`
returning 2, `runtime:tap`'s three bands, a `--verify` diff, `runtime:type`, and `smoke --android`
at exit 0 with all eight phases `ok`.

Nothing in the CLI changed to make that true, and that is the result. The refusal is reached by asking
the runtime what it carries rather than by knowing the platform, so the design was already right and
only the measurement was missing. Filling the column cost six findings. **F120**, **F122** and
**F126** were fixed in the wave; **F121**, **F123** and **F125** were left open for a contract
decision and all three fixed in **wave 30** [2026-08-28]. Three of the six are reachable only through
a dev-client plan, because a development build makes the plan's **last step a build rather than a dev
server**, and every assumption `dev` makes about that step was written for `expo start`.

**The Android column was the emptiest row in this table, and filling it cost seven findings**
[added 2026-08-27, wave 25]. `Android, anywhere` read `unreachable today — the harness has no Android
gate yet`, and that row was carrying more than it looked like. **F100**, **F101** and **F105** were
three commands reading the iOS app while reporting about Android. **F102** was `wasRunning: true` on
no evidence. **F103** was three follow-up builders dropping the platform flag. **F104** was advice an
Android caller cannot follow, and **F107** is the one gap left open.

Every one of them needed two platforms attached to one dev server to see. That is a state no other
suite in this tier can reach and no stub can double: the stub tier has a `no-debugger` socket, and
what it has not got is a *second* socket that answers. The two `--android` rows that were already
green stayed green, which is the other half of what a column is for.

**The cloud column is `runnable`, and its expectations came from a live run rather than from a type**
[rewritten 2026-08-27, after wave 19 landed]. Wave 19 changed what a cloud reload *is*: a two-verb
relaunch verified by `verifiedBy: "dev-server-bundle"`, with `commandSocketClients` beside
`appsConnected` because the two disagree exactly there. It also changed how the dev server becomes
reachable at all, because the tunnel this column originally assumed does not start on this machine.
Both rewrites were made against wave 19's captured payloads (`wave19-live/`) rather than against the
new source. The distinction matters for the same reason this whole audit does: a test written from a
type pins what somebody meant, and a test written from a captured payload pins what happened. The
column stayed `runnable` until somebody had run it, because a row filled by its own author's
confidence is the thing the `runnable`/`filled` split exists to make impossible.

**Wave 23 ran it, and the split earned its keep** [2026-08-27, its three sessions, taking the suite
from 4/7 to 6/7;
[[0022-live-tier]] §What the first four runs of it found]. Every red was a defect: four of them (F96,
F97, F98, F99), all fixed in that wave. The column's *premises* moved too, which is the part worth
carrying here. **Three of the four facts the suite was built on were about the state of one session
rather than about cloud sessions.** A session started `--expo-go` but never opened on the project holds
no command-socket client and shows no attach; one started with `--open-url` holds both. So `method:
"device"` was never a property of the cloud, and neither was S11. The rows below are corrected, and
`live-cloud` is **`runnable` still**, for the narrowest possible reason: the last assertion was fixed
against the third run's artifact with the session budget spent, so the corrected suite is a suite that
has not been run.

**Found by filling the columns** — two, both unreachable from any tier below
([[0022-live-tier]] §The findings this tier arrived with):

- **F93.** `status --explain` reports bun's install progress as EAS's answer about the caller's builds,
  on 3 of 6 runs. Same class as bug 3 below, one process boundary further out. It is also the fifth
  time this audit has found that **the reason a lookup prints is whatever the tool on the other side of
  the spawn last said**, which is a pattern now rather than an incident. What is new is that the tool
  on the other side is this CLI's *own* choice of package runner rather than something it found on the
  machine.
- **F94.** Every uncaught exception exits **7**, the code the exit table reserves for needs-human, with
  a raw Node stack and no envelope. The `uncaughtException` handler rethrows everything it does not
  recognise. No fixture can produce the input, because the crash observed came out of Node's socket
  layer, so this row could not have been filled at any lower tier and was not a gap anybody could have
  closed there.

## The bugs

Each was found by a test written before the fix, and each is a case no unit test could have
produced on its own. The tool on the other side of the spawn is the variable.

1. **`dev` reported an EAS stop with the Expo CLI's code and the Expo CLI's prose.**
   `stopPromptFor` spelled `code: 'EXPO_NEEDS_INPUT'` for every recognised stop, so an `eas build`
   that stopped for a login exited 7 carrying `EXPO_NEEDS_INPUT` and a message reading *"the Expo
   CLI asks before it does something it cannot decide"* with a `How:` line about `exagent dev`
   flags. The `needsHuman` block was right, and said `npx eas login`. The code and the prose beside
   it were not, which is worse than either being wrong alone. [[0015-backend-selection-and-config]]
   §Running an `eas` step is the paragraph that says these are different scenarios, and the registry
   already held the right code for each. Fixed: the row's own code stands, and the sentence names
   the CLI that stopped.

2. **`dev` quoted a wrapper's panic under "What the tool printed".** `src/utils/wrapperCrash.ts`
   exists so that a shim, a stale link or a binary from another project under the name `expo` or
   `eas` is *named* rather than quoted, and `planStepFailedError` did not apply it. Fixed by
   carrying the resolved binary path on the step failure, which is the fact that resolves it and
   which nothing had.

3. **`status --explain` reported a wrapper's panic as EAS's answer about the caller's builds.**
   `lookUpCachedBuildAsync` never fails a command. Every failure is an `unknown` with a `reason`,
   and that reason is printed as what the service said. On the machine this was written on, `eas` is
   a shim, and the reason read `thread 'main' panicked at src/main.rs:41:9:`.

4. **`status --explain --build <id>` did the same, plus advice about neither problem.** The error's
   `How:` line said to check the build id and the account's sign-in.

5. **`smoke --cloud` walked the caller off the backend they chose.** `buildSmokeFollowUps` had no
   notion of `--cloud`, so a cloud run that found no session was answered with
   `npx exagent navigate / --ios`, described as *"this is what opens one on a booted device"*, and
   with `npx exagent smoke --ios`. A host that reached for the cloud is very often a host with no
   booted device at all. `src/followups/reload.ts` already carried the flag and this did not. The
   rule is the one the `platform` field's own comment states ("a re-run that drops the platform is a
   different run", F58) applied to the other half of "which device is this run about".

6. **`NO_PROJECT` was a dead end.** The most common wrong-directory failure there is, answered with
   one clause: *"Project root directory not found"*. No reason, no next step, and a null
   `suggestedCommand`, so the `Try:` line an agent reads for its recovery was empty.

## What is still not tested, and why

Recorded rather than fixed, because each is either a design question or a boundary this tier cannot
cross.

- ~~**`dev` in a directory that is not an Expo app plans `expo install expo-dev-client`.**~~
  **Closed** [2026-08-26]. The design call and the implementation are [[0020-not-an-expo-app]]. The
  decision table read "no `expo` dependency" as "lacks a dev client", so an agent that ran `dev` one
  directory too high got a plan to install packages into the wrong repository. It is a `not-expo-app`
  row above every other now, nine commands stop at the entry with `NOT_EXPO_APP`, and the skipped test
  in `e2e/__tests__/project-shapes-test.ts` is unskipped with eight rows beside it.
- ~~**Exit 21 is reserved and reachable from nothing.**~~ **Closed as documentation** [2026-08-26].
  [[0010-agent-conventions]] §Exit codes says so in the table and in the paragraph under it, and
  `src/__tests__/exitCodes-test.ts` sweeps the loadable source so the claim cannot quietly stop being
  true. Nothing was wrong with the code: `build:wait` is deferred, and a declined plan exits 0 by
  explicit decision ([[0008-guardrails]] §Plan-with-cost dry run). The constant stays defined.
- ~~**A successful `runtime:eval` is unreachable at tier 0**~~. Still true *at tier 0*, and no longer
  untested: **closed** [2026-08-27] by `e2e-live`, where it returns `2` from real Hermes
  ([[0022-live-tier]] §live-local). The tier-0 statement stands unchanged from
  [[0002-testing-and-evals]] §Tier 0 doubles the dev server, not the app. What changed is that the
  boundary now has a tier on the other side of it rather than a note. What the earlier wave added at
  tier 0 is the third inspector state, a socket that answers every method `-32601`. That is a double
  for a runtime having no debugger rather than for a runtime, and it is what makes the 22-not-0 rule
  testable at this tier.
- ~~**No live `eas build`, `eas deploy` or simulator session runs anywhere in this suite**~~.
  **Closed for `eas deploy` and the read side, and reclassified for the rest** [2026-08-27].
  [[0022-live-tier]] is the tier, §The live matrix is the accounting, and `pnpm test:live:eas` runs
  `deploy --web` and the whole build read side against staging on demand. Two parts do not close and
  are now recorded as unreachable rather than untested: **build creation**, which no v1 command does,
  and the **cloud session**, whose suite is written and not yet run. §A flag is not shipped until it has
  run against the published binary is still a manual step for the *published version*. The live tier
  runs the published *surface* from this tree, which narrows what that run has to discover rather than
  replacing it.
- **The `--cloud` platform mismatch.** A session has one platform; `smoke --cloud --android` against
  an iOS session is refused by `navigate`'s own path and is not asserted for `smoke`. `live-cloud`
  asserts the `navigate` half; the `smoke` half is still open.
- **Windows.** Everything here runs on posix in the local loop; the `tier0-windows` job is what
  covers the `.cmd` shim half, and the space-in-path suite is the one most likely to find something
  there.

## The rule this states

**Every backend a command has is a separate row of its test matrix, and the row is only filled by a
test that ran the command against a stub of that backend's binary.** A test that pins the plan, the
argv or the options an EAS run would use fills no row. The four EAS bugs above were all in code that
had a passing unit test one call frame away.
