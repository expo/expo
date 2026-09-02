# 0005: Runtime loop tools

**Type:** RFC
**Status:** Active
**Systems:** `@expo/agent-cli` runtime commands (`src/runtime/`, `src/runtime/preflight.ts`, `src/navigate/`, `src/runtime/reload/`, `src/project/routes.ts`); `@expo/agent-cli smoke` (`src/smoke/`, `src/device/screenshot.ts`, `src/device/bootDevice.ts`, `src/device/installedApps.ts`); the cloud device layer (`src/device/cloudSimulator.ts`); the Android device layer (`src/device/adb.ts`, `src/navigate/adbReverse.ts`, `src/runtime/targetPlatform.ts`, `src/runtime/targetLiveness.ts`, `src/dev/logErrors.ts`); `@expo/cli` CDP debugging layer and dev-server message socket; `expo-router` link handling; LogBox
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20 · finalized 2026-08-28
**Revised:** 2026-08-30
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0008-guardrails]], [[0010-agent-conventions]], [[0016-v1-scope]], [[0017-deferred-commands]], [[0018-interaction-commands]], [[0021-honest-reports]], [[0022-live-tier]]

## Summary

Tools that let a driving agent observe and drive the running app. They ship as self-serve `@expo/agent-cli` commands [confirmed, Kudo, 2026-08-22]. `expo-mcp` is not a dependency.

App output is fenced with untrusted-content markers, including marker-forgery neutralization ([[0008-guardrails]]). Driving the app by testID is [[0018-interaction-commands]].

Two loops these close. Log triage: a red screen, then `runtime:errors`, then a symbolicated source location, then the agent's fix, then verification. Verified UI changes: edit, `runtime:reload`, screenshot, compare, iterate.

## What ships

Colon names: `runtime:eval`, `runtime:errors`, `runtime:reload`, `runtime:stop`, `navigate`, `smoke`. Space forms of the runtime verbs still resolve.

`runtime:network` is not in v1. See [[0017-deferred-commands]].

Every CDP path sends a same-origin `Origin` header. Metro's inspector proxy rejects the handshake without it (401).

## runtime:eval

`CdpClient.evaluateAsync` speaks `Runtime.evaluate` with `returnByValue`. An app exception exits 1.

CDP `awaitPromise` is inert on React Native [observed, SDK 57 / RN 0.86.2 in Expo Go on iOS, 2026-08-23]. CDP only awaits a result tagged `subtype: "promise"`. React Native replaces the engine `Promise` with `@react-native/js-polyfills`, which the inspector sees as an ordinary `Object`. `Runtime.evaluate("Promise.resolve(42)")` answers an ordinary object, or the polyfill's internal state (`_A`, `_x`, `_y`, `_z`). `--no-await-promise` printed the same thing.

Promises settle in the app (`src/runtime/promiseSettling.ts`). The wrapper tests `typeof v.then === 'function'`, parks `{state, type, value | reason}` on a global under a per-run nonce, and returns a marker. The CLI polls that global over the same debugger connection until it settles or `--timeout` runs out.

Five properties:

- A non-thenable returns unchanged. One round trip. The runtime's own `type`.
- The settled value carries the type the app read off it. CDP never sees the value on its own.
- A rejection is `promise.state`. It is not a `threw`. It exits 1.
- A promise still pending at the deadline is `RUNTIME_PROMISE_PENDING`. The app is told to drop the hold.
- `--no-await-promise` parks nothing and reports the pending promise at exit 0.

The wrapper puts the expression in an assignment. A statement such as `var x = 1` stops compiling. The fallback re-runs the source exactly as written.

Hermes does not raise a `SyntaxError` for that. It answers `Compiling JS failed: … invalid expression, sourceURL:`. Matching only `SyntaxError` left the fallback unreachable on the one runtime this command talks to.

Expo Go for Android has no CDP debugger. `runtime:eval` explains it with `RUNTIME_EVALUATE_UNSUPPORTED`. See §Android.

## runtime:errors

`CdpRuntimeErrorCollector` captures `Runtime.exceptionThrown` and `console.error` over a window. Both capture sources are required. React Native reports a thrown error through the console path as one string holding the message and the error's own frames. The CDP `stackTrace` beside it describes the console machinery (`console.js`, `backend.js`, `ExceptionsManager.js`). The frames that name the project are lifted out of the message and symbolicated.

Metro applies source maps to what it prints. It does not apply them to what it sends over CDP. Frames arrive as offsets into the bundle, with transform options attached. The project file is nowhere in them.

Symbolication is `POST /symbolicate` with `{stack: [{file, lineNumber, column, methodName}]}`. The server answers one frame per frame, in order, with `file` an absolute path on disk.

Three details are load-bearing:

- `lineNumber` is 1-based and `column` is 0-based both ways. CDP is 0-based in both. Rendered output is 1-based in both.
- `file` must carry the whole bundle URL, including the query string. Metro's lookup is exact string equality. The query selects the bundle's options.
- A frame it cannot map comes back unchanged rather than null. Expo's `customizeFrame` hook nulls its line and column and sets `collapse: true`. Failure of any kind falls back to the frames that were sent, with the query string trimmed. Symbolication improves a report. It is not a precondition for one.

The command exits 0 whatever it collects. An empty window means nothing happened while I watched. It does not mean the app is healthy. `--fail-on-error` exits 20 on a non-empty window. Only `errors` has that flag. A command that reports on the app does not gate on what it reported ([[0010-agent-conventions]]).

On a runtime that cannot answer, and where no dev-server log could be read, `--fail-on-error` exits 22. Nothing was shown to be wrong and nothing was proved right. When a log was read, the window is a real observation and 0 stands. Without the flag the command still exits 0 and prints the caveat.

When the runtime announces it cannot answer, `runtime:errors` falls back to the detached dev server's log (`src/dev/logErrors.ts`). The window is bounded by a line mark taken before it opens. Records are labelled `source: 'dev-server-log'`. The caveat sits above the count. The log does not name a platform, and there is no structured stack behind a record. Errors that were in the log before the window are counted and named rather than reported as this window's. `devServerLog.otherPlatformsConnected` names the platforms whose app writes to the same log.

`runtime:errors` retries target selection for `APP_RECONNECT_GRACE_MS` (3 s). Once around the "is any app connected" probe, which re-reads only while the list is empty. Once around target selection inside `CdpClient`, where a dying target is skipped. Bounded at three seconds so an app that is genuinely closed is still reported quickly.

## navigate

A device-side deep link (`simctl openurl` or `adb am start`). Scheme from the static app config, with an explicit `--scheme` override.

Expo Go uses `exp://<host>/--/<route>`. `navigate /` opens `exp://<host>/--/?` [confirmed, Kudo, 2026-08-23]. expo-router's Expo Go listener (`parseExpoGoUrlFromListener`) replaces a link whose path is empty or `/` with `getRootURL() + queryString`. `getRootURL()` in Expo Go is the empty string. The listener then ends in `if (href) listener(href)`, so the root link is dropped before the router sees it. A bare `?` is the smallest thing that survives that guard: `href` becomes `"?"`, which is truthy, and a path of `""` with an empty query resolves to the index route. A development build already treats `<scheme>://` as the index route. A reload is not the fix: Expo Go re-loads the URL it was launched with.

### The route table

The route is checked against the project's files before anything opens [confirmed, Kudo, 2026-08-23]. A route the project has not got is exit 1. An unmatched route is a screen the router renders on purpose. No runtime gate can catch it.

The table is read from disk against expo-router's conventions (`src/project/routes.ts`, `expo-router/src/matchers.tsx`, `getRoutesCore.ts`). The dev server cannot answer this for a native target. `GET /status` reports the bundler. `GET /json/list` reports debugger targets. `@expo/router-server`'s `createRoutesManifest` describes web and API routes and is served over HTTP nowhere. Reaching it means importing internals that [[0001-agentic-cli-on-expo-cli]] constraint 5 forbids. `_sitemap` is a screen the app renders. `.expo/types/router.d.ts` is generated only when `experiments.typedRoutes` is on.

The router root is `extra.router.root`, else `src/app`, else `app`. Group segments are stripped from the URL and accepted in it. `index` collapses onto its parent. `_layout` and any file with a `+` in its last segment are left out. `_sitemap` is added because the router generates it. `+not-found` is left out: counting it as a destination would make every route resolve.

Patterns, not literals. `/users/42` matches `app/users/[id].tsx`. `/users/42/edit` does not: a dynamic segment does not swallow a slash. `[...rest]` matches the rest of the path. A literal route wins over a dynamic one that also matches.

It fails open. `--no-route-check`, a route that is already a full URL, and a project with no router directory are reported `checked: false, ok: null` with a reason, and opened. A close miss lands in `Try:`. Nothing close enough falls back to `navigate /`.

The check answers whether the project has a route. It does not answer whether the app's navigator can display it.

### Verifying the route

The route table is the check. A route the project has not got is exit 1. An unmatched route the project does have is opened.

### Launcher-first on a development build

`exp://<host>` is the Expo Go form and nothing else. A development build gets its own scheme. The connect URL, pinned against the launcher that parses it [observed, `packages/expo-dev-launcher`]:

```
<scheme>://expo-development-client/?url=<url-encoded dev server origin>
```

`EXDevLauncherURLHelper.isDevLauncherURL` is `url.host == "expo-development-client"`. `exp://` inside the `url` query is rewritten to `http`. The origin inside `url` is `https` when the host type is a tunnel, because a tunnel terminates TLS. The scheme is `--scheme`, then the `scheme` field of the static app config, then the `exp+<slug>` default a managed development build registers. A project that declares none of them gets no development-build URL.

A connect URL is not a route link. `navigate --print-url` keeps the route URL as its `URL` line and adds a `Connect` line, plus a `connect` array in `--json`.

On a development build with nothing attached, the launcher URL is opened first [confirmed, 2026-08-28]. The existing attach budget waits for the app. Then the route link is opened. Both opens are reported (`launch` in `--json`, a `Launch` line above `App`). When an app is already attached, only the route link is opened.

Four conditions gate it. The target is a development build. Nothing is attached. A launcher URL exists (`buildConnectUrls` returns none without a dev server and a scheme). There is a budget to wait with. `--no-wait-attach` keeps the old behaviour. `smoke` now passes the attach budget, so a cold development-build run opens the launcher URL first rather than a route link into an empty app. Expo Go is unchanged: `exp://<host>/--/<route>` already carries the dev server, so the ladder does not fire.

The second open is not skipped for the root route. The launcher loads whatever the app last had. That is not necessarily `/`.

On Android the launcher URL goes to `MainActivity` by component (`am start -f 0x20000000 -n <package>/.MainActivity -d <url>`). A BROWSABLE `ACTION_VIEW` intent into a stopped app throws in `DevLauncherController.handleIntent` (`createAppIntent`) and leaves `DevLauncherErrorActivity` while `am start` exits 0. That is what `expo start --dev-client --android` does. The activity is `<app id>/.MainActivity` from `--app-id` or the app config. A project whose application id cannot be read falls back to the link.

When the target app cannot be told apart (nothing connected, no `--app-id`, no `expo-dev-client` dependency, a native directory checked in), both forms print, labelled, Expo Go first. `certain` is false in that one branch. `status.next` names `@expo/agent-cli navigate / --print-url` rather than guessing.

`--print-url` resolves everything and opens nothing, exit 0 [confirmed, Kudo, 2026-08-25]. `resolveRouteUrlAsync` is `openRouteAsync` with the device half removed. `--json` carries the URL, `hostType`, and the four device keys as `null`. `navigate` without the flag, on a machine with no device, names that URL in its failure and names the flag.

### Pointing an app at this dev server

Device-facing URLs prefer a current tunnel host over the listen address. See the next section.

### Where a device reaches the dev server

Device-facing URLs prefer a current tunnel host over the listen address [confirmed, Kudo, 2026-08-25]. The lock records `http://127.0.0.1:<port>`. That is the right answer for every command that talks to the dev server over HTTP. It is the wrong one for a link a device opens.

`src/dev/advertisedUrl.ts` reads the `Waiting on <url>` line the dev server prints. That URL is the tunnel origin whenever an `AsyncWsTunnel` is running. A detached run captures it in `.expo/dev/logs/dev-detached.log`. A dev server started attached writes that line to a terminal, so it is reported as unknown rather than guessed at.

The log has to belong to the dev server that is up. `dev --detach` truncates the log per run. The comparison is the log's mtime against the lock's `startedAt`. This document owns which URL `@expo/agent-cli` prints. A tunnel whose transport has died still advertises the tunnel host.

`--wait-ready` returning is not the tunnel being up. The bundler answers `/status` first. `dev --detach` waits for the host when the run asked for a tunnel, for up to 20 s, and reports it (`tunnelUrl` in `--json` and on `cli:dev_detach`). A run with no `--tunnel` waits for nothing.

`hostType` describes the URL that was printed, classified from that URL. A `127.0.0.1` URL under `tunnel` is an instruction to open a local address on a device somewhere else.

A cloud run against a `localhost` or `lan` URL is refused before anything opens, naming `dev --detach --tunnel`. Opening it would land the app on an error screen with the device tool reporting success. A development build's `<scheme>://<route>` carries no host (`hostType: null`) and is allowed: it reaches whatever dev server the app was launched against.

### adb reverse

`adb reverse tcp:<port> tcp:<port>` is this CLI's job (`src/navigate/adbReverse.ts`). `exp://127.0.0.1:<port>` names the loopback of whatever resolves it. On an emulator that is the emulator. `adb shell am start` still exits 0, because it delivered the intent.

The reverse runs before the link, and only for a loopback host. A LAN or tunnel host is already reachable. Reversing its port would point the device at itself. A refusal is reported rather than fatal. The link that follows is what turns "the reverse failed" into a failure a reader can see.

On the launcher-first path the reverse reads the dev server's origin. The launcher URL is addressed to `expo-development-client` and has no loopback host of its own.

`navigate` waits for an app on this platform to register a debugger target, and reports `App attached` or exits 22. `--no-wait-attach` reports `attached: null`. A stuck Expo Go on Android is force-stopped and the link opened once more. `ErrorActivity` does not retry the manifest fetch. A second intent into a stuck instance changes nothing.

## One preflight for the runtime family

Kudo's directive: if there is no connected app, exit early [confirmed, Kudo, 2026-08-27]. `src/runtime/preflight.ts` is the one place that asks, and the one refusal they all print.

| Command                                                                         | Needs             |
| ------------------------------------------------------------------------------- | ----------------- |
| `runtime:eval`, `runtime:errors`, `runtime:tree`, `runtime:tap`, `runtime:type` | a debugger target |
| `runtime:reload`                                                                | a dev server      |
| `runtime:stop`                                                                  | a device          |

`runtime:stop` requires a device. An app that was already stopped is success ([[0010-agent-conventions]]). Refusing there would fail the run that convention exists to make boring. `stop` reads the connection with `need: 'optional'` and requires only what it acts on. A machine with no device is told so by `resolveDeviceAsync`, with `xcrun simctl list devices booted` or `adb devices` to look with.

Two refusals, both exit 1. Reclassification never renames a code ([[0010-agent-conventions]]):

- `NO_DEV_SERVER`: nothing answered `GET /json/list` on the dev server this command was going to use. The dev server is probed first. "No dev server on `<url>`" and "no app on a running dev server" stay two facts.
- `NO_APP_CONNECTED`: the dev server is running and its debugger target list is empty, or holds no app on the platform the caller named.

Each carries what, why, and how. The how is one ladder, in one order: `npx @expo/agent-cli dev --detach`, then `npx @expo/agent-cli navigate /`, then `npx @expo/agent-cli smoke`. `reachTheAppLadder` is that sentence as a function.

`--cloud` is carried onto every command in the ladder that takes it. `dev --detach` becomes `dev --detach --tunnel` there. A caller who passed `--cloud` is on a machine whose device is in a datacenter. Only `reload` and `stop` have the flag to pass. The reading commands talk to a dev server over HTTP.

`error.data` on the `--json` error envelope holds what the refusal observed: `devServerUrl`, `devServerReachable`, `debuggerTargets`, `commandSocketClients`, `platform`. Always present. `null` for a failure with nothing to count. `commandSocketClients` is null for every command that never opens `/message` (all of them but `runtime:reload`). The alternative is a caller regexing English.

The connection is asked before the bundle gate. With nothing connected the exit is 1, whatever the code on disk would have compiled to. Nothing can be read off a screen that is not there. The other runtime commands already gave 1 for this. The bundle gate's budget is twenty seconds. The connection answer takes a millisecond.

The preflight reads the target list once and hands back the populated connection: the URL, how it was found, the targets, the platform-scoped subset a command may read, and the device index.

Both refusals are exit 1 in every command, including under a gate-shaped flag. `runtime:errors --fail-on-error` with no app is 1, never 0. `1` is "fix the call". The fix is to start a dev server or open the app.

Every command whose `need` is `debugger-target` waits out `APP_RECONNECT_GRACE_MS` (3 s) by default. `reload` can start the app it finds nothing of. `stop` calls an app that is not running a success. After that window, an empty list is exit 22 ([[0010-agent-conventions]] §An empty target list is inconclusive). No-dev-server and wrong-platform stay 1.

Every command of this group takes `--port <n>` as sugar for `--dev-server-url http://127.0.0.1:<n>`. `runtime:reload` and `runtime:stop` take `--platform ios|android` alongside `--ios`/`--android`. Passing both `--dev-server-url` and `--port` is `BAD_ARGS`. `--ios` and `--platform ios` together are fine. `--ios --platform android` is refused. A "no dev server" error names the URL that was tried when the caller already named one (`howToNameTheDevServer`).

## Reloading the app

`@expo/agent-cli runtime:reload` puts the running app back on the code that is on disk, and reports a reload only when one was observed [confirmed, Kudo, 2026-08-23]. It is a `runtime` action, not a top-level verb. Reloading is driving the running app. It keeps a module and a `--help` block of its own.

An error window is a property of the app's session, and the session outlives the fix. The debugger replays what the app reported to every new connection. A reload cleared it. `runtime:errors` cannot be believed about a fix until the app has been reloaded. That is why the reload leads the follow-ups of a non-empty error window.

### How it reloads

The mechanism is the interactive `r` keypress, spoken from outside the CLI process [observed, `packages/@expo/cli/src/start/server/metro/dev-server/createMessageSocket.ts`]. The dev server mounts a WebSocket on `/message`. A frame carrying a `method` and neither an `id` nor a `target` is a broadcast, relayed verbatim to every other connected client. The sender must be trusted (`isLocalSocket && isMatchingOrigin`: a loopback connection that sends no `Origin` header is trusted, the opposite of the inspector proxy). The method must be one of `reload` and `devMenu`.

Every frame needs `version: 2` [observed, `dev-server/utils/socketMessages.ts` `parseRawMessage`]. A frame without it, or with another number, is dropped with no answer and no error.

This is preferred over the device path. It needs no platform tooling, no application id, and no knowledge of which device the app is on. It is the same code path on iOS and Android. It does not restart the process. App state that is not JavaScript survives.

`getpeers` (`{"version":2,"target":"server","method":"getpeers","id":…}`) is the protocol handshake. It is answered with the connected clients as `socket id -> upgrade query`. An answer proves the dev server speaks this version, so a broadcast on the same socket will be relayed rather than discarded, and whether there is an app to reload. Silence is "does not speak this protocol version". It is never "no peers". The two lead to different next actions.

`--method auto` is one ladder, keyed on whether the command socket holds a client [confirmed, Kudo's delegate, 2026-08-27]:

| rung | mechanism               | reached when                                                             |
| ---- | ----------------------- | ------------------------------------------------------------------------ |
| 1    | broadcast on `/message` | the socket holds a client                                                |
| 2    | relaunch the app        | the socket holds none, or the broadcast was delivered and proved nothing |

On `--cloud`, rung 2 is the two controller verbs in §Cloud simulator. Otherwise it is `simctl terminate` / `am force-stop`, then the deep link. A `terminate` that reports the app was not running is success: that is the state the step was reaching for. The application id comes from the debugger target (`appId`) and falls back to Expo Go per platform.

`--method` pins a rung and skips the rest. `--method runtime` calls `expo.reloadAppAsync()` over the debugger, at the target `runtime:eval` reads. `auto` never picks it. On Expo Go the same call closes the app [observed, Expo Go SDK 57, iOS, 2026-08-27]. One runtime reloads and another quits. The difference is not something this command can read off a target. The `expo` global is the door. Hermes has no `require`, no `import()`, no `process`. A module the app did not already load is unreachable. An app whose `expo` global has no `reloadAppAsync` is reported as exactly that.

The entry-bundle check runs before any rung [confirmed, Kudo, 2026-08-24]. A reload makes the app fetch the served bundle again. A bundle that does not compile is exit 20 with `attempts: []`. `--no-bundle-check` exists. `unknown` passes. A check that ran out of budget is 22. The `bundle` object is the one `smoke` prints, same keys, produced by the same function. `appsConnected` on a run that refuses is the count the dev server gave, not `0`.

A broadcast that was delivered is a mechanism that ran. An attempt carries `delivered` beside `ok`. Delivery is whether the action reached the app. It is not whether it worked. A delivered-and-unproved broadcast is exit 22, and `auto` climbs to rung 2. A pinned `--method` never climbs. A broadcast whose churn was observed is a reload, and nothing follows it. The attempt says which of the two states it was reached for.

Rung 2 replaces the app's process, so the JavaScript state is gone. The attempt carries the cost, and only when there was an app to lose state. A relaunch that started an app cost nothing and says nothing.

Android Expo Go holds a client on `/message`. Local Android takes rung 1. `runtime:reload` is the one runtime command that works on Expo Go for Android while five others refuse, because neither proof is a CDP read.

### What proves a reload

A broadcast has no reply. Trusting the send would ship the same false green this command exists to remove. `reloaded: true` with exit 0 requires an observation. Name a verifying signal only when that signal's own evidence is in the payload and non-empty ([[0021-honest-reports]]).

Three observations, watched on one budget. The first to answer ends both watches:

1. Message-socket peers. Socket ids never repeat (`createSocketMap.ts` `createSocketIdFactory`). A peer under a new id is a new connection. This proves the app _acted_. On its own it is `reloaded: true` with exit 22. A churn wait that returns as soon as `peersChanged` is true reads a list that changes in two directions. An app that had dropped its connection would satisfy it. It waits for an id the dev server had not listed before, and reports `commandSocketChurn.reconnected`.
2. A debugger target the dev server had not listed before the reload (`waitForFreshAppConnectionAsync`). Metro's page ids come from a counter it does not rewind. This proves the app _came back_. The old wait returned on the first non-empty list, which was the pre-reload target on its way out.
3. A `Bundled` line in the dev server's captured output that was not there before (`src/runtime/reload/bundleSignal.ts`). Fast Refresh produces no `Bundled` line. A relaunched app re-registers under the same debugger page id, because Metro's per-device counter restarts with the app. This is how a cloud reload can exit 0. `verifiedBy: dev-server-bundle` says the dev server served a bundle after this command acted. It does not say which client asked for it.

Known ids are read after the bundle gate and immediately before the broadcast. Never reused from discovery. A save the watcher picked up in between would otherwise be credited to this command.

`appsConnected` and `appsReconnected` are both reported. One connected and zero reconnected is an app that never re-registered. Zero of both is an app that went. `appsReconnected: 0` is also "the bundle proof answered first, so this watch stopped asking". `appsReconnectedReason` names which one.

`/json/list` is the answer to "is anyone there". It is the list the rest of this CLI uses. The peer list is a property of a mechanism. An empty peer list with a populated debugger list reports `no client is registered on the dev server's command socket, while its debugger target list names N connected app(s)`.

The last read of the wait is the re-read of the target list. A success is a runtime that was observed after the reload.

A proved reload whose last target read was zero asks once more for the reconnect window (`countConnectedAppsAsync`). That is not a wait for a fresh target. Whether it is new was already answered. The question here is the one every command after this reload will ask: is there a runtime on this dev server now. A zero that survives the window keeps its meaning. A cloud session can sit with `/json/list` empty while the app runs.

`verifiedBy` keeps the mechanism's own observation as its label when it has one: `message-socket-peers` for peer churn, `app-relaunch` for a local relaunch, `fresh-debugger-target` for `--method runtime`, `dev-server-bundle` for the Bundled line. The exit code is decided by the observations alone: `0` with either a fresh target or a bundle line, `22` with neither, `20` when no rung ran at all. Peer churn alone is still `reloaded: true` at exit 22.

On a project with no captured dev server log, rung 2 has nothing left to observe when the page id repeats, and exits 22 after `--timeout`. The fix is the first rung of the preflight's own ladder: `npx @expo/agent-cli dev --detach` captures the output that makes the second observation possible.

| Code | Meaning                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------- |
| `0`  | happened, and was observed                                                                                        |
| `20` | did not happen: broken bundle, or no rung reached the app                                                         |
| `22` | a mechanism ran and neither observation was made when `--timeout` expired, or the entry bundle was still building |
| `1`  | not attempted: no dev server, or a bad argument                                                                   |

Nothing connected plus `--method auto` starts the app on the device and can exit 0. `--method dev-server` in that state exits 20. No dev server is 1. A reload makes the app fetch its bundle again. With no dev server that fetch has nowhere to go. Stopping the app would replace a stale screen with no screen.

Follow-ups keep the platform flag the run had. `--cloud` is carried alone when that is the device.

## Loading the app is not navigating it

`<scheme>://<route>` navigates an app already running against a dev server.
`<scheme>://expo-development-client/?url=<origin>` — and `exp://<host>` for Expo Go — **loads** one:
the launcher fetches the bundle the link names, and only then is there an app to navigate. A cold
device given the navigation link shows the dev launcher's own screen and loads nothing [observed —
2026-08-30, Kudo's DailyWords-Grok run: the smoke screenshot was the launcher].

So `openRouteAsync`'s ladder is launcher-first on a development build, and it is **gated on an
attach budget**: the open and the wait for the loaded app to register a debugger target share one
bound. A caller that passes no budget gets the navigation-only behaviour, which is right only for
an app somebody else already loaded — the mistake `smoke` made once it began booting its own
devices, fixed by passing one.

Two consequences the code cites here:

- **There is no launcher runtime to misread.** With the launcher on screen the dev server lists no
  debugger target at all, so the reading phases count zero and are never asked. The e2e pins that
  consequence; target metadata could not pin the cause, because the launcher and the project are
  one application.
- **A picture says what it is a picture of.** Three cases, all plausible to a reader who will not
  check: the project's screen, the dev launcher's screen (a loading link that never produced a
  loaded app), and a device with neither. Read from the open's own report, never guessed.

## The smoke gate

`@expo/agent-cli smoke` answers "does this app still boot" by asking the questions of existing commands in this process, plus a picture of the screen [confirmed, Kudo, 2026-08-24]. Graduated 2026-08-28 ([[0016-v1-scope]]). One process. Every dependency is injected (`src/smoke/phases.ts`). A `smoke` built out of subprocesses would do dev-server discovery eight times, and eight discoveries on a machine running two projects can answer eight different things.

Eight phases:

| phase           | the function                                       |
| --------------- | -------------------------------------------------- |
| `dev-server`    | `discoverDevServerAsync`                           |
| `bundler-ready` | `waitForBundlerReadyAsync`                         |
| `bundle`        | `checkEntryBundleAsync`                            |
| `app`           | `waitForAppConnectionAsync`, then `openRouteAsync` |
| `route`         | `openRouteAsync` (route-checked)                   |
| `runtime`       | `CdpClient.evaluateAsync('1')`                     |
| `errors`        | `CdpRuntimeErrorCollector`                         |
| `screenshot`    | `captureScreenshotAsync`                           |

The URL the first phase settled on is threaded into every phase after it. A gate whose phases talk to two dev servers is a gate whose phases are about two different things.

`--start` must not name a platform. `expo start --ios` drives Simulator.app through AppleScript. On a Mac that has granted no Automation grant the Expo CLI does not catch the refusal and the dev server exits with it. The recovery is the one this command performs: start the dev server without opening anything, then open the app with `navigate`. `START_DEV_SERVER_ARGV` is pinned by a test. `--start` also carries `--port` through when the caller named a loopback one.

| Code | Outcome        | Meaning                                                                                                                                   |
| ---- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `0`  | `passed`       | every deciding phase answered yes, and the runtime answered at all                                                                        |
| `20` | `failed`       | an error in the window, a broken bundle, another project's dev server, a device that refused the link, or no dev server with `--no-start` |
| `22` | `inconclusive` | a wait expired, no app could be opened, or the runtime cannot be read                                                                     |
| `1`  |                | a route the project has not got, or a bad flag                                                                                            |

`passed` requires the runtime to evaluate `1`. A `-32601` there means the window that follows proves nothing. Expo Go for Android cannot, so `smoke --android` against Expo Go exits 22 on a working app. `dev-server`, `bundler-ready`, `bundle` (for android), `app`, and `screenshot` can still be `ok`. `runtime` and `errors` are `inconclusive` with the reason naming the engine. A broken Android bundle is still exit 20 with the later phases skipped.

A development build can pass. The `runtime` phase measures. Live runs have exited 0 with all eight phases `ok`. Evidence is in [[0022-live-tier]].

`smoke --platform web` is `BAD_ARGS`, exit 1. `/json/list` is the inspector proxy's list of React Native runtimes. A browser registers nothing in it. `passed` would be a bundler check wearing a name that promises a runtime check. `22` says "look again", and no amount of looking makes a browser answer a debugger.

The gate fails on `isError || source === 'exception'`. React Native reports an Error through the console path as one string holding the message and its frames. `splitTextStack` lifts them out. `RuntimeErrorRecord` gains `isError` for it. `source === 'exception'` is kept because a runtime that does use the exception channel exists. A logged `Error` and an uncaught one are the same bytes here, so `console.error(new Error(…))` fails the gate too. Plain `console.error` text does not.

The screenshot primitive writes a PNG (`src/device/screenshot.ts`). `simctl` is given the path and writes the file. `adb exec-out screencap -p` writes the PNG to stdout. Never through `adb shell`, which rewrites `\n` as `\r\n` and corrupts every image. Never through a JavaScript string. Success is the first eight bytes matching the PNG signature. `adb exec-out` answers a device that is not ready by writing a sentence to stdout and exiting 0. A missing screenshot degrades. It never decides the run. When no app of this project was connected, `screenshot.ok` says the picture is of the device's screen.

### The run brings its own environment

Start what is missing, stop only what you started, leave what you found [confirmed, Kudo, 2026-08-29]. `--start` is the default. `--no-start` is the opt-out. A dev server that was already up is used and still running afterwards. One this run started is stopped in a cleanup. The same for the device. The run tracks "I started this" explicitly. It never infers it at cleanup time.

`start-dev-server` and `boot-device` appear in the phase list only when the run did them. Every other phase is a question of every run, so a run that never reached one owes the reader a `skipped` row. These two are acts. A machine that already had a dev server did not skip a start. Their failures are the ordinary 20-band. The cleanup still runs.

Cleanup is registered before the resource is started, newest-first. A start that got halfway is still a resource this run is holding. Newest-first because the dev server is started before the device is booted, and leaving an app talking to a bundler that has gone is a worse state than the reverse. A cleanup that fails is reported and never folded into the outcome. It lands in `environment.cleanup`, as a `left behind` line, and on `cli:smoke` as `leftBehind`.

### This command does not build

The start phase asks `StartPlan.buildLocation` first and refuses with `npx @expo/agent-cli dev` when the plan would compile. Expo Go targets and a development build already installed for this fingerprint both answer null there, and both bootstrap in full.

The bootstrap is not charged to `--timeout`. A cold simulator takes about a minute. A cold first bundle takes longer. Each act has a budget of its own: 120 s for the dev server, 120 s for an iOS boot, 240 s for an Android one. This run pays for the cold it caused. First compile (`FIRST_BUNDLE_TIMEOUT_MS`, 3 min) when it started that dev server. First launch and attach (`APP_ATTACH_TIMEOUT_MS`, 2 min) when it started the dev server or booted the device. That attach budget is taken once and shared by the open and the `app` phase wait, so a cold run that never attaches answers after two minutes rather than four. First readable runtime (`RUNTIME_READY_TIMEOUT_MS`, 30 s) when it opened the app. `--timeout` bounds the reads.

### The device that can open the app

Which device gets booted: the one that has the app installed. `src/device/installedApps.ts` reads the simulator filesystem (`Devices/<udid>/data/Containers/Bundle/Application/<container>/<Name>.app`, `plutil` for `CFBundleIdentifier`). `simctl get_app_container` and `simctl listapps` refuse on a shut device. `lastBootedAt` breaks the tie among the devices that have it. When no device has it, nothing is booted. `BootDeviceResult.refused` carries that difference. Expo Go is not exempt: `simctl openurl` does not install Expo Go. `expo start --ios` is what does, and `smoke` opens through `simctl openurl` to avoid the AppleScript grant. Android makes no such choice: there is normally one AVD, and the package list needs `adb` on a running emulator. `--cloud` boots nothing. A run whose dev server already has an app attached boots nothing.

An attached app is not yet a readable app. Expo Go registers a target, downloads the bundle, and the target goes away and comes back when the JS runtime is created. A single read landing in that gap answers `No target found` about an app that is running. The `runtime` phase asks `Runtime.evaluate('1')` until it answers. A runtime with no debugger is asked exactly once. Polling it would turn the refusal into a hang. A wait that ends with no answer reports the runtime's own reason.

`smoke` waits before it photographs. Nothing over this protocol says "rendered". What is waited for is two reads of the target list that name the same ids, bounded, and only for a run that put the app there.

A development-build open that still has the launcher on screen lists no debugger target on this project's dev server [observed, 2026-09-01]. The `app` phase is inconclusive and the reading phases are skipped. The launcher and the project are the same application, so `/json/list` cannot tell them apart. The picture is labelled from the open's own report: the project's screen, the launcher's, or a device with neither.

`smoke`'s error window has no dev-server-log fallback. On Expo Go for Android the `errors` phase is `inconclusive` where `runtime:errors --android` reports a log-backed observation of the same window. The reason names the runtime. The `runtime` phase is inconclusive either way, so the outcome stays 22. On a development build both phases measure.

Live evidence for the eight-phase table, Expo Go Android at 22, and a development build at 0 is [[0022-live-tier]].

## Android

Every refusal below was measured against Expo Go for Android. On a development build of the same project, on the same emulator, `runtime:eval` returns values, `runtime:tree` reads the screen, `runtime:tap` and `runtime:type` drive it, `runtime:errors` reports `runtimeReadable: true`, and `smoke --android` exits 0. The sentences are about an app, not about a platform.

Expo Go for Android ships a Hermes without any CDP debugger [observed, `HermesRuntime[RNBridgeless] does not support debugging over the Chrome DevTools Protocol`]. `Runtime.enable`, `Log.enable`, `Network.enable`, and `Debugger.enable` acknowledge. `Runtime.evaluate` answers `-32601`. The ack is what makes an empty window look like a healthy app. Collectors probe the runtime as they open their window, with `Log.enable` for the announcement and one `Runtime.evaluate` of `1` for the code. The verdict is `RuntimeDebuggerCapability`. `RUNTIME_EVALUATE_UNSUPPORTED` is reached by asking, not by knowing the platform.

The target selector skips only on transport failure, and ranks `-32601` targets behind answering ones. It no longer drops such targets. `CdpRuntimeErrorCollector` forwards every `CdpClientOptions` key, including `platform` and `deviceIndex`.

`/json/list` does not name a platform. Two live targets on one dev server differ in `appId` (`host.exp.Exponent` vs `host.exp.exponent`), `deviceName`, and `title`. `description`, `type`, and `reactNative.capabilities` are identical. `src/runtime/targetPlatform.ts` infers the platform, strongest evidence first: a device name this machine's own device tools just reported (`simctl list devices booted`, `adb devices -l`), then React Native Android's `<model> - <release> - API <sdk>` shape, then Expo Go's two app ids. A target none of them place is `null` and is never counted as either.

Scoping reaches `requireConnectedAppAsync`, `waitForAppConnectionAsync`, `CdpClient` target selection, and `preflightRuntimeAsync`'s `appTargets` for every caller that names a platform. Only a command that requires a runtime still refuses on an empty scope. For `reload` an empty scope is a rung of its ladder. For `stop` it is already-stopped success. `resolveAppId` drops the other platform's Expo Go id before it takes the first one. An id it cannot place is kept: a development build's package name says nothing about a platform.

The bundle-check platform is derived from the apps that are actually connected (`resolveBundleCheckPlatformsAsync`). A named `--platform` wins. One connected platform is that platform. Two are both. Nothing connected leaves the fixed default, and the report says so. A broken bundle decides the run whichever platform it was found on.

`adb` is resolved from `ANDROID_HOME`, then `ANDROID_SDK_ROOT`, then `PATH`, then this platform's default install location (`src/device/adb.ts`). A tool failure is `ADB_NOT_RUNNABLE`. It names every place that was looked. "No device" is reachable only once `adb` has run and answered.

On Android, `am force-stop` exits 0 whether or not the app was running. `stopAppOnDeviceAsync` asks `adb shell pidof <appId>` before the stop. A pid makes `wasRunning` an observation. Exit 1 with nothing said makes it `false`. A `pidof` that could not run makes `verified` false and `wasRunning` null. The `adb shell` returns as soon as ActivityManager has taken the request, so `stopped: true` means the stop ran. A caller that needs the process gone has to look.

Follow-ups keep the platform flag the run had. `navigate --android`'s screenshot line names `npx @expo/agent-cli smoke --android`. `status` lists every local device (`LocalDeviceStatus.devices`).

On a local iOS simulator, every `simctl openurl` of a development-build scheme raises a springboard confirmation, `Open in "<app>"?`, on every call. The four gates that let `navigate --cloud` answer the dialog start with "only on `--cloud`". Whether that gate should be about the device rather than about the flag is open. With the dialog answered by hand, the iOS development build behaves like the Android one.

## Cloud simulator

Device resolution has a third backend: a simulator that runs on EAS [confirmed, Kudo, 2026-08-26]. `@expo/agent-cli navigate --cloud` drives it. A machine with no local device reaches for it as a fallback on `navigate` and `smoke`. `runtime:stop` and `runtime:reload` take `--cloud` and reach for it only when named, so a session that happens to be up never quietly bills a run that a local device would have served.

`NavigateDevice` gains `backend: 'local-ios' | 'local-android' | 'cloud'`. It is reported rather than inferred from `platform`. An EAS session runs iOS too. It rides in `--json` as `deviceBackend`.

The order in `resolveDeviceAsync`:

1. `--cloud` (`cloud: 'required'`): the session is the device. No platform tool is asked.
2. A local device: free, instant, and what a developer at a keyboard is looking at.
3. The session (`cloud: 'fallback'`): only when the local probes found nothing.

`--cloud` is a backend flag. `--cloud --ios` names the platform the session must be. A session that is the other one is refused. `--cloud --print-url` is refused: one asks for a device and the other asks for none.

The backend is `eas simulator:<verb>` subprocesses (`src/device/cloudSimulator.ts`), per [[0001-agentic-cli-on-expo-cli]] constraint 5. Device verbs go through `eas simulator:exec npx agent-device@latest …`. `AGENT_DEVICE_SPEC` is that decision in one constant. The `npx` in that argv is a token the EAS service executes in a datacenter. This CLI does not rewrite it. The argv is pinned by a test table (`src/device/__tests__/cloudSimulator-test.ts`). Enum values come back as raw GraphQL enums (`IN_PROGRESS`, `IOS`) while `type` is the flag spelling (`agent-device`). `startedAt` and `finishedAt` are absent rather than null when they do not apply.

A cloud device is a session the service says is running, not a file on disk [confirmed, Kudo, 2026-08-26]. `eas simulator:list --status in-progress` is the probe. MCP need not write `.env.eas-simulator`. `simulator:start --json` and `--out-config-type env` do not write it either. The file outlives the session it names. Direct GraphQL to `api.expo.dev` is rejected: it reads another CLI's credential store. `eas` is the program that owns that token, so `eas` is the program that spends it.

The device ladder (`navigate` and `smoke`) asks the service. The suggestion ladders (`status.next`, the `start` and `dev` banner) keep the `stat` on the dotenv. They promise to be instant.

Which session, when there is more than one, is deterministic:

1. Only `type: agent-device` is a candidate. An `argent`, `appium`, or `serve-sim` session has no agent-device daemon. A project whose only live session is one of those is told that.
2. The session `.env.eas-simulator` names, when it is among the candidates. The file is a poor existence proof and a good preference.
3. The platform the caller asked for.
4. The most recently created, `createdAt` descending, `id` ascending as the tiebreaker.

The chosen id is reported on the `Device` line, as `deviceId` in `--json`, and on the `cli:navigate` event.

A cloud simulator requires a tunnel. `exp://127.0.0.1:<port>` names the loopback of whatever resolves it, and for a cloud session that is a machine in a datacenter. There is no `adb reverse` that can fix it. A `localhost` or `lan` URL is refused before anything opens (`CLOUD_SIMULATOR_UNREACHABLE_DEV_SERVER`). The check lives in `openRouteAsync`, next to the device. The identical URL is perfectly good for the simulator on this desk.

`close` reports success whatever id it is given. The help says "close the named app". What the service does is answer about the session. `runtime:stop --cloud` therefore reports `wasRunning: null` and `verified: false`. The `--app-id` mismatch check is gated on `verified`. The verb is kept. Closing the foreground app is a real act. The claim about which app is removed. `runtime:reload --cloud` and the Android attach recovery consume `close` as a nudge and verify the outcome independently.

`DEVICE_IN_USE` is retried once, bound to the session the controller named. Never a second session. Acting on "start a new one" bills a second machine and leaves the first one held. The `How:` names the session the controller named, points at binding the verb to that session, and says not to start another.

`xcrun simctl openurl` exiting non-zero is the device refusing the link, exit 1. `eas simulator:exec` exiting non-zero is any of five things: a session that ended mid-run, a signed-out account, a controller flag this CLI got wrong, a binary that was never the EAS CLI, or the device refusing after everything worked. `readControllerError` recognises `Error (CODE): <sentence>`. `CLOUD_SIMULATOR_DEVICE_REFUSED` says the command reached the device, and the device is what said no. A signed-out account becomes the `eas-login` handoff and exit 7. `looksLikeWrapperCrash` names the `eas` under that name rather than quoting a Rust backtrace.

The ways there is no session are separate errors. `unknown` is a tool that did not answer and has said nothing about the world.

| State                                   | Error                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `inactive`                              | `NO_CLOUD_SIMULATOR_SESSION`, saying the dotenv's id is not among the live sessions           |
| `none`, live sessions of the wrong type | `NO_CLOUD_SIMULATOR_SESSION`, naming the types that are up                                    |
| `none`, feature available               | `NO_CLOUD_SIMULATOR_SESSION`, naming `simulator:start` and that it bills until stopped        |
| `none`, feature off                     | `CLOUD_SIMULATOR_UNAVAILABLE`, with the waitlist URL, plus the local device and `--print-url` |
| `unknown`                               | `CLOUD_SIMULATOR_SESSION_UNKNOWN`, naming `simulator:list` and never `simulator:start`        |

Availability is asked only when the listing came back empty of usable sessions. "Start one" for a session that could not be ruled out starts a second billed session.

On `--cloud`, reload rung 2 is the primary mechanism. The tunnel carries the bundle over HTTP. It is not evidence of a client on the command socket. Live there was none. The broadcast reached nobody.

```
eas simulator:exec npx agent-device@latest open <app-id> --platform ios --relaunch
eas simulator:exec npx agent-device@latest open <url>    --platform ios
```

`--relaunch` terminates the app process and launches it again. `close` is the verb that ends the controller's session. Two verbs, not the documented shell-plus-link form. A cold launch of Expo Go with a dev-server URL hits `UNIQUE constraint failed: updates.scope_key, updates.commit_time`. Restart the shell with no URL, then send the link. The URL is `navigate --cloud`'s, resolved by `resolveRouteUrlAsync`. The tunnel precondition is checked before the first verb. A cloud relaunch that nothing observed is exit 22. On a local device the relaunch is an observation, because `simctl terminate` names a process and fails when there is none.

An `exp://` URL handed to the system on an iOS cloud simulator raises "Open in 'Expo Go'?". Nobody is in front of the screen. `navigate --cloud` answers that dialog itself, under four gates: only on `--cloud`, only after this run's own open exited 0, only when nothing attached inside the budget, and only after `alert get` names the app the URL was for. The empty answer from `alert get` is exit 1, `alert not found`, which makes a speculative read safe. `attachAlert` carries three states: answered, some other alert, and none.

`eas simulator … --expo-go --open-url exp://<host>` is the session start that skips the dialog. Every piece of advice that starts a session names `eas simulator … --expo-go` (`CLOUD_SESSION_START_COMMAND`). A session started without it lists only the controller's test runner.

`smoke` takes `--cloud` and resolves its device through `resolveDeviceAsync`. One answer, threaded from the `route` phase into the `screenshot` phase. The screenshot primitive downloads to the path, with a longer budget covering `npx`, a network, and an image coming back. The PNG-signature check is identical. Nothing suggests a platform tool for a cloud device. This CLI never spawns `eas simulator:stop`. It only names it.

`--shutdown` is never passed. The distinction between one app and the whole remote machine is a flag.

## Stopping the app

`runtime:stop` ends the app on the device [confirmed, Kudo, 2026-08-23]. `@expo/agent-cli navigate` starts one. The id is ranked (`src/runtime/appId.ts`): `--app-id`, then the `appId` of a debugger target, then `ios.bundleIdentifier` / `android.package` from the static app config, then Expo Go per platform. A dynamic `app.config.js` is never evaluated ([[0001-agentic-cli-on-expo-cli]] constraint 5). The report names the rung that answered (`bundleIdSource`, `bundleIdReason`). The two Expo Go ids differ only in case: `host.exp.Exponent` on iOS, `host.exp.exponent` on Android.

The dev server outranks the app config. The config names a build. The dev server names what is running. A project whose config names a bundle identifier can still be running in Expo Go.

An app that was not running is success, with `wasRunning` saying whether this command produced that state. On Android the distinction is the `pidof` observation above.

When `--app-id` names an app that was not running and the dev server reports a different app that is, the command exits 20 [confirmed, Kudo, 2026-08-24]. An agent reads the exit code before it reads a word of the output. A warning inside a zero is a warning nobody acts on. Three conditions have to hold together: `--app-id` was passed, the device tool found nothing under it, and the dev server reports at least one debugger target none of which is that id. Idempotency holds. After a successful stop nothing is connected, so the second run has no other app to disagree with and exits 0. `--json` gains `connectedAppIds` and `appIdMismatch`. The follow-up is the same command with the connected id on it.

`dev:stop` reads the dev-server lock, signals the PID it names, and waits for the PID and the lock [confirmed, Kudo, 2026-08-23]. The port is reported, never waited on. `127.0.0.1:8081` and `[::1]:8081` are different sockets. A port check is corroboration. PID liveness (`process.kill(pid, 0)`, with `EPERM` read as alive) is the conclusion. `--json` carries `processStillRunning` beside `portStillAnswering`.

A port with no lock behind it is left running, exit 20. `--force` needs two independent proofs: the port answers `packager-status:running`, and the process on the port has a command line naming a program that runs one. Nothing running is exit 0. Without `--port` the report names the flag. Defaulting to 8081 is how a command ends up reporting on another project's server. Windows is `taskkill /PID <pid> /T /F`, best effort.

`dev:logs` reads the detached log (`.expo/dev/logs/`), strips escape codes, and names whether the log belongs to a server that is running now. A project with a running dev server and no log was started in a terminal. No `--follow`. An agent polls. Each read is bounded. Lines are fenced as untrusted ([[0008-guardrails]]).

## Testing

Schema unit tests plus tier-0 e2e against a fixture app ([[0002-testing-and-evals]]). The e2e stub dev server speaks a real `/message` WebSocket with `version: 2`, `getpeers`, peer churn, and debugger targets that re-register under a new page id on a `v2` reload. Four modes: `v2`, `deaf`, `no-churn`, `none`. `reloadTargets` picks `reconnect`, `stale`, or `gone`. The route table is unit-tested against the conventions. E2e asserts that a bogus route reaches the device tool zero times. `dev:stop` signals a real process. `runtime:stop` asserts the exact argv handed to a stub `xcrun`. Live suites in [[0022-live-tier]] are the evidence for Android Expo Go, Android development build, iOS, and cloud.
)
