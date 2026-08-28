# 0005: Runtime Loop Tools — Seeing and Driving the Running App

**Type:** RFC
**Status:** Draft
**Systems:** `exagent` runtime commands (`src/runtime/`, its shared preflight `src/runtime/preflight.ts`, `src/navigate/`, `src/runtime/reload/`, `src/project/routes.ts`); `exagent smoke` (`src/smoke/`, `src/device/screenshot.ts`); the cloud device layer (`src/device/cloudSimulator.ts`); the Android device layer (`src/device/adb.ts`, `src/navigate/adbReverse.ts`, `src/runtime/targetPlatform.ts`, `src/runtime/targetLiveness.ts`, `src/dev/logErrors.ts`); `@expo/cli` CDP debugging layer and dev-server message socket; `expo-router` link handling; LogBox
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0016-v1-scope]], [[0017-deferred-commands]]

## Summary

Tools that let a driving agent observe and manipulate the running app, closing the verify loop that text-only agents cannot close. They ship as self-serve `exagent` CLI commands [confirmed — Kudo, 2026-08-22], and `expo-mcp` is not a dependency. All items are [inferred] unless tagged. The named runtime hooks exist today [observed where noted].

## Candidates

- **Runtime eval.** The CLI already speaks CDP to the app (`packages/@expo/cli/src/start/server/metro/debugging/messageHandlers/`: `VscodeRuntimeEvaluate`, `VscodeRuntimeCallFunctionOn`, `VscodeRuntimeGetProperties` [observed]). Expose it as a tool: run JS inside the live app, read state, trigger navigation, assert on values. It turns "I think the fix works" into "I evaluated it in the app". Note: reaching the CDP endpoint from outside the CLI process must respect the process boundary, which means connecting over the dev server's protocol rather than via imports.
- **Structured red-screen feed.** LogBox symbolication exists in the CLI (`log-box/LogBoxSymbolication.ts` [observed]). Deliver every runtime error as a structured event, with the message, the symbolicated stack, and the source file and line.
- **Network inspection.** A CDP `NetworkResponse` handler exists [observed]. Expose the app's network log so failing API calls are debuggable without guessing.
- **Deep-link navigation.** Combine `expo_router_sitemap` [observed — existing expo-mcp tool] with URI-scheme launching, so "open route /profile/42 on the simulator" works. That enables per-route verification and screenshot sweeps.
- **Performance probe.** `expo-app-metrics` and `expo-insights` exist as packages [observed]. Startup time, slow frames and re-render counts mean "why is this list janky" starts from data.
- **Cross-platform verification sweep.** Boot iOS, Android and web in parallel, screenshot the same routes, and report divergence. Uniquely valuable for a universal framework.

## Composite loops these enable

- **Log triage** [confirmed — feature list, 2026-08-18]: a red screen, then `collect_app_logs` or the red-screen feed, then a symbolicated source location, then the agent's fix, then verification by screenshot.
- **Verified UI changes** [confirmed — feature list, 2026-08-18]: edit, reload, `automation_take_screenshot`, compare against the request, iterate.

## Implemented in v1 as

Home correction [confirmed — Kudo, 2026-08-22]: these are **self-serve in `packages/exagent`** as CLI commands. The expo-mcp implementation round was abandoned unpushed and the code ported over. Ported surface [observed — 2026-08-22]: `exagent runtime eval <expr>` (an app exception exits 1), `exagent runtime errors [--duration]`, and `exagent navigate <route> [--scheme] [--ios|--android]`. They were renamed on 2026-08-22 to the colon forms `runtime:eval`, `runtime:errors` and `runtime:network`, and the space forms still resolve. `runtime:network` was deferred out of v1 on 2026-08-26; see below and [[0017-deferred-commands]]. The port added 149 new jest tests, for 431 total. It was live-verified twice, as MCP-shaped tools and again as exagent commands against a real SDK 57 app, covering the eval value and exception, error collection with bundle-mapped stacks, and deep-link navigation. The original build and live verification notes [observed — 2026-08-22]:

- `runtime_evaluate` — `CdpClient.evaluateAsync` (Runtime.evaluate, returnByValue + awaitPromise + exceptionDetails); app output fenced with untrusted-content markers per [[0008-guardrails]], including marker-forgery neutralization.

  **Correction — CDP cannot settle a React Native promise** [observed — SDK 57 / RN 0.86.2 in Expo Go on iOS, 2026-08-23; friction run 2, F21]. `awaitPromise` is inert here. CDP only awaits a result the runtime tagged `subtype: "promise"`, and React Native replaces the engine's `Promise` with the `@react-native/js-polyfills` implementation, which the inspector sees as an ordinary `Object`. `Runtime.evaluate("Promise.resolve(42)", {returnByValue: false})` answers `{type: "object", className: "Object", objectId: "1"}` with no subtype, and with `returnByValue` it answers `{_A: null, _x: 0, _y: 1, _z: 42}`, the polyfill's internal state. So every `fetch`, AsyncStorage read and store selector came back as an opaque object, and `--no-await-promise` printed the same thing.

  It is settled **in the app** instead (`src/runtime/promiseSettling.ts`). The expression is wrapped so the app tests the result for `typeof v.then === 'function'`, subscribes to it, parks `{state, type, value | reason}` on a global under a per-run nonce, and returns a marker keyed and valued by that nonce. The CLI then polls that global over the same debugger connection until it settles or `--timeout` runs out. Five properties this holds to. A non-thenable is returned by the wrapper unchanged, so it costs one round trip and reports the runtime's own `type`. The settled value carries the type the app read off it, because CDP never sees the value on its own. A rejection is its own outcome (`promise.state`) rather than a `threw`, and it exits 1. A promise still pending at the deadline is `RUNTIME_PROMISE_PENDING`, and the app is told to drop what it was holding. And `--no-await-promise` parks nothing and reports the pending promise at exit 0.

  Two things the live round taught that the design did not. The wrapper puts the expression in an assignment, so a *statement* like `var x = 1` stops compiling, and the answer is re-running it exactly as written, which is the pre-wrapper behaviour. And **Hermes does not raise a `SyntaxError`** for that. It answers `Compiling JS failed: 2:25:invalid expression, sourceURL:`, so matching only `SyntaxError` left the fallback unreachable on the one runtime this command talks to. The captured frames are `src/runtime/__tests__/fixtures/live-promise-frames.json`.
- `read_runtime_errors` — `CdpRuntimeErrorCollector` capturing `Runtime.exceptionThrown` + console.error over a window; distinguishes "no errors" from "app unreachable".

  **Symbolication and gating** [observed — 2026-08-23; friction run 2, F25]. Metro applies its source maps to what it *prints*, not to what it sends over CDP. So every frame arrived as an offset into the bundle with roughly 400 characters of transform options attached: about 2 KB per error, with no project file anywhere. The dev server can map them. `POST /symbolicate` with `{stack: [{file, lineNumber, column, methodName}]}` answers one frame per frame, in order, with `file` an absolute path on disk. Three details are load-bearing. `lineNumber` is 1-based and `column` is 0-based both ways, since CDP is 0-based in both and rendered output is 1-based in both. `file` must carry the whole bundle URL including the query string, because Metro's lookup is exact string equality and the query selects the bundle's options. And a frame it cannot map comes back unchanged rather than null, with Expo's `customizeFrame` hook nulling its line and column and setting `collapse: true`. Failure of any kind falls back to the frames that were sent, with the query string trimmed, because symbolication improves a report rather than being a precondition for one.

  A fourth detail only live use showed. React Native reports a thrown error through the console path as **one string** holding the message *and the error's own frames*, while the `stackTrace` CDP sends alongside describes the console machinery that reported it (`console.js`, `backend.js`, `ExceptionsManager.js`). The frames that name the project are the ones inside the message, so they are lifted out of it and symbolicated. Live proof: `Error: BOOM_PROJECT_FRAME` and `at wave3bBoom (src/app/index.tsx:101:18)`, matching what LogBox showed on the device.

  Exit-code gating: the command stays **0** whatever it collects, because an empty window means "nothing happened while I watched" rather than "the app is healthy", which is the opposite of what `dev:wait` claims when it exits 0. `--fail-on-error` is the opt-in that exits 20 on a non-empty window, so an agent can gate on it the same way. Only `errors` has it, because a failed request is something `network` reports about the app rather than a verdict on it.
- `navigate_to_route` — a device-side deep link (`simctl openurl` or `adb am start`), with static scheme resolution from app.json, Expo Go `exp://<host>/--/<route>` support, and an explicit `scheme` override.

64 new unit tests, for 122 total in the package, against MockWebSocket and mocked spawns.

**Verified live** [observed — 2026-08-22, SDK 57 app in Expo Go on an iOS 26.5 simulator]. `evaluateAsync` returned real values, state and exceptions from Hermes. The error collector captured an injected uncaught error, delivered via RN's console path rather than `Runtime.exceptionThrown`, which is why having both capture sources is required. Deep-link navigation landed the app on the `/explore` route, screenshot-confirmed. The live round also found and fixed a blocking bug the unit tests could not see: **Metro's inspector proxy rejects CDP WebSocket handshakes without a same-origin `Origin` header (401)**, so all default connection paths now send it (`createInspectorWebSocket`).

**Network inspection — deferred from v1 (2026-08-26).** `exagent runtime:network` is out of the v1
surface. The CDP Network domain is unstable in React Native and effectively unavailable on Expo Go,
so the command's most common outcome was an explanation of why it could not answer. Everything that
was built and verified is now in [[0017-deferred-commands]]: the request, response and failure
correlation, the three outcome counts, and the two-refusal classification that `Network.enable`
needs. The code is on the reference shelf at `src/deferred/runtime-network/`. The rest
of this LLP ships. The rule that came out of it and outlived it is in [[0010-agent-conventions]] §The
third: a command that reports on the app does not gate on what it reported.

**Android pass** [observed — 2026-08-22, headless emulator plus the Expo Go 57 APK]: `navigate --android` works end to end, via adb reverse plus an `exp://` deep link, screenshot-confirmed. The hard finding: **Expo Go for Android ships a Hermes without any CDP debugger** ("HermesRuntime[RNBridgeless] does not support debugging over the Chrome DevTools Protocol" [observed via Log.entryAdded]). `Runtime.enable` and `Network.enable` merely ack, with no evaluate and no console or network capture. Three consequences: the target selector no longer drops such targets, skipping only on transport failure and ranking -32601 targets behind answering ones; `runtime eval` explains it with `RUNTIME_EVALUATE_UNSUPPORTED`; and errors and network connect but report empty windows there. Runtime capture on Android needs a development build [inferred — not yet verified].

> **Correction — the `adb reverse` in that sentence was done by hand** [observed — friction run 6
> (Android), 2026-08-24]. The 2026-08-22 pass reversed the port at the shell before running
> `navigate --android`, and the parenthesis above reads as though the command did it. It did not:
> `exagent` never ran `adb reverse` anywhere, and a run without the manual step landed Expo Go on
> `ErrorActivity` with `am start` exiting 0 and the command exiting 0. See §Android below, which is
> where everything this section got wrong or half-right is settled.

Still open: Android capture via a dev build, performance probe, cross-platform sweep. ("No traffic"
versus a silently-unsupported Network domain is settled below, in §Android.)

## One preflight for the runtime family

Added in wave 21, on Kudo's directive: "same for `runtime:*` commands — if there's no connected app, we
should disable or exit the command call early" [confirmed — Kudo, 2026-08-27].

Every command in this group needs the same two facts before it does any work: a dev server, and
something connected to it. Each one used to establish them its own way, in its own order, with
its own words. `src/runtime/preflight.ts` is now the one place that asks, and the one refusal they all
print.

### What each command needs, which is not the same thing

| Command | Needs | Why |
|---|---|---|
| `runtime:eval`, `runtime:errors`, `runtime:tree`, `runtime:tap`, `runtime:type` | a **debugger target** | there is nothing to read or drive without a JavaScript runtime, and nothing they report means anything |
| `runtime:reload` | a **dev server** | it can *start* an app, so "no app is connected" is a rung of its ladder; a missing dev server is a refusal, because a reload makes the app fetch the served bundle and stopping it there replaces a stale screen with no screen |
| `runtime:stop` | a **device** | it acts on a device, and an app can be running with no dev server behind it at all |

The third row is a decision, and it is the one that looks wrong at first. The directive says "if
there's no connected app… exit early", and `runtime:stop` deliberately does not. Its subject is a
**state**, not an act. llp/0010 §The seventh and eighth: the stop commands makes an app that was
already stopped a success, so that an agent stopping an app twice does not have to special-case the
second run. Refusing there would fail the very run that convention exists to make boring. So `stop`
reads the connection like everything else, with `need: 'optional'` and one shared discovery, and
requires only what it acts on. A machine with no device is told so by `resolveDeviceAsync`, in that
layer's own words, with `xcrun simctl list devices booted` or `adb devices` to look with.

### The refusal, in one shape

Two codes, unchanged from the ones five of the commands already shipped. llp/0010 §Needs-human
protocol's rule that reclassification never renames a code applies to a *unification* too:

- **`NO_DEV_SERVER`**: nothing answered `GET /json/list` on the dev server this command was going to
  use. The dev server is probed **first**, so "no dev server on `<url>`" and "no app on a dev server
  that is running" are never conflated. An agent that could not tell them apart would restart a
  healthy dev server.
- **`NO_APP_CONNECTED`**: the dev server is running and its debugger target list is empty, or holds
  no app on the platform the caller named. F51's two shapes are kept.

Each carries three parts. What: which list is empty, and on which dev server, by URL. Why: the
request that failed, or the list that was empty and for how long it stayed empty. And How: one
ladder, in one order, of `npx exagent dev --detach`, then `npx exagent navigate /`, then
`npx exagent smoke`, which waits for the bundle and the app together. `reachTheAppLadder` is that
sentence as a function, because six copies of it had drifted into six different first steps. One of
them named a keypress in a terminal that a `--detach`ed dev server does not have (F48-5).

**`--cloud` is carried onto every command in the ladder that takes it**, and `dev --detach` becomes
`dev --detach --tunnel` there. This is the F5x/S5 rule applied to the refusal. A caller who passed
`--cloud` is on a machine whose device is in a datacenter, so a suggestion without the flag sends
them to a local simulator they have not got, and a dev server without a tunnel is one the session
cannot reach (§A cloud simulator requires a tunnel). Only `reload` and `stop` have the flag to pass.
The reading commands talk to a dev server over HTTP and do not care where the device is.

### The counts go on the wire, not only in the prose

`error.data` is a new key of the `--json` error envelope (llp/0010 §The `--json` error envelope),
always present and `null` for a failure with nothing to count. The runtime refusals fill it with
what they observed: `devServerUrl`, `devServerReachable`, `debuggerTargets`, `commandSocketClients`
and `platform`. `commandSocketClients` is null for every command that never opens `/message`, which
is all of them but `runtime:reload`. The alternative was a caller regexing `names 1 app` out of an
English sentence nobody promised.

### Two things the sweep changed, and one it did not

**The connection is asked before the bundle gate** [observed — 2026-08-27, and confirmed against the
wave-19 tip by re-running the new e2e suite on it]. `runtime:tree`, `runtime:tap` and `runtime:type`
asked their entry-bundle gate first, so with nothing connected the exit code was decided by whether
the *project compiled*: exit **20** for a broken bundle and exit **1** for a clean one, for one
situation. Nothing can be read off a screen that is not there, whatever the code on disk says, so
`1`, the code the other three commands already gave, is the answer. llp/0010's bands decide it:
nothing was attempted, so there is no outcome to report. It also cost time nobody had a use for,
because the gate's budget is twenty seconds and the answer took a millisecond.

**One read of the target list instead of three.** `runtime:eval` resolved the dev server with a
probe, built the platform index with a probe, then required a connected app with a probe. Any two of
those reads could disagree about which app was attached, which is the shape F51 and F53 both had. The
preflight reads it once and hands back the populated connection: the URL, how it was found, the
targets, the platform-scoped subset a command may read, and the device index.

**What did not change: the bands.** Both refusals are exit `1` in every command, as they already
were, including under a gate-shaped flag. `runtime:errors --fail-on-error` with no app is `1` and
never `0`, because `1` is "fix the call" and the fix is to start a dev server or open the app. The
`22` rule of llp/0010 §The sixth, that a gate which cannot measure must not pass, is about a gate
whose window *opened* and observed nothing. That is a different state, and it is still `22`.

**Live evidence** [observed — 2026-08-27, friction/run7/tapapp, SDK 57 in Expo Go, iPhone 17 Pro
`C159CF99-…`, port 8631]. The three states, in order:

| State | What every reading command answered |
| --- | --- |
| Nothing listening on the port | exit **1**, `NO_DEV_SERVER`, `data.devServerReachable: false`, the ladder naming `dev --detach` then `navigate /` — `runtime:eval`, `runtime:errors`, `runtime:tree`, `runtime:tap`, `runtime:reload`, identical |
| Dev server up, no app | exit **1**, `NO_APP_CONNECTED`, `data.devServerReachable: true`, `debuggerTargets: 0` — `eval`, `errors --fail-on-error`, `tree`, `type`, identical. `runtime:reload` did not refuse: it started the app (§One ladder) |
| Dev server with the app | `eval "1+1"` → `2`, exit 0; `tree` → focused screen `index`, exit 0; `errors --fail-on-error` → `count: 0`, `runtimeReadable: true`, exit 0 |

`runtime:errors` is the one that takes visibly longer to refuse — about 3.5 s — and that is its
reconnect grace period spending itself before it reports an empty list, which is the trade F39 bought.

## Reloading the app

Decision [confirmed — Kudo, 2026-08-23]. `exagent runtime:reload` puts the running app back on the
code that is on disk, and reports a reload only when one was **observed**.

**Why an action of `runtime`, not a top-level verb** [confirmed — Kudo, 2026-08-23]. It was built
as `exagent reload` and renamed before it shipped. `runtime` is the group for "read and drive the
running app", and reloading is driving it. It is the same subject as `runtime:eval` and
`runtime:errors`, reached through the same dev-server connection. A top-level verb would have said
this is a different kind of thing than the commands it belongs with, and llp/0006's naming rule
reserves top-level verbs for capabilities that are their own subject. It keeps a module and a
`--help` block of its own, as `dev:wait` does inside `dev`, because the group's shared module exists
for the options `eval`, `errors` and `network` share, and these do not share them.

### The failure it answers

[observed — friction run 3, F31, 2026-08-23] A component threw while rendering. The file was fixed,
the served bundle was clean (`curl … | grep -c` answered 0), and `dev:wait` exited 0 with
`bundle.ok: true`. Meanwhile `runtime:errors --fail-on-error` kept exiting **20** for the error that
had just been removed, and the simulator showed a blank screen. There was no command for it. The
only recovery was `xcrun simctl terminate <udid> host.exp.Exponent` by hand, which is outside the
CLI and per-platform. `install`'s own follow-up said "reloading the app is enough" and then named
`runtime:errors`, which reloads nothing.

Reproduced live [observed — 2026-08-23, notesapp on SDK 57 in Expo Go, iOS 26.5 simulator], twice:
a `ReferenceError` in a route component, and a `throw` in the root `_layout`. The *mechanism*
turned out to be worth naming, because it is not the one the run-3 report assumed. On this SDK Fast
Refresh did recover the screen both times. What did not recover was the **error report**. Running
`runtime:errors --duration 3s` three times in a row against a healthy screen returned
`Error: F31_LAYOUT_BOOM` three times, so the debugger is replaying what the app reported to every
new connection rather than the app throwing again. A reload cleared it: `count: 0`, twice, exit 0.
So the trap is not only "the app runs stale code". It is that **an error window is a property of
the app's session, and the session outlives the fix**. Either way the answer is the same command,
and either way `runtime:errors` cannot be believed about a fix until the app has been reloaded.
That is why the reload now *leads* the follow-ups of a non-empty error window.

### How it reloads: the dev server's own client command socket

The mechanism is the one the interactive `r` keypress uses, spoken from outside the CLI process
[observed — `packages/@expo/cli/src/start/server/metro/dev-server/createMessageSocket.ts`,
`createMetroMiddleware.ts`, `BundlerDevServer.broadcastMessage`, 2026-08-23]. The dev server mounts
a WebSocket on **`/message`**. A frame carrying a `method` and neither an `id` nor a `target` is a
*broadcast*, relayed verbatim to every other connected client, which is how a reload reaches
the app. Two conditions gate it, and both are satisfied by a local wrapper. The sender must be
trusted (`isLocalSocket && isMatchingOrigin`, where a loopback connection that sends **no** `Origin`
header is trusted, the opposite of the inspector proxy whose handshake *requires* one). And the
method must be one of the two a client may broadcast, `reload` and `devMenu`.

This is preferred over the device path for four reasons. It needs no platform tooling, no
application id, and no knowledge of which device the app is on. It is the same code path on iOS and
Android. It does not restart the process, so app state that is not JavaScript survives. And it took
**0.28–0.58 s** live against **2.5–2.8 s** for terminate-and-relaunch.

**The detail that decides whether any of it works: `version: 2` on every frame** [observed —
`dev-server/utils/socketMessages.ts` `parseRawMessage`]. A frame without it, or with another
number, is dropped with no answer and no error. This was found the expensive way. The first live
attempt sent `{"method":"reload"}`, the socket opened, the send succeeded, nothing happened, and a
global planted in the app was still there afterwards. `{"version":2,"method":"reload"}` cleared it.

### What proves a reload, without CDP

A broadcast has no reply, so trusting the send would have shipped the same false green this command
exists to remove. Two things are read instead, and neither needs the Chrome DevTools Protocol. That
matters because Expo Go for Android has no CDP debugger at all (§Android pass).

1. **`getpeers` is the protocol handshake.** `{"version":2,"target":"server","method":"getpeers",
   "id":…}` is answered with the connected clients as `socket id -> upgrade query`, for example
   `{"socket#7":"role=ios","socket#8":null}`. An answer proves two things: that the dev server speaks
   this version, so a broadcast on the same socket will be relayed rather than discarded, and whether
   there is an app to reload at all. Silence is reported as "does not speak this protocol version"
   and never as "no peers", because the two lead to different next actions.
2. **Socket ids never repeat.** The dev server's ids come from a counter it does not rewind
   (`createSocketMap.ts` `createSocketIdFactory`), so a peer under a new id is a *new connection*.
   Live, across one reload, `{"socket#7":"role=ios","socket#8":null}` became
   `{"socket#10":"role=ios","socket#11":null}` within 500 ms. That is what `verifiedBy:
   "message-socket-peers"` names.

A debugger target is then waited for as well, because the rest of the CLI reads the app through one.
That wait was written as a floor and turned out to be the load-bearing half, as below.

#### Peer churn proves the app *acted*; only a new target proves it *came back*

Decision [confirmed — Kudo, 2026-08-24]. `reloaded: true` with exit `0` requires a debugger target
the dev server had **not** listed before the reload. `waitForFreshAppConnectionAsync` is that wait.

The finding [observed — friction run 4, F39 and F45]. Two reports that read as different bugs:
`runtime:reload` exited 0 with `Apps connected 1` while the simulator sat on the home screen (F45),
and the `reload` → `runtime:errors` chain the CLI prints as its own follow-up failed one run in
three with `CommandError: … No target found.` (F39). One mechanism, measured
[observed — 2026-08-24, notesapp SDK 57 in Expo Go, iPhone 17 Pro `C159CF99-…`, port 8190]: a
`{"version":2,"method":"reload"}` broadcast moved the target id from `8a9d…-1` to `8a9d…-2`, and

| t after the broadcast | `/json/list` |
| --- | --- |
| 254 ms | `8a9d…-1` — the runtime being replaced |
| 506 ms | `8a9d…-1` — still |
| 761 ms | `8a9d…-2` — the reloaded runtime |

The old wait returned on the first non-empty list, so it returned in about a millisecond, on the
**pre-reload** target. Everything downstream followed from that. The count it reported was of a
runtime on its way out, so an app that quit instead of coming back still counted (F45). And
`runtime:errors` immediately afterwards resolved that same dying target, failed to connect to it,
skipped it, and had nothing left, which is what `No target found.` means (F39).

Metro's page ids come from a counter it does not rewind, exactly like the message socket's peer
ids, so "a target this run has not seen" is decidable rather than inferred. The same test now
applies to the **peer** list, which it did not until wave 22. The churn wait returned as soon as
`peersChanged` was true, and a list changes in two directions: an app that had dropped its connection
and not yet come back satisfied it, so this rung could report the reload as observed off a client
*leaving*. It now waits for an id the dev server had not listed before, and reports the count
(`commandSocketChurn.reconnected`), which is what makes `verifiedBy: 'message-socket-peers'` checkable
[F95]. Three properties:

- **The known ids are read as late as possible**, from a probe of their own taken after the bundle
  gate and immediately before the broadcast — never reused from discovery. A save the watcher
  picked up in between would otherwise be credited to this command.
- **`appsConnected` and `appsReconnected` are both reported**, because they answer different
  questions and their difference is the diagnosis. One connected and zero reconnected is an app
  that never re-registered. Zero of both is an app that went. The exit-22 prose says which.
  **Amended in wave 22** [F95, live tier, 2026-08-27]: `appsReconnected: 0` is *three* facts rather
  than two, since the wave-21 ladder watches the bundle signal on every rung. The third is "the
  bundle proof answered first, so this watch stopped asking". `appsReconnectedReason` names which
  one, and a run proved by another signal is no longer a zero that reads as an app that failed to
  come back. See [[0021-honest-reports]] §An observed signal, or the band.
- **The last read of that wait is the re-read of the target list**, so a success is structurally
  never a peer count. It is a runtime that was observed after the reload. That is what makes F45's
  false-success path impossible rather than unlikely.

Live [observed — 2026-08-24, port 8190]: five `reload` then `runtime:errors --fail-on-error` rounds
back to back, all `0`/`0` with `appsReconnected: 1` and 559–1098 ms per reload. Then the same five
rounds with the reload sent as a bare broadcast, the `r` keypress that this CLI never waited for,
also all `0`. Terminating the app 350 ms and 450 ms into a reload, which is inside the window the
old code answered from, gives exit **22** with `appsConnected: 0`.

`runtime:errors` carries the other half of that fix, because a user may reload by pressing `r`, and
there is then nothing for this command to have waited on. Its target resolution retries for
`APP_RECONNECT_GRACE_MS`, which is 3 s, in two places. Once around the "is any app connected" probe
(`requireConnectedAppAsync`, which re-reads only while the list is *empty* and never for an
unreachable dev server), and once around target selection inside `CdpClient`, which is where the
dying target is skipped and the list has to be read again rather than the selector re-run. It is
bounded at three seconds because an app that is genuinely closed must still be reported quickly.

It is deliberately **not** given to `runtime:eval` and `runtime:network` [inferred]. The chain the
CLI prints, and the one the friction run drove, is reload then errors, and a grace period costs every
genuine "no app is connected" three seconds. It is one option away if a later run shows the same
flake there.

### The device fallback, and the exit codes

`--method auto` falls through to stopping the app on the device (`simctl terminate` or
`am force-stop`) and opening it again, which is the run-3 recovery absorbed into the CLI. It is
reached in two cases: nothing answered on the command socket, and **no app is connected at all**,
where "reload" and "start" are the same act. The application id comes from the dev server's own
debugger target (`appId`) and falls back to Expo Go's per platform. A `terminate` that reports the
app was not running is *success*, because that is the state the step was reaching for.

Three decisions on the codes (llp/0010 §Exit codes):

- **Nothing reloaded is `20`.** The tool worked and the operation failed. Live, with the app closed,
  `reload --method dev-server` exits 20 with `no app is connected to the dev server, so there is
  nothing to reload`, and `--method auto` exits 0 having started it on the device.
- **Reloaded but not reconnected is `22`.** The app went, and the wait ran out before its
  JavaScript registered a debugger target. Nothing is known to be wrong, so "look again" is the
  honest answer and the message says so.
- **No dev server is `1`, not `20`.** A reload makes the app fetch its bundle again, and with no dev
  server that fetch has nowhere to go, so stopping the app would replace a stale screen with no
  screen. Nothing is attempted.

### Two lists, one question

Added after Kudo's cloud dogfooding loop, K2 and K3 [observed — 2026-08-27].

Two connection lists describe one running app, and this command was reading the wrong one:

| list | what it names | who reads it |
|---|---|---|
| `getpeers` on `/message` | the clients registered on the dev server's **client command socket**, which is what a `reload` broadcast is relayed to | `runtime:reload`'s dev-server method, and nothing else |
| `GET /json/list` | the **JavaScript runtimes** that have a debugger attached | `status`, `runtime:eval`, `runtime:errors`, `smoke`, the three interaction commands |

Against a cloud app the first was empty and the second had the app in it. So `runtime:reload`
printed `Apps connected 1 · no reload happened`, taking the first number off the second list and the
verdict off the first. Then `no app is connected to the dev server, so there is nothing to reload`,
then `No booted device was found`, because the ladder fell through to the local device path on a
machine whose device was in a datacenter. `runtime:eval` was evaluating in that same app throughout.

Three changes, and the first is the one that matters:

1. **`/json/list` is the answer to "is anyone there".** It is the list the rest of this CLI uses, so
   it is the one this command reasons about. The peer list is a property of a *mechanism*, and an
   empty one now reports what it is, as `no client is registered on the dev server's command socket,
   while its debugger target list names N connected app(s)`, rather than claiming the app is gone.
2. **A third mechanism, `--method runtime`, which `auto` never picks.** It calls
   `expo.reloadAppAsync()` over the debugger, at the target `runtime:eval` reads. An app this CLI can
   *read* is an app it can *ask*, which is exactly the case the command socket could not serve, and
   it reloaded Kudo's cloud app. It proves nothing on its own, because the debugger has no peer list
   to churn, so it reports `verifiedBy: fresh-debugger-target` and the proof is the wait that was
   already there: a runtime registering under a page id the dev server had never used.

   **Why it is opt-in, and this is a live finding rather than caution.** On Expo Go the same call
   **closes the app**. `runtime:eval "expo.reloadAppAsync()"` took the app off the screen, and
   `/json/list` was still empty thirteen seconds later [observed — Expo Go SDK 57, iOS 26.5
   simulator `C159CF99-…`, 2026-08-27; the same runtime answered `Object.keys(expo)` with
   `…,reloadAppAsync,…` a moment before]. One runtime reloads and another quits, the difference is
   not something this command can read off a target, and a mechanism that sometimes closes the app
   is not one to run on a caller's behalf. That would have traded the device method's known cost
   for a less predictable one. So `auto` is the broadcast, and the device method when nothing is
   connected. `--method runtime` is a choice, with what it costs on Expo Go in its own `--help`.
3. **`auto` never force-stops an app the dev server can see.** The device method costs the app's
   state and, on a cloud session, can strand it (§Two things a cloud run leaves behind). It stays
   the answer for "no app is connected at all", where reload and start are the same act, and it is
   otherwise reached only by `--method device`. When `auto` skips it, the skip is an **attempt in
   the report** with the reason on it, because a step that is simply absent is a decision a reader
   cannot see.

   **Superseded in wave 21 — §One ladder, chosen by the command socket.** This rule was written to
   protect a cheaper alternative, and in the state it fires on there is none. With no client on the
   command socket the broadcast reaches nobody, so the choice is not "relaunch or keep the state" but
   "relaunch or do nothing". Wave 19 had already made the relaunch primary on a cloud session for
   exactly that reason. What replaces the caller's consent is a report the cost is visible in.

With a connected app and no mechanism able to reach it, the run is exit `20` and the `How:` says the
app *is* connected. The old text said "open the app on a device or simulator first", which is
advice for a caller whose app is not running, and which reads as "start a second copy".

**Why `expo.reloadAppAsync` and not `DevSettings.reload()` (K3).** The expression lands in Hermes,
where there is no `require`, no `import()` and no `process`. A module the app did not already load is
unreachable, so every recipe of the form `require('react-native').DevSettings.reload()` is untypeable
there. The `expo` global is the one door, and Kudo found it by dumping `Object.keys(expo)`. That is
now in `runtime:eval --help`, alongside the note that `runtime:reload` makes the manual call
unnecessary. An app whose `expo` global has no `reloadAppAsync` is reported as exactly that, with no
guessing.

**What is still [inferred].** That `--method runtime` *reloads* rather than closes a runtime that is
not Expo Go. Kudo's cloud app reloaded from the same call by hand, which is one observation on one
runtime this session did not have. What this session observed is the Expo Go behaviour, which is the
opposite. The e2e proves the mechanism against the stub, covering the probe, the call, and a fresh
target as the only proof. The first dev build somebody runs it against decides whether it can ever be
automatic.

**The honest limit of the whole section.** For an app that is connected, whose command socket has
no client, and which is not one `expo.reloadAppAsync()` reloads, this command has **no**
non-destructive reload. It says so, and points at the one thing that always works and costs nothing:
editing a file the app has loaded, which the dev server pushes on its own. [Amended in wave 21: the
limit is unchanged and the *answer* to it is no longer a refusal. `auto` spends the app's state
rather than leaving the caller with a stale screen, and says on the attempt that it did.]

### Reloading a cloud session

Added in wave 19, after Kudo hit it live: `runtime:reload` did not reload the app on an EAS cloud
simulator with a tunnelled dev server, with "1 app connected" on the screen
[observed — 2026-08-27]. The staging round had already recorded the same shape as S12.

**The premise that was wrong.** This document and the code both said the cloud changed only the
*fallback*, because "the dev-server broadcast reaches a cloud session already — a cloud session has
to reach that dev server through a tunnel to be running the bundle at all". The tunnel carries the
**bundle**, over HTTP. It is not evidence of a client on the dev server's client command socket, and
live there was none. The broadcast reached nobody, `auto` then fell through to the force-stop, and
the relaunch was refused, leaving a billed session with nothing running on it (S12). A premise no
stub could test was carried for two waves by the sentence that justified it.

**What `auto` does on `--cloud` now.** The relaunch is the **primary** mechanism rather than a
fallback, and the rule "never force-stop an app the dev server can see" does not apply there. That
rule protects an alternative, and a cloud session has none. Two controller verbs:

```
eas simulator:exec npx agent-device@latest open <app-id> --platform ios --relaunch
eas simulator:exec npx agent-device@latest open <url>    --platform ios
```

- **`--relaunch`** terminates the app process and launches it again, so nothing has to `close`.
  `close` is the verb that ends the *controller's* session, which is how the app was stranded
  [observed — `agent-device help open`, 0.20.10; the controller's own React Native guide says "Do
  not use agent-device reload. Use open --relaunch for native startup reset."].
- **Two verbs and not the documented shell-plus-link form.** `open <app-id> <url> --relaunch` cold
  launches the shell *with* the dev-server URL, and Expo Go died on its own updates database every
  time: `SQLiteGetResultsError: (code: 19; extendedCode: 2067; message: UNIQUE constraint failed:
  updates.scope_key, updates.commit_time)` on screen, twice out of two
  [observed — 2026-08-27, session `01a04378-…`, SDK 57 Expo Go on an iOS cloud simulator]. Restart
  the shell with no URL, *then* send the link. llp/0010 §Upstream asks records the Expo Go bug.
- **The URL is `navigate --cloud`'s**, resolved by `resolveRouteUrlAsync`: the manifest-derived
  tunnel host, never the `exp+<slug>://<host>` launcher form. The tunnel precondition is checked
  **before** the first verb, which is the other half of the S12 fix. A run that stops the app and
  only then finds the URL unusable is exactly how the app was left closed.
- **`DEVICE_IN_USE` is retried once**, bound to the session the controller names (S14). Never a
  second session, because that bills another machine.

**What proves it, when there is no debugger target to wait for.** Two observations are watched on one
budget, and the first to answer ends both:

1. a debugger target the dev server had not listed before, which is the proof every other path uses;
2. a **`Bundled` line** in the dev server's captured output that was not there before the relaunch,
   which means something fetched the served bundle again (`src/runtime/reload/bundleSignal.ts`).

The second one is why a cloud reload can exit `0` at all, and two live facts make it the load-bearing
one. A relaunched app re-registers under the **same** debugger page id, because Metro's per-device
counter restarts with the app, so `…ce-1` before the relaunch was `…ce-1` after it. And Fast Refresh
produces no `Bundled` line, so the signal is specific to a full bundle fetch rather than to any edit
[both observed — 2026-08-27, live]. `verifiedBy: dev-server-bundle` is its own value. It says the dev
server served a bundle after this command acted, and **not** which client asked for it.

`reloaded` is `verifiedBy != null`, which is stricter than it was for exactly one path. On a local
device the relaunch *is* an observation, because `simctl terminate` names a process and fails when
there is none. On a cloud session neither controller verb answers about the app it was given (§What
`close` will not tell you). So a cloud relaunch that nothing observed is exit `22` with both
observations spelled out, and never a success off a verb that accepted an argument.

**Live evidence** [observed — 2026-08-27, staging, project `@kudo1/livecheck`, iOS session
`01a04378-bf7f-74d3-b9c9-7603b2ff27d3`, SDK 57 Expo Go, public dev-server origin]:

| Case | Result |
| --- | --- |
| `runtime:reload --cloud` with the shell-plus-link verb | exit **22**, honest: relaunch ran, nothing observed. Screen: Expo Go's updates-database crash, twice |
| `runtime:reload --cloud`, two-verb sequence | exit **0**, `verifiedBy: dev-server-bundle`, `iOS Bundled 32ms … (1 module)`, `MARKER-THREE` on screen — the edit made seconds earlier |
| `runtime:reload --cloud --route /second` | exit **0** in 15.2 s, landed on `/second`, screenshot confirms |
| Both waits run to their own end | 89.9 s for a reload proved in the first seconds — hence the abort |
| `--cloud` with a `localhost` dev server | exit 1, `CLOUD_SIMULATOR_UNREACHABLE_DEV_SERVER`, **no** device verb spawned |
| A session started without `--expo-go` | `apps` lists only the controller's test runner; every `exp://` open fails `LSApplicationWorkspaceErrorDomain error 115` |

That last row is why every piece of advice in this package now names
`eas simulator … --expo-go` (`CLOUD_SESSION_START_COMMAND`). The old suggestion started a session
with no app on it, which no `navigate --cloud` or `runtime:reload --cloud` can use.

### One ladder, chosen by the command socket

Wave 21 [confirmed — Kudo's delegate, 2026-08-27]. `--cloud` stops being a behaviour switch. There is
one ladder, and one observable fact picks the rung: **whether the dev server's client command socket
holds a client**, which is what `getpeers` answers.

| rung | mechanism | reached when |
|---|---|---|
| 1 | broadcast on `/message` | the socket holds a client. Costs the app nothing, same code path on both platforms, under a second |
| 2 | relaunch the app | the socket holds none. On `--cloud`, wave 19's two controller verbs; otherwise the local device method (`simctl terminate`/`am force-stop`, then the deep link) |

`--method` still pins a rung and skips the rest, `--method runtime` is still a rung `auto` never
picks (§Two lists, one question), and the bundle gate still runs before any of them.

**Why the socket and not the location.** The wave-19 section's own finding is that the cloud broke the
ladder through a *mechanism* rather than through geography. The tunnel carries the bundle over HTTP
and the app registers no client on `/message`, so the broadcast reaches nobody. That is a fact about
the socket. Keying the ladder on `--cloud` encoded the correlation instead of the cause, and it was
wrong in both directions: a local app whose socket is empty was refused with advice, and a cloud
session that *did* hold a client would have been force-stopped for no reason. Two things follow, and
both are better than what they replace. The reading of the peer list is now the same step that
broadcasts, so one socket open rather than two. And `--cloud` narrows to what it is honestly about,
which is **which device backend may relaunch**, and which flag every suggested command keeps.

**Which rung Android takes, measured.** Rung 1, always, on a local emulator. It is worth
recording as a fact rather than an assumption, because Android is the platform where the *other*
verification is impossible. Expo Go for Android holds a client on `/message` [observed — 2026-08-27,
Expo Go 57.0.9 on `tuft-pixel`, port 8560]. `getpeers` answered
`{"socket#3":"device=sdk_gphone64_arm64%20-%2015%20-%20API%2035&app=host.exp.exponent&clientid=b","socket#4":null}`,
and `runtime:reload --android` reported `commandSocketClients: 2`, `method: "dev-server"`, one attempt,
`verifiedBy: "message-socket-peers"`, `commandSocketChurn: {observed: true, before: 2, after: 1,
reconnected: 1}` and `bundlesAfterReload.line: "Android Bundled 30ms …"`, in 590 ms. So the ladder
stops on its first rung and the app never loses its process. That is the opposite of the cloud, where
the broadcast does not reload Expo Go and takes its socket client with it (§Reloading a cloud
session).

**And the verification is honest there without any debugger.** Neither of the two facts that carried
it is a CDP read: a socket id the dev server's non-rewinding counter had not used before, and a bundle
the dev server was seen to serve for `android`. `appsReconnected` is the count that *would* have
needed one, and on the runs where the bundle line lands first it is `0` with `appsReconnectedReason`
saying which fact that is (F95). This is the whole reason `runtime:reload` is the one runtime command
that works on Expo Go for Android while five others refuse.

**What it costs, said out loud.** Rung 2 replaces the app's process, so the JavaScript state is gone.
Before wave 21 `auto` refused to spend that on a connected app, and named `--method device` for a
caller who meant it. Now the ladder spends it when nothing cheaper can reach the app, and the
*attempt* carries the cost: `<why the rung was reached> — which costs the app's JavaScript state:
<the commands that ran>`. That is said only when there was an app to lose state, because a relaunch
that *started* an app cost nothing and says nothing.

### A broadcast that was delivered is a mechanism that ran

Wave 23, F97 [observed — live cloud, 2026-08-27]. A broadcast has **three** outcomes and the code had
two. The socket can refuse it — no connection, a protocol version the dev server does not speak, an
empty peer list — or the frame can go out and the app be seen to come back, or the frame can go out
and nothing be seen. The third was reported as the first: `ok: false`, no mechanism, exit `20`
("nothing ran"), and the run then **skipped the two observations that exist for exactly this state**.
The payload said so in as many words: `bundlesAfterReload.reason: "nothing watched the dev server
output: no mechanism ran, so there was nothing to watch for"`, on a run with `commandSocketClients: 1`
that had spent 8.9 s of a 180 s budget.

So an attempt carries **`delivered`** beside `ok`: whether the action reached the app, which is not
whether it worked. A delivered-and-unproved broadcast is a mechanism whose own proof is missing —
`method: 'dev-server'`, `mechanismProof: null` — and the shared observations decide, which is `22`
rather than `20` and matches the exit-code rule this document already stated. `delivered` is null for
every rung where delivery is not a separate question: `simctl terminate` naming a process that is not
there fails, and there is no "delivered but unproved" for it.

### The ladder climbs

Wave 23, F99, and the one pair of live runs that settled it [observed — 2026-08-27, live cloud,
artifacts 005 and 006 of `live-cloud-…T19-17-35-037Z`]:

| Run | Socket | Rung | Result |
| --- | --- | --- | --- |
| `runtime:reload --cloud` | `commandSocketClients: 1` | 1 only | exit **22** after the whole 180 s: no fresh debugger target, no bundle |
| `runtime:reload --cloud --route /lab`, seconds later | `commandSocketClients: 0` | 1 then 2 | exit **0** in 18.5 s, `verifiedBy: dev-server-bundle`, `iOS Bundled 42ms` |

Read together those two rows say one thing: the broadcast took the app's client off the command socket
and did not reload it, and the relaunch — the rung the *next* command reached because the socket was
then empty — worked. `auto` stopping at a rung it had already tried made the command fail on a state
its own second rung handled.

**So `auto` climbs.** Rung 2 is now reached from two states, not one: the socket held no client, or the
broadcast was delivered and proved nothing. The second is this document's own rule applied honestly —
the app's state is spent "when nothing cheaper can reach the app", and a frame nobody acted on inside
its window is exactly that. Three things bound it:

- **A pinned `--method` never climbs.** A caller who named one rung excluded the others, cost and all.
- **Only an unproved rung climbs.** A broadcast whose churn *was* observed is a reload, and nothing
  follows it.
- **The attempt says which of the two states it was reached for.** The first cut printed `no client was
  registered on the dev server's command socket` over a payload whose own `commandSocketClients` was
  `1` — a report arguing with itself, which is what llp/0021 exists to remove.

**What stays upstream.** That the `/message` broadcast does not reload Expo Go on an EAS cloud
simulator over a proxied origin is not this CLI's to fix, and it is not S11: the app registers a
debugger target *and* a command-socket client there, both of which S11 said it would not. What this
CLI owes that state is the rung that works, which is now what it takes.

### The dialog nobody is there to answer

Wave 23, from S10 and the first two live runs of the cloud tier. An `exp://` URL handed to the
**system** on an iOS simulator raises "Open in 'Expo Go'?", and on an EAS Simulator session nobody is
in front of the screen. The link is delivered — the `open` verb exits 0 — and nothing loads:
`navigate --cloud` exit 22 after 60.9 s, then two 180 s reloads that served no bundle
[observed — 2026-08-27; and staging, 2026-08-26, S10, where `agent-device alert accept` proved the
causality].

**Two layers, and the cheaper one is the session's own start.** `eas simulator … --expo-go` installs
and launches Expo Go; nothing has opened the *project* in it, so the first `exp://` URL still goes to
the system. `--open-url exp://<host>` is the runner opening the URL in the app it just launched
[observed — `eas simulator --help`, eas-cli@latest, 2026-08-27: "URL to open in the installed
application after it launches"], and that is the state wave 19's working session was in before any
exagent command touched it (`wave19-live/12-open-session.json`, `open host.exp.Exponent`). The live
suite starts its session that way, and `navigate --cloud` went from exit 22 in 60.9 s to exit 0 in
17.1 s with `attached: true` in 206 ms.

**And `navigate --cloud` answers the dialog itself.** The decision, and it is a decision about
llp/0008 rather than about iOS: the caller ran `--cloud <route>`, which *is* the instruction "open this
route on the cloud simulator". iOS then asked whether it may do the thing that was just asked for.
Answering completes the requested action and authorises nothing beyond it. The precedent is in the same
function: the Android stuck-app recovery is automatic rather than suggested, "because the state it
clears is one this command caused" — and this state is one this command caused too. Four gates keep it
to the one dialog:

1. only on `--cloud`; a dialog on the machine at somebody's desk has somebody at it;
2. only after **this run's own** open exited 0;
3. only when nothing attached inside the caller's budget, so the happy path spends no verb;
4. the alert is **read before it is answered** — `alert get` — and accepted only when it names the app
   the URL was for. Anything else is reported and left on the screen.

The fourth gate is what keeps this from being "answer any prompt", and it is read as **text** rather
than parsed: what `alert get` prints for a *present* alert has not been seen by anything in this
package, so a parser for it would be a shape invented here and then trusted. What has been seen is the
empty answer — exit **1**, `Error (COMMAND_FAILED): alert not found` [observed —
`agent-device@latest alert get`, 2026-08-27] — which is what makes the read safe to run speculatively:
it costs a refusal rather than an action.

`attachAlert` carries the three states — answered, some other alert, none — and the what/why/how names
the dialog and the two verbs by hand when nothing attaches anyway. A report that left the dialog
unmentioned sent readers to debug a bundle that was never fetched.

**The verification is identical on every rung**, which is the other half of "one ladder". Two
observations, watched on one budget, either of which is a reload:

1. a debugger target the dev server had not listed before — the stronger one, and what tells an app
   that came back from one that quit;
2. a `Bundled` line in the dev server's captured output that was not there before (`bundleSignal.ts`).

`verifiedBy` keeps the *mechanism's* own observation as its label when it has one —
`message-socket-peers` for peer churn, `app-relaunch` for a local relaunch — because "the app's
connection was replaced" is a stronger fact than "the dev server served a bundle to somebody", and
flattening the two would lose it. The exit code is decided by the observations alone: `0` with either,
`22` with neither, `20` when no rung ran at all. So the F45 hold is unchanged — peer churn alone is
still `reloaded: true` with exit `22` — and the second observation is now available to the local rungs
too, which is what makes the ladder one ladder rather than two with a shared name.

**The consequence to know about, and it is a real cost.** A relaunched app re-registers under the page
id it had before (§Reloading a cloud session, observed live), so on a project with **no captured dev
server log** rung 2 has nothing left to observe and exits `22` after spending the whole `--timeout`.
That is honest — the app was relaunched and whether it came back is unknown — and the fix is the first
rung of the preflight's own ladder: `npx exagent dev --detach` captures the output that makes the
second observation possible. It is not a regression; the local relaunch path had exactly this hold
before, reached from a different direction.

**Not attempted, and why.** A third observation is available in principle — a target that *vanished*
from `/json/list` and came back is a new connection even under an id it used before — and it is
[inferred] until something watches a live relaunch closely enough to say so. It is written down here
rather than built, because a proof this command reports as `reloaded` has to be one that was seen.

**Live evidence** [observed — 2026-08-27, friction/run7/tapapp, SDK 57 in Expo Go, iPhone 17 Pro
`C159CF99-…`, dev server detached on port 8631]:

| Case | Result |
| --- | --- |
| Nothing connected, `runtime:reload --ios` | exit **0** in 3.3 s, rung 2 on the local device, `verifiedBy: app-relaunch`, `appsReconnected: 1`. Rung 1's attempt: `no app is connected to the dev server, so there is nothing to broadcast to` |
| App connected, `runtime:reload` | exit **0** in 813 ms, rung 1 chosen off `commandSocketClients: 2`, `appsReconnected: 0`, `bundlesAfterReload: iOS Bundled 40ms node_modules/expo-router/entry.js (1 module)` |
| Five `reload` → `runtime:errors --fail-on-error` rounds back to back | rounds 1–4 exit `0`/`0` in 301–333 ms, **three of them with `appsReconnected: 0`** — proved by the bundle line alone. Round 5, after five reloads inside two seconds, exit `22` after the full 30 s with neither observation, and `runtime:errors` then exit `1`, `NO_APP_CONNECTED`: the app had gone and both commands said so |
| Recovery from that state, `runtime:reload --ios` | exit **0** in 2.9 s via rung 2, `appsReconnected: 1` |
| `runtime:stop --ios` | exit **0**, `wasRunning: true`, `connectedAppIds: ["host.exp.Exponent"]` |

Two things in that table are the wave's own result. The three rounds with `appsReconnected: 0` **were
exit 22 before it** — the local path never read the log, so a reload the dev server had just served a
bundle for was reported as inconclusive — and the printed `reload` → `runtime:errors` chain stayed
green across all four, which is the F39 risk the abort could have reintroduced answered by
measurement rather than by argument (`runtime:errors` retries target selection for
`APP_RECONNECT_GRACE_MS`, which is what absorbs it).

### Live evidence

[observed — 2026-08-23, notesapp SDK 57, Expo Go, iPhone 17 Pro `C159CF99-…`, port 8170]

| Case | Result |
| --- | --- |
| Recover from `Unmatched Route`, `reload --route /notes` | exit 0, `dev-server`, `waitedMs: 455`, screenshot on `/notes` |
| Stale error after a fix: `dev:wait` 0 + `runtime:errors --fail-on-error` **20** | `reload` → exit 0 → `runtime:errors --fail-on-error` **0**, `count: 0`, twice |
| `--method device` | exit 0, `verifiedBy: app-relaunch`, `waitedMs: 2745`, `simctl terminate` then `openurl` |
| App closed, `--method dev-server` | exit **20**, `no app is connected` |
| App closed, `--method auto` | exit 0 via `device`, `appsConnected: 1` |

## Verifying the route

Decision [confirmed — Kudo, 2026-08-23]. `exagent navigate` checks the route against the project's
routes **before** it opens anything, and a route the project has not got is exit `1`.

The finding [observed — friction run 3, F32]: `navigate /totally-bogus-route-xyz` exited 0, and so
did `runtime:errors --fail-on-error` and `dev:wait --require-app` after it, with the simulator on
Expo Router's **Unmatched Route** screen. No runtime gate can ever catch this: an unmatched route is
not an error the app reports, it is a screen the router renders on purpose. The check has to happen
before the link, or not at all.

### Where the route table comes from, and why not the dev server

`expo_router_sitemap` was listed as an existing expo-mcp tool above, so the first question was
whether the dev server can answer it. It cannot, for a native target [observed — 2026-08-23]:

- `GET /status` reports the bundler and `GET /json/list` reports debugger targets. Neither has ever
  had anything to say about routes.
- The only routes manifest in the family is `@expo/router-server`'s `createRoutesManifest`, reached
  from `MetroBundlerDevServer.getExpoRouterRoutesManifestAsync`. It describes **web and API** routes,
  it is served over HTTP nowhere, and reaching it means importing internals that llp/0001
  constraint 5 forbids.
- `_sitemap` is a screen the *app* renders. Asking it needs a healthy connected app — which is
  exactly what is missing in the case the check exists for.
- `.expo/types/router.d.ts` is generated only when `experiments.typedRoutes` is on, and is itself
  produced from the same file scan.

So the table is read from the files, against expo-router's own conventions
(`expo-router/src/matchers.tsx`, `getRoutesCore.ts`): the router root is `extra.router.root`, else
`src/app`, else `app`; group segments are stripped from the URL and accepted in it; `index`
collapses onto its parent; `_layout` and any file with a `+` in its last segment are left out;
platform variants collapse onto one route; `_sitemap` is added because the router generates it.
`+not-found` is left out **deliberately** — it is the screen an unmatched path already lands on, so
counting it as a destination would make every route resolve, which is the bug this exists to catch.

**Cross-validated live** [observed — 2026-08-23]: the scanner reported `/`, `/_sitemap`,
`/explore`, `/notes`, `/users/[id]`, and the app's own `_sitemap` screen listed `index.tsx`,
`notes.tsx`, `explore.tsx`, `users/[id].tsx` — the same set, from the router's own reading of the
same project.

### Three properties of the check

- **Patterns, not literals.** `/users/42` matches `app/users/[id].tsx`; `/users/42/edit` does not,
  because a dynamic segment does not swallow a slash. `[...rest]` matches the rest of the path. A
  literal route wins over a dynamic one that also matches, so `/users/me` reaches its own file.
- **It fails open.** `--no-route-check`, a route that is already a full URL, and a project with no
  router directory are all reported `checked: false, ok: null` with a reason, and opened. Same
  reasoning as the bundle check of llp/0010: a false red stops a command that would have worked and
  names no fix, which is worse than the false green it replaces.
- **The last line is a paste, not a list.** A route within a third of its length of a real one is
  named in `Try:` — live, `navigate /note` answers `Try: npx exagent navigate /notes`. Nothing close
  enough falls back to `navigate /`.

**The limit, stated because it is easy to over-read.** The check answers whether the *project* has a
route, not whether the *app's navigator* can display it. Live [observed — 2026-08-23]: the notesapp
uses `NativeTabs` with three declared triggers, and `navigate /users/42` — a route the project
genuinely has, listed by the app's own sitemap — was accepted, opened, and left the app on the tab
it was already on. That is the navigator's answer, not the check's, and no file scan can predict it.

## The root route needs a query marker

Decision [confirmed — Kudo, 2026-08-23]. `navigate /` opens `exp://<host>:<port>/--/?` for Expo Go.

The finding [observed — friction run 3, F33]: `navigate /` produced `exp://<host>:<port>`, which is
a no-op for an app that is already loaded — as is `exp://<host>:<port>/--/`. Every other route
worked. `/` is what the CLI's own `status.next`, `dev` plan reason and run banner suggest.

The cause is in **expo-router**, not in Expo Go [observed — `expo-router/src/link/linking.ts`]:
`subscribe`'s Expo Go branch runs every incoming URL through `parseExpoGoUrlFromListener`, which
replaces a link whose path is empty or `/` with `getRootURL() + queryString`. `getRootURL()` in
Expo Go is `parsePathFromExpoGoLink(Linking.createURL('/'))`, which is the **empty string**. The
listener then ends in `if (href) listener(href)`, so the root link is dropped before the router sees
it. A bare `?` is the smallest thing that survives that guard: `href` becomes `"?"`, which is
truthy, and a path of `""` with an empty query resolves to the index route.

**Verified live** [observed — 2026-08-23, three runs]: from `/notes`, `exp://127.0.0.1:8170/--/`
and `exp://127.0.0.1:8170` both left the app on `/notes`; `exp://127.0.0.1:8170/--/?` landed it on
the root route, screenshot-confirmed each time.

A reload is **not** the fix for this, which was the other candidate. Expo Go re-loads the URL it was
launched with, so an app deep-linked to `/notes` returns to `/notes` after a reload [observed —
2026-08-23, screenshot]. A development build never had the problem: its listener passes the URL
through whatever the path is, so `<scheme>://` already means the index route, and it is unchanged.

## Where a device reaches the dev server

Decision [confirmed — Kudo, 2026-08-25]. The Expo Go link this CLI prints anywhere leads with the
**tunnel host** when the dev server has one, and the tunnel is only claimed while it is still up.

The finding [observed — dogfood, 2026-08-24]. A cloud EAS simulator was driven through a tunnel
(`EXPO_STAGING=1 EXPO_UNSTABLE_TUNNEL_V2=1 exagent start --tunnel --go`), and every URL the CLI
produced named `127.0.0.1:8081` or `192.168.1.233:8081`. Neither is loadable from a machine in
somebody else's datacentre. The dev server knew the right answer the whole time and this CLI never
asked it.

### Where the tunnel host comes from, and why not the lock

The dev-server lock (`src/devLock/`) answers where the dev server listens **on this machine**, which
is the right answer for every command that talks to it over HTTP and the wrong one for a link a
device opens. Four candidates were considered; only the last two survive.

- **The lock.** Records `http://127.0.0.1:<port>` and nothing else. Extending its wire protocol
  would work and was rejected for now: the lock is taken before the tunnel is up, so it would have
  to be revised after the fact, and a fact that can go stale inside a live socket is the property
  the lock exists to *not* have.
- **The manifest endpoint.** `ExpoGoManifestHandlerMiddleware` builds `hostUri` through the same
  `UrlCreator` that produces the tunnel host, so a `GET /` with an `expo-platform` header carries
  it. Rejected as the primary source: it needs a live, correctly-headed request per call, and the
  answer is wanted in places that must not make one — a start banner, a status line.
- **The `devserver:url` JSONL event.** `BundlerDevServer.startAsync` emits it with `url`,
  `runtimeUrl`, `hostType` and `port` [observed — `@expo/cli` on `main`, 2026-08-25]. Exactly the
  right shape, and **not in any released SDK**: expo 57.0.17 writes `metro:instantiate` and
  `devserver:start` into `.expo/dev/logs/start.log` and no `devserver:url` [observed — live,
  2026-08-25]. Worth reading when it ships; useless today.
- **The line the dev server prints.** `Waiting on <url>`, from `startAsync`, and that URL *is* the
  tunnel origin whenever a `AsyncWsTunnel` is running — `getDevServerUrl` returns
  `constructUrl()` in that case rather than the listen address. A detached run captures it in
  `.expo/dev/logs/dev-detached.log`, so it is readable afterwards by anything. **Verified live**
  [observed — 2026-08-25, notesapp on SDK 57.0.17 with a ws tunnel: `Waiting on
  http://znakdiwe5j2n5o0.boltexpo.dev`, and `navigate / --print-url` answered
  `exp://znakdiwe5j2n5o0.boltexpo.dev/--/?`].

So `src/dev/advertisedUrl.ts` reads the printed line, classifies the host (`localhost` / `lan` /
`tunnel`), and every device-facing URL prefers a current tunnel host over the listen address. A dev
server started **attached** writes that line to somebody's terminal, so it is honestly reported as
unknown rather than guessed at.

One guard, because the line outlives the run that printed it: the log has to belong to the dev
server that is up. `dev --detach` truncates the log per run and refuses a second detached server
while the lock is held, so a live detached run always has a log written after its lock was taken; a
dev server started attached leaves the previous detached log untouched, and that is exactly where a
tunnel host from days ago would come from. The comparison is the log's mtime against the lock's
`startedAt`.

**Deliberately not asked: whether the tunnel is healthy.** A tunnel's lifetime belongs to
`@expo/ws-tunnel` and its reporting to the Expo CLI [decided — Kudo, 2026-08-26]. This document owns
*which URL exagent prints*, and nothing more: a wrapper that also read the transport's prose for
failure signatures would be diagnosing a system it does not manage. The consequence is stated
plainly rather than hidden — a dev server whose tunnel has died still advertises the tunnel host,
because from here that is indistinguishable from one that is fine.

### The tunnel comes up after the bundler does

`--wait-ready` returning is not the same as the tunnel being up: the bundler answers `/status`
first, and the tunnel is established after it. So a scripted `dev --detach --tunnel --wait-ready`
followed immediately by `navigate --print-url` landed in that gap and got `exp://127.0.0.1:8081`
with nothing saying a tunnel was on its way [observed — live, 2026-08-25] — the same wrong answer
this section exists to prevent, arrived at a different way.

`dev --detach` therefore **waits for the host** when, and only when, the run asked for a tunnel
(`requestsTunnel` over the forwarded arguments), for up to 20 s, and reports it: a `Tunnel` line
under the listen address it is not, and `tunnelUrl` in `--json` and on `cli:dev_detach`. Bounded,
because a tunnel that never comes up must not hold up a dev server that did — the run reports
`tunnelUrl: null` and the log says why. A run with no `--tunnel` waits for nothing and pays nothing.

### `hostType` describes the URL, not the log

`navigate --print-url` reports the kind of host **the URL it printed carries**, classified from that
URL rather than from what the log advertised. The two can differ whenever the tunnel host is not the
one that ended up in the link — a `127.0.0.1` URL under `tunnel · reachable from any network` is an
instruction to open a local address on a device somewhere else [observed — live, 2026-08-25]. One
fact, read off the thing it describes.

## Pointing an app at this dev server

Decision [confirmed — Kudo, 2026-08-26]. `exp://<host>` is the **Expo Go** form and nothing else.
Every URL this CLI prints resolves which application is meant first, and a development build gets
its own scheme.

The gap. `resolveDeepLinkUrl` already refused to build an `exp://` link for a development build —
it produced `<scheme>://<route>` — so no wrong URL was ever printed. What was missing is the other
half: `<scheme>://<route>` navigates an app that is **already loaded against a dev server**, and
nothing this CLI printed said how to get it loaded. `status.next` on a machine with no device
deferred to `navigate / --print-url`, and that answered `myapp://` — an app opening on whatever it
last loaded, which is not this dev server.

**The shape, pinned against the launcher that parses it** [observed —
`packages/expo-dev-launcher`, 2026-08-26]:

```
<scheme>://expo-development-client/?url=<url-encoded dev server origin>
```

`EXDevLauncherURLHelper.isDevLauncherURL` is exactly `url.host == "expo-development-client"`; the
dev server URL rides in the `url` query parameter and `exp://` inside it is rewritten to `http`;
`DevLauncherURLHelper.kt` reads it identically on Android; and the launcher's own Swift test spells
one out as `scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`. `@expo/cli` builds
the same string in `UrlCreator.constructDevClientUrl`, and from it comes one detail worth copying:
the origin inside `url` is **https** when the dev server's host type is a tunnel, because a tunnel
terminates TLS — the plain-HTTP origin the dev server prints for itself is not what a device off the
network should be given.

The scheme is the deep link's own precedence: `--scheme`, then the `scheme` field of the static app
config, then the `exp+<slug>` default a managed development build registers. A project that declares
none of them gets **no** development-build URL rather than one with a hole in it.

**A connect URL is not a route link**, and both are printed. `navigate --print-url` keeps the route
URL as its `URL` line — that is what the command was asked for — and adds a `Connect` line, plus a
`connect` array in `--json`. The rung order follows: for a development build the connect URL is
first, because the route link cannot go anywhere until something is loaded.

### When it cannot be told which app, both — labelled

The target-app resolution is the deep link's, unchanged in order: `--app-id`, then the app connected
to the dev server, then the project. What is new is that the decision now reports **how it was
reached**, because a guess between two applications must not be printed as one URL.

`certain` is false in exactly one branch: nothing connected, no `--app-id`, no `expo-dev-client`
dependency, and a native directory checked in. Such a project has a build of its own *and* can still
be opened in Expo Go, and nothing here can tell which happened. Every other branch has something
that settles it — the flag, the connected app, the dependency, or the absence of any dev-build
machinery at all. That branch prints both forms, labelled, Expo Go first because it needs nothing
installed.

`status.next` cannot carry a labelled pair on one line, so where it would have to it names
`exagent navigate / --print-url` instead, which prints both.

### On a development build, `navigate` goes launcher-first

Decision [decided — wave 30, 2026-08-28; the finding is F123, from the wave-29 live pass]. The
section above got the *printing* right and left the *acting* wrong. `navigate` computed the launcher
URL into its own `connect` array and then opened `<scheme>://<route>` at an app it had just reported
was not there — `target: "no app is connected to the dev server, and the project depends on
expo-dev-client"` — spent its whole attach budget, and exited `22` after **90.6 s** on Android with
no dialog anywhere in it [observed — wave 29, `evidence/61-navigate-after-stop-android.json`]. It is
the command every follow-up in this CLI names as the way to open the app, including `runtime:stop`'s
own.

The contract now: **when the target is a development build and no app is attached, the launcher URL
is opened first, the existing attach budget is spent waiting for the app, and then the route link is
opened.** Both opens are reported — `launch` in `--json`, a `Launch` line above `App` in the human
summary — because two links were delivered and naming one of them describes half the run. When an
app **is** attached, nothing changes: it understands the route link, and reloading it would throw
away the state the caller is navigating within.

Four conditions gate it, and each rules out a case where loading first would be wrong: a development
build (Expo Go's `exp://<host>` already carries the dev server); nothing attached; a launcher URL
exists (`buildConnectUrls` returns none without a dev server *and* a scheme); and a budget to wait
with. The last one is why `smoke` and `--no-wait-attach` keep exactly the behaviour they had — the
launcher fetches a bundle, and a route link delivered into that gap reaches an app that has not
finished loading.

**Two things on Android that no choice of URL can express**, and the fix is incomplete without
either [both observed — 2026-08-28, `live-devclient`'s emulator, with the dev server and app of the
suite]:

1. **The launcher URL goes to `MainActivity` by component, not as a link.** A BROWSABLE
   `ACTION_VIEW` intent carrying it reaches `DevLauncherController.handleIntent`, and on an app that
   is *not running* that path throws — `java.lang.NullPointerException … createAppIntent` — and
   leaves the app on `DevLauncherErrorActivity` with `am start` having exited 0. The same URL sent as
   `am start -f 0x20000000 -n <package>/.MainActivity -d <url>` loads the bundle and attaches in
   about three seconds, on the same device in the same minute. That is what
   `expo start --dev-client --android` does [reference — `@expo/cli`
   `src/start/platforms/android/adb.ts` §launchActivityAsync], and it is why the route link stays a
   link while the launcher URL does not. The activity is `<app id>/.MainActivity`, from `--app-id` or
   the app config; a project whose application id cannot be read falls back to the link.
2. **The port that is forwarded is the dev server's, not the route link's.** §The device's loopback
   is not this machine's reverses the loopback port *of the URL being opened*, and
   `<scheme>://expo-development-client/?url=…` has no loopback host of its own — so nothing was
   forwarded and the launcher fetched its bundle from a port on the device. When this ladder fires,
   the reverse reads the dev server's origin instead.

Result on the emulator that produced the finding: exit `0` in **3.0 s**, `launch.attached: true`
after 2.6 s, `reversedPort: 8560`, and `attached: true` 82 ms after the route link
[observed — wave 30, `live-devclient` `026-f123-navigate-cold.txt`].

## Resolving a URL without a device

Decision [confirmed — Kudo, 2026-08-25]. `exagent navigate <route> --print-url` resolves everything
and opens nothing.

The device this CLI can drive and the device the app runs on are not always the same one. A cloud
simulator, a phone, and a teammate's laptop all need the identical thing — the URL — and none of
them is reachable with `simctl` or `adb`. Before this, the URL was resolved one step before
`resolveDeviceAsync` and thrown away with its failure.

`resolveRouteUrlAsync` is `openRouteAsync` with the device half removed: the route check against the
project's route table, the dev-server discovery, the Expo Go vs development build decision, the
scheme, the `/--/?` root marker, and the tunnel host. `openRouteAsync` is now that function plus the
device. One composition, two modes — which is the same reason `openRoute.ts` was split out of
`navigateAsync` for `smoke` in the first place: a second composition is a second place for the
findings of this document to be forgotten.

Exit `0` on a resolvable URL. Whether anything then opens it is not this command's to know, and a
non-zero code for "nobody opened it" would make the mode useless to the caller it exists for. The
route check still fails the run, because a URL for a route the project has not got is not an answer.

`--json` carries the URL, plus `hostType` — the fact that decides whether the URL is usable
anywhere but here — and the four device keys as `null`, so a parser reads one shape either way.

And `navigate` **without** the flag, on a machine with no device, now names that URL in its failure
and names the flag: the resolution had already happened, and "no device found" was the whole truth
and less than half the answer.

## The cloud simulator backend

Decision [confirmed — Kudo, 2026-08-26]. Device resolution grows a **third backend**: a simulator
that runs on EAS rather than on this machine. `exagent navigate --cloud` drives it, and a machine
with no local device reaches for it on its own.

This is the other half of §Resolving a URL without a device. That section's dogfood session drove
Expo Go on a **cloud** simulator through a tunnel, from a laptop with neither a booted simulator nor
an attached device, and every `navigate` it ran stopped at "no booted device was found" [observed —
2026-08-24]. Wave 9 gave that machine the **URL**. This gives it the **act**: the same session the
agent was driving by hand is a device this CLI can open a link on.

### Three backends, one ladder

`NavigateDevice` gains `backend: 'local-ios' | 'local-android' | 'cloud'`, and it is reported rather
than inferred from `platform` — an EAS session runs iOS too, so `ios` no longer says where the
device is. It rides in `--json` as `deviceBackend` on `navigate` and on `smoke`, on the `Device`
line of the human summary, and on the `cli:navigate` event.

The order, in `resolveDeviceAsync`:

1. **`--cloud`** (`cloud: 'required'`) — the session is the device and no platform tool is asked at
   all. A caller that named a device meant that device.
2. **A local device** — free, instant, and what a developer at a keyboard is looking at. A session
   that happens to be up must never quietly take a run away from the simulator on the desk.
3. **The session** (`cloud: 'fallback'`) — only when the local probes found nothing.

Rung 3 asks the **service**, not the filesystem: `eas simulator:list --status in-progress` is what
makes it a rung at all, because a session started by MCP, by another terminal, or by a
`simulator:start --json` that wrote no dotenv is still this project's session. The first cut gated it
on `.env.eas-simulator` existing; §Finding the session is why that changed and what it costs.

**Opt-in per caller, defaulting to `off`.** `navigate` and `smoke` put the cloud on their ladder as
a *fallback*; `runtime:stop` and `runtime:reload` take `--cloud` and reach for it only when named,
so a session that happens to be up never quietly bills a run that a local device would have served.
See §What the cloud backend can and cannot do.

`--cloud` is a **backend** flag, not a third platform, so it does not join the `--ios`/`--android`
pair: a session is iOS or Android too, and `--cloud --ios` is a meaningful line to type. It names
the platform the session must be, and a session that is the other one is refused rather than
driven. `--cloud --print-url` is refused as well: one asks for a device and the other asks for none.

### The mechanism: `eas simulator:*` subprocesses

Per llp/0001 constraint 5, `eas-cli` is reached across a process boundary like the rest of the
family. So the backend is `eas simulator:<verb>` subprocesses, and **every one of them is built by
one module**, `src/device/cloudSimulator.ts`.

One deviation worth naming. The device verbs are not an `eas` subcommand: `eas simulator:exec` loads
the session's connection environment and **spawns the command it is given**, and the verbs come from
`agent-device`, a controller run on demand through `npx`. The process this CLI starts is still the
family binary; what it asks that binary to run is a second process this CLI never resolves itself.
`AGENT_DEVICE_SPEC` is the whole of that decision, in one constant.

### The argv, validated against a live session

Two rounds, and the second one is the one that counts.

**Round one read the packages.** The account was signed out, so wave 11 read the published source of
the CLIs it spawns instead of the skill that describes them: `eas-cli` (`oclif.manifest.json` for
every flag, `build/commands/simulator/*.js` for the exact JSON each one prints) and
`agent-device@0.20.10` (`agent-device help <verb>`, which runs offline).

**Round two ran them.** Kudo signed in on 2026-08-26, and one bounded session —
`01a03d80-0556-7d22-98df-f415d9392b98` on `expo-ci`/`expo-workflow-testing`, created 09:56:35Z,
stopped 09:58:58Z, about two and a half billed minutes — was started for the express purpose of
turning this table from *accepted* into *answered*. The payloads are recorded verbatim in
`src/__fixtures__/eas/` and parsed by the test suite, so a drift in the service fails here rather
than on somebody's paid session.

| Invocation | What the service did with it | Status |
| --- | --- | --- |
| `eas simulator:list --status in-progress --limit 25 --json` | Exit 0 and `{"sessions":[…],"pageInfo":{…}}` for **this project's** sessions — the exact argv this CLI builds, accepted as sent | [observed — live, `eas-cli/22.4.0`] |
| `eas simulator:availability --json` | `{"available":true,"accountName":"expo-ci"}`. **No `waitlistUrl` when available** — the key appears only for a gated account | [observed — live; gated branch still [inferred] from `build/commands/simulator/availability.js`] |
| `eas simulator:exec npx agent-device@latest open <url> --platform ios` | Accepted and executed: `npx` fetched the controller, the controller built the Apple runner and reached the device | [observed — live] |
| `eas simulator:exec npx agent-device@latest close <appId>` | Exit 0 and `{"success":true,"data":{"session":"default","message":"Closed: default"}}` — **for any id at all.** See §What `close` will not tell you | [observed — live] |
| `eas simulator:exec npx agent-device@latest screenshot <path>` | Refused with `Error (SESSION_NOT_FOUND): No active session. Run open first.` and wrote no file, on a simulator with nothing open. The precondition the verb table documents, in the service's own words | [observed — live] |
| `eas simulator:start --platform ios --type agent-device --non-interactive --name …` | Created the session, waited for the daemon, wrote the dotenv, printed a `webPreviewUrl` and a job URL. ~69 s to ready | [observed — live] |
| `eas simulator:stop` | Stopped the dotenv's session; the listing then reported it `STOPPED` with `finishedAt` set | [observed — live] |
| `eas simulator:get [--id <id>] --json` | Fields at the **top level** (no envelope), plus `remoteConfig` and `artifacts`. Not spawned by this CLI any more | [observed — package source; not exercised live] |
| `.env.eas-simulator` | `EAS_SIMULATOR_SESSION_ID` plus the daemon URL and token, `KEY='value'` under a "Do not commit this file" header. **Not written** by `simulator:start --json` or `--out-config-type env` | [observed — `build/simulator/env.js`; the write itself seen live] |

Enum values, which is where a string comparison goes wrong quietly: `status` and `platform` come
back as the **raw GraphQL enums** (`IN_PROGRESS`, `STOPPED`, `IOS`) while `type` is the lower-case
**flag spelling** (`agent-device`) — so a comparison that lower-cases all three, or none, is wrong
either way [observed — live]. `startedAt` and `finishedAt` are **absent** rather than null when they
do not apply, and `pageInfo` grows `startCursor`/`endCursor` only on a non-empty page.

What running it **corrected**, rather than confirmed:

- `close <appId>` does not answer about the app id. That is §What `close` will not tell you, and it
  was a false green shipped in this wave and caught by the live run.
- A non-zero exit from a device verb is **not** evidence the argv was wrong. The controller prints
  its own refusals as `Error (CODE): <sentence>`, and the first live `open` produced
  `Error (COMMAND_FAILED): Simulator device failed to open myapp://.` under a "Why" that blamed the
  syntax. `readControllerError` splits the two, and `CLOUD_SIMULATOR_DEVICE_REFUSED` is the failure
  for a command that was accepted and a device that said no.
- `simulator:availability` omits `waitlistUrl` entirely when the account has access, so a parser
  that expected it always to be present would have read a gated account out of a healthy one.

Still standing, and still the design:

- **The argv is pure and pinned by a test table** (`src/device/__tests__/cloudSimulator-test.ts`),
  for the reason `buildOpenUrlCommand` and `buildScreenshotCommand` are — except more so. A wrong
  `simctl` flag fails on a machine with a simulator; a wrong `simulator:exec` flag fails on a
  machine with an account, a session, and a bill.
- **That validation pass has now been run** [observed — 2026-08-26, staging, session
  `01a03ec5-9255-78c6-bd1d-0f09d4350677`]. What it reached is everything the blank-simulator session
  could not: an **Android** session, started with a **real development build installed on it**
  (`eas simulator --platform android --build-id <id> --type agent-device`, the APK of the app under
  test rather than Expo Go), and `open`, `screenshot` and `close` run against that app.

  Every argv this module builds was spawned unchanged and exited 0.
  `navigate / --cloud` resolved the session from the service — no `.env.eas-simulator` involved —
  and ran `eas simulator:exec npx agent-device@latest open dailywordsgrok:// --platform android`,
  reporting `deviceBackend: "cloud"`, `platform: "android"` and the session's own id.
  `screenshot` wrote a 320×640 PNG of the app's own launcher screen to a local path, which is the
  first time the cloud backend has been seen to photograph a real app.
  `runtime:stop --cloud` ran `… close dev.expo.kudo.dailywords` and answered `stopped: true` with
  `wasRunning: null`, which is the honest report §What `close` will not tell you argues for.

  **`runtime:stop --cloud` was seen to stop a running app**, which the previous pass could not say.
  The evidence is not `close`'s own exit code — that proves nothing about the id — but the state
  after it: the next `screenshot` failed with
  `Error (SESSION_NOT_FOUND): No active session. Run open first.`, where the screenshot before it
  had succeeded. The app was foregrounded, then it was not.

  Two things this pass did **not** reach. `runtime:reload --cloud` stopped at its dev-server
  precondition — `NO_DEV_SERVER`, exit 1, correctly, since a cloud simulator needs a *tunnelled*
  dev server and none was running — so the reload broadcast over a cloud session is still
  [inferred]. And the gated-account branch of `availability` still needs a gated account.

### What `close` will not tell you

The controller's `close` verb ends the app and reports success **whatever id it is given**:

```
$ eas simulator:exec npx agent-device@latest close com.nonexistent.zzz.qqq --json
{"success":true,"data":{"session":"default","message":"Closed: default"}}
```

Byte for byte the answer `close host.exp.Exponent` gave on the same blank simulator [observed —
live, 2026-08-26]. The help says "close the named app, or the active session app when app is
omitted"; what the service does is answer about the **session**, and the argument does not make the
answer specific.

That matters because `runtime:stop`'s whole contract is *which app*. §Stopping the app is built on
the observation that the command is the easy half and the **id** is the hard half — `simctl
terminate` and `am force-stop` name a process and fail when there is none, which is exactly what
makes `wasRunning` knowable. A backend whose verb succeeds unconditionally has no such fact, and
reporting `wasRunning: true` from it would be this command inventing the one thing it exists to
report. This wave shipped that bug for four commits; the live run is what found it.

So the honest shape, rather than the convenient one:

- `StopAppResult.verified` is **false** for the cloud backend and true for both local ones. It says
  whether the tool's answer is about this application id at all.
- `runtime:stop --json` reports **`wasRunning: null`** on a cloud session — a fact the run does not
  have, which is what llp/0006 §Output contract says null is for. The human line says *"the session
  closed the app in front; whether it was this one is not something the controller reports"*.
- The `--app-id` mismatch check (§An `--app-id` nobody is running, exit 20) is gated on `verified`,
  so it never fires on a backend that cannot establish its premise. Exit 20 there would be a
  fabricated diagnosis.
- The verb is **kept**, because closing the foreground app is a real act and is what "put the app
  into a known state" means. What is removed is the claim about which app.

`runtime:reload --cloud` and the Android attach recovery are unaffected, and the reason is worth
naming: neither trusts the stop. A reload is reported only when peer churn **and** a new debugger
target prove it (§What proves a reload, without CDP), and the recovery re-checks `/json/list`. They
consume `close` as a nudge and verify the outcome independently, which is why an unreliable verb is
sound there and not here.

**Upstream ask:** a `close` that fails, or at least reports the app it acted on, when the named
application is not the session's. Until then this CLI cannot offer a verified per-app stop on a
cloud session, and says so rather than pretending.

### Two things a cloud run leaves behind

Added after live staging validation, S12 and S13 [observed — 2026-08-26].

**A failed `runtime:reload --cloud` leaves the app closed, and said so nowhere (S12).** The device
fallback is a force-stop and a relaunch. The stop succeeded — `close host.exp.Exponent` on the
session — and the relaunch was refused, so the session was left up, billing, with nothing running on
it. The report said only *"The app was not reloaded"* and offered `npx exagent navigate /`, which on
a cloud session is the very open that had just failed.

**Wave 19 did redesign it**, and the first cut of this paragraph — "the fallback is not redesigned
here" — is the thing to correct. There is no `close` in the path any more, so the state this
paragraph describes cannot be reached the same way: one verb restarts the app, and a refusal of it
says something narrower and true — `--relaunch` terminates before it launches, so whether the app is
on the screen is **not known**, and the report says that instead of claiming either. `leftAppStopped`
stays on the payload for the local device method, where the stop and the start are two commands and
the fact *is* knowable. The by-hand recovery is still named, and still the application id rather than
a deep link: it avoids the "Open in Expo Go?" dialog that nothing can answer on a cloud device
(S10).

**`runtime:stop --cloud`'s follow-up asserted the app was not running (S13).** `wasRunning` is
**null** on a cloud session for the reason §What `close` will not tell you gives, and the follow-up
read that null as `false`: *"The app was not running, so this is what starts it"* — while Expo Go was
running on the session. The three-way is now written out, and the null arm claims neither.

### Finding the session

Decision [confirmed — Kudo, 2026-08-26]. **A cloud device is a session the service says is
running, not a file on disk.** The first cut gated the whole backend on `.env.eas-simulator`
existing, and the file is the wrong contract for three reasons that are all about *other people's*
sessions: MCP is growing its own simulator support and need not write it, `simulator:start --json`
and `--out-config-type env` do not write it either [observed — `build/simulator/env.js`], and the
file outlives the session it names, so its presence was never proof and its absence never was.

Three ways to answer "is there a session", and what each one costs:

| Option | What it is | Cost |
| --- | --- | --- |
| **1. `eas simulator:list`** | One more subprocess in the family this CLI already spawns | One `eas` start-up plus one GraphQL round trip; needs a login and a linked `projectId`; the command is hidden and experimental, so its flags can move |
| 2. Direct GraphQL to `api.expo.dev` | One HTTP call, using the session token in `~/.expo/state.json` | Breaks llp/0001 constraint 5; **reads another CLI's credential store**; reimplements project resolution, `EXPO_TOKEN` precedence and the auth header; pins a schema this package does not generate from |
| 3. Keep the file as the gate | One `stat` | Answers a question nobody asked: whether this project *once started* a session |

**Option 1, with option 3 kept for what it is actually true about.**

Option 2 is the one worth arguing with, because this CLI does already make direct HTTP calls — it
talks to the dev server's `/json/list` and its message socket without going through `expo`. The
difference is what is on the other end. The dev server is **this machine's own process**, started
by this CLI, reached over loopback, with no credential involved: a direct call there is a local IPC
that happens to speak HTTP. `api.expo.dev` is somebody's **account**, on a **paid** product, reached
with a **secret** this package neither issued nor owns. Lifting a token out of `~/.expo/state.json`
makes an undocumented file into an API — it moves whenever eas-cli wants it to, and the failure mode
is not a broken command but a credential this CLI mishandled. `eas` is the program that owns that
token, so `eas` is the program that spends it. Rejected, and worth writing down so it is not
re-argued.

**Where the cost lands is the real design.** The gate used to be one `stat` on the failure path of
every `navigate` with no local device, and it is now a subprocess. That is paid on purpose, and only
on one of the two ladders:

- **The device ladder** (`navigate`/`smoke`, `cloud: 'fallback'` or `'required'`) asks the service.
  It is about to open a link on a device; being *right* is worth ~1 s, and being wrong costs a
  reader a false "no device" on a machine that has one.
- **The suggestion ladders** (`status.next`, the `start`/`dev` banner) keep the `stat`, unchanged.
  They promise to be instant, they are not acting on anything, and a suggestion that names a dead
  session costs one command that says so — a much cheaper wrong answer than a held-up banner
  (§Where it composes).

#### A device that is held is not a session that ended

Added after live staging validation, S14 [observed — 2026-08-26].

The session's controller answers a verb it cannot perform with `Error (CODE): <sentence>`, and one of
those codes carries its own remedy: `DEVICE_IN_USE` — *Device is already in use by session
"default".* The general advice for a refused verb is the opposite of it — "a session can end between
the moment it was listed and the moment a verb reaches it; start a new one if it has" — and acting on
that **bills a second machine and leaves the first one held**.

So `DEVICE_IN_USE` gets its own `How:`. It says the session did not end, names the session the
controller named (read out of the sentence, with a fallback for a message that stops carrying one),
points at binding the verb to that session, and says not to start another. The suggestion under it
stays `eas simulator:list --status in-progress`, which for this code is how to see which sessions are
up and starts nothing.

#### Which session, when there is more than one

Deterministic, pure, and total — two runs a second apart must pick the same session, and the
answer must not depend on the order the service happened to return:

1. **Only `type: agent-device` is a candidate.** The bridge is `simulator:exec npx agent-device`,
   and an `argent`, `appium` or `serve-sim` session has no agent-device daemon inside it to answer.
   A project whose only live session is one of those is told *that*, rather than "no session".
2. **The session `.env.eas-simulator` names**, when it is among the candidates. The file is a poor
   existence proof and a good **preference**: it is the session this project started, so it is the
   one the person at the keyboard means.
3. **The platform the caller asked for**, when `--ios`/`--android` named one.
4. **The most recently created**, `createdAt` descending, with `id` ascending as the tiebreaker.

The chosen id is reported — the `Device` line, `deviceId` in `--json`, and the `cli:navigate` event
— so "which one did it pick" is never a thing a reader has to work out.

### A cloud simulator requires a tunnel

`exp://127.0.0.1:<port>` names the loopback of **whatever resolves it**, and for a cloud session
that is a machine in a datacenter. This is the same shape as the Android emulator finding in
§The device's loopback is not this machine's — and unlike the emulator, there is no `adb reverse`
that can fix it. A LAN address is no better: the session is not on this network.

So a cloud run against a `localhost` or `lan` URL is **refused before anything opens**, naming
`dev --detach --tunnel`. Opening it would land the app on an error screen with the device tool
reporting success, which is exactly the false green F50 was.

The check lives in `openRouteAsync`, next to the device, not in the URL resolver: it is a fact about
the *device*, and the identical URL is perfectly good for the simulator on this desk. A development
build's `<scheme>://<route>` carries no host at all (`hostType: null`) and is allowed — it reaches
whatever dev server the app was launched against, which this command has no say in.

The attach confirmation is unchanged: the same `/json/list` wait, scoped to the session's platform.
The app connects back through the tunnel, so "a debugger target on this platform" proves the same
thing it proves locally.

### A non-zero exit means different things per backend

`xcrun simctl openurl` exiting non-zero is **the device refusing the link** — a fact about the app
on it, which `navigate` reports and exits `1` for. `eas simulator:exec` exiting non-zero is any of:
a session that ended mid-run, a signed-out account, a controller flag this CLI got wrong, a binary
that was never the EAS CLI, **or the device refusing after everything worked**. None of the first
four is "the device refused", and reporting them as that would send a reader to reinstall Expo Go.

The last one is a live correction. The first real `open` this CLI ever sent came back as:

```
Error (COMMAND_FAILED): Simulator device failed to open myapp://.
```

— the controller's own words, for a scheme no app on the blank simulator had registered [observed —
2026-08-26]. The argv was right and the bridge worked; the message printed above it said "a verb or
a flag this CLI sends may not be the one the installed eas-cli has", which would have sent that
reader to check a command that was already correct. `agent-device` prints every refusal as
`Error (CODE): <sentence>` and `simulator:exec` propagates the exit status, so `readControllerError`
recognises the shape and `CLOUD_SIMULATOR_DEVICE_REFUSED` says the true thing: the command reached
the device and the device is what said no.

So the cloud path raises a **tool failure** for the rest, and folds three things into it:

- `looksLikeWrapperCrash` — the `eas` under that name is named rather than quoted. A Rust backtrace
  printed under "What the tool printed" claims the EAS CLI reported it.
- The needs-human classifier — a signed-out account becomes the `eas-login` handoff and **exit 7**,
  which is the band an agent reads before it reads a word (llp/0010 §Exit codes).
- Otherwise, what the tool printed, plus the `--help` that is authoritative for an experimental CLI.

The same classification runs on the *question* about the session, not only on the answer: a probe
that stopped because nobody is signed in carries the failed run, and `cloudSessionUnknownError`
raises the same handoff. Signing in is the next step whether the login was found while driving a
session or while asking about one.

### The ways there is no session, and why they are separate errors

`unknown` is the one that matters, and it is the same distinction `DeviceProbe.toolError` draws for
`adb` (F49): **a tool that did not answer has said nothing about the world.**

| State | Error | Why it is its own |
| --- | --- | --- |
| `active` | — | The device |
| `inactive` | `NO_CLOUD_SIMULATOR_SESSION`, saying the dotenv's id is not among the live sessions | The file outlives the session it names, so a stale one reads as an answer unless it is called stale |
| `none`, live sessions of the wrong **type** | `NO_CLOUD_SIMULATOR_SESSION`, naming the types that are up | "No session" for a running `serve-sim` sends a reader to start a second one next to it |
| `none`, feature available | `NO_CLOUD_SIMULATOR_SESSION`, naming `simulator:start` and that it bills until stopped | Nothing to find: a cloud simulator is started, not left booted by somebody else |
| `none`, feature off | `CLOUD_SIMULATOR_UNAVAILABLE`, with the **waitlist URL** the service returns, plus the local device and `--print-url` | An account that cannot have the feature must never be told to start a session — and "no" without "here is where access comes from" is a dead end |
| `unknown` | `CLOUD_SIMULATOR_SESSION_UNKNOWN`, naming `simulator:list` and **never** `simulator:start` | "Start one" for a session that could not be ruled out starts a **second billed session** next to one that may be running |

Availability is asked **only** when the listing came back empty of usable sessions — one read-only
request, on the one path where the answer changes the instruction from "start a session" to "this
account cannot have one".

### What the cloud backend can and cannot do

The first cut said `runtime:stop` had no cloud form. **That was wrong**, and reading the controller
is what corrected it: `agent-device close <appId>` closes the **named app** and leaves the device up
[observed — `agent-device help close`, 0.20.10]. That is the same act as `simctl terminate` and
`am force-stop`, so `runtime:stop --cloud` is now a command that runs rather than one that explains
itself. `--shutdown`, which would also stop the simulator, is never passed: the distinction the
first cut was protecting — one app versus the whole remote machine — is a **flag**, not the absence
of a verb.

With one app-ending verb in hand, the rest of the loop follows:

| Command | Cloud form | How |
| --- | --- | --- |
| `navigate` | yes | `open <url> --platform <p>` |
| `smoke` | yes | `navigate`'s device, then `screenshot <path>` |
| `runtime:stop --cloud` | yes, with a caveat | `close <appId>` — which ends the app but does **not** report which one, so `wasRunning` is null. See §What `close` will not tell you |
| `runtime:reload --cloud` | yes, and it is the **primary** path there | `open <appId> --relaunch`, then `open <url>` — no `close` at all. §Reloading a cloud session |
| the Android attach recovery | yes | the same pair, so it is gated on "the platform is Android" rather than on "the device is local" |
| ending the **session** | no, and deliberately | `eas simulator:stop` is the person's command. This CLI never spawns it; it only names it |

**Corrected in wave 19.** This section used to say `runtime:reload`'s primary path "never needed a
cloud form", because the broadcast goes over the dev server's own command socket and a cloud session
must reach that dev server through a tunnel. The tunnel carries the *bundle*; the app holds no client
on that socket through it, and the broadcast reloaded nothing. The cloud therefore changes the
**ladder** rather than a fallback, and §Reloading a cloud session is the sequence that works.
(`agent-device metro reload` is still *not* used, and now for a reason that was read rather than
assumed: its own help says that "when the server has no HTTP /reload route (Expo) the reload is
broadcast over its /message websocket instead" — the same broadcast, sent from the controller's side,
with the same empty client list at the far end.)

### Where it composes

- **`smoke`** takes `--cloud` and resolves its device through `resolveDeviceAsync`, which is the
  function `navigate` uses. One answer, threaded from the `route` phase into the `screenshot` phase
  — a gate whose two device phases resolved separately could photograph one device to answer for
  another. `deviceBackend` rides in its `--json`.
- **The screenshot primitive** grows the third backend. `simctl` is given a path and writes it,
  `adb exec-out` writes to stdout and is redirected, and the controller **downloads** to the path —
  so it reuses the `simctl` shape with a much longer budget (`npx`, then a network, then an image
  coming back). Everything after that is identical, including the PNG-signature check: "the command
  ran" and "there is a screenshot" are two facts over a network too.
- **The no-local-device suggestions** of wave 9 name the session when the project has one. The
  `open-app` rung of `start`/`dev` is no longer *dropped* on a machine with no device, it is aimed
  at `navigate / --cloud`; `status.next` names that command instead of a URL for somebody else to
  open; and `dev:wait`'s "the bundle is built and nothing is running it" rung says the same, because
  "open it on the booted simulator or the attached device" is an instruction that cannot work on the
  machine this backend exists for. All three read the **dotenv** and not the service: `status`
  promises to be instant, and a start banner must never be held up by a ladder. A file naming a dead
  session costs one `navigate --cloud` that says so, which is a much cheaper wrong answer than a
  slow report — this is the split §Finding the session draws between the two ladders.
- **Nothing suggests a platform tool for a cloud device.** `simctl` and `adb` are commands about
  *this machine*, and a run whose backend is `cloud` never names them: the follow-ups branch on
  `deviceBackend`, and the errors a cloud verb raises point at `simulator:exec --help` and
  `simulator:list` instead.

## Stopping the app

Decision [confirmed — Kudo, 2026-08-23]. `exagent runtime:stop` ends the app on the device, and
`exagent navigate` starts one. Between them an agent can put a project into a known state without
composing a `simctl` or `adb` line.

**The command is the easy half.** `xcrun simctl terminate <udid> <id>` and `adb shell am force-stop
<id>` are two lines that never change. What changes is the *id*, and getting it wrong stops nothing
while reporting that it stopped something. Expo Go and a development build are different
applications, the two Expo Go ids differ only in case (`host.exp.Exponent` on iOS,
`host.exp.exponent` on Android), and a project moves between the two worlds the moment it grows a
native directory.

So the evidence is ranked, and the report names the rung that answered (`bundleIdSource`,
`bundleIdReason` — `src/runtime/appId.ts`):

1. `--app-id`, which the caller knows better than this does.
2. The `appId` of a debugger target the dev server reports — what is running *now*.
3. `ios.bundleIdentifier` / `android.package` from the **static** app config. A dynamic
   `app.config.js` is never evaluated, per llp/0001 constraint 5.
4. Expo Go, per platform.

**The dev server outranks the app config, and that ordering is the decision.** The config says what
a *build* of this project would be called; the dev server says what is running. A project whose
config names a bundle identifier can still be running in Expo Go — every Expo Go project with a
prebuild config is in that state — and stopping the id from the config would then terminate nothing
and report success, which is the class of false green this whole round exists to remove.

**An app that was not running is a success with a note.** `simctl terminate` exits non-zero for it
with `found nothing to terminate`, and reading that as a failure would make a second `runtime:stop`
fail for having nothing left to do. `stopped` is the state the caller asked for and `wasRunning`
says whether this command is what produced it — two keys because they answer two questions. On
Android the distinction cannot be drawn: `am force-stop` exits 0 and prints nothing whether or not
the app was running, so `wasRunning` there means "not known to have been already stopped".

Live [observed — 2026-08-23, notesapp on port 8171]: with Expo Go attached, exit 0,
`bundleIdSource: dev-server`, `wasRunning: true`, and the dev server's target list went from 1 to
0. Run again immediately: exit 0, `wasRunning: false`, `bundleIdSource: expo-go-default` — the
source moved down a rung because there was no longer an app connected to ask, which is the report
being honest rather than sticky.

### An `--app-id` nobody is running

Decision [confirmed — Kudo, 2026-08-24]. When `--app-id` names an app that was **not** running and
the dev server is reporting a **different** app that is, `runtime:stop` exits `20`. Every other
"the app was not running" stays exit `0`.

The finding [observed — friction run 4, F42]: `runtime:stop --app-id host.exp.Exponent2` — one
character wrong — exited **0** with `Stopped yes · it was not running` and a follow-up reading "The
app was not running, so this is what starts it". Debugger targets before: 1. After: 1. The app the
caller was looking at kept running, and every channel said the command had worked. This section
above says the whole point of ranking the evidence is that "getting it wrong stops nothing while
reporting that it stopped something"; the command had the connected bundle id in hand the entire
time and never compared it.

**Why `20` and not a note on a `0`.** This was the argued call, and the argument that decides it is
llp/0010's own first sentence: an agent reads the exit code before it reads a word of the output,
so a warning inside a zero is a warning an agent does not see. The other reading is real — the
state the caller named ("`host.exp.Exponent2` is not running") does hold, and §The seventh and
eighth says a state already reached is a success. It loses because the *subject* of this command
is the app on the device, and the app on the device is untouched. A `0` here means the command that
exists to remove this exact class of false green produces one.

**The false red it costs, and why it is small.** A machine can legitimately run an app that is not
attached to this dev server while another one is, and stopping the first is now exit `20`. Three
conditions have to hold together for that, which is what keeps the surface narrow:

1. `--app-id` was passed, so this is the caller's id and not a guess of ours to defend;
2. the device tool found nothing under it (`wasAlreadyStopped`) — an id that stopped something is
   never suspicious, whatever else is connected; and
3. the dev server reports at least one debugger target, and none of them is that id.

Idempotency is unaffected, and that is a consequence of (3) rather than a special case: after a
successful stop nothing is connected, so the second run has no other app to disagree with and exits
`0`. Live [observed — 2026-08-24, port 8190]: `--app-id host.exp.Exponent2` with Expo Go attached →
exit `20`, targets still 1; `--app-id host.exp.Exponent` → exit `0`, targets 0; then
`--app-id host.exp.Exponent2` again → exit `0`, `appIdMismatch: false`.

Both channels carry it. `--json` gains `connectedAppIds` and `appIdMismatch`; the human report's
first line says `Stopped no · host.exp.Exponent2 was not running, and host.exp.Exponent is` rather
than the old `Stopped yes · it was not running`, which is true of the id and reads as "the app is
stopped". The follow-up is the same command with the connected id on it — the old list led with
`navigate /`, which starts an app while the one the caller meant to stop is still running.

## Stopping the dev server

Decision [confirmed — Kudo, 2026-08-23]. `exagent dev:stop` reads the **dev-server lock**, signals
the PID it names, and waits for both the lock and the port to go quiet.

The friction it replaces is a shell incantation an agent has to compose and get right —
`lsof -ti tcp:8081 | xargs kill`. Every part of it is a guess: which port, whether the PID on it is
this project's dev server, whether the signal reached the bundler as well as the wrapper. A wrong
guess kills something nobody asked about.

The lock answers all three, and it already existed for other reasons: `src/devLock/` holds a socket
for as long as an `exagent`-started dev server runs, and the line it answers with carries `pid`
next to `url` and `port`. One `SIGTERM` to that PID is enough for the whole tree, because both
spawn paths install forwarders for `SIGINT`/`SIGTERM` and pass them to the `expo start` child
[observed — `src/utils/subprocess.ts`, `src/utils/expoCli.ts` `runExpoAsync`]. Live it takes about
**170 ms**, and the wrapper, Metro and the lock all go [observed — 2026-08-23, port 8171].

**The wait is on the PID and the lock; the port is read and reported, never waited on.** Revised
[confirmed — friction run 5, F48-10, 2026-08-25]; it was all three, and see §A port number is not one
listener for why that was wrong. The two that stayed fail independently — the lock is released
before Metro finishes closing its listener, and a holder that dies without releasing leaves a socket
file nothing answers on — and both are about *this project*: the PID is what the signal was sent to,
and the lock is what another command would still be pointed at.

### A port number is not one listener

Amendment [confirmed — friction run 5, F48-10, 2026-08-25]. `127.0.0.1:8081` and `[::1]:8081` are
**different sockets**. A machine with a split IPv4/IPv6 stack can have one process on each without
either one seeing a collision, and everything this CLI checks is over IPv4: the lock publishes
`http://127.0.0.1:<port>` [observed — `src/devLock/holdLock.ts`], and every `/status` request follows
it. So "the port answers" and "this project's dev server is running" are two claims, and the second
does not follow from the first.

Two commands were reading the first as the second.

- **`dev:stop` waited on the port before it would say a dev server had stopped.** With a stranger on
  `127.0.0.1:8081` and this project's dev server on `[::1]:8081`, the signalled process died on
  schedule and the port went on answering, so the command reported `reason: "still-running"` and
  exit `20` about a process that was already gone — and its `How:` line offered `--signal SIGKILL`,
  a next action with nothing left to signal. The conclusion is now drawn from **PID liveness**
  (`process.kill(pid, 0)`, with `EPERM` read as alive because a process this user may not signal is
  a process that is there), and the port is reported rather than acted on: `--json` carries
  `processStillRunning` (primary) beside `portStillAnswering` (secondary), and a stop whose port is
  still busy prints that fact and a `dev:stop --port <n>` rung to find out whose it is. `--force`
  changed the same way: it proved *that process* was the dev server on the port, so that process
  going away is what "forced" means.

  This also split the `still-running` failure in two, which is the useful part. The PID alive is the
  old failure and keeps the old recovery; the PID gone with the lock still answering is a *second*
  holder of the lock — two dev servers for this project, only one of them stopped — and its recovery
  is `status --json` and stopping the other one where it was started, never a bigger signal.
- **`dev --detach --wait-ready` could not say why it gave up.** The readiness wait is one long-lived
  `GET /status` against the lock's URL, so on a split stack it can be answered by whatever is on
  IPv4 while this project's bundler finishes untroubled on IPv6. The failure now says so on every
  path — the two sockets, and `lsof -nP -iTCP:<port> -sTCP:LISTEN` to list both — because it is the
  cause a reader will not think of and the log the error already quotes will not show it. When
  `X-React-Native-Project-Root` decides it (`projectRootMatched === false`), the message stops
  hedging and names the project root that answered: a wait that was watching somebody else's
  bundler is not a wait that needed longer.

The general rule this leaves: **a port check is corroboration, never a conclusion.** Where this CLI
has a handle on the thing itself — a PID, a lock, a project root header — that handle is the
evidence, and the port is what gets reported next to it.

### A port with no lock behind it is not this command's to kill

Decision [confirmed — Kudo, 2026-08-23]. It is reported, with its PID when the machine will name
one, and left running — exit `20`.

This is the one place the command could do real damage, and the reasoning is the same as llp/0010's
rule that a false red beats a false green only when the red is actionable: here the *destructive*
answer is the one that cannot be taken back. A second project's dev server on the port is the
ordinary case, not the exotic one.

`--force` stops it, and requires **two independent proofs**:

- the port answers `packager-status:running`, which establishes that a Metro dev server is there;
- the process on the port has a command line naming a program that runs one.

Neither alone is enough, and the reason is not caution for its own sake: a `/status` answer proves a
dev server exists but says nothing about *which PID owns the port*, and a PID lookup can race a port
that was closed and reopened between the two reads. Together they are the same fact from two
directions.

Live, all three cases [observed — 2026-08-23]: a dev server started by `expo start` directly on
8172 → exit **20**, `reason: foreign-dev-server`, `pid: 99705`, still answering afterwards; the same
with `--force` → exit 0, `forced: true`, port clear in 43 ms; and a plain Node HTTP server on 8173,
which is a `node` process but does not answer `packager-status:running` → exit **20** even with
`--force`, still serving afterwards. The detail line says "in use" there rather than "answering as
an Expo dev server", which is the difference the two proofs are about.

**Nothing running is exit `0`.** The end state the caller asked for is the state it is already in,
and a second `dev:stop` must not read as a failure. Without `--port` the report says so and names
the flag, because with no lock this command has not been *told* which dev server the caller means —
defaulting to 8081 there is how a command ends up reporting on, or killing, another project's.

**Windows is `taskkill /PID <pid> /T /F`,** because `process.kill` there maps every signal onto an
immediate terminate and reaches only the named process, leaving a bundler started through a batch
shim alive. Best effort, and untested on that platform, which is why the result reports whether the
call was made rather than whether it worked.

## Reading the detached dev server's output

Decision [confirmed — friction run 4, 2026-08-24]. `exagent dev:logs [--tail <n>] [--json]`.

The counterpart of `dev --detach` ([[0004-smart-start-and-project-state]] §Daemonization).
Detaching moves the bundler's output off the terminal, and this is where it goes instead — one file
per project under `.expo/dev/logs/`, truncated per run.

Three things it does that reading the file would not:

- **Strips the escape codes.** Metro colours its output and draws progress with cursor moves.
  Neither is text once it is out of a terminal, and a driving agent reading the raw file spends its
  context on `[2K[1G`.
- **Names the dev server the log belongs to.** The lock is read alongside the file, so the report
  says whether these lines are from a server that is running now or from the last one that did.
- **Tells "no log" apart from "started attached".** A project with a running dev server and no log
  has one that was started in a terminal, and its output is on that terminal. Reporting an empty
  file there would send the caller looking for something that was never going to exist.

**No `--follow`, and the help says why.** A tail that never returns re-creates the exact problem
`--detach` was added to solve. An agent polls; each read is bounded and quotable.

The lines are fenced in untrusted markers like every other command that relays what a project
produced ([[0008-guardrails]]): a bundler's log quotes source files and error messages from code
this CLI did not write.

## The dev server a caller names

Amendment [confirmed — friction run 4, 2026-08-24]. Every command of this group takes `--port <n>`
as sugar for `--dev-server-url http://127.0.0.1:<n>`, and `runtime:reload`/`runtime:stop` take
`--platform ios|android` alongside `--ios`/`--android`.

Flag drift is a tax an agent pays in failed commands. `exagent dev --port 8195` is the command that
starts the server, and every command that then talks to it wanted the *other* spelling — so a
caller with a port in hand got `unknown or unexpected option: --port` [observed — F47, friction run
4]. The same for platform: `runtime:stop --json` reports `"platform": "ios"` and then refused
`--platform ios` on the next call, which is a report a caller cannot write a command from.

Passing both `--dev-server-url` and `--port` is `BAD_ARGS`: they name two dev servers and there is
no rule for which wins. `--ios` and `--platform ios` together are fine — two spellings of one
answer — while `--ios --platform android` is two devices and is refused.

Related, and the reason this belongs in one place: a "no dev server answered" error must not suggest
the flag the caller just passed. `howToNameTheDevServer(explicit)` in `src/runtime/devServer.ts` is
the one sentence, and with an explicit URL it says the URL you named is the one that was tried
rather than telling you to name one [observed — F41 leftover, `runtime:reload --dev-server-url
http://127.0.0.1:9999`].

## The smoke gate

Decision [confirmed — Kudo, 2026-08-24]. `exagent smoke` is one command that answers "does this app
still boot", by asking the questions of six existing commands **in this process** and adding a
seventh nothing could ask before: a picture of the screen.

The plan this ships from is `plans/cluster-a-runtime-verify.md` §Feature 1, written when none of
those commands existed. Most of it has since been built as commands of its own, so `smoke` is now a
thin composite rather than the eight new things the plan described. What it composes, and which
function each phase calls — never a subprocess of this CLI, which is the design constraint:

| phase | the command whose question it is | the function |
| --- | --- | --- |
| `dev-server` | every runtime command | `discoverDevServerAsync` |
| `bundler-ready` | `dev:wait` | `waitForBundlerReadyAsync` (readiness + `projectRootMatched`) |
| `bundle` | `dev:wait`, `runtime:reload` | `checkEntryBundleAsync` |
| `app` | `dev:wait --require-app` | `waitForAppConnectionAsync`, then `openRouteAsync` |
| `route` | `navigate` | `openRouteAsync` (route-checked) |
| `runtime` | `runtime:eval` | `CdpClient.evaluateAsync('1')` |
| `errors` | `runtime:errors` | `CdpRuntimeErrorCollector` |
| `screenshot` | — | `captureScreenshotAsync` (new) |

The two `dev:wait` rows name the command those questions were first asked by. It was deferred from
v1 on 2026-08-26 ([[0017-deferred-commands]] §`dev:wait`), and `smoke` is now the only command that
asks them; the functions are unchanged and live.

**Why one process and not eight.** A `smoke` built out of `exagent` subprocesses would do dev-server
discovery eight times, and eight discoveries on a machine running two projects can answer eight
different things. It would also hand back a chain of exit codes where the point of the command is
that there is one. `src/smoke/phases.ts` is the composition, with every dependency injected — so the
outcome table, which is the part that can be wrong in a way no type checker sees, is tested against
fakes with no dev server, no device and no clock.

`navigate`'s act was extracted from its reporting to make this possible (`src/navigate/openRoute.ts`).
The alternative was for `smoke` to compose the same six steps itself, which would be a second place
for §Verifying the route, §The root route needs a query marker and the Expo Go decision to be
forgotten.

### The outcome table, and why there are three

| Code | Outcome | What it means |
| --- | --- | --- |
| `0` | `passed` | Every phase that decides answered yes, **and the runtime answered at all** |
| `20` | `failed` | An error in the window, an entry bundle that does not compile, another project's dev server, a device that refused the link, or no dev server with no `--start` |
| `22` | `inconclusive` | A wait expired, no app connected and none could be opened, or the runtime cannot be read |
| `1` | — | The command was wrong: a route the project has not got, a bad flag |

The third row is what llp/0005 §Android pass forces, and it is the reason a two-value gate would be
a lie. Expo Go for Android acknowledges `Runtime.enable` and reports nothing, so an error window
from it is empty whatever the app is doing — a gate that passed on an empty window would report
health it never observed. `runtime` is a phase of its own for exactly this: it asks the runtime to
evaluate `1`, and a `-32601` there means the window that follows proves nothing. `passed` requires
that evaluation to have answered.

### `--platform web` is refused, not answered

Decision [confirmed — Kudo, 2026-08-24]. `exagent smoke --platform web` is `BAD_ARGS`, exit `1`,
and its `Try:` is `npx exagent dev:wait --platform web`.

The original plan listed `web` alongside `ios` and `android`. [[0010-agent-conventions]] §What app
counting can and cannot see is newer than that plan and settles the same shape for
`--require-app --platform web`: `/json/list` is the inspector proxy's list of React Native
runtimes, a browser registers nothing in it whether or not the page is open, and there is nothing
to filter. Every phase of this command after the bundle check reads the app through that list.

The two alternatives both lose, and for the reasons that section already gave. `passed` would be
`dev:wait --platform web` wearing a name that promises a runtime check — the word "smoke" is a
claim about the app running. `22` says "look again", and no amount of looking makes a browser
answer a debugger, which is the argument that ruled out `22` for `--require-app`. `1` is the band
for "the tool did not work: usage error … fix the call", and the recovery is one command the
message names.

What web keeps is the half it can answer, and `dev:wait --platform web` is exactly that: the
bundler is this project's and the web entry bundle compiles.

### What counts as a crash, and the measurement that changed it

Amendment [observed — 2026-08-24, notesapp on SDK 57 in Expo Go, iPhone 17 Pro
`C159CF99-…`, port 8210]. The plan defined a red screen operationally as "at least one record with
`source: 'exception'` in the window", and that definition **passes every crash on this runtime**.

Live, with a `setInterval` throwing `Error('WAVE6_SMOKE_BOOM')` every 400 ms, the gate exited `0`
reporting seventeen `console.error` calls. `Runtime.exceptionThrown` never fired once. React Native
catches an uncaught throw and reports it through the console path, which §Implemented in v1 as
already records for the error collector — the collector has both capture sources for exactly this
reason — and the gate was reading the source rather than the record.

Three cases measured side by side in one window settle what is decidable:

| what the app did | `source` | `message` | the stack |
| --- | --- | --- | --- |
| `console.error("some text")` | `console` | `some text` | `console.js`, `backend.js` |
| `console.error(new Error(x))` | `console` | `Error: x` | the project's own frame |
| `throw new Error(x)` | `console` | `Error: x` | the project's own frame |

So the difference a gate can act on is not the channel, it is whether the record carries **the
error's own stack**: React Native reports an Error through the console path as one string holding
the message *and* its frames, and `splitTextStack` is what lifts them out. `RuntimeErrorRecord`
gains `isError` for it, and the gate fails on `isError || source === 'exception'` — the second
disjunct kept because a runtime that does use the exception channel exists, and reading only the
console path would be the same mistake pointed the other way.

**The limit, stated because it decides behaviour:** a logged `Error` and an uncaught one are the
same bytes here, so a gate built on this fails on `console.error(new Error(…))` too. That is the
honest trade — the alternative is a gate that passes a crash — and the record is printed next to
the verdict, so a reader sees which it was in one look. Live either way: seventeen throws →
exit `20`, `failing: 17`; eight `console.error` lines of text → exit `0`, `failing: 0, logs: 8`.

### The screenshot primitive

`src/device/screenshot.ts`, and the first thing in this CLI that takes one rather than printing the
command for one — `src/followups/navigate.ts` has suggested `xcrun simctl io <id> screenshot` since
the first runtime round and nothing ever ran it.

`buildScreenshotCommand` is pure, for the reason `buildOpenUrlCommand` is: the argv is the whole of
what the module decides and a wrong one fails only on a machine with a device attached. The two
platforms differ in one way that shapes the module: `simctl` is *given* the path and writes the
file, while `adb exec-out screencap -p` writes the PNG to **stdout** and the caller has to redirect
it — into a file descriptor, never through a string, because a PNG does not survive a JavaScript
string round trip. `exec-out` rather than `shell` for the same reason: `adb shell` runs through a
pty that rewrites `\n` as `\r\n` and corrupts every image it carries.

**Success is not read from the exit code.** `adb exec-out` answers a device that is not ready by
writing a sentence to stdout and exiting `0`, which leaves a file that exists, is not empty, and is
not a picture — so the first eight bytes are checked against the PNG signature instead. That is the
difference between "the command ran" and "there is a screenshot".

It **degrades and never decides**. A machine with no simulator reports `screenshot.ok: false` with
a reason and the run answers the rest of the question anyway: a screenshot is evidence attached to
an answer, and a run that established the app does not throw has established that with or without
one. The picture is of the *screen*, not of the app, which is said out loud in `--help` because it
is the limit a reader would otherwise assume away.

### Two more things the live round changed

Both were found on the first `--start` run and neither was visible in any test [observed —
2026-08-24].

- **`--start` must not name a platform.** The first version ran `exagent dev --yes --detach
  --wait-ready --ios`, and `expo start --ios` drives Simulator.app through AppleScript. On a Mac
  that has granted no Automation permission the Expo CLI does not catch the refusal and the dev
  server exits with it — llp/0010 §A failed plan step reports a failure, and the upstream ask
  beside it. The run watched exactly that: the first three phases answered against a dev server
  that was already dying, and the fourth found nothing. The recovery llp/0004 records is the one
  this command performs anyway — start the dev server without opening anything, then open the app
  with `navigate`, which needs no Automation grant. `START_DEV_SERVER_ARGV` is pinned by a test,
  because an absence is invisible in a diff.
- **One dev server for the whole run.** `navigate` discovers its own, so a run that had settled on
  one in phase 1 went looking again in phase 4 and found nothing: `Cannot build an Expo Go URL
  because the dev server URL is unknown`, exit `1`, from a run whose first three phases had all
  answered. The URL the first phase settled on is threaded into every phase after it. A gate whose
  phases talk to two dev servers is a gate whose phases are about two different things.

`--start` also carries `--port` through when the caller named a loopback one: a caller that passed
`--port 8210` named the dev server it means, and starting on 8081 would answer a question about a
different port than the one it was asked about.

### Live evidence

[observed — 2026-08-24, notesapp SDK 57, Expo Go, iPhone 17 Pro `C159CF99-…`]

| Case | Result |
| --- | --- |
| Healthy app, dev server on 8210 | exit `0`, eight phases `ok`/`skipped`, 3.4 s warm, 401 829-byte PNG of the root route |
| `--route /notes` | exit `0`, `routeCheck.ok: true`, screenshot on the Notes tab |
| Syntax error appended to `src/app/notes.tsx` | exit `20` at `bundle`, `src/app/notes.tsx:78:2`, `app` onwards `skipped`, nothing photographed |
| `setInterval` throwing every 400 ms | exit `20` at `errors`, `failing: 7`, screenshot still taken |
| `console.error` of plain text every 400 ms | exit `0`, `failing: 0, logs: 8` |
| App stopped on the device, dev server up, no `--start` | exit `0` — the gate opened the app itself (`exp://…/--/?`) and read it |
| Dev server stopped, no `--start` | exit `20` at `dev-server`, follow-ups naming `dev --detach` and `smoke --start` |
| `--start` from nothing | exit `0` in 11.4 s, `started: true`, dev server on 8081, app opened, PNG taken |
| `--start --port 8210 --route /notes` | exit `0` in 11.3 s, dev server on **8210**, `source: flag`, screenshot on `/notes` |

## Android

Everything in this document above was designed against iOS and read on iOS. The first Android
friction round [observed — friction run 6, 2026-08-24] found that four of the things it takes for
granted are **properties of the iOS simulator**, not of the runtime loop, and the commands were
reporting the iOS answer whatever they were pointed at. The findings and what they settled:

> **Read §The wall was Expo Go's, not Android's before you quote anything below as "Android
> cannot".** Every refusal in this section was measured against **Expo Go for Android**, and on
> 2026-08-28 the same commands were run against an Android **development build** on the same
> emulator: `runtime:eval` returns `2`, `runtime:tree` reads the screen, `runtime:tap --verify` sees
> the diff, `runtime:type` types, `runtime:errors` reports `runtimeReadable: true`, and
> `smoke --android` exits **0** with all eight phases `ok`. The sentences below are true and they
> are about an app, not about a platform.

### The device's loopback is not this machine's

`exp://127.0.0.1:<port>` names the loopback of whatever resolves it. On an emulator that is the
emulator, so the manifest fetch reaches a port nothing listens on, Expo Go shows `ErrorActivity`,
and `adb shell am start` still exits **0** — it delivered the intent, which is all it claims.
`navigate --android` therefore reported success for an app showing an error screen [F50].

`adb reverse tcp:<port> tcp:<port>` is the missing step, and it is what `expo start --android` runs
before it opens anything [reference — `@expo/cli` `src/start/platforms/android/adbReverse.ts`;
reimplemented as a subprocess in `src/navigate/adbReverse.ts`, per [[0001-agentic-cli-on-expo-cli]]
§Constraints item 5]. It runs **before** the link, only for a loopback host — a dev server on the
LAN or behind a tunnel is already reachable, and reversing its port would point the device at
itself — and a refusal is reported rather than fatal, because the link that follows is what turns
"the reverse failed" into a failure a reader can see.

**Which URL's port** [amended — wave 30, 2026-08-28, F123]. The rule above reads the loopback host
*of the URL being opened*, and that is right for a route link. The dev launcher's URL carries the
dev server inside its `url` parameter and is addressed to `expo-development-client`, which is not a
loopback host — so on the run that opens it (§On a development build, `navigate` goes
launcher-first) the reverse reads the **dev server's own origin** instead. Without that, the
launcher fetched its bundle from a port on the device: F50's shape, one URL further out.

### An exit code from a device tool is not an app that is running

The same finding's other half. `navigate` now waits for an app **on this platform** to register a
debugger target, and reports `App attached` or exits `22` with what it did and did not see. A stuck
Expo Go is force-stopped and the link opened once more before that verdict, because `ErrorActivity`
does not retry the manifest fetch — a second intent into a stuck instance changes nothing, so the
recovery has to end the process. `--no-wait-attach` is the way back to the old behaviour, and it
reports `attached: null` rather than `true`.

Live [observed — 2026-08-25, notesapp on SDK 57, Expo Go on `tuft-pixel`, port 8250]:
`Port reversed tcp:8250` then `App attached · 1 android debugger target after 2103ms`, with the
emulator on `/notes` (screenshot `friction/run-android/verify-01-navigate-notes.png`).

### The dev server does not label its targets, so the platform is inferred

`/json/list` is where every reading command decides what to talk to, and **nothing in it names a
platform**. Two live targets on one dev server, side by side [observed — 2026-08-25; the payload is
committed at `src/runtime/__tests__/fixtures/json-list-ios-and-android.json`]:

| field | iOS | Android |
| --- | --- | --- |
| `appId` | `host.exp.Exponent` | `host.exp.exponent` |
| `deviceName` | `iPhone 17 Pro` | `sdk_gphone64_arm64 - 15 - API 35` |
| `title` | `host.exp.Exponent (iPhone 17 Pro)` | `host.exp.exponent (Google sdk_gphone64_arm64)` |
| `description` | `React Native Bridgeless [C++ connection]` | *identical* |
| `type`, `reactNative.capabilities` | — | *identical* |

So `--android` scoped the deep link and nothing else: `smoke --android` opened the app on the
emulator and then earned its verdict from the **simulator's** runtime [F51]. `src/runtime/
targetPlatform.ts` infers the platform instead, strongest evidence first — a device name this
machine's own device tools just reported (`simctl list devices booted`, `adb devices -l`), then
React Native Android's `<model> - <release> - API <sdk>` device-name shape
[`AndroidInfoHelpers.getFriendlyDeviceName`], then Expo Go's two app ids, which differ by one
capital letter. **A target none of them place is `null` and is never counted as either**: a run that
cannot tell what it is talking to says so.

The scoping reaches `requireConnectedAppAsync`, `waitForAppConnectionAsync` and the `CdpClient`'s
target selection, so `runtime:eval`/`errors`/`network` (which now take `--ios`/`--android`/
`--platform`), `dev:wait --require-app` and every phase of `smoke` read the platform they were told
about. Live proof, one dev server, both apps attached, same route, same minute
[observed — 2026-08-25]: `smoke --android` → `22 inconclusive, runtimeSupported: false`;
`smoke --ios` → `0 passed, runtimeSupported: true`.

### The platform default must not answer for the other platform

`runtime:reload` and `dev:wait` built the entry bundle for a fixed default (iOS). With an
Android-only break — a `.android.ts` file that does not parse beside an `.ios.ts` that does — a
no-flag `runtime:reload` checked iOS, passed, and reloaded the **Android** app onto the bundle that
does not compile, printing `Bundle compiles · for ios` while doing it [F53].

The platform is now derived from the apps that are actually connected
(`resolveBundleCheckPlatformsAsync`): a named `--platform` wins, one connected platform is that
platform, **two are both**, and nothing connected leaves the fixed default with the report saying
that it is a default. A broken bundle decides the run whichever platform it was found on. Live
[observed — 2026-08-25, both apps attached, `src/lib/probe.android.ts` a syntax error]:
`Bundle does not compile · for android · also checked ios · the platform the connected app is on`,
exit 20; `dev:wait` with no flag the same way.

### The CDP-less runtime, corrected

The §Android pass note above is right that Expo Go for Android has no CDP debugger and wrong about
what that looks like on the wire. **Everything in this subsection is about Expo Go**, which was the
only Android app anything had run against when it was written; §The wall was Expo Go's, not
Android's is the same table for a development build, where every one of these methods answers. Measured method by method [observed — 2026-08-25, Expo Go 57 on
`tuft-pixel`, against the same app on an iPhone 17 Pro simulator]:

| method | Expo Go Android | Expo Go iOS |
| --- | --- | --- |
| `Runtime.enable` | `{}` — and `Runtime.executionContextCreated` and a `consoleAPICalled` NOTE do arrive | `{}` |
| `Log.enable` | `{}` | `{}` |
| `Network.enable` | `{}` | `{}` |
| `Debugger.enable` | `{}` | `{}`, with `Debugger.scriptParsed` for every script |
| `Console.enable` | `-32601` | `-32601` (`"Unsupported method 'Console.enable'"`) |
| `Runtime.evaluate` | `-32601` (message: the method name) | `{"result":{"type":"number","value":1}}` |
| `Log.entryAdded` | `Debugger integration: Android Bridgeless (ReactHostImpl)`, then `warning`: `The current JavaScript engine, HermesRuntime[RNBridgeless], does not support debugging over the Chrome DevTools Protocol.` | `Debugger integration: iOS Bridgeless` only |

Two corrections to what this document said [F61]. It is **not** true that Android "answers every
method" with `-32601` — four of the six above are acknowledged, and the ack is what made an empty
window look like a healthy app. And `Network.enable` succeeding is the *normal* Android case, so
`classifyNetworkDomainRefusal` never ran there at all: it only ever saw refusals. It now takes
`null` for "nothing refused anything" plus what the runtime said about carrying a debugger, and has
a name for the third case — `acknowledged-but-blind`.

Both collectors probe the runtime as they open their window: `Log.enable` for the announcement, and
one `Runtime.evaluate` of `1` for the code. The verdict is a field on the collector
(`RuntimeDebuggerCapability`), so a caller can qualify what it is about to print.

### Reading Android errors anyway

The same round found that the information was never missing — only the channel was. The error the
debugger could not report was in `dev:logs` the whole time, symbolicated, with a code frame [F52].
So `runtime:errors` falls back to the detached dev server's own log when, and only when, the runtime
announced that it cannot answer: the window is bounded by a line mark taken before it opens, the
records are labelled `source: 'dev-server-log'`, and the caveat sits **above** the count rather than
after it.

Its limits are stated in `src/dev/logErrors.ts` and printed with the result: the log does not name
the platform (Expo's logger only prefixes when the app is not bridgeless, and every modern app is),
and there is no structured stack behind a record — what there is, is the file and line the dev
server already resolved. Errors that were in the log *before* the window are counted and named, not
reported as this window's.

Live [observed — 2026-08-25]: with `throw new Error('boom from HomeScreen — F52 live check')` and a
`runtime:reload --android` inside the window, `runtime:errors --android --fail-on-error` exited
**20** with the message, the code frame and `HomeScreen (src/app/index.tsx:33:18)` — the first time
this CLI has reported an Android app's error at all.

### `--fail-on-error` on a runtime that cannot answer: exit 22, not 0

Recorded here because it **changes** what §Implemented in v1 as says about `runtime:errors`
("stays 0 whatever it collects; `--fail-on-error` exits 20 on a non-empty window"), and
[[0010-agent-conventions]] §Exit codes with it. That rule was written before any runtime that
cannot answer had been seen. On one, an empty window is not "nothing happened while I watched", it
is *no observation*, and exiting 0 reports health that nothing established.

So: when the runtime is blind **and** no dev server log could be read, `--fail-on-error` exits
`22` — llp/0010's code for "nothing was shown to be wrong and nothing was proved right" — with the
what/why/how naming `dev --detach` as the thing that would give it a log to read. When a log *was*
read, the window is a real observation and 0 stands. Without `--fail-on-error` the command still
exits 0 and prints the caveat: the flag is what says a caller is gating on this.

### `adb` is not on `PATH` on a normal machine

Every Android step is `adb` in a subprocess, and all of them spawned the bare name. On a machine
with the SDK installed the normal way and `platform-tools` never added to `PATH`, the first one to
fail is the device probe — so the CLI reported **"no Android device or emulator is attached"** for a
running emulator [F49]. `src/device/adb.ts` resolves `ANDROID_HOME`, then `ANDROID_SDK_ROOT`, then
`PATH`, then this platform's default install location, and every `adb` call site takes the
resolution the device probe made. `PATH` sits above the default location and below the environment
variables, which is one step off `@expo/cli`'s order and deliberate: an `adb` somebody put on `PATH`
is a choice, and the default location is this CLI guessing.

The second half is separate and matters more: **a tool failure is never reported as a device
failure**. `ADB_NOT_RUNNABLE` names every place that was looked and the variable that adds another,
and the "no device" message is only reachable once `adb` has run and answered.

### Smaller things the same round settled

- **Follow-ups keep the platform.** `smoke --android` failing suggested `npx exagent smoke`, which
  on a Mac reads the simulator [F58]; every command a follow-up names now carries the flag the run
  had, and `navigate`'s screenshot line carries the `adb` that was actually run rather than a bare
  name this machine cannot execute [F54].
- **`dev --plan` does not print a development build plan** for a project Expo Go can still serve —
  the plan engine reaches those steps only when a native module makes Expo Go incompatible
  (`src/plan/decide.ts`). Two messages claimed it did [F55]; they now name what actually helps.
- **`status` counts what can be talked to.** `/json/list` is a list of registrations, and a page an
  app left behind stays in it — so `status` said `1 app connected` while every runtime command
  answered `No target found` [F56]. It opens one debugger socket per listed target and reports
  `appsConnected`, `appsListed` and `appsStale`. (Verified by unit and e2e tests; the live emulator
  dropped its stale target within about two seconds, so this session could not reproduce the window
  the friction run hit.)
- **`smoke` waits before it photographs.** A run that opened the app itself photographed it
  mid-load [F57]. Nothing over this protocol says "rendered", so what is waited for is the honest
  neighbouring fact: two reads of the target list that name the same ids, bounded, and only for a
  run that put the app there.
- **`impact` and `checkpoint` agreed about git all along.** Both resolve the work tree the same way;
  what differed was that a `git status` which *failed* borrowed the sentence written for a project
  with no repository [F60]. `listChangedFilesAsync` now returns which of the two happened.

### The second Android round, and where F51's fix had not reached

Wave 25 put Android into the live tier — `e2e-live/__tests__/live-android-test.ts`, 24 tests on a real
emulator, described in [[0022-live-tier]] — and the suite's mixed-platform block found that **the
scoping this section describes was in three fewer places than this document said**. Every finding
below is one dev server with an iPhone 17 Pro simulator and a `tuft-pixel` emulator on it, port 8560,
2026-08-27. The shape is F51's, and the reason it recurred is worth naming: the narrowing is a
parameter, and a parameter can be accepted and then not passed on.

**F100 (CRITICAL) — `runtime:errors` and `smoke`'s error window read the runtime that answers.**
`CdpRuntimeErrorCollector` takes `platform` and `deviceIndex` — `runtimeAsync` and `smokeAsync` both
pass them — and built its `CdpClient` by naming four other options, so those two were dropped.
Unscoped, the default selector ranks a target that answers `Runtime.evaluate` **above** one that
answers `-32601` (§Android pass), and Expo Go for Android is the second kind: so the selection landed
on iOS *by design*. Measured, in one minute, both apps on `/lab` throwing
`new Error("W25 boom on " + Platform.OS)`:

| command | answer |
| --- | --- |
| `runtime:eval "1+1" --android` | exit 1, `RUNTIME_EVALUATE_UNSUPPORTED` |
| `runtime:errors --android` | `count: 1`, message **`W25 boom on ios`**, `runtimeReadable: true` |

Two commands, one flag, two runtimes — and the `runtimeReadable: true` also suppressed the
dev-server-log fallback F52 built for exactly this runtime. The collector now forwards every
`CdpClientOptions` key with a rest spread, which cannot go stale when an option is added.

**F101 (CRITICAL) — `runtime:stop --android` force-stopped the iOS application id.** `resolveAppId`
took `targetAppIds.find(Boolean)` off the **unscoped** target list, and the two Expo Go ids differ by
one capital letter (§The dev server does not label its targets). The dev server listed iOS first, so
the command ran `adb -s emulator-5554 shell am force-stop host.exp.Exponent` — not an installed
package on Android — and reported `stopped: true, wasRunning: true` while
`adb shell pidof host.exp.exponent` still answered `3933` and the target stayed listed. Two fixes,
because either alone leaves a hole:

- `preflightRuntimeAsync` scopes `appTargets` for **every** caller that names a platform, not only
  for `need: 'debugger-target'`. That field is documented as "the targets this command may read", and
  it was the unscoped list for `runtime:stop` (`optional`) and `runtime:reload` (`dev-server`). Only a
  command that *requires* a runtime still refuses on an empty scope — for `reload` an empty scope is a
  rung of its ladder, and for `stop` it is the state [[0010-agent-conventions]] §The seventh and
  eighth calls a success.
- `resolveAppId` drops the other platform's Expo Go id before it takes the first one. It is the one id
  in that list that can be *shown* to be about another device; an id it cannot place is kept, because
  a development build's package name says nothing about a platform.

**F102 (MAJOR) — `wasRunning` was `true` on every Android stop, on no evidence.** `am force-stop`
exits 0 and prints nothing whether the app was running or not — `appProcess.ts`'s own comment said so
— and the result was still returned as `verified: true, wasAlreadyStopped: false`, which the report
renders as "the app was running". `stopAppOnDeviceAsync` now asks `adb shell pidof <appId>` **before**
the stop: a pid makes `wasRunning` an observation, exit 1 with nothing said makes it `false`, and a
`pidof` that could not run makes `verified` false and `wasRunning` null.

**And `am force-stop` is asynchronous.** The `adb shell` exits as soon as ActivityManager has taken
the request; `pidof` still answers for a moment afterwards [observed — the second run of
`live-android`]. So `stopped: true` means the stop ran, not that the process is already gone, and a
caller that needs the second fact has to look. `simctl terminate` on iOS does not behave this way.
The live suite asserts the effect within a bound rather than instantly, per [[0022-live-tier]] §What a
live assertion is allowed to be.

**F103 (MAJOR) — three follow-up builders dropped the platform flag**, against §Smaller things' own
claim that "every command a follow-up names now carries the flag the run had":
`buildRuntimeErrorsFollowUps` took no platform at all (`runtime:reload`, `runtime:errors --duration`),
`buildStopFollowUps` carried `--cloud` and not the platform (`navigate /`), and
`buildStartPlanFollowUps` offered a bare `npx exagent dev` after `dev --plan --android` — the one
follow-up whose whole promise is "runs the plan above", naming a command that would plan for iOS.
`--cloud` is still carried alone, because that flag already names the one device a session has.

**F104 (LOW) — `navigate --android`'s screenshot line named a command that cannot answer there.** It
said to run `npx exagent runtime:tree` first and capture once it lists the screen: good advice on iOS,
exit 1 every time on Android. It now names `npx exagent smoke --android`, whose screenshot phase waits
on the fact F57 chose and captures the screen itself.

**F105 (MED) — the log fallback said the records were "this app's errors".** §Reading Android errors
anyway already records that the log does not name a platform, and the caveat above the records
contradicted it. With both apps connected, `runtime:errors --android --fail-on-error` exited **20** on
a record whose own text was `[Error: W25 boom on ios]`. The log cannot be scoped — that is the finding
— so what changed is the saying: `devServerLog.otherPlatformsConnected` names the platforms whose app
writes to the same log, and the caveat says a record below may be from one of them.

**F106 (MED) — `status` named one device, and iOS wins on macOS.** `readLocalDeviceProbe` took
`probes.find((probe) => probe.device)`, so the section whose whole subject is what this machine has
printed `device  ios iPhone 17 Pro (C159CF99-…)` on a run whose only connected app was Expo Go on
`emulator-5554`. `LocalDeviceStatus.devices` lists every device now; the singular fields stay the
first, because the ladders in that report branch on them.

**F107 (MED, deferred) — `smoke`'s error window has no dev-server-log fallback.** So on Android the
`errors` phase is `inconclusive` where `runtime:errors --android` reports a real, symbolicated,
log-backed observation of the same window. Nothing it prints is false — the reason names the runtime,
not the app — and the phase above it (`runtime`) is inconclusive either way, so the outcome would stay
22 regardless. It is deferred rather than fixed because the decision it needs is not a bug fix:
whether a gate may fail on a record it cannot attribute to the platform it was asked about (F105), on
a dev server with two apps. Until that is answered, `smoke --android` cannot tell a healthy Android
app from a crashing one and `runtime:errors --android --fail-on-error` can.

### F123 — `navigate` opens the route link at an app that is not loaded

[**fixed — wave 30, 2026-08-28**; found 2026-08-28, wave 29, MAJOR. Reported rather than fixed in
wave 29 because the recovery is a ladder and which rung an exit code belongs to is a contract
decision; that decision is §On a development build, `navigate` goes launcher-first, and what follows
is the finding as it was measured.]

§Pointing an app at this dev server states the rule this breaks, in `connectUrl.ts`'s own header:
**a connect URL is not a route link.** `<scheme>://<route>` navigates an app that is *already*
loaded against a dev server; `<scheme>://expo-development-client/?url=<origin>` is what gets it
loaded. `navigate` builds both — the second is in its own `connect` array, and it is printed — and
it opens the first, whether or not anything is loaded.

Measured on Android, where no dialog can be blamed [observed — `61-navigate-after-stop-android.json`]:

```
$ npx exagent navigate / --android --json          # after runtime:stop --android
  target   "no app is connected to the dev server, and the project depends on expo-dev-client"
  url      "dcapp://"
  connect  [{ target: "dev-build", url: "dcapp://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" }]
  exitCode 0            # the `am start` delivered the intent
  attached false        # after attachWaitedMs: 90576
→ exit 22
```

Three things make it worth a number rather than a caveat:

- **The command has the right URL in hand and prints it.** This is not a missing capability; it is
  the wrong one of two being chosen, by a branch that already knows the answer — `target` says the
  app is not connected and that the project depends on `expo-dev-client`, in the same payload.
- **It is what every ladder recommends.** `runtime:stop`'s own follow-up is
  `npx exagent navigate / --<platform>` "so this starts it again on the root route with a clean
  JavaScript runtime", and on a development build it cannot. So does `dev`'s, and `dev:stop`'s.
- **It costs the caller the whole attach budget**, 90.6 s on Android and 45.4 s on iOS, on an action
  that could not have worked.

What the fix has to decide, which is why it is not made here. The connect URL carries a dev server
and no route, so a named route needs **two** opens with a wait between them — open the launcher URL,
wait for the app to attach, then open `<scheme>://<route>`. That is the reload ladder's shape and it
wants the same answers: what `attached` means when only the first rung ran, whether a route that was
never reached is 20 or 22, and whether the second open is skipped for the root route (where the
first is already complete). Expo Go needs none of it — `exp://<host>/--/<route>` loads *and*
navigates in one URL, which is why nothing noticed.

**How wave 30 answered those** (§On a development build, `navigate` goes launcher-first). Two opens
with a wait between them, exactly as sketched. `attached` keeps meaning what it has always meant —
an app of this platform holds a debugger target when the run ends — and the launcher's own wait is
reported separately as `launch.attached`, so "the app came up" and "the route was delivered to it"
stay two facts. The exit codes are unchanged: nothing new can fail, and a run where nothing attaches
is the 22 it already was. The second open is **not** skipped for the root route: the launcher loads
whatever the app last had, which is not necessarily `/`, and one extra intent costs milliseconds.
Live: exit 0 in 3.0 s where the finding above is 90.6 s [`live-devclient`
`026-f123-navigate-cold.txt`].

### The wall was Expo Go's, not Android's

[added 2026-08-28, wave 29. Measured on `tuft-pixel`, one dev server, an Expo SDK 57 project with a
development build made by `npx expo run:android`; evidence under `wave29-devclient/evidence/`.]

§The CDP-less runtime, corrected measured **Expo Go for Android** and this section then wrote
"Android" wherever it meant "that app". A development build of the same project, on the same
emulator, answers everything Expo Go refuses:

| command | Expo Go for Android | Android **development build** |
| --- | --- | --- |
| `runtime:eval "1+1"` | exit 1, `RUNTIME_EVALUATE_UNSUPPORTED` | **exit 0, `value: 2`** [`47-eval-android.json`] |
| `runtime:tree` | exit 1, the same refusal | **exit 0**, 10 nodes off 372 fibers, `disabled`/`disabledOn` on both bands [`48-tree-android.json`] |
| `runtime:tap inc-btn --verify` | unreachable | **exit 0**, and `counter-interp` *and* `counter-str` both in the diff — F63's pair, on Android for the first time [`50-tap-inc-android.json`] |
| `runtime:tap` disabled / dup / plain | unreachable | **20 / 20 / 20**, `disabled` · `ambiguous` · `no-handler` |
| `runtime:type` | exit 1 | **exit 0**; `editable={false}` → **20**, `disabledOn: "editable"` |
| `runtime:errors` | `runtimeReadable: false`, dev-server-log fallback (F52) | **`runtimeReadable: true`**, and the fallback correctly **not** read |
| `runtime:reload` | rung 1, verified with no CDP anywhere in it | exit 0 in 1.3–2.4 s, rung 1, `Android Bundled 29ms …` as the bundle proof |
| `runtime:stop` | Expo Go's package | **the project's own package**, `bundleIdSource: "dev-server"`, `pidof` empty after |
| `navigate /explore` | `exp://…/--/explore` | `dcapp://explore`, and `runtime:tree` reports `focusedScreen: "explore"` afterwards |
| `navigate /` with nothing loaded | one URL loads *and* navigates | **two opens** — the launcher URL by component, then the route link (F123, fixed in wave 30) |
| `smoke` | **22 on a working app** — the `runtime` phase cannot measure | **exit 0, `outcome: "passed"`, all eight phases `ok`** [`56-smoke-android-devclient.json`] |

Two things this changes, and one it does not:

- **`smoke --android` is a gate again.** §What `smoke --android` is says "not a green light, and it
  never will be" — true of Expo Go, and the sentence should have named it. On a development build
  the `runtime` phase measures, so llp/0010 §The sixth is satisfied and the gate returns a verdict.
- **The `--android` refusal band is about an *app*.** `RUNTIME_EVALUATE_UNSUPPORTED` is the right
  answer when the runtime says it carries no debugger, and it is reached by asking rather than by
  knowing the platform — which is why nothing had to change for this to work. The measurement is
  what was missing, not the code.
- **F107 is unchanged**, and narrower than it looked: `smoke`'s error window has no dev-server-log
  fallback, which matters only for a runtime that cannot answer. On a development build both phases
  measure, so the gap is Expo-Go-on-Android's alone.

**There is no automated iOS half of this, and the reason is a machine fact worth its own line.**
Every way this CLI opens an app on a local iOS simulator is `xcrun simctl openurl`, and on iOS 26.5
that raises a springboard confirmation — `Open in "<app>"?` — for a **development build**'s scheme,
on every call rather than only the first, with the app foregrounded or not. Nothing launches until
somebody taps Open. Measured against Expo Go on the same simulator minutes apart:
`exp://127.0.0.1:8901` launched Expo Go and registered a debugger target inside 4 s;
`dcapp://expo-development-client/?url=…` and `exp+dcapp://…` both left the simulator on the
springboard with **0 targets after 24 s** [observed — `27-clean-connect-url.png`,
`19-after-expgo-url.png`, 2026-08-28]. This is §The dialog nobody is there to answer, which wave 23
recorded as a *cloud* fact, on a laptop. The four gates that let `navigate --cloud` answer the dialog
start with "only on `--cloud`; a dialog on the machine at somebody's desk has somebody at it" — and
a Tuft machine driving its own simulator is a desk with nobody at it. Whether that gate should be
about the *device* rather than about the flag is the open question this leaves.

With the dialog answered by hand, the iOS development build behaves like the Android one: `eval` →
2, `tree` → 10 nodes, `tap --verify` → both texts, `type` → 0 and 20 on the read-only input,
`errors` → `runtimeReadable: true`, `smoke --ios` → **0 with all eight phases `ok`**, and
`runtime:stop --ios` → the project's own bundle id from `bundleIdSource: "dev-server"`.

### What `smoke --android` is, given all of that

**On Expo Go**, and only there — §The wall was Expo Go's, not Android's measured the same command at
exit **0** on a development build, and the sentence below was written before anything had run one.

Not a green light, and it never will be on Expo Go: exit **22 on a working app**, because
[[0010-agent-conventions]] §The sixth says a gate that cannot measure must not pass and the `runtime`
phase cannot measure. What it is instead is four proofs and two abstentions, and the report says which
is which — `dev-server`, `bundler-ready`, `bundle` (for **android**), `app` and `screenshot` all
`ok`; `runtime` and `errors` `inconclusive` with the reason naming the engine. A broken Android bundle
is still exit 20 with the later phases skipped, which is the answer that matters most often.

## Testing

Each tool: schema unit tests + tier-0 e2e coverage against a fixture app on a simulator ([[0002-testing-and-evals]]; scripted MCP replay is optional/deferred there). The composite loops are tier-1/2 eval scenarios.

The two additions above are tested at both tiers, and the split follows where each one can be wrong
[observed — 2026-08-23].

`reload` speaks a protocol nobody promises, so the e2e stub dev server grew a real `/message`
WebSocket rather than a mock: it requires `version: 2` on every frame, answers `getpeers`, and
re-registers its peers under new ids when a broadcast arrives. Four modes — `v2`, `deaf` (opens and
never answers, i.e. another protocol version), `no-churn` (answers, nothing reconnects), and `none`
— which is what makes the three outcomes of the command testable through the published bin: exit 0
with `verifiedBy: message-socket-peers` and no device touched, exit 20 naming the protocol version,
and exit 20 naming the app that did not act. The unit tests own what the client *sends* (the
version stamp on every frame, a broadcast with no `id` and no `target`, a reply matched to its
request, silence answering `null`) and what `peersChanged` concludes.

The route table is unit-tested against the conventions, because that is where it can be wrong: 24
cases covering the router-root precedence, group stripping, `index` collapsing, the `+`
conventions, platform variants, dynamic and catch-all matching, the group-inclusive spelling, and
the three fail-open paths. The e2e tests own the process boundary the check exists to protect —
that a bogus route reaches the device tool **zero** times.

The two stop commands split the same way, and the split is what makes them testable at all.
`dev:stop` signals a **real process**, so its e2e test starts one that records the signal it
receives and asserts that the PID the lock named is the PID that got it — a mocked `process.kill`
would prove nothing about the only thing the command does. `runtime:stop` runs a **real device
tool**, so its e2e test asserts the exact argv handed to a stub `xcrun`. The unit tests own the
decisions: the ranked application-id resolution, the three `dev:stop` states, and both halves of
the `--force` proof, each refused on its own.

The header of `--json` is asserted as an exact key set at both tiers for every command, per
llp/0006 §Output contract. Counts as of this change: 1741 unit (from 1588), 304 e2e (from 280).

### `smoke` splits by what a process can show

[added — 2026-08-24] The gate's **outcome table** is the unit tests', because it is a pure function
of eight answers over injected fakes and pinning it needs no processes at all — every phase is a
function already tested where it lives. What the e2e tier owns is the process boundary: that the
three codes leave the process, that `--json` is one parseable object whatever happened, that a
bogus route reaches the device tool **zero** times, and the one thing no mock can show — that a PNG
written to a real pipe by a stub `adb exec-out` arrives on disk as the same bytes, `\r\n` and all.

Two fixture honesty problems fell out of building it, and both are the kind that make a test pass
for the wrong reason:

- The unit fixture for a failing window used `source: 'exception'`, which is a fixture of a runtime
  this command never talks to (§What counts as a crash). It is `source: 'console'` with the error's
  own stack now, which is what React Native sends.
- One e2e test cleared the stub bins by inheriting the machine's `PATH`, so a real `xcrun` found
  the developer's own booted simulator and the assertion that no screenshot was taken failed —
  correctly. `PATH` is an empty directory there now: a test of the machine is not a test of the
  code.

Counts as of this change: 2055 unit (from 1882), 363 e2e (from 341).

### The fixtures had to start reloading

[added — 2026-08-24] Fixing F39/F45 changed what a test *fixture* has to be, and that is the part
worth recording. Every "reloaded: true" assertion in this package used to run against a stub whose
`/json/list` answered the same target forever — which is a stub of an app that never reloaded, and
every one of those assertions passed for it. The two tiers grew the same property:

- the e2e stub dev server re-registers its debugger targets under a page id it has never used when
  a `v2` reload broadcast arrives, beside the peer churn it already did, and `reloadTargets` picks
  `reconnect` (the default), `stale` (peers churn, the same target stays) or `gone` (the app quits)
  — the last two being F39 and F45 as fixtures;
- the unit fixture flips its listing from the socket's own `broadcastReload`, so the change is
  caused by the broadcast rather than counted off the reads.

One fixture honesty problem fell out of it. The device-fallback test claimed an app with a debugger
target and *no* message-socket peer, which no real app is, and under the new rule that target was
"already there" and never fresh. The stub now reports no targets until the stub `xcrun` has opened
the app, which is what "no app is connected" means on both channels at once.

The other half of the same fix does **not** reach tier 0, and that is a boundary rather than a gap
in the suite: the grace period `runtime:errors` uses answers a target that is *listed* and refuses a
CDP connection, and the e2e stub carries no inspector proxy to refuse one. Its two halves are
unit-tested where they can be — an empty target list that fills, and a selector that can make
nothing of the list it is given — and the behaviour itself was verified live, ten rounds.
[[0002-testing-and-evals]] §Resolved decisions records where that line falls and what stands in for
it on the far side.
