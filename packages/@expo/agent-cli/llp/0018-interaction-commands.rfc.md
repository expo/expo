# 0018: The interaction commands

**Type:** RFC
**Status:** Active
**Systems:** `src/runtime/interact/` (`expression.ts`, `resolveOptions.ts`, `interactAsync.ts`, `format.ts`, `types.ts`, `tree.ts`, `tap.ts`, `type.ts`); follow-up ladders (`src/followups/interact.ts`); the entry-bundle gate (`src/runtime/bundleCheck.ts`); `cli:runtime_tree` / `cli:runtime_tap` / `cli:runtime_type`
**Author:** Tuft agent (implementation of the [[0014-interaction-spike]] spike, for Kudo)
**Date:** 2026-08-26 · finalized 2026-08-28
**Revised:** 2026-08-30
**Related:** [[0005-runtime-loop-tools]], [[0006-agent-native-cli-surface]], [[0008-guardrails]], [[0009-smart-followups]], [[0010-agent-conventions]], [[0016-v1-scope]]

## Summary

`runtime:tree`, `runtime:tap`, and `runtime:type` drive the running app through the
debugger. They walk the React fiber tree, match by element, call the app's own handlers,
and (with `--verify`) re-read the tree to report what changed.

The eight rules in §Must not lose are the contract. They came from a live spike
([[0014-interaction-spike]], superseded). The commands ship as ordinary v1 commands.

```
@expo/agent-cli runtime:tree [--all] [--all-screens] [--testID <id>] [--max-nodes <n>] [--json]
@expo/agent-cli runtime:tap <testID> [--index <n>] [--all-screens] [--verify] [--force] [--json]
@expo/agent-cli runtime:type <text> --testID <id> [--submit] [--index <n>] [--force] [--all-screens] [--json]
```

Every string in the output comes from the app, so all of it is fenced under
[[0008-guardrails]].

## Shape of the code

The fiber tree only exists inside the app. Matching, the focus filter, the disabled
check, and the handler calls all live in `expression.ts` as JavaScript source. The
TypeScript around it never sees a fiber. It builds a string, sends it through the same
`CdpClient.evaluateAsync` that `runtime:eval` uses, and formats the object that comes
back.

That is what makes the feature testable. `expression-test.ts` evaluates the real
expression against fake fiber roots built from the spike's recorded payloads, gaps in
the chains included.

`--verify` is three round trips: a walk, the tap, then a second walk after the app has
been given a second to commit.

The three commands share the entry-bundle gate with `runtime:reload`
(`checkEntryBundleAsync`). The gate runs before the debugger connection is used, so a
refused run asks the app nothing. The budget is `BUNDLE_CHECK_TIMEOUT_MS = 20_000`, not
a flag. `--no-bundle-check` overrides it.

Two timing constants, neither a flag. `VERIFY_SETTLE_MS = 1000`: a React state update is
not a synchronous repaint, so a second walk sent in the same millisecond as the tap
reads the tree from before it. `EVALUATE_TIMEOUT_MS = 10_000`: a budget only ever
reached by a blocked JavaScript thread.

## Must not lose

These eight rules are pinned by tests that fail when the rule is inverted
(`src/runtime/interact/__tests__/expression-test.ts`). Code that walks fibers `@ref`s
this section.

1. Match by element. A `testID` written once in JSX lands on every fiber in the chain
   that forwards props. Fiber counting makes `--index` fire on every call.
2. A group is not a contiguous chain. Collect the subtree. `expo-router`'s `Link`
   forwards `testID` through wrappers that do not carry it themselves. A walk that
   follows only the child pointer stops before the fiber that owns `onPress`.
3. Shallowest handler wins. The deepest is a library's internal. `RectButton` puts
   `onPress` on six fibers of the same group. Only the shallowest is the app's own
   function.
4. No React tag numbers. Use `typeof elementType === 'string'`. Numeric fiber tags are
   renumbered between React versions.
5. Filter to the focused screen. While the app is on one route, the fibers of the others
   are still mounted. Default to nodes with no unfocused `Screen` ancestor.
   `--all-screens` opts into the whole tree. Focus that cannot be read is
   `focusedScreen: null` plus the whole tree, never an error and never an empty report.
6. Bound the default projection, not depth. Fiber depth on a real screen sits between
   128 and 152. A `--depth 5` returns nothing. The size question is what an agent should
   read, not what the socket will bear.
7. Refuse a disabled match. `onPress` is still on the props of a `disabled` button.
   React Native disables the press at the responder level, which this never goes
   through.
8. One guard: no hook → `RUNTIME_TREE_UNSUPPORTED`, never a partial tree. Ask at the top
   of every expression whether `__REACT_DEVTOOLS_GLOBAL_HOOK__` is missing or has no
   `getFiberRoots`.

## Eight shipped decisions

1. `--max-nodes` defaults to 200. A flag alone is not a bound, because the size of an
   unbounded report is a property of the app. The spike's full projection of one screen
   was 12 KB, and 241 KB with 300 more list rows. 200 is far above what a normal screen
   produces and still bounds the pathological one. A run that hits it says
   `truncated: true` and names the flag that lifts it.

2. Focus is "no unfocused `Screen` ancestor", not "the one focused `Screen`". A nested
   navigator has two focused `Screen` fibers, one inside the other. A node is off the
   focused screen when any `Screen` ancestor of it is unfocused. `focusedScreen` reports
   the deepest focused `Screen` whose ancestors are all focused.

3. `runtime:type` takes `--index` and `--force`. It matches the same way `tap` does, so
   it meets `ambiguous` the same way. `editable={false}` is what a `TextInput` uses for
   the state `disabled` is on a button. `disabledOn` in the report names which prop said
   so: `disabled`, `editable`, `accessibilityState.disabled`, or `aria-disabled`.

4. `RUNTIME_TREE_UNSUPPORTED` is exit 1, and is a different failure from
   `RUNTIME_EVALUATE_UNSUPPORTED`. The tool did not work, and running the same command
   again unchanged will fail identically ([[0010-agent-conventions]]). One is "the
   runtime cannot evaluate anything" (Expo Go for Android). The other is "the runtime
   evaluated it and has no DevTools hook". Only the second is answered by opening a
   development bundle. Everything the app decides is the 20 band: no match, ambiguous,
   index out of range, disabled, no handler, no submit handler, and a handler that
   threw.

5. A handler that threw is 20. `runtime:eval` exits 1 when the expression throws,
   because the expression is the caller's own code. Here the handler is the app's code
   and the tap did land, reporting `called: true` with a `threw`. That is an outcome of
   the app. The report keeps the two facts apart: the call was made, and it raised.

6. `runtime:tree --testID` is a tap without the tap. It reports the matched elements'
   own subtrees plus one summary row each: the component, the group size, the handler
   `runtime:tap` would call, whether that handler is on an ancestor, and whether the
   element is disabled. A `--testID` that matches nothing exits 20. Without one, an
   empty screen exits 0, because the caller asked what is there and was told.

7. Follow-ups were added. The spike left them off. A `runtime:tree` run has just read
   the argument the next command takes, and can name a real testID off this walk. All
   three take `--no-followups`. Never suggest an act this run has shown would be
   refused. Tree offers a tap on the element it found, a type into the input it found,
   and a read of the errors. Tap offers the `--verify` it did not ask for, or the errors
   when the diff saw nothing. Type offers the `--submit` it did not make, then the tree
   that names the button which consumes the text. A run that failed still prints no
   follow-ups. Its refusal already names what to do.

8. `--test-id` is accepted as another spelling of `--testID`. `testID` is React Native's
   own prop name and is what every report prints back, so it stays canonical. An unknown
   flag is a hard stop for a driving agent, and `--test-id` is what every other flag in
   this CLI would have led one to type.

Also shipped, because the listing and the refusals depend on them:

The default `runtime:tree` listing groups by element, the same match `--testID` and
`tap` use. The row carries the group's facts: the union of its handler props, `disabled`
when any fiber of it is disabled, the first text any of them has, and `groupSize`. A
node with a handler and no testID is still a row, grouped by its own fiber identity. The
row's `handlers` are the element's own, never an ancestor's. `runtime:tap` walks up when
the group has none and says `handlerOutsideMatch: true` about it.

`nodeCount` is what came back. `nodesBeforeTruncation` is what the projection produced.

Text is the joined string and number children of a node. Element children are skipped
(`String(child)` on a React element is `[object Object]`). A `TextInput`'s `placeholder`
is its own key. `text: ""` is a field that was measured and is empty. `text: null` is a
field that shows nothing.

The expression computes each candidate's own handler before it refuses anything, and
carries it on `candidates[].handler`. With no candidate carrying the prop the answer is
`no-handler`, naming both how many elements there are and that none of them takes the
action. `ambiguous` is still the answer when some of them do.

A pre-scan of the caller's argv catches `--index` and `--max-nodes` values matching
`/^-\d/`. For every other flag a leading `-` really does start an option.

## What `--verify` claims

It walks the full projection before and after, keys each node by its testID (or its
component name) plus its position among nodes with the same key, and reports what was
added, what was removed, and whose text changed. The interactive projection is the wrong
choice for a diff: the row a tap appends is often a `Text` with no testID and no
handler.

`changed: false` is a real answer and is printed as one: the handler ran, and whatever
it did is not visible in the component tree. That covers a network call, a navigation
this walk cannot see, or nothing at all. It is never rendered as "the tap did nothing".

The full projection is bounded by the same `--max-nodes`. Nothing prints a snapshot,
only the diff between two of them.

Without `--verify`, the only claim is that the handler was called. Nothing reports an
effect it did not observe.

## Honest limits

- This calls props, not touches. No press timing, no responder chain, no gesture
  recognition, no `onPressIn` / `onPressOut` pair, no native focus for a `TextInput`. A
  component that only works because of the responder system will not be exercised by it.
- An invisible button is still tapped. A button hidden behind a modal, scrolled off
  screen, or at zero opacity is indistinguishable from a visible one to this walk.
- The event is synthetic. A handler that reads a real touch's `pageX` gets zero.
- Nothing works on Expo Go for Android, which has no CDP debugger at all
  ([[0005-runtime-loop-tools]]). Same refusal as `runtime:eval`. A development build on
  the same emulator does answer.
- Release bundles install no DevTools hook, so they are not a runtime these commands
  claim. They need a dev server and a debugger connection to run at all.

A tap whose handler is on an ancestor has been read live (`handlerOn: "Text"` over an
`expo-router` `Link` chain) and never called live.

## Testing

- `expression-test.ts`. The real expressions, against fake fiber roots built from the
  spike's recorded payloads. The shallowest-handler rule, the non-contiguous group, and
  the element-match rule are each inverted in a scratch copy to confirm the suite
  catches them.
- `resolveOptions-test.ts`. Every flag, and the errors for the values that are not
  usable.
- `format-test.ts`. The untrusted fence, including a node whose text tries to close it.
  The per-reason explanations. The `--verify` diff.
- `interactAsync-test.ts`. The exit code for each outcome, the stable key set, and the
  two refusals told apart.
- `e2e/__tests__/runtime-interact-test.ts`. The published bin against a stub dev server
  whose inspector socket answers `Runtime.evaluate`.
- Live coverage is the `runtime:tree` / `runtime:tap` / `runtime:type` rows of
  [[0022-live-tier]] §Coverage matrix.
