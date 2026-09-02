# Fixtures: the `runtime:tree` / `runtime:tap` / `runtime:type` spike

Every `expr-*.js` file here is an expression that was sent to a running app as one
`Runtime.evaluate`, and every `out-*.json` file is what that app answered. Nothing was
hand-written or edited afterwards, except where a field is marked as elided.

One line was added to each expression after its capture: the leading `/* oxlint-disable … */`
comment, so the package's linter leaves these alone. It is inert, and it is the only difference
between a file here and what went over the socket. These are Hermes expressions, not package
source — `var` throughout is deliberate.

## Provenance

| | |
|---|---|
| Captured | 2026-08-24 |
| App | `friction/run3/notesapp` — Expo SDK 57.0.15, `expo-router` 57.0.15, React 19.2.3, React Native 0.86.2, `react-native-gesture-handler` 2.32.0 |
| Runtime | Expo Go, iOS 26.5 simulator `C159CF99-9B06-4D2F-BFDC-010A107E2FBC` (iPhone 17 Pro), Hermes, Fabric, bridgeless |
| Renderer | `react-native-renderer` 19.2.3, `bundleType: 1` (development), one renderer, one fiber root |
| Dev server | `@expo/agent-cli start --go --port 8230`, `http://127.0.0.1:8230` |
| Transport | `Runtime.evaluate` over the Metro inspector proxy, `returnByValue: true`, same-origin `Origin` header (`src/runtime/cdpClient.ts`) |

`out-*.json` records `exprBytes` (the expression sent), `cdpResponseBytes` (the whole CDP frame
that came back) and `roundTripMs` (send to answer, one socket already open), alongside the
runtime's own `result`.

## What each pair proves

| Expression | Output | Question |
|---|---|---|
| `expr-01-devtools-hook.js` | `out-01-devtools-hook.json` | Is `__REACT_DEVTOOLS_GLOBAL_HOOK__` there, and does `getFiberRoots(1)` answer? |
| `expr-02-fiber-shape.js` | `out-02-fiber-shape.json` | What a fiber looks like on this runtime: tags, `elementType`, Fabric `stateNode` |
| `expr-03-tree-walk.js` | `out-03-tree-walk.json` | The full walk and its census, on the notes screen as the app ships |
| `expr-04-match-groups.js` | `out-04-match-groups.json` | How many *elements* carry a testID, versus how many fibers |
| `expr-05-type.js` | `out-05-type.json` | Calling `onChangeText` on a `TextInput` fiber |
| `expr-06-read-state.js` | `out-06a-…-before.json`, `out-06b-…-after-type.json`, `out-06c-…-after-tap.json` | Reading the effect of a call back over the same connection |
| `expr-07-tap.js` | `out-07-tap.json` | Calling `onPress` found from a testID (`Pressable`) |
| `expr-08-tap-variants.js` | `out-08-tap-variants.json` | The same for `TouchableOpacity` and two react-native-gesture-handler components |
| `expr-09-read-marks.js` | `out-09-read-marks.json` | Which of those three handlers actually ran |
| `expr-10-tap-template.js` | `out-10-tap-link.json` | The tap as a command would build it, on an `expo-router` `Link` |
| `expr-11` — none | `out-11-tree-walk-300rows.json` | `expr-03` again, with 300 extra list rows rendered |
| `expr-12-payload-cap.js` | `out-12-payload-cap.json` | How large a value this connection will carry |
| `expr-13-offscreen.js` | `out-13-offscreen.json` | Whether React itself knows which screen is on screen |
| `expr-14-screen-focus.js` | `out-14-screen-focus.json` | Where the "which screen is on screen" answer actually lives |
| `expr-15-disabled.js` | `out-15-disabled.json` | Whether `disabled` takes `onPress` off a `Pressable`'s props |

## Two files are templates

`expr-10-tap-template.js` contains `__TESTID_JSON__` and `expr-12-payload-cap.js` contains
`__SIZE__`. Each was replaced with a literal before sending — `JSON.stringify(testID)` and a
decimal integer — which is the only place caller input enters an expression. The outputs record
which value was used.

## Two outputs were produced against a temporarily edited app

`out-08-tap-variants.json`, `out-09-read-marks.json`, `out-10-tap-link.json`,
`out-11-tree-walk-300rows.json`, `out-13-offscreen.json` and `out-14-screen-focus.json` were
captured with `src/app/notes.tsx` in the notes app carrying four extra elements — an RN
`TouchableOpacity`, a gesture-handler `TouchableOpacity`, a gesture-handler `RectButton`, an
`expo-router` `Link`, a toggle that renders 300 more list rows, and a `Text` that records which
handlers ran. The screen was wrapped in `GestureHandlerRootView`, without which every
gesture-handler component throws on render. That edit was reverted after the capture; the app is
back at the file this spike found.

`out-15-disabled.json` was captured with one further temporary element, a `Pressable` with
`disabled` and a `testID` of `disabled-btn`, next to the `add-note` button it is compared against.

The other outputs are against the app as it ships.

## The one thing to re-check before trusting these

`bundleType: 1` in `out-01` says this was a development bundle. The DevTools hook is what a
development bundle installs; a release bundle is expected not to have it, and that case is not
covered by any fixture here.

See `llp/0018-interaction-commands.rfc.md` for what was concluded from these.
