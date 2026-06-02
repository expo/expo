# Plan: Remove `useSyncExternalStore`, move to a single global navigation state

**Status:** v3 — revised after a second (fresh) round of React-core and React-Navigation reviews
**Author:** Claude

> **v2 (first review round).** Both reviewers independently concluded: the *storage* change
> (root `useReducer` + plain context, ripping `useSyncState`) is sound; the *resolution* change
> (a "smart" reducer that walks the tree via a router **registry** and re-implements bubbling)
> is **unsound** and was removed. Net: **the reducer is dumb**; bubbling/focus-cascade/
> `beforeRemove` stay in `useOnAction`/`useOnRouteFocus`. (Rejected smart-reducer design: §7.)
>
> **v3 (second, fresh review round — both returned NO-GO-as-written, GO after these edits).**
> The decisive correction: **`setState` is NOT a per-navigator slice write.** It is a recursive
> parent-rebuild via `SceneView.setCurrentState` up to the single root `useSyncState`, and the
> focus cascade (`useOnAction` → `onRouteFocusParent` → `useOnRouteFocus`, recursively up) is
> **synchronous and data-dependent**: each ancestor's `getStateForRouteFocus` calls `getState()`
> and must observe the previous step's write. So "coalesce leaf + ancestor *slices* into one
> `COMMIT_SLICES`" was the wrong primitive. v3 fixes this — see §2 "Dispatch model (v3)" and
> §6a. The reducer now has **two** primitives: `REPLACE_ROOT` (imperative nav, buffered) and
> `COMMIT_SLICES` (render-phase/bootstrap merge).
**Scope decisions (confirmed with requester):**

- **Depth:** Full — rip react-navigation's per-navigator `useSyncState` store; hold the
  *entire* nested navigation state in a single root React reducer.
- **Navigators that must work:** **Stack** (native-stack) and **NativeTabs** only.
  Drawer, JS Tabs, JS Top Tabs, headless UI tabs, and web Stack may temporarily break.
- **Quality bar:** Spike / proof-of-concept. We may rip aggressively and leave some tests
  red, as long as the architecture is clean and the two target navigators work end-to-end.
- **Imperative model:** Root `useReducer` is the single source of truth. The module-level
  `router` object dispatches actions; a root effect drains them into the reducer's dispatch.
  Out-of-render calls are flushed into React's cycle (concurrent-safe). All mutation is via
  dispatched actions / setters exposed from the global store.

---

## 1. Why (motivation)

Today expo-router has **three** layers of `useSyncExternalStore` (20 call sites):

1. **Expo Router's own store** — `routeInfoSubscribe` + `store.getRouteInfo`
   (`useRouteInfo.ts`) drives `usePathname` / `useSegments` / `useGlobalSearchParams`;
   `routingQueue` drives the imperative emitter (`imperative-api.tsx`); plus the loader cache.
2. **Vendored react-navigation core** — `useSyncState.tsx` is the canonical store for *every*
   navigator. `BaseNavigationContainer` owns the root store; each `useNavigationBuilder` owns
   a slice threaded through `NavigationStateContext`, with updates bubbling up via `setState`
   + `scheduleUpdate`/`flushUpdates`.
3. **Auxiliary** — `useNavigationState`, `useIsFocused`, `useFrameSize`, and the custom
   `useSyncExternalStoreWithSelector`.

`useSyncExternalStore` is a *concurrent-mode escape hatch*: it bypasses React's render-cycle
state and forces synchronous external reads. As long as navigation state lives in an external
mutable store mirrored into React via `uSES`, React's concurrent features (transitions,
`useDeferredValue`, Suspense-driven navigation) cannot govern navigation transitions —
they see state that already changed underneath them. A prior attempt to wrap the *existing*
`useSyncState` in `useTransition`/`useDeferredValue` produced infinite loops
(documented internally: *"defer content not structure"*).

**The fix is to make navigation state ordinary React state** (`useReducer` at the root) that
flows down purely through context, so the reconciler owns transitions. This is the *first
step* — it does not itself introduce concurrent features, but it removes the store-sync that
blocks them.

## 2. Target architecture (v2 — dumb reducer)

```
                 NavigationStoreProvider  (root, in BaseNavigationContainer)
                 ┌────────────────────────────────────────┐
                 │  const [tree, dispatch] =               │
                 │      useReducer(navReducer, SEED(init)) │  ← single source of truth
                 │  // dispatch is published to the        │
                 │  // routing-queue drain effect, NOT     │
                 │  // called directly by module code      │
                 │  <RootTreeContext value={tree}>         │
                 └────────────────────────────────────────┘
                                  │  (plain React context — NO uSES)
   each navigator: reads ITS slice from a per-navigator SliceContext (React.memo'd),
   re-provides its children's slice downward (structural sharing keeps untouched subtrees ===)
        ┌─────────────────────────┼─────────────────────────┐
   Stack navigator           NativeTabs navigator        (others: may break)
   useNavigationBuilder      useNavigationBuilder
   reads slice / renders     reads slice / renders
   ScreenStackItem           RNS Tabs.Host
        │                         │
        │  navigation.dispatch(action)
        ▼                         ▼
   useOnAction (UNCHANGED): bubble up→down, first router whose
   getStateForAction returns non-null wins; run beforeRemove gate;
   run getStateForRouteFocus up the ancestor chain.
        │  collect leaf slice + every ancestor-focus slice
        ▼
   dispatch(COMMIT_SLICES([{key, slice}, ...]))   ← ONE atomic commit per logical navigation
        │
        ▼
   navReducer: pure structural replace of each {key→slice} in the tree. No router. No registry.
```

### Dispatch model (v3) — the load-bearing detail

How `setState` *actually* works today (verified by both reviewers, see `SceneView.tsx:62-85`,
`BaseNavigationContainer.tsx:105`, `useSyncState.tsx:27-34`):

- There is **no per-navigator slice store.** A navigator's `setState` resolves through
  `NavigationStateContext` to `SceneView.setCurrentState`, which reads the *parent's* `getState()`,
  splices its child slice into `parent.routes`, and calls the *parent's* `setState` — recursing
  to the root's single `useSyncState.setState`. So **every** `setState(result)` already produces a
  **full rebuilt root tree**.
- `useSyncState.setState` mutates the in-memory `state` **synchronously** (even while
  `batchUpdates` is suppressing *notifications*). The focus cascade reads-its-own-writes via
  `getState()` between steps. Atomicity = `batchUpdates` collapsing N synchronous full-tree
  writes in one handler into **one** subscriber notification → one render.

Therefore v3 replaces the **notification layer** of `useSyncState`, not the synchronous tree:

- **`liveTreeRef` (root).** A mutable ref holding the current full tree. The recursive
  `getState`/`setState` chain is kept intact; the root `setState` writes `liveTreeRef.current`
  **synchronously** (so the focus cascade and queued actions still read-their-own-writes), then
  schedules a flush.
- **`getState()` reads `liveTreeRef`, NOT committed context.** This is mandatory: if `getState`
  read `RootTreeContext` (committed React state), mid-cascade ancestor focus would compute against
  stale indices → wrong Stack/NativeTabs focus.
- **Flush = one dispatch per JS task, on a synchronous boundary (NOT a deferred microtask).**
  The scheduled flush calls `dispatch(REPLACE_ROOT(liveTreeRef.current))` exactly once, publishing
  the fully-cascaded tree into React. **Required boundary (review GO-condition):** imperative-nav
  flush dispatches synchronously at the end of `routingQueue.run` (the drain effect), inside
  React's batching scope — never `queueMicrotask`/`Promise.then`, which would let code reading
  navigation state synchronously after `router.push()` in the same handler observe a pre-flush
  committed tree. Render-phase flush stays on `useLayoutEffect` (`useClientLayoutEffect`), not
  `useEffect`/microtask, to preserve the commit-phase timing native-stack/RNS depends on. This
  *is* `batchUpdates`, re-expressed as a single reducer dispatch. One logical navigation (leaf
  write + every ancestor-focus write) → one `REPLACE_ROOT` → one render → one native diff.
- **`liveTreeRef` intentionally leads `RootTreeContext`.** Between the synchronous cascade write
  and the committed `REPLACE_ROOT` render, navigation `getState()` (live ref) sees the new tree
  while `usePathname`/route-info (context) still sees the old — identical to today's
  live-`state`-vs-unnotified-`uSES` window, so not a regression. No render path may assume the two
  reads are in sync.

### `navReducer(tree, action)` — DUMB and pure. Two primitives + seed/reset:

- `SEED(partialTree)` — initial value only (partial, URL-derived).
- **`REPLACE_ROOT(fullTree)`** — wholesale publish of `liveTreeRef.current`. **The imperative-
  navigation path.** No per-key work; the buffered tree already contains leaf + ancestor changes.
- **`COMMIT_SLICES([{ key, slice }])`** — structurally replace each addressed slice in dispatch
  order, sharing untouched branches (incl. `preloadedRoutes` entries) by reference. **The
  render-phase / bootstrap path** (route-name change, `getRehydratedState`, lazy tab fill,
  Protected toggles) where several navigators write in one commit and need an order-preserving
  by-key merge. Tolerates a `key` whose child slot was never seeded (lazy mount).
- `RESET(tree)` — resetRoot.

It contains **no routing logic, no router registry, no `getStateForAction`, no bubbling.**

- **Resolution stays in components (unchanged):** `useOnAction` runs the bubbling protocol with
  the live router + `routerConfigOptions` ref + `beforeRemove` listeners + emitter;
  `useOnRouteFocus` runs the ancestor focus cascade. The *only* change is the **root** `setState`:
  instead of `useSyncState.setState` + `uSES` notification, it writes `liveTreeRef` synchronously
  and schedules the single `REPLACE_ROOT` flush.
- **Per-navigator slice context.** Root provides the whole tree; each navigator computes its
  child's slice and re-provides it via the existing `NavigationStateContext` shape. Combined with
  `React.memo` on navigator content + structural sharing, this approximates the old
  selector-scoped re-render granularity. Residual: the spine from root → active leaf re-executes
  on every navigation (inherent to context; acceptable for the Stack+NativeTabs spike, documented).
- **Imperative bridge (unchanged shape).** `router.push/replace/navigate/back/preload` keep
  calling `routingQueue.add(...)` (a plain array). A root effect drains the queue and calls the
  reducer `dispatch`. This indirection is load-bearing: it is safe before mount (actions buffer),
  during render (deferred to commit), and under StrictMode (queue identity reset is idempotent).
  The queue's change-notification is converted from `uSES` to a `useState` tick so no `uSES`
  remains.

### What we explicitly keep (verbatim)

- All router logic: `StackRouter`, `TabRouter`, `NativeBottomTabsRouter`, the per-instance
  `stackRouterOverride` (`preloadedRoutes` / `PRELOAD` / zoom / singular). Changing *where the
  result lands*, never the routing math.
- The bubbling protocol in `useOnAction` (parent-first → child-fallback, `action.target`,
  `shouldActionChangeFocus`, visited-set), `beforeRemove`/`preventRemove`, the focus cascade in
  `useOnRouteFocus`, `onDispatchAction`/`__unsafe_action__` emission.
- The `stateRef` mid-render `getState()`/`canGoBack()` workaround in `useNavigationHelpers` /
  `useNavigationBuilder` — context gives the *committed* slice, but a navigator may compute a
  newer not-yet-committed `nextState` in the same render; `getState()` must return that. **And at
  the root, `getState()` reads `liveTreeRef` (synchronous, read-your-writes), never committed
  context** — required for the focus cascade to compute against fresh indices.
- Lazy per-navigator bootstrap, `getRehydratedState`, and `getStateForRouteNamesChange`
  (conditional/Protected screens) — they stay in `useNavigationBuilder` and feed the tree via
  `COMMIT_SLICES` on first render. The reducer tolerates slices it never seeded being filled later.
- `descriptors`, `NavigationContent`, screen children parsing, `withLayoutContext`, RNS views.

### What we remove / replace

- `react-navigation/core/useSyncState.tsx` — deleted; its `batchUpdates` atomicity guarantee is
  re-expressed as the single-`REPLACE_ROOT`-per-navigation rule (imperative) + `COMMIT_SLICES`
  order-preserving merge (render-phase). Note: today's imperative path is not actually
  `batchUpdates`-wrapped (it relies on React event-handler auto-batching); the new explicit single
  `REPLACE_ROOT` is *stronger* batching than today.
- `useSyncExternalStore` in `useRouteInfo.ts`, `imperative-api.tsx`, `useNavigationState.tsx`,
  `useIsFocused.tsx`. (`useFrameSize`, loader cache: deferred — see §5.)
- `setState`/`scheduleUpdate`/`flushUpdates` *ownership* in `BaseNavigationContainer` /
  `useNavigationBuilder` → reads from context + `dispatch(COMMIT_SLICES)`.

### Honest scope of the "concurrent-ready" claim

Removing `uSES` lets the reconciler govern transitions of **JS content** under a navigator
(`useDeferredValue`/transitions become possible). It does **not** make the imperative native
containers (react-native-screens native-stack, `UITabBar`) interruptible — those still commit
imperatively in the commit phase. `store.getRouteInfo()`/`store.state` remain a "last-committed,
imperative-only" read (backed by a commit-time ref) and must **not** be relied on during render;
render-phase callers (`canDismiss`, `getStateForHref`, redirect logic) are audited and moved to
read from context. This step *removes the blocker*; it does not itself add concurrency.

## 3. Commit breakdown (v2 — reviewable side commits)

Each commit ends with a fresh challenge agent and a why/how message that is itself reviewed.

### Commit 0 — Scaffolding: dumb global navigation store + staging buffer (no consumers yet)
- New `src/global-state/navigation-store/`: `navReducer` (handles **only** `SEED`,
  `REPLACE_ROOT`, `COMMIT_SLICES`, `RESET`), action creators, `RootTreeContext`,
  `liveTreeRef` + a `stageRootState(tree)` helper (synchronous write + scheduled single flush),
  `NavigationStoreProvider` (owns `useReducer`), and the routing-queue→dispatch wiring helper.
  **No router registry. No `DISPATCH_NAV_ACTION`.**
- Unit tests (TDD):
  - `REPLACE_ROOT` publishes a full tree; N synchronous `stageRootState` writes in one task →
    exactly **one** `REPLACE_ROOT` dispatch (atomicity), and `liveTreeRef` reflects each write
    synchronously between them (read-your-writes).
  - `COMMIT_SLICES` replaces addressed slices in dispatch order, shares untouched branches **and
    `preloadedRoutes` entries** by reference (structural-sharing assertions), no-ops unknown keys,
    tolerates a key whose child slot was never seeded, merges multiple slices across nesting
    levels into one new tree.
- Not yet wired into reads.
- **Why:** establish the single source of truth, the synchronous staging buffer (the real
  atomicity mechanism), and both commit primitives before migrating anything.

### Commit 1 — Imperative emitter off `uSES` (queue → tick), keep dispatching to navigationRef
- Convert `routingQueue` change-notification from `uSES` to a `useState` tick so
  `useImperativeApiEmitter` no longer uses `useSyncExternalStore`; keep the
  add→drain-in-effect indirection. Drain still dispatches to `navigationRef` (old store remains
  truth until C3) — this commit is purely the `uSES` removal on the emitter.
- **Why:** removes one `uSES` with zero behavior change; resolves the "emitter itself uses uSES"
  contradiction early. (RouteInfo `uSES` removal is deferred to C3, where context becomes the
  source — removing it now would leave `usePathname` reading from nothing.)
- **Target green:** full existing suite (no behavior change).

### Commit 2 — Rewire `BaseNavigationContainer` + `useNavigationBuilder` onto the staging buffer
- `BaseNavigationContainer`: drop `useSyncState`; own the root `useReducer` via
  `NavigationStoreProvider`; seed with the **partial** URL-derived initial state; the root
  `getState` reads `liveTreeRef`, the root `setState` writes `liveTreeRef` synchronously +
  schedules one `REPLACE_ROOT` flush. Publish `dispatch` to the drain effect.
- Keep the recursive `SceneView.setCurrentState` chain intact (it rebuilds the parent tree as
  today); only its **root terminus** changes (`useSyncState.setState` → `stageRootState`).
- `useNavigationBuilder`: read its slice from per-navigator slice context (derived from the root
  tree by key); keep ALL router/bootstrap/rehydrate/route-name-change logic and `stateRef`.
  The render-phase `useScheduleUpdate(() => setState(nextState))` path commits via
  `COMMIT_SLICES` (keyed, order-preserving) so multiple navigators writing in one mount/commit
  merge correctly. Imperative-nav `setState`s flow through the recursive chain → `REPLACE_ROOT`.
- **Keep the legacy `store.state` / `store.routeInfo` commit-time ref updated** on every flush so
  `usePathname`/`useSegments` keep working across the C2→C3 gap (RouteInfo isn't migrated to
  context until C3). This keeps C2 breakage scoped to non-target navigators, not global.
- `React.memo` navigator content; verify structural sharing scopes re-renders.
- Delete `useSyncState.tsx`.
- **Why:** the actual rip of react-navigation's per-navigator store. Bubbling stays in
  components (reviewer consensus); reducer stays dumb; atomicity comes from the staging buffer +
  single flush. Largest/riskiest commit; scoped so only Stack + NativeTabs must recover (C3/C4).
- **Atomicity gate:** assert one logical navigation (incl. multi-level focus cascade) produces
  exactly one committed tree / one render.

### Commit 3 — RouteInfo off `uSES` + Stack works end-to-end
- `useRouteInfo`/`usePathname`/`useSegments`/`useGlobalSearchParams`: derive from
  `RootTreeContext` via `use`; delete `routeInfoSubscribe`/`uSES`. `store.getRouteInfo()`/
  `store.state` become commit-time-ref "last-committed, imperative-only".
- **Exhaustive render-phase reader audit (enumerated, not representative).** Confirmed callers:
  - **Render-phase → must migrate to context / prove safe:** `ExpoRoot.tsx:159`
    (`initialState={store.state}`), `link/preview/HrefPreview.tsx:31` (`store.state` in render body).
  - **Event/imperative phase (OK as last-committed):** `router.ts:90` (`canDismiss`).
  - **Drain-effect / commit phase (OK):** `getNavigationAction.ts:36` (`store.getRouteInfo()` runs
    inside `routingQueue.run`).
  - **Effect phase (verify):** `useLinking.ts:363,394` (`store.state`), `useStore.ts:61`
    (`() => store.getRouteInfo()` thunk into linking config).
  - **Test harness (OK):** `testing-library/index.tsx` getters.
- Fix native-stack view to consume slices from the global tree; verify `push/replace/back/
  preload`, `preloadedRoutes`, and link-preview (preview keeps local synthesized state, commits
  on accept).
- Tests + simulator (router-e2e Stack app).
- **Why / How:** documented per requester instruction.

### Commit 4 — NativeTabs works end-to-end
- Route `JUMP_TO` + `tabPress` through the global reducer as a single commit; preserve the
  native↔JS `provenance`/`programmatic-js` echo guard; verify tab switching + per-tab nested
  Stack; check the native-pop-gesture path lands one commit.
- Tests + simulator + `/android-e2e-testing`.

### Commit 5 — Auxiliary cleanup + scope documentation
- `useNavigationState` / `useIsFocused`: derive from context instead of `uSES`.
- Document what is intentionally deferred (other navigators, `useFrameSize`, loader cache).
- Update `CLAUDE.md` state-management section; remove this plan's stale sections.

## 4. Residual risks to watch during implementation (v2)

These survived the redesign and must be verified per-commit (challenge agents should target them):

1. **Atomicity (C2/C3/C4).** Every logical navigation, including cross-navigator focus cascades,
   must produce exactly **one** `REPLACE_ROOT` flush → one tree → one native diff. Mechanism =
   synchronous `liveTreeRef` writes (read-your-writes for the cascade) + single scheduled flush.
   A regression here = RNS double-push / wrong transition / dropped screen (cf. "defer content
   not structure"). Verify the flush boundary keeps the NativeTabs `tabPress`-emit and `JUMP_TO`
   in one task; confirm `JUMP_TO`'s `shouldActionChangeFocus` is `false` (no ancestor cascade).
2. **Re-render scope (C2).** Without per-navigator slice context + `React.memo` + structural
   sharing, plain context re-renders O(navigators) per navigation. Verify untouched subtrees stay
   referentially stable. Accept spine re-render as a documented spike regression.
3. **Mid-render `getState()` (C2).** `stateRef` must still return the navigator's not-yet-committed
   `nextState`; `canGoBack()`/native header depend on it.
4. **Imperative-read tearing (C3).** `store.getRouteInfo()`/`store.state` are last-committed only;
   no render-phase reliance. Audit every caller.
5. **Lazy/conditional state (C2).** Seed is **partial**; bootstrap/rehydrate/route-name-change
   stay in the builder and commit on first render. Verify Protected/conditional screens.
6. **PRELOAD/preview (C3).** Preview's synthesized state stays local; only commits on accept.
   Explicit preview e2e.
7. **Native two-masters (C4).** Native-selected tab index / native pop gesture vs. JS tree —
   the existing `provenance`/`programmatic-js` echo guard must keep working under single-commit.

## 5. Explicitly deferred (out of scope this step)

- Drawer, JS Tabs / Top Tabs, headless UI tabs, web Stack.
- `useFrameSize` (`useSyncExternalStoreWithSelector`) — layout sizing, not navigation state.
- Loader cache `uSES` (`useLoaderData`) — separate concern; can migrate later.
- Actually introducing `useTransition`/`useDeferredValue` for navigation — this step only
  removes the blocker.

## 6a. Review revisions applied (v2 → v3) — second, fresh review round

Both fresh reviewers returned **NO-GO as written → GO after these edits** (a plan edit, not a
redesign). Applied:

1. **Corrected the atomicity primitive.** `setState` is a recursive full-root-tree rebuild via
   `SceneView.setCurrentState`, not a slice write; the focus cascade is synchronous and reads its
   own writes through `getState()`. v2's "coalesce leaf+ancestor slices into one `COMMIT_SLICES`"
   was wrong. v3: keep the recursive chain; root holds `liveTreeRef` (synchronous mutate); flush
   one `REPLACE_ROOT` per JS task. This *is* `batchUpdates` re-expressed.
2. **`getState()` reads `liveTreeRef`, not committed context** — required so the ancestor focus
   cascade computes against fresh indices (else wrong Stack/NativeTabs focus).
3. **Two reducer primitives.** `REPLACE_ROOT` (imperative nav, buffered) + `COMMIT_SLICES`
   (render-phase/bootstrap merge across navigators in one commit). `COMMIT_SLICES` tolerates
   never-seeded child slots (lazy tabs) and preserves `preloadedRoutes` entry identity.
4. **C2→C3 sequencing fix.** C2 keeps the legacy `store.state`/`routeInfo` commit-time ref updated
   so `usePathname`/`useSegments` survive until C3 migrates RouteInfo to context — keeping C2
   breakage scoped to non-target navigators, not global.
5. **Exhaustive render-phase reader audit** (enumerated in C3): concrete render-phase readers
   `ExpoRoot.tsx:159` and `HrefPreview.tsx:31` must be migrated/proven; the rest classified.
6. **C1 hardening:** unconditional drain-on-mount + StrictMode idempotency test for the
   queue→tick conversion (pre-mount `router.push` must not strand in the queue).
7. **`preloadedRoutes` identity** asserted in C0 structural-sharing tests and C3 (RNS freeze
   workaround depends on it).

## 6. Review revisions applied (v1 → v2)

From the React-core and React-Navigation creator reviews (both reached the same verdict).
*Items 2–3 below describe the v2 commit model; the dispatch mechanics were superseded by v3 (§6a) —
the corrected primitive is `REPLACE_ROOT` for imperative nav + `COMMIT_SLICES` for render-phase.*

1. **Reducer is now dumb.** Deleted the "smart reducer walks tree + router **registry** +
   re-implements bubbling" design (§7). Reducer handles only `SEED`/`COMMIT_SLICES`/`RESET`.
2. **Bubbling/resolution/focus-cascade/`beforeRemove` stay in `useOnAction`/`useOnRouteFocus`.**
   Only the terminal `setState(result)` changes (→ staged write + flush per v3 §6a).
3. **Atomicity is a hard requirement, not spike-acceptable.** (v3: via `liveTreeRef` + one
   `REPLACE_ROOT` flush per logical navigation, replacing `batchUpdates`.)
4. **Emitter `uSES` removed first (C1)** and queue change-notification converted to a tick; keep
   the add→drain-in-effect indirection (safe before mount / during render / under StrictMode).
   No direct module-level `dispatchRef` calls.
5. **RouteInfo `uSES` removal moved to C3** (where context becomes the source), not C1.
6. **`store.getRouteInfo()`/`store.state` flagged as last-committed/imperative-only**, with a
   render-phase caller audit (`canDismiss`, `getStateForHref`, redirects). "Concurrent-ready"
   claim dialed back to "unblocks JS-content concurrency; native containers still commit."
7. **Per-navigator slice context + `React.memo` + structural sharing** added to recover the
   selector-scoped re-render granularity lost when leaving `uSES`.
8. **Eager seeding is partial + initial-value-only**; lazy bootstrap, `getRehydratedState`, and
   `getStateForRouteNamesChange` (conditional/Protected screens) stay in the builder.
9. **`stateRef` mid-render `getState()` preserved** — context alone is insufficient mid-render.
10. **Commit order resequenced** and the smart-reducer TDD commit deleted.

## 7. Rejected design (v1, for the record): "smart reducer + router registry"

The original plan had `navReducer` apply navigation actions itself: walk the tree, find the
target navigator via a module **registry** of `{ router, configOptions }` populated by component
effects, run `getStateForAction`, and re-implement bubbling. **Rejected** because:

- A `useReducer` reducer must be pure; reading a mutable, component-populated registry makes it
  impure and stale on the first / lazy / conditional navigation (the registry write runs in an
  effect *after* the dispatching render).
- A centralized tree-walk cannot reproduce react-navigation's bubbling protocol: dynamic
  "first router to return non-null wins" (most actions carry no `target`), parent-first→child
  fallback direction, `shouldActionChangeFocus` + `getStateForRouteFocus` ancestor cascade,
  `beforeRemove`/`preventRemove` gating (which fires emitter events — illegal in a reducer), and
  `onDispatchAction` noop semantics.
- PRELOAD/link-preview synthesized scratch state has no home in a single global tree under the
  smart model.

The dumb-reducer design (§2) keeps every router and the bubbling protocol byte-for-byte while
still moving state into React's render cycle — which is the only thing the motivation requires.
