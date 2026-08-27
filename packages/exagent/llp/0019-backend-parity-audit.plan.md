# 0019: Backend Parity — the Coverage Matrix, and What It Found

**Type:** Plan
**Status:** Draft
**Systems:** the e2e tier (`e2e/`); the live tier (`e2e-live/`); the EAS-backed call sites (`src/dev/devAsync.ts`, `src/impact/buildCache.ts`, `src/impact/compare.ts`, `src/status/easBuilds.ts`, `src/device/cloudSimulator.ts`, `src/passthrough/auth.ts`, `src/deploy/`); the follow-up ladders (`src/followups/`)
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-26 (live columns added 2026-08-27)
**Related:** [[0002-testing-and-evals]], [[0022-live-tier]], [[0015-backend-selection-and-config]], [[0016-v1-scope]], [[0010-agent-conventions]], [[0005-runtime-loop-tools]], [[0008-guardrails]]

## Summary

[[0016-v1-scope]] fixed what ships. This is the audit that asks whether it is *tested* — specifically
whether the two backends behind the v1 surface are tested at comparable depth. They were not, and
the asymmetry was not random: **everything that runs on this machine had an e2e suite, and most of
what runs somewhere else had a unit test and a plan.**

Five real bugs came out of closing it, all of them in code that no test had ever executed end to
end. Four are on the EAS side; the fifth is a follow-up ladder that walked a caller off the backend
they chose.

The general shape, and the thing worth carrying forward: **a backend is not a flag, it is a second
process boundary.** A command that "supports EAS" spawns a different binary, reads a different
failure vocabulary and needs a different recovery sentence, and none of that is exercised by a test
that pins the *plan* an EAS run would produce.

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
**stub** of its backend's binary. This one asks the next question, which is the one §What is still not
tested left open in as many words: **has it ever run for real, and where is the evidence.**

One row per v1 command, four columns. What each cell means, and the distinctions are load-bearing:

- **`stub-e2e`** — a whole `exagent` process ran against a stub `expo`/`eas`/dev server (`e2e/`).
- **`live-local`** — ran against a real Metro, a real booted iOS simulator, real Expo Go, real Hermes.
- **`live-eas`** — ran against the real EAS service on staging.
- **`live-cloud`** — ran against a real EAS Simulator session.
- **`filled`** — asserted by a run somebody has seen green. Green means green on macOS/iOS/Expo Go.
- **`runnable`** — the test exists and nobody has run it. **Not evidence.** Every `live-cloud` cell is
  this today: the suite was written in wave 20 and the staging cloud-session budget belonged to another
  wave. It becomes `filled` when the lead runs it.
- **`open`** — this tier could test it and does not yet. The reason is in the cell.
- **`n/a`** — the command has no such backend, so the column is not a gap.
- **`unreachable`** — the tier cannot cross the boundary. Reason in the cell, and these are the rows
  that matter most, because they are the ones a "fully tested" claim would be quietly wrong about.

| Command | stub-e2e | live-local | live-eas | live-cloud |
| --- | --- | --- | --- | --- |
| `new` | filled | **filled** — scaffolds + installs, per run | n/a | runnable (its own scaffold) |
| `install --check` | filled | **filled** — real registry resolution, `check.report` non-null (F76) | n/a | n/a |
| `install` (adds a package) | filled | open — every run would install from the registry; the `--check` path proves the wrapper | n/a | n/a |
| `typecheck` (fresh project) | unit only — a stub `expo` writes no `expo-env.d.ts` | **filled** — exit 20 + `generatedTypes` naming the file (F64) | n/a | n/a |
| `typecheck` (after `dev`) | filled | **filled** — same command, exit 0, `generatedTypes: null` | n/a | n/a |
| `doctor` | filled | **filled** — real expo-doctor, `parse: "full"`, 21 checks, protocol exit code (F68) | n/a | n/a |
| `status` (report) | filled | **filled** — real 40-hex fingerprint from the resolved `@expo/fingerprint` | **filled** — `auth` agrees with `whoami` (F65) | n/a |
| `status --assert` | filled | **filled** — 22 on a project with no recorded build | n/a | n/a |
| `status --explain` (build lookup) | filled | n/a | **filled** — real build found by fingerprint, **+ found F93** | n/a |
| `status --explain --build <id>` | filled | n/a | **filled** — the id is echoed (F66) | n/a |
| `dev --detach --wait-ready` | filled | **filled** — and the port still answers 8 s later (F61) | n/a | n/a |
| `dev` (attached, blocking) | filled | open — the suite has no use for a foreground server; `--detach` is the agent-facing shape | n/a | n/a |
| `dev` (EAS plan run) | filled (wave 19) | n/a | unreachable — the plan's EAS step is a native build, which no v1 command creates | n/a |
| `dev --tunnel` | filled | **unreachable on this machine** — `@expo/ngrok` exits 1 (`Tunnel URL not found` ×12, then `Cannot read properties of undefined`) [wave19-live] | n/a | n/a — `live-cloud` uses a **proxy origin** (`EXPO_PACKAGER_PROXY_URL` + `tuft host`) instead, which is the path wave 19 proved |
| `dev` with a **proxy origin** | none — a stub dev server advertises nothing | open — `live-local` has no use for a public origin | n/a | **runnable** — `EXPO_PACKAGER_PROXY_URL` + `tuft host add`, and the origin is checked before a session is billed |
| cloud session start (`--expo-go`) | n/a | n/a | n/a | **runnable** — `eas simulator … --expo-go`; without the flag the session has no app and every `open` is `LSApplicationWorkspaceErrorDomain error 115` [wave19-live] |
| `dev:logs` | filled | **filled** — reads the real bundler error the gates refused on | n/a | n/a |
| `dev:stop` | filled | **filled** — process gone, port free after | n/a | n/a |
| `start` | filled | open — `expo start` verbatim; `dev` covers the same subprocess with a plan around it | n/a | n/a |
| `navigate` (local) | filled | **filled** — `simctl openurl`, route check, `attached: true` | n/a | n/a |
| `navigate` (bad route) | filled | **filled** — exit 1, `ROUTE_NOT_FOUND`, real sitemap in the message | n/a | n/a |
| `navigate --print-url` | filled | open — the URL is asserted by the `navigate` row; `--print-url` adds no backend | n/a | **runnable** — `beforeAll` uses it to prove the public origin took (`hostType: "tunnel"`) before billing a session |
| `navigate --cloud` | filled | n/a | n/a | **filled** — `deviceBackend: "cloud"`, the URL on the public origin, the `open` at exit 0, and `attached: true` in 206 ms on a session started with `--open-url` [2026-08-27]. `attached` is asserted permissively — a cold first bundle over a proxy may outlive the wait — but a run that does not attach must have looked for the S10 dialog |
| `runtime:eval` | filled (6, failure paths only) | **filled** — returns `2` from real Hermes; the row §What is still not tested called unreachable | n/a | unreachable — no `--cloud` on `eval` (correct), and S11 anyway |
| `runtime:errors` | filled (6) | **filled** — `runtimeReadable: true` from a real debugger | n/a | unreachable — same |
| `runtime:tree` | filled | **filled** — `disabled`, `groupSize`, `placeholder` on real nodes (F69, F70) | n/a | unreachable — same |
| `runtime:tap` (3 refusal bands) | filled | **filled** — disabled / ambiguous / no-handler, all 20 | n/a | unreachable — same |
| `runtime:tap --verify` | unreachable — no CDP at tier 0 | **filled** — interpolated **and** single-string Text in the diff (F63) | n/a | unreachable — same |
| `runtime:type` | filled | **filled** — types into a real input; `editable={false}` → 20 | n/a | unreachable — same |
| `runtime:reload` (local) | filled | **filled** — `verifiedBy: "message-socket-peers"`, real reconnect | n/a | n/a |
| `runtime:reload --cloud` | filled (wave 19) | n/a | n/a | **filled** — exit 0, `verifiedBy: "dev-server-bundle"`, `iOS Bundled 40ms`, in 18.5 s and 48 s on two runs [2026-08-27]. **Not** wave 19's field-by-field contract: `method: "device"` was that session's state, and the assertion is now the *ladder* — rung 1 always taken and always reporting what the socket held, the relaunch reloading from either state |
| `runtime:reload --cloud --route` | filled | n/a | n/a | **filled** — `exp://<public-host>/--/lab` opened and echoed, exit 0 in 18.5 s and 26.5 s [2026-08-27]. The landing open of a socket-rung reload goes through the third URL path F96's audit found, so this row is what would have caught it |
| `runtime:stop` (local) | filled | **filled** — `wasRunning: true`, Expo Go terminated on the named udid | n/a | n/a |
| `runtime:stop --cloud` | filled | n/a | n/a | **runnable** — `wasRunning` may be null and that is honest (S13), and the session is still listed afterwards (S12) |
| `smoke` (pass) | unreachable — the runtime and screenshot phases need an app | **filled** — 8 phases, screenshot on disk | n/a | n/a |
| `smoke` (broken bundle) | filled | **filled** — 20, later phases skipped, `lab.tsx` named | n/a | n/a |
| `smoke --cloud` | filled (2) | n/a | n/a | **filled** — exit 22 at the `runtime` phase, `deviceBackend: "cloud"`, a 64 KB PNG through the session's controller, every follow-up on `--cloud` [2026-08-27]. It found F96 (exit 1 refusing its own dev server) and F98 (`deviceBackend: null` beside that PNG) |
| break-and-fix cycle (6 gates) | partial — the refusal only | **filled** — 6 gates to 20 and back to green, no restart (F62) | n/a | n/a |
| `deploy --web` | filled | n/a | **filled** — URL 200, HTML title, entry bundle serves the fixture's marker | n/a |
| `deploy --native` (launch) | filled | n/a | open — it runs `eas build`, which bills a worker; one deploy per run is the budget | n/a |
| `whoami` | filled | n/a | **filled** — staging session file named (S6), `--json` object | n/a |
| `login` / `logout` / `register` | filled | unreachable — they mutate the machine's session, which a test suite must not | unreachable — same | n/a |
| `inspect:build-log` (binary in) | filled | n/a | **filled** — a real brotli-served EAS log → 22 (S8) | n/a |
| `inspect:build-log` (decoded) | filled | n/a | **filled** — same log decoded → phase located, line checked back against the file | n/a |
| `inspect:build-log <build-id>` | n/a | n/a | unreachable — reserved; eas-cli has no `build:logs` | n/a |
| `inspect:config-plugins` | filled | open — no backend dimension, and the stub tier runs the real config loader already | n/a | n/a |
| `skills:*`, `agents:setup` | filled | open — filesystem only; nothing about them is a second process boundary | n/a | n/a |
| forwarded `expo` set | filled | open — a forward is argv assembly, which is what the stub tier is for | n/a | n/a |
| native EAS build **creation** | n/a | n/a | **unreachable in v1** — verified: no v1 command creates one. `deploy --native` runs create-launch; `inspect:build-log` takes no id | n/a |
| Android, anywhere | filled (posix) | **unreachable today** — the suite is iOS/Expo Go; the harness has no Android gate yet | n/a | n/a |
| Windows | filled (`tier0-windows`) | unreachable — no simulator, and this tier is macOS-gated | unreachable — same gate | unreachable — same |
| CDP on a cloud simulator | n/a | n/a | n/a | **S11 amended, 2026-08-27** — the app registers a debugger target *and* a command-socket client once the project is loaded, so CDP is reachable there; `smoke --cloud`'s `runtime` phase still answered `No target found.` at that moment, which is a timing question rather than the wall S11 described. What is upstream and unreachable is narrower: the `/message` reload broadcast does not reload Expo Go there, and takes the app's socket client with it |

### What the live columns changed

**Provably real now, and was stub-only before** — 23 cells, and the four that could not have been
reached at any lower tier at all: a successful `runtime:eval`; `--verify` seeing a text diff;
`runtime:errors` proving a runtime answered rather than that a list was empty; and `smoke` passing with
a screenshot on disk. [[0002-testing-and-evals]] §Tier 0 doubles the dev server, not the app named all
four as the cost of that boundary; this is the tier that pays it.

**Still stub-only, by choice** — `install` adding a package, `start`, `dev` attached,
`inspect:config-plugins`, `skills:*`, `agents:setup`, the forwarded set. Each is argv assembly or
filesystem work with no second process boundary, which is exactly what the stub tier is good at. These
are `open`, not gaps.

**Unreachable, and worth saying out loud** — build creation (impossible in v1); `login`/`logout`/
`register` (a suite must not mutate the machine's session); the `/message` reload broadcast on a cloud
simulator (upstream; the narrowed remains of S11);
`expo start --tunnel` on this machine at all (`@expo/ngrok` exits 1); Android and Windows at the live
tier. A claim that the v1 surface is "fully tested live" would be wrong about every one of these, which
is why they have rows.

**The cloud column is `runnable`, and its expectations came from a live run rather than from a type**
[rewritten 2026-08-27, after wave 19 landed]. Wave 19 changed what a cloud reload *is* — a two-verb
relaunch verified by `verifiedBy: "dev-server-bundle"`, with `commandSocketClients` beside
`appsConnected` because the two disagree exactly there — and it changed how the dev server becomes
reachable at all, because the tunnel this column originally assumed does not start on this machine. Both
rewrites were made against wave 19's captured payloads (`wave19-live/`), not against the new source. The
distinction matters for the same reason this whole audit does: a test written from a type pins what
somebody meant, and a test written from a captured payload pins what happened. The column stayed
`runnable` until somebody had run it — a row filled by its own author's confidence is the thing the
`runnable`/`filled` split exists to make impossible.

**Wave 23 ran it, and the split earned its keep** [2026-08-27, three sessions, 4/7 → 4/7 → 6/7;
[[0022-live-tier]] §What the first three runs of it found]. Every red was a defect: four of them (F96,
F97, F98, F99), all fixed in that wave. And the column's *premises* moved, which is the part worth
carrying here — **three of the four facts the suite was built on were about the state of one session
rather than about cloud sessions.** A session started `--expo-go` but never opened on the project holds
no command-socket client and shows no attach; one started with `--open-url` holds both. So `method:
"device"` was never a property of the cloud, and neither was S11. The rows below are corrected, and
`live-cloud` is **`runnable` still**, for the narrowest possible reason: the last assertion was fixed
against the third run's artifact with the session budget spent, so the corrected suite is a suite that
has not been run.

**Found by filling the columns** — two, both unreachable from any tier below
([[0022-live-tier]] §The findings this tier arrived with):

- **F93.** `status --explain` reports bun's install progress as EAS's answer about the caller's builds,
  on 3 of 6 runs. Same class as bug 3 below, one process boundary further out — and it is the fifth
  time this audit has found that **the reason a lookup prints is whatever the tool on the other side of
  the spawn last said**, which is a pattern now rather than an incident. What is new is that the tool
  on the other side is this CLI's *own* choice of package runner, not something it found on the machine.
- **F94.** Every uncaught exception exits **7** — the code the exit table reserves for needs-human —
  with a raw Node stack and no envelope, because the `uncaughtException` handler rethrows everything it
  does not recognise. No fixture can produce the input (the crash observed came out of Node's socket
  layer), so this row could not have been filled at any lower tier and was not a gap anybody could have
  closed there.

## The bugs

Each was found by a test written before the fix, and each is a case no unit test could have
produced on its own — the tool on the other side of the spawn is the variable.

1. **`dev` reported an EAS stop with the Expo CLI's code and the Expo CLI's prose.**
   `stopPromptFor` spelled `code: 'EXPO_NEEDS_INPUT'` for every recognised stop, so an `eas build`
   that stopped for a login exited 7 carrying `EXPO_NEEDS_INPUT` and a message reading *"the Expo
   CLI asks before it does something it cannot decide"* with a `How:` line about `exagent dev`
   flags. The `needsHuman` block was right — `npx eas login` — and the code and the prose beside it
   were not, which is worse than either being wrong alone. [[0015-backend-selection-and-config]]
   §Running an `eas` step is the paragraph that says these are different scenarios; the registry
   already held the right code for each. Fixed: the row's own code stands, and the sentence names
   the CLI that stopped.

2. **`dev` quoted a wrapper's panic under "What the tool printed".** `src/utils/wrapperCrash.ts`
   exists so that a shim, a stale link or a binary from another project under the name `expo` or
   `eas` is *named* rather than quoted, and `planStepFailedError` did not apply it. Fixed by
   carrying the resolved binary path on the step failure — which is the fact that resolves it, and
   which nothing had.

3. **`status --explain` reported a wrapper's panic as EAS's answer about the caller's builds.**
   `lookUpCachedBuildAsync` never fails a command; every failure is an `unknown` with a `reason`,
   and that reason is printed as what the service said. On the machine this was written on, `eas` is
   a shim, and the reason read `thread 'main' panicked at src/main.rs:41:9:`.

4. **`status --explain --build <id>` did the same, plus advice about neither problem.** The error's
   `How:` line said to check the build id and the account's sign-in.

5. **`smoke --cloud` walked the caller off the backend they chose.** `buildSmokeFollowUps` had no
   notion of `--cloud`, so a cloud run that found no session was answered with
   `npx exagent navigate / --ios` — *"this is what opens one on a booted device"* — and
   `npx exagent smoke --ios`. A host that reached for the cloud is very often a host with no booted
   device at all. `src/followups/reload.ts` already carried the flag; this did not. The rule is the
   one the `platform` field's own comment states ("a re-run that drops the platform is a different
   run", F58) applied to the other half of "which device is this run about".

6. **`NO_PROJECT` was a dead end.** The most common wrong-directory failure there is, answered with
   one clause — *"Project root directory not found"* — no reason, no next step, and a null
   `suggestedCommand`, so the `Try:` line an agent reads for its recovery was empty.

## What is still not tested, and why

Recorded rather than fixed, because each is either a design question or a boundary this tier cannot
cross.

- ~~**`dev` in a directory that is not an Expo app plans `expo install expo-dev-client`.**~~
  **Closed** [2026-08-26] — the design call and the implementation are [[0020-not-an-expo-app]]. The
  decision table read "no `expo` dependency" as "lacks a dev client", so an agent that ran `dev` one
  directory too high got a plan to install packages into the wrong repository. It is a `not-expo-app`
  row above every other now, nine commands stop at the entry with `NOT_EXPO_APP`, and the skipped test
  in `e2e/__tests__/project-shapes-test.ts` is unskipped with eight rows beside it.
- ~~**Exit 21 is reserved and reachable from nothing.**~~ **Closed as documentation** [2026-08-26] —
  [[0010-agent-conventions]] §Exit codes says so in the table and in the paragraph under it, and
  `src/__tests__/exitCodes-test.ts` sweeps the loadable source so the claim cannot quietly stop being
  true. Nothing was wrong with the code: `build:wait` is deferred, and a declined plan exits 0 by
  explicit decision ([[0008-guardrails]] §Plan-with-cost dry run). The constant stays defined.
- ~~**A successful `runtime:eval` is unreachable at tier 0**~~ — still true *at tier 0*, and no longer
  untested: **closed** [2026-08-27] by `e2e-live`, where it returns `2` from real Hermes
  ([[0022-live-tier]] §live-local). The tier-0 statement stands unchanged from
  [[0002-testing-and-evals]] §Tier 0 doubles the dev server, not the app — what changed is that the
  boundary now has a tier on the other side of it rather than a note. What the earlier wave added at
  tier 0 is the third inspector state — a socket that answers every method `-32601` — which is a double
  for a runtime having no debugger rather than for a runtime, and is what makes the 22-not-0 rule
  testable at this tier.
- ~~**No live `eas build`, `eas deploy` or simulator session runs anywhere in this suite**~~ —
  **closed for `eas deploy` and the read side, and reclassified for the rest** [2026-08-27]:
  [[0022-live-tier]] is the tier, §The live matrix is the accounting, and `pnpm test:live:eas` runs
  `deploy --web` and the whole build read side against staging on demand. Two parts do not close and
  are now recorded as unreachable rather than untested: **build creation**, which no v1 command does,
  and the **cloud session**, whose suite is written and not yet run. §A flag is not shipped until it has
  run against the published binary is still a manual step for the *published version* — the live tier
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
argv or the options an EAS run would use fills no row: the four EAS bugs above were all in code that
had a passing unit test one call frame away.
