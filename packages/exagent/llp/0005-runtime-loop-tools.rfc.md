# 0005: Runtime Loop Tools — Seeing and Driving the Running App

**Type:** RFC
**Status:** Draft
**Systems:** `exagent` runtime commands (`src/runtime/`, `src/navigate/`, `src/reload/`, `src/project/routes.ts`); `exagent smoke` (`src/smoke/`, `src/device/screenshot.ts`); the Android device layer (`src/device/adb.ts`, `src/navigate/adbReverse.ts`, `src/runtime/targetPlatform.ts`, `src/runtime/targetLiveness.ts`, `src/dev/logErrors.ts`); `@expo/cli` CDP debugging layer and dev-server message socket; `expo-router` link handling; LogBox
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Related:** [[0001-agentic-cli-on-expo-cli]]

## Summary

Tools that let a driving agent observe and manipulate the running app, closing the verify loop that text-only agents cannot close. Ship as self-serve `exagent` CLI commands [confirmed — Kudo, 2026-08-22]; `expo-mcp` is not a dependency. All items [inferred] unless tagged; the named runtime hooks exist today [observed where noted].

## Candidates

- **Runtime eval.** The CLI already speaks CDP to the app (`packages/@expo/cli/src/start/server/metro/debugging/messageHandlers/`: `VscodeRuntimeEvaluate`, `VscodeRuntimeCallFunctionOn`, `VscodeRuntimeGetProperties` [observed]). Expose as a tool: run JS inside the live app, read state, trigger navigation, assert on values. Turns "I think the fix works" into "I evaluated it in the app". Note: reaching the CDP endpoint from outside the CLI process must respect the process boundary — connect over the dev server's protocol, not via imports.
- **Structured red-screen feed.** LogBox symbolication exists in the CLI (`log-box/LogBoxSymbolication.ts` [observed]). Deliver every runtime error as a structured event: message, symbolicated stack, source file/line.
- **Network inspection.** A CDP `NetworkResponse` handler exists [observed]. Expose the app's network log so failing API calls are debuggable without guessing.
- **Deep-link navigation.** Combine `expo_router_sitemap` [observed — existing expo-mcp tool] with URI-scheme launching: "open route /profile/42 on the simulator". Enables per-route verification and screenshot sweeps.
- **Performance probe.** `expo-app-metrics` / `expo-insights` exist as packages [observed]. Startup time, slow frames, re-render counts — "why is this list janky" starts from data.
- **Cross-platform verification sweep.** Boot iOS + Android + web in parallel, screenshot the same routes, report divergence. Uniquely valuable for a universal framework.

## Composite loops these enable

- **Log triage** [confirmed — feature list, 2026-08-18]: red screen → `collect_app_logs` / red-screen feed → symbolicated source location → agent fixes → verify by screenshot.
- **Verified UI changes** [confirmed — feature list, 2026-08-18]: edit → reload → `automation_take_screenshot` → compare against the request → iterate.

## Implemented in v1 as

Home correction [confirmed — Kudo, 2026-08-22]: these are **self-serve in `packages/exagent`** as CLI commands — the expo-mcp implementation round was abandoned unpushed and the code ported over. Ported surface [observed — 2026-08-22]: `exagent runtime eval <expr>` (app exception ⇒ exit 1), `exagent runtime errors [--duration]`, `exagent navigate <route> [--scheme] [--ios|--android]` (renamed 2026-08-22 to the colon forms `runtime:eval`/`runtime:errors`/`runtime:network`; the space forms still resolve); 149 new jest tests (431 total). Live-verified twice — as MCP-shaped tools and again as exagent commands against a real SDK 57 app (eval value/exception, error collection with bundle-mapped stacks, deep-link navigation). Original build + live verification notes [observed — 2026-08-22]:

- `runtime_evaluate` — `CdpClient.evaluateAsync` (Runtime.evaluate, returnByValue + awaitPromise + exceptionDetails); app output fenced with untrusted-content markers per [[0008-guardrails]], including marker-forgery neutralization.

  **Correction — CDP cannot settle a React Native promise** [observed — SDK 57 / RN 0.86.2 in Expo Go on iOS, 2026-08-23; friction run 2, F21]. `awaitPromise` is inert here. CDP only awaits a result the runtime tagged `subtype: "promise"`, and React Native replaces the engine's `Promise` with the `@react-native/js-polyfills` implementation, which the inspector sees as an ordinary `Object`: `Runtime.evaluate("Promise.resolve(42)", {returnByValue: false})` answers `{type: "object", className: "Object", objectId: "1"}` with no subtype, and with `returnByValue` it answers `{_A: null, _x: 0, _y: 1, _z: 42}` — the polyfill's internal state. So every `fetch`, AsyncStorage read and store selector came back as an opaque object, and `--no-await-promise` printed the same thing.

  Settled **in the app** instead (`src/runtime/promiseSettling.ts`): the expression is wrapped so the app tests the result for `typeof v.then === 'function'`, subscribes to it, parks `{state, type, value | reason}` on a global under a per-run nonce, and returns a marker keyed and valued by that nonce; the CLI polls that global over the same debugger connection until it settles or `--timeout` runs out. Properties this holds to: a non-thenable is returned by the wrapper unchanged, so one round trip and the runtime's own `type`; the settled value carries the type the app read off it, because CDP never sees the value on its own; a rejection is its own outcome (`promise.state`), not a `threw`, and exits 1; a promise still pending at the deadline is `RUNTIME_PROMISE_PENDING`, and the app is told to drop what it was holding; `--no-await-promise` parks nothing and reports the pending promise, exit 0.

  Two things the live round taught that the design did not: the wrapper puts the expression in an assignment, so a *statement* (`var x = 1`) stops compiling — the answer is re-running it exactly as written, which is the pre-wrapper behaviour; and **Hermes does not raise a `SyntaxError`** for that, it answers `Compiling JS failed: 2:25:invalid expression, sourceURL:`, so matching only `SyntaxError` left the fallback unreachable on the one runtime this command talks to. The captured frames are `src/runtime/__tests__/fixtures/live-promise-frames.json`.
- `read_runtime_errors` — `CdpRuntimeErrorCollector` capturing `Runtime.exceptionThrown` + console.error over a window; distinguishes "no errors" from "app unreachable".

  **Symbolication and gating** [observed — 2026-08-23; friction run 2, F25]. Metro applies its source maps to what it *prints*, not to what it sends over CDP, so every frame arrived as an offset into the bundle with roughly 400 characters of transform options attached — about 2 KB per error, no project file anywhere. The dev server can map them: `POST /symbolicate` with `{stack: [{file, lineNumber, column, methodName}]}` answers one frame per frame, in order, with `file` an absolute path on disk. Three details are load-bearing: `lineNumber` is 1-based and `column` is 0-based both ways (CDP is 0-based in both, and rendered output is 1-based in both); `file` must carry the whole bundle URL including the query string, because Metro's lookup is exact string equality and the query selects the bundle's options; and a frame it cannot map comes back unchanged rather than null, with Expo's `customizeFrame` hook nulling its line and column and setting `collapse: true`. Failure of any kind falls back to the frames that were sent, with the query string trimmed — symbolication improves a report, it is not a precondition for one.

  A fourth detail only live use showed: React Native reports a thrown error through the console path as **one string** holding the message *and the error's own frames*, while the `stackTrace` CDP sends alongside describes the console machinery that reported it (`console.js`, `backend.js`, `ExceptionsManager.js`). The frames that name the project are the ones inside the message, so they are lifted out of it and symbolicated. Live proof: `Error: BOOM_PROJECT_FRAME` / `at wave3bBoom (src/app/index.tsx:101:18)`, matching what LogBox showed on the device.

  Exit-code gating: the command stays **0** whatever it collects, because an empty window means "nothing happened while I watched" rather than "the app is healthy" — the opposite of what `dev:wait` claims when it exits 0. `--fail-on-error` is the opt-in that exits 20 on a non-empty window, so an agent can gate on it the same way. Only `errors` has it; a failed request is something `network` reports about the app, not a verdict on it.
- `navigate_to_route` — device-side deep link (`simctl openurl` / `adb am start`), static scheme resolution from app.json with Expo Go `exp://<host>/--/<route>` support and explicit `scheme` override.

64 new unit tests (122 total in the package) against MockWebSocket / mocked spawns.

**Verified live** [observed — 2026-08-22, SDK 57 app in Expo Go on an iOS 26.5 simulator]: `evaluateAsync` returned real values/state/exceptions from Hermes; the error collector captured an injected uncaught error (delivered via RN's console path, not `Runtime.exceptionThrown` — having both capture sources is required); deep-link navigation landed the app on the `/explore` route (screenshot-confirmed). The live round also found and fixed a blocking bug the unit tests could not see: **Metro's inspector proxy rejects CDP WebSocket handshakes without a same-origin `Origin` header (401)** — all default connection paths now send it (`createInspectorWebSocket`).

**Network inspection** [observed — 2026-08-22]: `exagent runtime network` (CDP Network domain collector; request/response/failure correlated by requestId; three outcomes counted — answered / failed / never-answered, because RN never sends `Network.loadingFailed` for a refused connection [observed, SDK 57/RN 0.86]). Live-verified on iOS (200/404/refused).

**Two refusals, not one** [observed — `ReactCommon/jsinspector-modern/HostAgent.cpp`, React Native 0.86, 2026-08-23]. `Network.enable` fails for two unrelated reasons, and the command must not report either as the other:

- `registeredHostsCount > 1` ⇒ a JSON-RPC *internal error*, `"The Network domain is unavailable when multiple React Native hosts are registered."`. About the state of the app process — the domain attaches only while exactly one React Native host is registered — so it clears when the app is relaunched with only this project loaded, and stopping another dev server does nothing for it. Expo Go reaches it by holding a host for a project it loaded earlier.
- `InspectorFlags::getNetworkInspectionEnabled()` off ⇒ the method is never handled, and the dispatcher answers `-32601`. About how the runtime was built, and it never clears; Expo Go for Android answers every method this way.

The classification is by the runtime's own answer (`classifyNetworkDomainRefusal`: the quoted message, then the JSON-RPC code), and the why and how branch on it. The `unstable_enableNetworkPanel=true` flag on the target describes what the debugger frontend would show, so it is named only in the `-32601` case, where it genuinely contradicts the runtime. Recommending an SDK upgrade for a multiple-hosts refusal was the shipped bug this replaced [friction run 2, F24].

**Android pass** [observed — 2026-08-22, headless emulator + Expo Go 57 APK]: `navigate --android` works end-to-end (adb reverse + `exp://` deep link, screenshot-confirmed). Hard finding: **Expo Go for Android ships a Hermes without any CDP debugger** ("HermesRuntime[RNBridgeless] does not support debugging over the Chrome DevTools Protocol" [observed via Log.entryAdded]) — `Runtime.enable`/`Network.enable` merely ack; no evaluate, no console/network capture. The target selector no longer drops such targets (skip only on transport failure; -32601 targets rank behind answering ones), `runtime eval` explains it with `RUNTIME_EVALUATE_UNSUPPORTED`, and errors/network connect but report empty windows there. Runtime capture on Android needs a development build [inferred — not yet verified].

> **Correction — the `adb reverse` in that sentence was done by hand** [observed — friction run 6
> (Android), 2026-08-24]. The 2026-08-22 pass reversed the port at the shell before running
> `navigate --android`, and the parenthesis above reads as though the command did it. It did not:
> `exagent` never ran `adb reverse` anywhere, and a run without the manual step landed Expo Go on
> `ErrorActivity` with `am start` exiting 0 and the command exiting 0. See §Android below, which is
> where everything this section got wrong or half-right is settled.

Still open: Android capture via a dev build, performance probe, cross-platform sweep. ("No traffic"
versus a silently-unsupported Network domain is settled below, in §Android.)

## Reloading the app

Decision [confirmed — Kudo, 2026-08-23]. `exagent runtime:reload` puts the running app back on the
code that is on disk, and reports a reload only when one was **observed**.

**Why an action of `runtime`, not a top-level verb** [confirmed — Kudo, 2026-08-23]. It was built
as `exagent reload` and renamed before it shipped. `runtime` is the group for "read and drive the
running app", and reloading is driving it — the same subject as `runtime:eval` and
`runtime:errors`, reached through the same dev-server connection. A top-level verb would have said
this is a different kind of thing than the commands it belongs with, and llp/0006's naming rule
reserves top-level verbs for capabilities that are their own subject. It keeps a module and a
`--help` block of its own, as `dev:wait` does inside `dev`: the group's shared module exists
because `eval`/`errors`/`network` share options, and these do not.

### The failure it answers

[observed — friction run 3, F31, 2026-08-23] A component threw while rendering. The file was fixed,
the served bundle was clean (`curl … | grep -c` → 0), and `dev:wait` exited 0 with
`bundle.ok: true` — while `runtime:errors --fail-on-error` kept exiting **20** for the error that
had just been removed, and the simulator showed a blank screen. There was no command for it: the
only recovery was `xcrun simctl terminate <udid> host.exp.Exponent` by hand, which is outside the
CLI and per-platform. `install`'s own follow-up said "reloading the app is enough" and then named
`runtime:errors`, which reloads nothing.

Reproduced live [observed — 2026-08-23, notesapp on SDK 57 in Expo Go, iOS 26.5 simulator], twice —
a `ReferenceError` in a route component and a `throw` in the root `_layout` — and the *mechanism*
turned out to be worth naming, because it is not the one the run-3 report assumed. On this SDK Fast
Refresh did recover the screen both times; what did not recover was the **error report**. Running
`runtime:errors --duration 3s` three times in a row against a healthy screen returned
`Error: F31_LAYOUT_BOOM` three times, so the debugger is replaying what the app reported to every
new connection rather than the app throwing again. A reload cleared it: `count: 0`, twice, exit 0.
So the trap is not only "the app runs stale code" — it is that **an error window is a property of
the app's session, and the session outlives the fix**. Either way the answer is the same command,
and either way `runtime:errors` cannot be believed about a fix until the app has been reloaded.
That is why the reload now *leads* the follow-ups of a non-empty error window.

### How it reloads: the dev server's own client command socket

The mechanism is the one the interactive `r` keypress uses, spoken from outside the CLI process
[observed — `packages/@expo/cli/src/start/server/metro/dev-server/createMessageSocket.ts`,
`createMetroMiddleware.ts`, `BundlerDevServer.broadcastMessage`, 2026-08-23]. The dev server mounts
a WebSocket on **`/message`**. A frame carrying a `method` and neither an `id` nor a `target` is a
*broadcast*: it is relayed verbatim to every other connected client, which is how a reload reaches
the app. Two conditions gate it, and both are satisfied by a local wrapper: the sender must be
trusted (`isLocalSocket && isMatchingOrigin` — a loopback connection that sends **no** `Origin`
header is trusted, which is the opposite of the inspector proxy, whose handshake *requires* one),
and the method must be one of the two a client may broadcast, `reload` and `devMenu`.

This is preferred over the device path for four reasons: it needs no platform tooling, no
application id, and no knowledge of which device the app is on; it is the same code path on iOS and
Android; it does not restart the process, so app state that is not JavaScript survives; and it took
**0.28–0.58 s** live against **2.5–2.8 s** for terminate-and-relaunch.

**The detail that decides whether any of it works: `version: 2` on every frame** [observed —
`dev-server/utils/socketMessages.ts` `parseRawMessage`]. A frame without it, or with another
number, is dropped with no answer and no error. This was found the expensive way: the first live
attempt sent `{"method":"reload"}`, the socket opened, the send succeeded, nothing happened, and a
global planted in the app was still there afterwards. `{"version":2,"method":"reload"}` cleared it.

### What proves a reload, without CDP

A broadcast has no reply, so trusting the send would have shipped the same false green this command
exists to remove. Two things are read instead, and neither needs the Chrome DevTools Protocol —
which matters because Expo Go for Android has no CDP debugger at all (§Android pass).

1. **`getpeers` is the protocol handshake.** `{"version":2,"target":"server","method":"getpeers",
   "id":…}` is answered with the connected clients as `socket id -> upgrade query`, e.g.
   `{"socket#7":"role=ios","socket#8":null}`. An answer proves the dev server speaks this version —
   so a broadcast on the same socket will be relayed rather than discarded — *and* names whether
   there is an app to reload at all. Silence is reported as "does not speak this protocol version",
   never as "no peers": the two lead to different next actions.
2. **Socket ids never repeat.** The dev server's ids come from a counter it does not rewind
   (`createSocketMap.ts` `createSocketIdFactory`), so a peer under a new id is a *new connection*.
   Live, across one reload: `{"socket#7":"role=ios","socket#8":null}` →
   `{"socket#10":"role=ios","socket#11":null}` within 500 ms. That is what `verifiedBy:
   "message-socket-peers"` names.

A debugger target is then waited for as well, because the rest of the CLI reads the app through one.
That wait was written as a floor and turned out to be the load-bearing half — see below.

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
**pre-reload** target. Everything downstream followed from that: the count it reported was of a
runtime on its way out, so an app that quit instead of coming back still counted (F45); and
`runtime:errors` immediately afterwards resolved that same dying target, failed to connect to it,
skipped it, and had nothing left — which is what `No target found.` means (F39).

Metro's page ids come from a counter it does not rewind, exactly like the message socket's peer
ids, so "a target this run has not seen" is decidable rather than inferred. Three properties:

- **The known ids are read as late as possible**, from a probe of their own taken after the bundle
  gate and immediately before the broadcast — never reused from discovery. A save the watcher
  picked up in between would otherwise be credited to this command.
- **`appsConnected` and `appsReconnected` are both reported**, because they answer different
  questions and their difference is the diagnosis: one connected and zero reconnected is an app
  that never re-registered, zero of both is an app that went. The exit-22 prose says which.
- **The last read of that wait is the re-read of the target list**, so a success is structurally
  never a peer count — it is a runtime that was observed after the reload. That is what makes F45's
  false-success path impossible rather than unlikely.

Live [observed — 2026-08-24, port 8190]: five `reload` → `runtime:errors --fail-on-error` rounds
back to back, all `0`/`0` with `appsReconnected: 1` and 559–1098 ms per reload; and the same five
rounds with the reload sent as a bare broadcast — the `r` keypress, which this CLI never waited for
— also all `0`. Terminating the app 350 ms and 450 ms into a reload, which is inside the window the
old code answered from, gives exit **22** with `appsConnected: 0`.

`runtime:errors` carries the other half of that fix, because a user may reload by pressing `r` and
there is then nothing for this command to have waited. Its target resolution retries for
`APP_RECONNECT_GRACE_MS` (3 s) — once around the "is any app connected" probe
(`requireConnectedAppAsync`, which re-reads only while the list is *empty*, never for an
unreachable dev server) and once around target selection inside `CdpClient`, which is where the
dying target is skipped and the list has to be read again rather than the selector re-run. Bounded
at three seconds because an app that is genuinely closed must still be reported quickly.

Deliberately **not** given to `runtime:eval` and `runtime:network` [inferred]: the chain the CLI
prints, and the one the friction run drove, is reload → errors, and a grace period costs every
genuine "no app is connected" three seconds. It is one option away if a later run shows the same
flake there.

### The device fallback, and the exit codes

`--method auto` falls through to stopping the app on the device (`simctl terminate` /
`am force-stop`) and opening it again, which is the run-3 recovery absorbed into the CLI. It is
reached in two cases: nothing answered on the command socket, and **no app is connected at all** —
where "reload" and "start" are the same act. The application id comes from the dev server's own
debugger target (`appId`) and falls back to Expo Go's per platform. A `terminate` that reports the
app was not running is *success*, because that is the state the step was reaching for.

Three decisions on the codes (llp/0010 §Exit codes):

- **Nothing reloaded is `20`.** The tool worked; the operation failed. Live: with the app closed,
  `reload --method dev-server` exits 20 with `no app is connected to the dev server, so there is
  nothing to reload`, and `--method auto` exits 0 having started it on the device.
- **Reloaded but not reconnected is `22`.** The app went, and the wait ran out before its
  JavaScript registered a debugger target. Nothing is known to be wrong, so "look again" is the
  honest answer and the message says so.
- **No dev server is `1`, not `20`.** A reload makes the app fetch its bundle again; with no dev
  server that fetch has nowhere to go, so stopping the app would replace a stale screen with no
  screen. Nothing is attempted.

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
what that looks like on the wire. Measured method by method [observed — 2026-08-25, Expo Go 57 on
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
