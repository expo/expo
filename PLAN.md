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
3. **Router-level pending UX.** A `Link` can render a pending indicator while its navigation
   transition is in flight (Next.js `useLinkStatus`-style), without the user wiring
   `useTransition` manually.
4. **Non-transition navigation is unchanged.** A bare `router.push` outside any transition keeps
   today's synchronous-commit behavior (fallbacks show, nothing gets delayed).

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

### D1 — deliver rendered state through React, keep the store as imperative truth

The committed sync store **stays** the single source of truth for every imperative read
(`getState`, `getRootState`, `store.state`, next-dispatch base, `canGoBack`, action targeting).
What changes is the *render* delivery:

- `BaseNavigationContainer` holds the rendered tree in React state:
  `const [renderedState, setRenderedState] = useState(seed)`.
- `dispatchRoot` keeps writing the store synchronously (single writer, unchanged), then calls
  `setRenderedState(next)` in the same call stack. Because it is now a plain React state update
  made inside the caller's `startTransition` scope (D2 makes the stack synchronous), React itself
  classifies it as urgent or transition — **no expo-router transition flag, no parallel API**.
- Navigators stop subscribing to the store. `useStoreSlice` becomes a read of the rendered tree
  from context (`NavigationStateContext` already carries `state`) + the existing `getCachedSlice`
  keyed by rendered-tree identity. `useNavigationState` / `useIsFocused` follow the same
  conversion. Unchanged slices keep their identity (root reducer guarantees it), so navigator
  memo/bail-out behavior is preserved.

Consequences to design for, not around:

- **Store leads render during a pending transition.** `navigationRef.getRootState()` returns the
  already-reduced state while the old screen is still on screen. That is the *correct* reading for
  imperative consumers (a second dispatch must reduce against the latest state), and it is the
  same "store is truth, render is projection" model the base branch documents — it just becomes
  observable for longer windows. Audit every `getRootState`/`store.state` consumer and classify:
  imperative/navigation logic → latest (store); UI/derived-display → rendered.
- **Rendered-tree consistency improves.** All consumers read one React-committed value per render
  — strictly stronger than N independent uSES snapshots (no inter-slice tearing).
- **Commit-time effects move with the transition.** `onStateChange`, the `'state'` emitter event,
  focus events, and `store.onStateChange` (which derives route info) all fire from effects and so
  fire when the *transition commits*. That is the desired timing for anything user-visible
  (pathname updates together with the screen), but it must be an explicit, tested decision —
  see D4.

**Alternatives considered.**
- *`useDeferredValue` layering* (container reads uSES, children render a deferred copy): gives
  automatic "keep old screen while new one suspends" for every navigation, but composes with
  neither `useTransition` (`isPending` never reflects navigation) nor async actions, and makes
  transition behavior mandatory rather than opt-in. Rejected as the mechanism; noted as a
  fallback if D1 hits an unfixable wall.
- *React concurrent-store API*: not shipped; nothing to build on today.

### D2 — make the dispatch path synchronous

`routingQueue.add` drains immediately (calls `run(ref)`) when the container ref is attached and
ready; the queue keeps buffering only for the pre-ready window (actions before mount, exactly its
original job). `useImperativeApiEmitter` reduces to draining the buffered backlog once on
ready. This preserves:

- the sync `startTransition` scope for `startTransition(() => router.push(…))`;
- React 19 async-transition tracking for `startTransition(async () => { …; router.push(…) })`;
- and it deletes a full effect-tick of latency from every imperative navigation — independently
  valuable and landable first.

`Link` presses and `useLinkTo`-style dispatches already go through `navigationRef.dispatch`
synchronously; verify and add coverage rather than change.

### D3 — API surface (deliberately minimal)

- **Headline: no new API for the core capability.** `useTransition` / `startTransition` from React
  are the API. Expo Router's job is to stop defeating them.
- **`Link` pending status**: `useLinkStatus()` hook (usable in components rendered inside a
  `Link`) returning `{ pending: boolean }`, backed by a per-Link `useTransition` that wraps the
  navigation when — and only when — the link opts in: `<Link transition …>`. Default stays
  non-transition (native-stack behavior unchanged for existing apps).
- **`router.push(href, { transition… })`? Not in v1.** Callers who want a transition wrap the call
  themselves; an options flag would duplicate React's primitive and needs an answer for "whose
  isPending is it". Revisit only if Link-level + raw React proves insufficient.
- Explicitly out of scope: automatic wrapping of *all* navigations in transitions (Next.js model).
  Native-stack apps rely on commit-now semantics; flipping the default is a separate,
  later conversation.

### D4 — route-info hooks and timing

`usePathname`/`useSegments`/params hooks read the module-level route-info cache, which is updated
from `store.onStateChange` — already effect-timed, so after D1 it lands at transition commit and
stays consistent with the visible tree. Work here is **audit + tests, not a rewrite**: pin with
tests that during a pending transition the hooks keep reporting the *current* (old) route, and
that imperative `store.getRouteInfo()` consumers that feed navigation logic (e.g.
`resolveHrefStringWithSegments` relative-href resolution) use the value consistent with the state
they reduce against — relative navigation during a pending transition must resolve against the
committed store, not the stale render. Fix discrepancies found, per-consumer.

## Risks / open questions (resolve during Step 0 spike)

1. **react-native-screens + react-freeze.** Inactive screens are frozen via Suspense. A transition
   whose render lands in a frozen subtree can be starved (freeze holds the suspension → transition
   never commits → `isPending` forever). Must be characterized in the spike; likely mitigations:
   scope freeze interaction, or ensure transition renders only unfrozen targets (new screens are
   not yet frozen — probably fine, but *prove* it).
2. **Test environment.** Jest + `@testing-library/react-native` + React 19 concurrent semantics:
   confirm `startTransition` + Suspense behave realistically under `renderRouter` (act batching
   can mask pending windows). May need `jest.useFakeTimers` patterns or async `act` helpers; the
   testing recipe is a Step 0 deliverable since every later step's red tests depend on it.
3. **Render-count regressions.** Losing uSES per-slice snapshot bail-outs in favor of context
   propagation re-renders the navigator layer on every commit. Slice identity + existing memo
   boundaries should keep screen subtrees quiet; the base branch's render-count tests
   (e.g. native tabs) are the tripwire. Budget: no regression in committed render counts for
   non-transition navigations.
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

## Steps

Order: 0 → 1 → 2 → 3 (atomic core) → 4 → 5 → 6 → 7. Each step keeps the full suite green;
Step 3 is the only one allowed to be atomic-across-one-commit (uSES removal + context reads flip
together).

### Step 0 — Spike + characterization tests
Deliverables: (a) a `router-e2e` playground app with a lazy/suspending screen; (b) failing-or-
documenting tests that pin today's behavior (transition de-opt: `startTransition(() => router.push)`
still swaps screens synchronously / shows fallback); (c) the concurrent-testing recipe (risk 2);
(d) react-freeze interplay characterized (risk 1); (e) written answers to risks 4–7 unknowns.
No production code changes.

### Step 1 — Synchronous queue drain (D2)
`routingQueue.add` drains immediately when a ready ref is attached; `useImperativeApiEmitter`
drains only the pre-ready backlog. Red: a test asserting `router.push` inside an event handler
commits state in the same task (no effect tick); existing before-mount buffering tests stay green.
Files: `global-state/routingQueue.ts`, `imperative-api.tsx`, `fork/NavigationContainer.tsx`.

### Step 2 — Rendered state moves into React state (D1, container half)
`BaseNavigationContainer`: `useState` for the rendered tree; `dispatchRoot` writes store then
`setRenderedState`. `useSyncState` shrinks to the store factory + `scheduleUpdate`/`flushUpdates`
(or inlines into the container). uSES stays temporarily in `useStoreSlice` etc. — they still
subscribe to the store, which still notifies, so behavior is unchanged (transition still de-opts;
that's expected until Step 3).
Red: container renders from React state (assert commit ordering, replay/mount-window behavior,
`onStateChange` timing unchanged for sync navigations).
Files: `react-navigation/core/BaseNavigationContainer.tsx`, `react-navigation/core/useSyncState.tsx`.

### Step 3 — Slice reads flip to rendered context (atomic core)
`useStoreSlice` → read `NavigationStateContext` state + `getCachedSlice`; convert
`useNavigationState`, `useIsFocused`; store's render-notify subscribers become unused → remove the
render subscription path (store keeps `subscribe` only if non-render consumers need it, e.g. the
pre-ready queue). Keep the identity assertions. This is the moment transitions start actually
deferring — the Step 0 characterization tests flip polarity here.
Red: (from Step 0) transition keeps previous screen mounted, no fallback flash, `isPending`
lifecycle; render-count budget tests (risk 3).
Files: `react-navigation/core/useStoreSlice.tsx`, `useNavigationState.tsx`, `useIsFocused.tsx`,
`core/useNavigationBuilder.tsx` (projection read), `global-state/storeContext.ts`.

### Step 4 — Route-info + imperative-read audit (D4)
Classify every `store.state` / `getRootState` / `getRouteInfo` consumer (rendered vs latest);
tests: pathname hooks report old route during pending transition; relative href resolution during
pending transition reduces against the committed store; sitemap/devtools unaffected.
Files: `global-state/store.ts`, `global-state/router.ts`, `hooks/*`, audit-driven.

### Step 5 — Transition semantics test pass
End-to-end unit coverage of the headline behaviors: sync `startTransition`, `useTransition`
`isPending`, async transition (React 19 action), interruption (second navigation while pending;
back while pending), `beforeRemove`/protected routes during pending transitions, StrictMode,
`NavigationIndependentTree`. Mostly tests; fix what they catch.

### Step 6 — `Link` transition opt-in + `useLinkStatus` (D3)
`<Link transition>` wraps its dispatch in an internal `useTransition`; `useLinkStatus()` exposes
`{ pending }` via context from the nearest Link. Red-first per component; RSC tests for the new
export.
Files: `link/Link.tsx`, `link/useLinkStatus.tsx` (new), `exports.ts`.

### Step 7 — Verification, docs, changelog
`et check-packages expo-router`; manual verification in `apps/router-e2e` on iOS simulator + web
(lazy screen with/without transition; pending indicator); docs: new guide section
(transitions with Expo Router) + API reference (`useLinkStatus`, `Link` prop) via
`et generate-docs-api-data --packageName expo-router`; CHANGELOG entry.

## Non-goals

- Changing the default: bare `router.push` stays synchronous-commit.
- `useOptimistic`-based optimistic navigation state (natural follow-up once this lands).
- Wrapping native-driven gestures (back swipe) in transitions — native owns those commits.
- Any change to reducer/registry semantics from the base branch.
