# 0005: Runtime Loop Tools — Seeing and Driving the Running App

**Type:** RFC
**Status:** Draft
**Systems:** `exagent` runtime commands (`src/runtime/`, `src/navigate/`, `src/reload/`, `src/project/routes.ts`); `@expo/cli` CDP debugging layer and dev-server message socket; `expo-router` link handling; LogBox
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

Still open: Android capture via a dev build, distinguishing "no traffic" from silently-unsupported Network domain (an enable-ack proves nothing), performance probe, cross-platform sweep.

## Reloading the app

Decision [confirmed — Kudo, 2026-08-23]. `exagent reload` puts the running app back on the code
that is on disk, and reports a reload only when one was **observed**.

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

A debugger target is then waited for as well (`waitForAppConnectionAsync`), because the rest of the
CLI reads the app through one; that wait is a floor, not the proof.

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

The header of `--json` is asserted as an exact key set at both tiers for both commands, per
llp/0006 §Output contract. Counts as of this change: 1677 unit (from 1588), 294 e2e (from 280).
