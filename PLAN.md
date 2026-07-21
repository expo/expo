# Plan: React transition (`startTransition` / `useTransition`) support in Expo Router

> Stacked on `@ubax/eng-21996-change-the-state-in-expo-router-to-be-global` (the global-state
> refactor: reducer registry + root reducer + single committed store). This plan is the *technical*
> spec for the transitions branch. Execution follows the same per-step workflow as the base
> branch's meta-plan (detailed step note → 3-lens plan review → red/green TDD → 3-lens
> implementation review → commit `[step x] <one-line>`).

## Goal — what "transition support" means for users

1. **Plain React just works.** `startTransition(() => router.push('/slow'))` and
   `const [isPending, startTransition] = useTransition()` behave the way React promises:
   the current screen stays mounted and interactive, a navigation whose destination suspends
   (lazy bundle-split screen, `use(promise)`, suspending loader) does **not** flash the Suspense
   fallback, and `isPending` is `true` until the destination is ready and committed.
2. **React 19 async transitions work.** `startTransition(async () => { await mutate(); router.push(…) })`
   keeps transition semantics across the `await`.
3. **Every navigation is a transition.** The router wraps *all* rendered-state commits in
   `startTransition` itself — imperative (`router.push`/`back`/…), `Link` presses, deep links,
   and native-induced actions (back swipe / native dismiss, native tab presses, hardware back).
   A bare `router.push` never flashes a Suspense fallback; the previous screen stays up until the
   destination is ready. There is no non-transition navigation path.
4. **Router-level pending UX.** Because the router owns the transition, it exposes the pending
   state: a global "navigation in flight" hook, and a `Link`-scoped pending status
   (Next.js `useLinkStatus`-style) without the user wiring `useTransition` manually.

Why this branch enables it: the base branch collapsed dispatch to a single reduction point
(`dispatchRoot` → `rootReducer` → one `setState` on the committed store). Transition support is a
property of *how that one commit is delivered to React* — impossible to retrofit on the old
per-navigator `useOnAction` world, straightforward to layer on the new single-writer model.

## Current architecture (base branch) and the two blockers

State flow today:

```
router.push(href)
  → routingQueue.add(action)                    # module-global buffer
  → uSES notify → useImperativeApiEmitter       # ⚠ drains in a useEffect
  → navigationRef.dispatch → dispatchRoot
  → rootReducer(committed, action, registry)    # pure, splices only the changed path
  → shouldPreventRemove? (sync, dispatch-time)
  → setState(next) on the sync store            # single writer
  → useSyncExternalStore notify                 # ⚠ always renders synchronously
  → container + every navigator slice re-read
```

**Blocker 1 — every render read is `useSyncExternalStore`.** React renders uSES updates
synchronously and *de-opts any in-flight transition* when an external store mutates. Read sites on
this branch: `useSyncState` (container root state), `useStoreSlice` (per-navigator slice),
`useNavigationState`, `useIsFocused`, `useRouteInfo` (backs `usePathname` / `useSegments` /
`useLocalSearchParams` / `useGlobalSearchParams`), and `useImperativeApiEmitter` (queue). As long
as the tree consumes navigation state through uSES, wrapping `router.push` in `startTransition`
is a no-op by design of uSES.

**Blocker 2 — the imperative dispatch path is asynchronous.** `useImperativeApiEmitter` drains
`routingQueue` in a `useEffect`, one tick after `router.push` returns. `startTransition`'s scope
(sync, or async-context-tracked in React 19) is gone by the time `setState` runs, so even with
Blocker 1 fixed the update would not be marked as a transition.

Useful properties the base branch already gives us (don't break these):

- **Single-writer invariant**: only `dispatchRoot` writes the committed store; every dispatch
  reduces against the *latest committed* state, not the rendered one.
- **Slice identity**: `rootReducer` splices only along the acted-on path; `useNavigationBuilder`
  asserts the render projection is identity outside route-names reconciliation. This is what makes
  cheap bail-outs possible once state moves into React.
- **Dispatch-time semantics**: `shouldPreventRemove` / `beforeRemove` and `__unsafe_action__` run
  synchronously at dispatch, independent of when React renders the result.

## Design

### D1 — committed state lives in the global store; render delivery goes through React

Two ownership changes, one for each side of the "store is truth, render is projection" split:

**Committed state: one global owner, no ref indirection.** Today `store.state` reads the committed
state *through the navigation ref* (`navigationRef.getRootState()`), and the state itself lives in
the container's private `createStore` instance. That indirection goes away: the committed state
moves into the global-state store (`global-state/store.ts`), written there by `dispatchRoot` on
every `rootReducer` commit. Every imperative read — `store.state`, `getState`/`getRootState`,
next-dispatch base, `canGoBack`, action targeting, `getStateForHref` — reads that one field
directly. The ref's `getRootState()` becomes a thin compatibility wrapper over the same store
value, never the source. (The `storeRef.current.state` pre-mount seed field disappears too: the
store holds the seed from compile time and the committed state after, one field, no mount-time
handover.) Caveat to resolve in the flip step: `NavigationIndependentTree` currently gets
isolation from per-container stores — decide whether independent trees keep a container-local
store or are unsupported for global-state reads, and test whichever we pick.

**Render delivery: React state instead of uSES.** What changes for rendering:

- `BaseNavigationContainer` holds the rendered tree in React state:
  `const [renderedState, setRenderedState] = useState(seed)`.
- `dispatchRoot` writes the global store synchronously (single writer, unchanged), then calls
  `setRenderedState(next)` **inside a container-owned `startTransition`** in the same call stack.
  `dispatchRoot` is the single reduction point every source funnels through — the imperative API,
  `Link`/`navigation.dispatch`, mount-window replays, and native-event dispatches — so one wrap
  site makes *every* navigation a transition, uniformly. No per-callsite flags, no parallel API.
- The container owns the transition via `useTransition`, so its `isPending` is the global
  "navigation in flight" signal (D3). A caller's own `startTransition(() => router.push(…))`
  still composes: nesting transitions is well-defined, and the caller's `isPending` tracks their
  scope (D2 keeps the stack synchronous so their scope is preserved).
- Navigators stop subscribing to the store. `useStoreSlice` becomes a read of the rendered tree
  from context (`NavigationStateContext` already carries `state`) + the existing `getCachedSlice`
  keyed by rendered-tree identity. `useNavigationState` / `useIsFocused` follow the same
  conversion. Unchanged slices keep their identity (root reducer guarantees it), so navigator
  memo/bail-out behavior is preserved.

Consequences to design for, not around:

- **Store leads render during a pending transition.** `store.state` returns the already-reduced
  state while the old screen is still on screen. That is the *correct* reading for imperative
  consumers (a second dispatch must reduce against the latest state), and it is the same "store is
  truth, render is projection" model the base branch documents — it just becomes observable for
  longer windows. Audit every `store.state` consumer and classify: imperative/navigation logic →
  latest (store); UI/derived-display → rendered.
- **Rendered-tree consistency improves.** All consumers read one React-committed value per render
  — strictly stronger than N independent uSES snapshots (no inter-slice tearing).
- **Commit-time effects move with the transition.** `onStateChange`, the `'state'` emitter event,
  focus events, and `store.onStateChange` (which derives route info) all fire from effects and so
  fire when the *transition commits*. That is the desired timing for anything user-visible
  (pathname updates together with the screen), but it must be an explicit, tested decision —
  see D4.

**Alternatives considered.**
- *`useDeferredValue` layering* (container reads uSES, children render a deferred copy): gives
  automatic "keep old screen while new one suspends" for every navigation — superficially matching
  the everything-is-a-transition goal — but composes with neither `useTransition` (`isPending`
  never reflects navigation, neither ours nor the caller's) nor async actions, and offers no
  per-source urgency escape hatch (D5). Rejected as the mechanism; noted as a fallback if D1 hits
  an unfixable wall.
- *React concurrent-store API*: not shipped; nothing to build on today.

### D2 — remove the routing queue; dispatch is a plain synchronous call

`routingQueue` and `useImperativeApiEmitter` are **deleted**, not made synchronous. `router.push`
et al. resolve their action (`getNavigateAction`) and call the container's `dispatch` directly, in
the caller's own call stack. This:

- preserves the sync `startTransition` scope for `startTransition(() => router.push(…))` and
  React 19 async-transition tracking for `startTransition(async () => { …; router.push(…) })`;
- deletes a full effect-tick of latency and one uSES read site from every imperative navigation;
- removes a whole class of "action silently dropped because the ref was null" bugs the queue's
  `run()` carries today.

What replaces the queue's one real job (buffering actions dispatched before the container is
ready): nothing, deliberately. An imperative navigation before the root layout has mounted is
already an error (`store.assertIsReady` throws with the "Attempted to navigate before mounting
the Root Layout" message); direct dispatch makes that the uniform behavior. Dispatches from
*descendant mount effects* during the registration window are not the queue's job and keep
working — `dispatchRoot`'s `pendingReplayRef` mount-window replay handles them, unchanged. The
characterization step must sweep for any remaining legitimate pre-ready caller (tests, deep-link
race on cold start); if one exists it moves onto the replay mechanism, not a resurrected queue.

`Link` presses and `useLinkTo`-style dispatches already go through `navigationRef.dispatch`
synchronously; verify and add coverage rather than change.

### D3 — API surface

- **Transitions are the default and only mode** — the router wraps every commit (D1), so there is
  no `transition` flag anywhere: not on `Link`, not on `router.push` options. Callers can still
  layer their own `startTransition`/`useTransition` for scoped `isPending`; it composes with the
  router's wrap.
- **`useNavigationTransitionPending()`** (name TBD): global pending signal from the container's
  `useTransition`, exposed via context. This is the primitive everything else derives from.
- **`useLinkStatus()`**: `Link`-scoped `{ pending: boolean }` for pending indicators. Derived by
  combining the global pending signal with "this Link initiated the in-flight navigation"
  (per-Link `useTransition` wrapping the dispatch gives this for free and stays correct under
  interruption).

### D5 — native-induced actions are transitions too

All native-originated navigation reaches `dispatchRoot` as dispatched actions (native-stack
`onDismissed`/swipe-back and header-back events, native tabs' tab-press → `JUMP_TO`, Android
hardware back → `GO_BACK`, deep links → linking dispatch), so the D1 wrap covers them with no
per-source work. The design question is not *where* to wrap but *reconciliation urgency*: for a
native-driven gesture the native side has **already committed visually** — the JS dispatch is a
reconciliation of an accomplished fact, and a transition may delay that JS commit.

- Delaying the *outgoing* screen's JS unmount is harmless (its native view is already gone or
  animating away; the JS tree lingering briefly is invisible).
- The danger is code that requires the JS commit to land before the next native frame to avoid
  visual artifacts — e.g. react-native-screens re-showing a natively-dismissed screen because the
  JS state still contains it, or freeze re-freezing mid-gesture. The store commits synchronously
  (unchanged), so anything reading committed state is fine; only *rendered-tree*-driven native
  props are at risk.
- The spike (Step 3) must characterize: native swipe-back with a suspending remaining screen; native tab press
  where the target tab's JS suspends; rapid gesture + imperative interleaving. If a specific
  reconciliation proves gesture-critical, the escape hatch is marking *that dispatch* urgent
  (plain `setState`, no transition) — an internal, per-action-source decision, not user API. The
  default remains: everything is a transition unless the spike proves a specific source cannot be.

### D4 — route-info hooks and timing

`usePathname`/`useSegments`/params hooks read the module-level route-info cache, which is updated
from `store.onStateChange` — already effect-timed, so after D1 it lands at transition commit and
stays consistent with the visible tree. Work here is **audit + tests, not a rewrite**: pin with
tests that during a pending transition the hooks keep reporting the *current* (old) route, and
that imperative `store.getRouteInfo()` consumers that feed navigation logic (e.g.
`resolveHrefStringWithSegments` relative-href resolution) use the value consistent with the state
they reduce against — relative navigation during a pending transition must resolve against the
committed store, not the stale render. Fix discrepancies found, per-consumer.

## Risks / open questions (resolve during the Step 3 spike)

1. **react-native-screens + react-freeze — decided: freeze is disabled for all screens.**
   Inactive screens frozen via Suspense can starve a transition (freeze holds the suspension →
   transition never commits → `isPending` forever), so expo-router forces `freezeOnBlur: false`
   on every screen it renders — native-stack, JS stack, bottom-tabs, drawer, `ui` TabSlot —
   overriding both the screen option and the app-level `enableFreeze()` default. Residual risk to
   measure in the characterization step: blurred screens now re-render on state changes freeze
   used to absorb; the slice-identity bail-outs (risk 3) are what keeps that cheap.
2. **Test environment.** Jest + `@testing-library/react-native` + React 19 concurrent semantics:
   confirm `startTransition` + Suspense behave realistically under `renderRouter` (act batching
   can mask pending windows). May need `jest.useFakeTimers` patterns or async `act` helpers; the
   testing recipe is a Step 3 (spike) deliverable since the flip and everything after depend on it.
3. **Render-count regressions.** Losing uSES per-slice snapshot bail-outs in favor of context
   propagation re-renders the navigator layer on every commit. Slice identity + existing memo
   boundaries should keep screen subtrees quiet; the base branch's render-count tests
   (e.g. native tabs) are the tripwire. Budget: no regression in committed render counts per
   navigation (a transition may add scheduler passes, but committed renders must not grow).
4. **Multiple dispatches during one pending transition.** Store reduces each immediately
   (single writer), React entangles the transition renders; last committed render reflects the
   final store state. Needs explicit interruption tests (navigate-while-pending, back-while-pending).
5. **`NavigationIndependentTree` / nested containers** each own a store + registry; conversion must
   stay per-container (no module-global React state).
6. **SSR / static rendering / RSC.** `useState`-delivered state must not change hydration output;
   `getSeedState` path is render-time identical. Verify `rsc/web` projects and static rendering
   snapshots.
7. **DevTools & `__unsafe_action__`** stay dispatch-timed while `onStateChange` is commit-timed —
   during a pending transition the two visibly diverge. Document; confirm devtools tolerate it.
8. **Everything-is-a-transition is a behavior change for existing apps.** Suspense fallbacks that
   used to flash on push now never show during navigation (the old screen stays instead);
   loading UX built on fallbacks must move to pending indicators. Tests (ours and users') that
   assume a synchronous rendered commit after `router.push` rely on `act`/scheduler flushing —
   audit `testing-library` helpers so `renderRouter`-based tests keep passing without every user
   sprinkling manual flushes. Needs a CHANGELOG/migration note.
9. **Native reconciliation urgency** (see D5): a native-driven dispatch whose transition commit is
   delayed by an unrelated suspension must not cause react-native-screens to resurrect a dismissed
   screen or stall a gesture. Spike deliverable; per-source urgent escape hatch is the mitigation.

## Steps

Order: 1 → 2 → 3 (spike) → 4 → 5 (atomic core) → 6 → 7 → 8 → 9. Each step keeps the full suite
green; Step 5 is the only one allowed to be atomic-across-one-commit (uSES removal + context
reads + transition wrap flip together).

### Step 1 — Delete the routing queue (D2)
Remove `routingQueue` and `useImperativeApiEmitter`. `router.push`/`navigate`/`back`/… resolve
their action and call the container's `dispatch` directly, synchronously, in the caller's stack.
Pre-ready imperative navigation uniformly throws via `store.assertIsReady` (it is an error today
on most paths already); mount-window dispatches keep working through `pendingReplayRef`.
Red: `router.push` inside an event handler commits state in the same task (no effect tick);
pre-ready `router.push` throws the root-layout error; mount-window replay tests stay green.
Files: `global-state/routingQueue.ts` (deleted), `global-state/router.ts`, `imperative-api.tsx`,
`fork/NavigationContainer.tsx`.

### Step 2 — Committed state moves into the global store; rendered tree into React state (D1)
Two halves of the same ownership change, behavior-neutral (no transition wrap yet):
(a) the committed state becomes a field on the global-state store, written by `dispatchRoot` on
every commit; `store.state` reads it directly, `navigationRef.getRootState()` becomes a wrapper
over it, and the pre-mount seed handover disappears (one field from seed to commit);
(b) `BaseNavigationContainer` holds the rendered tree in `useState`; `dispatchRoot` writes the
store, then `setRenderedState`. `useSyncState` dissolves (store factory goes to `store.ts`;
`scheduleUpdate`/`flushUpdates` stay in the container). uSES read sites still subscribe to the
store, which still notifies, so nothing observable changes yet.
Red: commit ordering, replay/mount-window behavior, `onStateChange` timing, `store.state` identical
before/during/after mount.
Files: `global-state/store.ts`, `react-navigation/core/BaseNavigationContainer.tsx`,
`react-navigation/core/useSyncState.tsx` (deleted or absorbed).

### Step 3 — Spike + characterization tests
With the plumbing from Steps 1–2 in place, pin down reality before the flip. Deliverables:
(a) a `router-e2e` playground app with a lazy/suspending screen; (b) failing-or-documenting tests
that pin current behavior (uSES still de-opts: `startTransition(() => router.push)` swaps screens
synchronously / shows fallback); (c) the concurrent-testing recipe (risk 2); (d) native-event
reconciliation under delayed JS commits characterized on the simulator — swipe-back, native tab
press, hardware back (D5, risk 9); (e) a sweep for any legitimate pre-Step-1 pre-ready caller that
the queue removal orphaned (D2); (f) written answers to risks 4–8 unknowns. No production code
changes beyond the playground app.

### Step 4 — Disable freeze for all screens (risk 1)
Force `freezeOnBlur: false` on every screen expo-router renders — native-stack, JS stack,
bottom-tabs, drawer, `ui` TabSlot — overriding the per-screen option and the app-level
`enableFreeze()` default, so no frozen subtree can starve a pending transition.
Red: screens render with freeze disabled even when `enableFreeze()` was called / the option is set;
blurred-screen render-count baseline recorded for risk 3.
Files: `fork/native-stack/`, `react-navigation/{bottom-tabs,drawer,stack}/views/`, `ui/TabSlot.tsx`,
`layouts/StackClient.tsx`.

### Step 5 — The flip: navigators read React state, and every commit is a transition (atomic core)
In plain English: today, every navigator independently subscribes to the store and re-reads its
slice whenever anything changes — that subscription (`useSyncExternalStore`) is exactly what
forces React to render navigation synchronously and ignore transitions. After this step, only the
container knows when state changes. It puts the new tree into React state inside
`startTransition`, and every navigator simply reads the tree its parent passed down through
context (`NavigationStateContext`), picking out its own slice with the existing `getCachedSlice`.
Nothing subscribes to the store for rendering anymore.

The payoff, and why both halves land in one commit: once the reads come from React state *and* the
write is wrapped in the container's `useTransition`, React can prepare the next screen in the
background — the old screen stays mounted and interactive, no Suspense fallback flashes, and this
applies to **every** navigation (imperative, Link, replay, native-event) because they all funnel
through `dispatchRoot`. Landing only one half either changes nothing (wrap without reads: uSES
still de-opts) or tears (reads without wrap is fine, but then the step isn't the flip).

Converted read sites: `useStoreSlice`, `useNavigationState`, `useIsFocused`, the
`useNavigationBuilder` projection. The store's render-notify subscription path is removed; the
identity assertions stay.
Red: (from Step 3, polarity flipped) bare `router.push` to a suspending screen keeps the previous
screen mounted with no fallback flash; container `isPending` lifecycle; native-event dispatch
reconciliation tests (risk 9, as far as jest can pin them); render-count budget tests (risk 3).
Files: `react-navigation/core/useStoreSlice.tsx`, `useNavigationState.tsx`, `useIsFocused.tsx`,
`core/useNavigationBuilder.tsx`, `core/BaseNavigationContainer.tsx`, `global-state/storeContext.ts`.

### Step 6 — Decide what every state reader means during a pending navigation (D4)
In plain English: once navigations are transitions, there are two truthful answers to "what is the
current route" — the **latest** state (the store, already reduced, possibly ahead of the screen)
and the **rendered** state (what the user is actually looking at). Today the codebase never had to
distinguish them because they were never apart for longer than a tick. This step walks through
every place that reads state and makes the choice explicit, with a test per reader:

- Hooks that components render with — `usePathname`, `useSegments`, `useLocalSearchParams`,
  `useGlobalSearchParams`, sitemap — must describe the **rendered** screen. While a navigation is
  pending, they keep reporting the old route, then update together with the screen when the
  transition commits. (Their update path is already effect-timed, so this is mostly *verifying*,
  not rewriting.)
- Functions that feed the *next* navigation — relative-href resolution
  (`resolveHrefStringWithSegments`), action targeting, `canGoBack`, `getStateForHref` — must use
  the **latest** store state, because a second dispatch has to build on what the first one already
  did, even if it hasn't rendered yet.
- Anything found reading the wrong side (or reading the store mid-render, which would tear) gets
  fixed and pinned with a test.
Files: `global-state/store.ts`, `global-state/router.ts`, `global-state/useRouteInfo.ts`,
`hooks/*` — audit-driven.

### Step 7 — Transition semantics test pass
End-to-end unit coverage of the headline behaviors: bare `router.push` (router-owned transition),
caller `startTransition` composition and caller `isPending`, async transition (React 19 action),
interruption (second navigation while pending; back while pending; native event while pending),
`beforeRemove`/protected routes during pending transitions, StrictMode,
`NavigationIndependentTree`, `testing-library` ergonomics (risk 8). Mostly tests; fix what
they catch.

### Step 8 — Pending-state API: `useNavigationTransitionPending` + `useLinkStatus` (D3)
Expose the container's `isPending` via context behind `useNavigationTransitionPending()` (final
name decided here); `useLinkStatus()` exposes `{ pending }` via context from the nearest Link,
backed by a per-Link `useTransition`. Red-first per hook; RSC tests for the new exports.
Files: `link/Link.tsx`, `link/useLinkStatus.tsx` (new), `hooks/`, `exports.ts`.

### Step 9 — Verification, docs, changelog
`et check-packages expo-router`; manual verification in `apps/router-e2e` on iOS simulator + web
(lazy screen via push, swipe-back and native tab press with suspending targets, pending
indicators); docs: new guide section (transitions with Expo Router — including the fallback →
pending-indicator behavior change) + API reference (`useNavigationTransitionPending`,
`useLinkStatus`) via `et generate-docs-api-data --packageName expo-router`; CHANGELOG entry with
migration note (risk 8).

## Non-goals

- `useOptimistic`-based optimistic navigation state (natural follow-up once this lands).
- Driving/altering native gesture *animations* from JS — native owns the visual gesture; this
  branch only changes how the resulting JS state commit is scheduled.
- Any change to reducer/registry semantics from the base branch.
