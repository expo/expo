# 0014: Driving the app from the debugger — spike notes

**Type:** Notes (Spike)
**Status:** Draft — spike record, not a design of record. **Implemented** in `src/runtime/interact/` as of 2026-08-26; what was built, and the eight things this record left open, are in [[0018-interaction-commands]].
**Systems:** proposed `exagent runtime:tree` / `runtime:tap` / `runtime:type`; `src/runtime/cdpClient.ts`; `src/runtime/promiseSettling.ts`; fixtures in `src/runtime/__tests__/fixtures/spike-view-tree/`
**Author:** Tuft agent (spike run for Kudo)
**Date:** 2026-08-24
**Related:** [[0018-interaction-commands]], [[0005-runtime-loop-tools]], [[0008-guardrails]], [[0010-agent-conventions]], [[0006-agent-native-cli-surface]], [[0016-v1-scope]]

## What this is

`plans/cluster-a-runtime-verify.md` §"Feature 2" gated the interaction commands on a live spike,
because every claim about React internals in it was marked `[inferred]`. This is that spike. It
proves or refutes each claim against a real app, and recommends a design.

Everything below is `[observed — Expo Go on an iOS 26.5 simulator, SDK 57 / RN 0.86.2, React
19.2.3, Fabric, bridgeless, 2026-08-24]` unless it says otherwise. The expressions that were sent
and the answers that came back are committed in
`src/runtime/__tests__/fixtures/spike-view-tree/`, with provenance in that directory's README.

**Verdict: GO.** All five hypotheses hold. Three of them hold differently from how the plan
described them, and those three change the command shapes.

## Verdicts

### 1. The DevTools hook is there, and it answers — confirmed

`__REACT_DEVTOOLS_GLOBAL_HOOK__` is installed in an Expo Go dev bundle, and
`hook.getFiberRoots(1)` returns a `Set` of fiber roots from a plain `Runtime.evaluate` expression.
One renderer, `rendererPackageName: "react-native-renderer"`, `version: "19.2.3"`,
`bundleType: 1`, one root (`out-01-devtools-hook.json`). Round trip: 5 ms.

The renderer object also carries `overrideProps`, `overrideHookState`, `scheduleUpdate` and
`scheduleRefresh`. None of them is needed for this feature, and none should be used: they mutate
the app rather than drive it.

`bundleType: 1` is the development bundle. A release bundle installing no hook was **not tested**,
and is the one branch the fixtures do not cover.

### 2. A self-contained expression can walk the fibers — confirmed, with two corrections

One expression walks every fiber under every root and collects
`{component, testID, accessibilityLabel, accessibilityRole, text, interactive}`
(`expr-03-tree-walk.js`). Measured on the notes app as it ships:

| | Notes screen | With 300 extra list rows |
|---|---|---|
| Fibers walked | 504 | 3279 |
| Host components | 93 | 708 |
| Nodes kept by the filter | 75 | 1322 |
| Interactive nodes | 17 | 29 |
| Whole CDP frame | 11.7 KB | 219 KB |
| Round trip | 8 ms | 25 ms |
| Kept nodes as JSON | 12.4 KB | 241 KB |
| Interactive nodes as JSON | 3.5 KB | 6.1 KB |

**Correction 1 — `--depth <n>` as the plan describes it is useless.** Fiber depth on this app is
**152**, and every element the user can see sits between depth 128 and 152. Depth in fibers counts
context providers, `forwardRef` wrappers and memo boundaries, so a `--depth 5` returns nothing at
all and a `--depth 200` returns everything. A depth cap has to count *kept* nodes, not fibers, or
not exist.

**Correction 2 — the cap is not a transport limit.** `Runtime.evaluate` carried a 64 MB string
back in 1.08 s, and refused nothing at 1, 4, 16 or 64 MB (`out-12-payload-cap.json`). So the size
question is entirely about what an agent should read, not what the socket will bear. The relevant
number in the table above is the last row: the interactive projection stays around 6 KB while the
full tree grows without bound with the list. **The default must be a bounded projection, and the
unbounded tree must be opt-in** — the opposite of the `[--interactive-only]` flag the plan sketched.

**Fabric fiber shape, versus the classic assumptions.** A host fiber's `stateNode` is
`{node, canonical: {currentProps, internalInstanceHandle, nativeTag, publicInstance,
publicRootInstance, viewConfig}}`, and `publicInstance` is a `ReactNativeElement`. There is no
`_nativeTag` and no `measure` on the `stateNode` itself, which is where the pre-Fabric renderer
put them. Nothing in the walk needs `stateNode`, so this costs nothing — but any later work that
wants coordinates has to go through `canonical.publicInstance`.

Everything else the walk needs — `tag`, `elementType`, `type`, `child`, `sibling`, `return`,
`memoizedProps` — is present and behaves as expected. `memoizedProps` holds the props as written
in JSX, including `testID`.

### 3. tap works, on every button family tested — confirmed, with the plan's matching rule refuted

Tapping by finding a fiber with `memoizedProps.testID` and calling the nearest `onPress` drives
the app. Proven on four component families in one screen (`out-08-tap-variants.json`,
`out-09-read-marks.json`, `out-10-tap-link.json`):

| Component | Handler found on | Effect observed |
|---|---|---|
| `Pressable` | `Pressable` | Note appended to the list, input cleared |
| RN `TouchableOpacity` | `TouchableOpacity` | `marks` text updated |
| `react-native-gesture-handler` `TouchableOpacity` | `GenericTouchable` | `marks` text updated |
| `react-native-gesture-handler` `RectButton` | the outer `forwardRef` | `marks` text updated |
| `expo-router` `Link` | `Text` | **Navigated to `/`** — screenshot-confirmed |

react-native-gesture-handler was the plan's biggest open question, and it needs no separate path:
the app's own `onPress` prop is on the fiber, and calling it runs the app's handler. What the
library does differently is *recognise* the gesture, and this never asks it to.

**Refuted — "`--index` is required when `matched > 1`".** A `testID` written once in JSX lands on
**every fiber in the chain that forwards props down to a host view**. In this app 17 fibers carry
a testID and there are 4 elements (`out-04-match-groups.json`): the `Pressable` costs 3 fibers,
the `expo-router` `Link` costs 6, the `FlatList` costs 5. Counting fibers would make
`runtime:tap add-note` report "3 matches, pass `--index`" for a button that appears once on the
screen, on every single call. The plan's rule would have made the command unusable.

**The rule that works — match by element, then take the shallowest handler.**

1. A *match* is a fiber carrying the testID **no ancestor of which carries the same testID**.
   That collapses 17 fibers to 4 elements, one per `testID` written in the source. `--index` then
   means what the plan wanted it to mean, and in this app it is never needed.
2. The *group* of a match is that fiber plus every descendant carrying the same testID. The group
   is **not a contiguous fiber chain** — `expo-router`'s `Link` forwards `testID` through
   `ExpoLinkImpl` and `BaseExpoRouterLink`, which do not carry it themselves. A walk that follows
   only the immediate child stops before the fiber that owns `onPress` and reports "no handler"
   for a working link. That was a real bug in the first version of `expr-04`, visible in its
   history: `handlerFound: null` for `home-notes-link`.
3. The handler is the one on the **shallowest** fiber of the group that has it. This is
   load-bearing for gesture-handler: `RectButton` puts `onPress` on **six** fibers of the same
   group, and only the shallowest is the app's own function. The deepest is
   `RNGestureHandlerButton`'s internal press handler, which expects the library's event, not ours.
4. Only when the group has no handler at all does the search walk **up** past the match — and the
   answer must say so. Tapping a `Text` inside a card would otherwise silently fire the card's
   handler, which is what a real touch does but not what the agent asked for. In this app the
   handler was inside the group every time; the up-walk never ran.

**The handler is called with a synthetic event.** React Native press handlers are given a
`GestureResponderEvent`, and a handler reading `event.nativeEvent.pageX` would throw on
`undefined`. The expression passes an object with `nativeEvent` coordinates, `preventDefault`,
`stopPropagation` and `persist`. It is not a real event and never will be — see the honest limits
below.

### 4. type works — confirmed

Calling `onChangeText` on the element whose testID is `note-input` set the app's state, the
committed `value` prop on all three fibers of the group became the typed text, and the simulator
showed it (`out-05-type.json`, `out-06b-read-state-after-type.json`, screenshot). The `Pressable`
tap that followed then consumed the typed draft and appended it to the list, which is the
end-to-end proof that this is the app's real state and not a prop that was overwritten.

All three fibers of a `TextInput` group carry the **same function object**
(`sameFunctionAsFirst: true`), so for text the depth choice does not matter. It does for
`onPress`, which is why the rule is written for the harder case.

### 5. The effect is observable on the same connection — confirmed

A second `Runtime.evaluate` after the call reads the new state. After the type: `value` is
`"spike-typed-note"` on every fiber of the input. After the tap: the input is `""` and a new row
`"spike-typed-note"` is in the list (`out-06c-read-state-after-tap.json`). No reload, no second
connection, no wait beyond the one second this spike allowed for the commit.

This means `runtime:tap` **can** verify its own effect, and the plan's open question ("should tap
re-read the tree afterwards?") has a cheap answer: a second walk costs 8 ms on this app.

## What the walk sees that the user cannot

The largest finding the plan did not anticipate. While the app is on `/notes`, the fibers of `/`
and `/explore` are **still mounted**, and the walk reports their elements as though they were on
screen: the baseline `out-03-tree-walk.json` contains "Welcome to Expo", "Open notes", the whole
Explore screen's five collapsibles, *and* the notes screen. An agent reading that tree would
conclude the app shows all three at once. Worse, `runtime:tap` would happily fire a handler on a
screen that is not visible.

React itself does not know. All four `Offscreen` fibers report `mode: "visible"` with a null
`memoizedState` (`out-13-offscreen.json`) — this app uses native tabs
(`RNSTabsHostIOS` / `RNSTabsScreenIOS`), so the switching happens natively and React never marks
a subtree hidden.

The answer lives one level up, in React Navigation's own `Screen` component
(`out-14-screen-focus.json`):

```
Screen  { isFocused: false, name: "index",   routeKey: "index-0rdCLEmcFeHIj-D-YOWuy" }
Screen  { isFocused: false, name: "explore", routeKey: "explore-DbbNx4vcBV76Gur9ayT4X" }
Screen  { isFocused: true,  name: "notes",   routeKey: "notes-uwRaOpCYt9X7npvD894oL" }
```

The unfocused `RNSTabsScreenIOS` hosts also carry `pointerEvents: "none"` while the focused one
carries `"box-none"` — a second, renderer-level signal that agrees with the first.

**Recommendation:** default to the focused screen, using the `Screen` fiber's `isFocused`, and
report which screen that was in the JSON. `--all-screens` opts into the whole tree. This reads
React Navigation internals, which is a narrower dependency than React's, so the failure has to be
"I could not tell which screen is focused, here is everything, `focusedScreen: null`" rather than
an error.

## `disabled` does not remove the handler

A `<Pressable testID="disabled-btn" disabled onPress={addNote}>` keeps `onPress` on
`memoizedProps` — `hasOnPress: true` alongside `disabled: true` (`out-15-disabled.json`). React
Native disables the press at the responder level, which this never goes through, so the naive tap
runs the handler of a button the user cannot press. That is a false pass an agent cannot see, and
it is the one correctness bug in the mechanism that this spike found.

The signal is there twice, on the same group:

```
Pressable  { testID: "disabled-btn", onPress: fn, disabled: true }
View       { testID: "disabled-btn", accessibilityState: { disabled: true } }
RCTView    { testID: "disabled-btn", accessibilityState: { disabled: true } }
```

The enabled button next to it has `disabled: <absent>` and `accessibilityState: {}`. So:
**refuse a tap when any fiber of the match group has `disabled === true` or
`accessibilityState.disabled === true`**, with an exit in the `20` band and a `--force` to
override. `accessibilityState` is the more portable of the two, because it is what a component
sets for the platform rather than what one library happens to call its prop.

## Version fragility, measured rather than guessed

| What is depended on | How stable | If it breaks |
|---|---|---|
| `__REACT_DEVTOOLS_GLOBAL_HOOK__`, `getFiberRoots` | A stable DevTools contract; the renderer registers itself with it | Nothing works — detect and refuse |
| `memoizedProps`, `child`, `sibling`, `return` | Reconciler field names, unchanged for years | Nothing works — detect and refuse |
| `elementType` being a string for host components | The host/composite distinction itself | Component names go wrong; the walk still runs |
| **Numeric fiber tags** (`5` host, `6` text, `15` memo…) | **Renumbered between React versions** | Silently wrong classification |
| `Screen.isFocused` | React Navigation internal | Focus filter fails; fall back to all screens |
| `GenericTouchable` / `RNGestureHandlerButton` names | gesture-handler internal | Only affects what is *reported*, not what is called |

The fourth row is the one to design against. This spike used numeric tags to explore, and they are
wrong to ship: `typeof elementType === 'string'` answers "is this a host component" without any
tag, and the walk needs nothing else. **Do not put React's tag numbers in the shipped expression.**

The refusal path should be one guard at the top of every expression —
"no `__REACT_DEVTOOLS_GLOBAL_HOOK__`, or it has no `getFiberRoots`" — answering
`RUNTIME_TREE_UNSUPPORTED` rather than emitting a wrong tree, exactly as the plan proposed.

## Honest limits, for `--help` rather than for a footnote

- **This calls props, not touches.** No press timing, no responder chain, no gesture recognition,
  no `onPressIn`/`onPressOut` pair, no native focus for a `TextInput`. A component that only works
  because of the responder system will not be exercised by it.
- **An invisible button is still tapped.** A button hidden behind a modal, scrolled off screen or
  at zero opacity is indistinguishable from a visible one to this walk.
- **A disabled button is still tapped, unless the command refuses it.** See below — this one is
  cheap to fix, so it should not stay a limit.
- **The event is synthetic.** A handler that reads a real touch's `pageX` gets zero.
- **Nothing works on Expo Go for Android**, which has no CDP debugger at all
  ([[0005-runtime-loop-tools]] §Android pass). Same refusal as `runtime:eval`.
- **Release bundles are untested** and expected not to carry the hook.

## The device-automation fallback, checked

`idb` is **not installed** on this machine; only `idb_companion` 1.1.8 (a 2022 build) is, and it
is not the CLI. So the iOS fallback the plan named as Backend B costs an install before it can be
evaluated at all, and is not a same-day alternative. Android's `uiautomator` path was out of scope
for this spike. The fiber walk works, so nothing is blocked on this.

## Recommendation: GO, with these command shapes

`runtime:tree` — default to the focused screen and the interactive projection, because that is
what stays a fixed size as the app grows:

```
exagent runtime:tree [--all] [--all-screens] [--testID <id>] [--max-nodes <n>] [--json]
```

`--all` is the full projection (every node with a testID, a label, a role, a handler or text);
without it, only nodes with a handler or a testID. `--max-nodes` truncates and says so in
`truncated`. There is no `--depth`. JSON adds `focusedScreen` and `screensSeen`.

`runtime:tap` — matching by element, not by fiber:

```
exagent runtime:tap <testID> [--index <n>] [--all-screens] [--verify] [--force] [--json]
```

JSON: `{ testID, matched, index, component, handler, handlerOn, handlerOutsideMatch, disabled,
screen, ok }`.
`matched` counts elements. `--index` is required only when `matched > 1`, which this app never
reached. `handlerOutsideMatch: true` says the handler came from an ancestor of the match and is
worth an explicit line in the text output. `--verify` re-walks after the call and reports what
changed — 8 ms, per hypothesis 5.

`runtime:type` — same matching, `onChangeText`:

```
exagent runtime:type <text> --testID <id> [--submit] [--all-screens] [--json]
```

`--submit` calls `onSubmitEditing` after the text. Exit `0` handled, the `20`-band code for no
match / no handler / ambiguous, per [[0010-agent-conventions]].

All three go through `evaluateOverSessionAsync` in `src/runtime/cdpClient.ts` unchanged — verified
by running the fiber walk through the shipped `exagent runtime:eval`, which returned
`{"fibers": 3279}` with the `promiseSettling` wrapper in place and nothing to adjust. Every string
in the output comes from the app, so all of it is fenced under [[0008-guardrails]].

## What the implementer must not lose

1. **Match by element.** Fiber counting makes `--index` fire on every call.
2. **A group is not a contiguous chain.** Collect the subtree, do not follow the child pointer.
3. **Shallowest handler wins.** The deepest is a library's internal.
4. **No React tag numbers in the shipped expression.** Use `typeof elementType === 'string'`.
5. **Filter to the focused screen**, or the tree describes three screens at once.
6. **Bound the default projection**, not the depth.
7. **Refuse a disabled match.** `onPress` is still on the props of a `disabled` button.
8. **One guard, one refusal:** no hook ⇒ `RUNTIME_TREE_UNSUPPORTED`, never a partial tree.
