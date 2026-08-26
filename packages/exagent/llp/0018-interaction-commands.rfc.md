# 0018: The Interaction Commands — `runtime:tree`, `runtime:tap`, `runtime:type` As Shipped

**Type:** RFC
**Status:** Draft — implemented, marked `[experimental]`
**Systems:** `src/runtime/interact/` (`expression.ts`, `resolveOptions.ts`, `interactAsync.ts`, `format.ts`, `types.ts`, `tree.ts`, `tap.ts`, `type.ts`); the `runtime` group of `src/commandRegistry.ts`; the `cli:runtime_tree` / `cli:runtime_tap` / `cli:runtime_type` events in `src/events.ts`; the `inspectorEvaluate` option of `e2e/utils.ts`
**Author:** Tuft agent (implementation of [[0014-interaction-spike]], for Kudo)
**Date:** 2026-08-26
**Related:** [[0014-interaction-spike]], [[0005-runtime-loop-tools]], [[0008-guardrails]], [[0010-agent-conventions]], [[0006-agent-native-cli-surface]], [[0016-v1-scope]]

## What this document is

[[0014-interaction-spike]] is the spike record: five hypotheses, checked against a real app, with a
GO verdict and three recommended command shapes. This is what was **built** from it — and, more to
the point, the nine places the implementation had to decide something the spike did not settle.
Eight of them were decided at the desk and are below; the ninth was decided by the live run at the
end, which is where it is recorded.

Everything the spike marked non-negotiable is implemented as written and is pinned by a test that
fails when the rule is inverted (`src/runtime/interact/__tests__/expression-test.ts`). Nothing in
that list is re-argued here. What follows is the delta.

## The shape of the code

One directory, `src/runtime/interact/`, and one property that decides where each line goes: **the
fiber tree only exists inside the app**. So the whole of the matching, the focus filter, the
disabled check and the calls live in `expression.ts` as JavaScript source, and the TypeScript around
it never sees a fiber — it builds a string, sends it through the same `CdpClient.evaluateAsync`
`runtime:eval` uses, and formats the object that comes back.

That is what makes the feature testable at all. `expression-test.ts` evaluates the real expression
against fake fiber roots built from the shapes `out-04-match-groups.json`, `out-14-screen-focus.json`
and `out-15-disabled.json` recorded, gaps in the chains included. The alternative — asserting on
TypeScript that never touches a fiber — would have proved nothing about any of the five rules.

`--verify` is the one thing that is not one round trip. It is three: a walk, the tap, then a second
walk after the app has been given a second to commit.

## The eight decisions the spike left open

### 1. `--max-nodes` has a default of 200, not just a flag

[[0014-interaction-spike]] §Correction 2 says the default projection must be bounded and gives
`--max-nodes` as the flag. It does not say what happens when nobody passes it.

A flag alone is not a bound: the size of an unbounded report is a property of the *app*, and the
spike's own measurements are the argument — the full projection of one screen was 12 KB and 241 KB
with 300 more list rows. So the cap is always on, at 200 nodes, which is far above what a normal
screen produces (the spike's screen kept 75, of which 17 were interactive) and still bounds the
pathological one. A run that hits it says `truncated: true` and names the flag that lifts it.

### 2. Focus is "no unfocused `Screen` ancestor", not "the one focused `Screen`"

The spike found one focused `Screen` among three and recommended filtering to it. A nested
navigator — a stack inside a focused tab — has **two** focused `Screen` fibers, one inside the
other, and the recommendation as written does not say which one wins.

The rule that needs no such choice: a node is off the focused screen when **any** `Screen` ancestor
of it is unfocused. For the spike's app that is exactly what it recommended; for a nested navigator
it is the inner screen without anything having to prefer it. `focusedScreen` reports the deepest
focused `Screen` whose ancestors are all focused, which is the screen the user is on.

The failure mode is unchanged and is the point of the whole section: focus that cannot be read is
`focusedScreen: null` plus the whole tree, never an error and never an empty report. Two cases reach
it — no `Screen` fiber anywhere, and `Screen` fibers of which none is focused — and both are pinned.

### 3. `runtime:type` takes `--index` and `--force`, which the recommended shape did not have

The spike's shape for `type` is `<text> --testID <id> [--submit] [--all-screens] [--json]`, and its
disabled refusal is written for `tap`.

Both were added to `type`, for one reason each:

- **`--index`** — `type` matches the same way `tap` does, so it meets `ambiguous` the same way. Its
  recommended shape gives an agent that meets it no way forward at all: the answer would be "give
  the input a unique testID", which is a code change, in an exit code that says "retry differently".
- **`--force`, and the disabled refusal behind it** — `editable={false}` is what a `TextInput` uses
  for the state `disabled` is on a button, and calling `onChangeText` on one is the same false pass
  the spike called *the one correctness bug in the mechanism*. Refusing it is the same three lines;
  `--force` is what keeps the refusal recoverable, exactly as it does for `tap`.

`disabledOn` in the report names which prop said so — `disabled`, `editable`,
`accessibilityState.disabled` or `aria-disabled` — so the refusal is auditable rather than a verdict.

### 4. `RUNTIME_TREE_UNSUPPORTED` is exit 1, and is a different failure from `RUNTIME_EVALUATE_UNSUPPORTED`

The spike names the code and calls it a refusal without giving it a band. It is the 1 band, on
[[0010-agent-conventions]]'s rule: the tool did not work, and running the same command again
unchanged will fail identically. It sits beside `RUNTIME_EVALUATE_UNSUPPORTED`, which is Expo Go for
Android, and the two must not be merged — one is *the runtime cannot evaluate anything*, the other
is *the runtime evaluated it and has no DevTools hook*, and only the second is answered by opening a
development bundle.

Everything the **app** decides is the 20 band: no match, ambiguous, index out of range, disabled, no
handler, no submit handler, and a handler that threw. Retrying with a different flag is the recovery
for every one of them, which is what the band means.

### 5. A handler that threw is 20, where `runtime:eval` uses 1

`runtime:eval` exits 1 when the expression throws, because the expression is the caller's own code
and a throw in it is the caller's mistake. Here the handler is the *app's* code and the tap did
land: `called: true` with a `threw`, which is an outcome of the app rather than a failure of the
command. So it is 20, and the report keeps the two facts apart — the call was made, and it raised.

### 6. `runtime:tree --testID` is a tap without the tap

The spike gives `--testID` as a filter and does not say what it filters to. It reports the matched
elements' own subtrees **plus** one summary row each: the component, the group size, the handler
`runtime:tap` would call, whether that handler is on an ancestor, and whether the element is
disabled. That is every fact the tap decides on, without the call — so "look before you drive" is
one command rather than a tap with an unwanted side effect.

A `--testID` that matches nothing exits **20**. Without one, an empty screen exits 0: the caller
asked what is there and was told. With one, the caller asked a yes/no question about the app and the
answer was no.

### 7. No follow-ups, and so no `--no-followups`

Every command that prints a `Suggested next:` block takes `--no-followups` to clear it
([[0009-smart-followups]]). None of the three recommended shapes has that flag, and adding one to
each to carry a block nobody asked for is a worse trade than not having the block: the recovery an
agent needs here is per-outcome, not per-command, and it is already carried by the failure
explanation and the `Try:` line under it ([[0006-agent-native-cli-surface]] §Errors are prompts).

### 8. `--test-id` is accepted as another spelling of `--testID`

`testID` is React Native's own prop name and is what every report prints back, so it stays
canonical. The kebab spelling resolves to it because an unknown flag is a hard stop for a driving
agent, and `--test-id` is what every other flag in this CLI would have led one to type.

## The timing constants, and why neither is a flag

- **`VERIFY_SETTLE_MS = 1000`.** A React state update is not a synchronous repaint, so a second walk
  sent in the same millisecond as the tap reads the tree from before it. One second is the wait the
  spike allowed and observed at ([[0014-interaction-spike]] §Verdict 5). The walk itself costs 8 ms.
- **`EVALUATE_TIMEOUT_MS = 10_000`.** The largest walk the spike measured — 3279 fibers — answered
  in 25 ms. A budget four hundred times that is only ever reached by a blocked JavaScript thread,
  which no flag fixes.

## What `--verify` claims, and what it does not

It walks the **full** projection before and after, keys each node by its testID (or its component
name) plus its position among nodes with the same key, and reports what was added, what was removed
and whose text changed. `changed: false` is a real answer and is printed as one: *the handler ran;
whatever it did is not visible in the component tree* — a network call, a navigation this walk
cannot see, or nothing at all. It is never rendered as "the tap did nothing".

The projection it walks is the ninth decision, and it was made by the live run below rather than at
the desk. `--verify` used the interactive projection — the same one `runtime:tree` defaults to —
until the notes app showed why that is the wrong choice for a diff: the row a tap appends is a
`ThemedText` with no testID and no handler, so the snapshot could not see it, and the report said
only that the input had cleared. What a tap alters is usually *text*. The full projection is bounded
by the same `--max-nodes`, and nothing prints a snapshot — only the diff between two of them — so
the size argument that decides the `runtime:tree` default does not apply here.

Without `--verify`, the only claim is that the handler was called. That is the honesty rule of this
whole feature: nothing reports an effect it did not observe.

## Why these ship `[experimental]`

Marked `unstable: true` on all three, per [[0016-v1-scope]] §Experimental is per command. The
mechanism is proved — five hypotheses, all held — but against **one app, on one runtime, on one
day**: Expo SDK 57 / RN 0.86.2 / React 19.2.3, Expo Go on an iOS 26.5 simulator, Fabric, bridgeless.
Every claim it makes about React's internals is recorded with the payload that showed it, and the
row of [[0014-interaction-spike]]'s fragility table that is most likely to move these command shapes
is the one nobody has tested: a component family in a library the spike never met.

The names are not going anywhere. What may move is the projection, the `--verify` diff, and whether
`--index` needs a companion for picking a list row by its text.

## Testing

- **`expression-test.ts`** — the real expressions, against fake fiber roots built from the spike's
  recorded payloads. The three load-bearing rules were each inverted in a scratch copy to confirm
  the suite catches them: the shallowest-handler rule fails 3 tests when reversed, the
  non-contiguous group fails 3 when the walk follows only the child pointer, and the element-match
  rule fails 10 when the ancestor check is dropped.
- **`resolveOptions-test.ts`** — every flag, and the errors for the values that are not usable.
- **`format-test.ts`** — the untrusted fence, including a node whose text tries to close it; the
  per-reason explanations and the command each one recovers into; the `--verify` diff.
- **`interactAsync-test.ts`** — the exit code for each outcome, the stable key set, and the two
  refusals told apart.
- **`e2e/__tests__/runtime-interact-test.ts`** — the published bin against a stub dev server whose
  inspector socket answers `Runtime.evaluate`. That responder is new in `e2e/utils.ts`
  (`inspectorEvaluate`) and is what makes a reading command testable at the process boundary at all.
- **A live run**, recorded below. It is not automated and is not a gate; it is what found the two
  things no fixture could.

## The live run, and the two things it changed

The three commands were run against a real app before this was written
[observed — `friction/run3/notesapp`, Expo SDK 57 / RN 0.86.2 / React 19.2.3, Expo Go on the iOS
26.5 simulator `C159CF99-9B06-4D2F-BFDC-010A107E2FBC`, dev server on 8230, 2026-08-26]. This is the
same app and the same runtime the spike used, so it is not independent evidence about React — it is
evidence about *these expressions*, which differ from the spike's in the ways above.

What held, exactly as recorded:

| | |
|---|---|
| `runtime:tree` | 492 fibers walked, 11 nodes kept on the notes screen, `focusedScreen: "notes"`, `screensSeen: ["index","explore","notes"]` — the two unfocused screens' elements are absent, which is the filter doing its job |
| `runtime:tree --testID add-note` | `matched: 1` from a 3-fiber group, `handlerOn: "Pressable"`, `handlerOutsideMatch: false` — the same numbers `out-04-match-groups.json` recorded |
| `runtime:type` then `runtime:tap --verify` | the typed string reached the app's state, the tap consumed it, and the second walk saw the input clear and the new row appear |
| the three refusals | `no-match` on a testID nothing carries, `no-handler` on `note-list` (the element `out-04` recorded with `handlerFound: null`), `no-handler` for a `runtime:type` aimed at the `add-note` button |
| `--all-screens` | 11 nodes on the focused screen, 29 across all three, and the extra ones include `home-notes-link` on the **unfocused** `index` screen — which is the finding [[0014-interaction-spike]] §What the walk sees is about, seen from the other side |
| the non-contiguous group | `runtime:tree --testID home-notes-link --all-screens` reported `groupSize: 6` and `handlerOn: "Text"`, over a subtree of `Link → ExpoLink → ExpoLinkImpl → BaseExpoRouterLink → Text → RCTText` — the two-level gap and the same numbers `out-04` recorded, this time from the shipped expression |

Two things it changed, both invisible to every test that existed at the time:

1. **`--verify` now walks the full projection**, per the section above. The interactive one missed
   the row the tap had appended.
2. **A testID goes onto a suggested command unquoted unless a shell would split it.** The messages
   print their suggestion inside a sentence that is itself quoted, so an unconditional
   `JSON.stringify` produced `run "npx exagent runtime:tree --testID "note-list"" for …` — three
   levels of quote around a string that needed none.

## What is still unverified

- **Any app but this one.** One app, one runtime, one navigator (native tabs), on one day. The
  `expo-router` `Link` group was read live and matched its recording; the gesture-handler families
  were exercised by the *spike's* expressions only, and are covered here by fibers rebuilt from
  those recordings.
- **A tap whose handler is on an ancestor.** `handlerOutsideMatch` was reported `false` every time
  live, because every element on this app has its own handler — the same thing the spike found.
- **`--index`.** No screen in the run had two elements sharing a testID, so the ambiguous path and
  the index that resolves it are unit-tested and never live.
- **The disabled refusal.** Same: the spike added a `disabled` button temporarily and reverted it,
  so what ran live here is the enabled case.
- **Android, and a production bundle.** Neither was reachable, and both are refusal paths.

The first friction run against a project this did not come from is what closes those, and is the
re-entry point for the `[experimental]` mark.
