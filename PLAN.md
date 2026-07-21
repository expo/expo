# Plan: React transition (`startTransition` / `useTransition`) support in Expo Router

> Stacked on `@ubax/eng-21996-change-the-state-in-expo-router-to-be-global` (the global-state
> refactor: reducer registry + root reducer + single committed store). This plan is the *technical*
> spec for the transitions branch. Execution follows the same per-step workflow as the base
> branch's meta-plan (detailed step note → 3-lens plan review → red/green TDD → 3-lens
> implementation review → commit `[step x] <one-line>`).
>
> Revised after a 3-lens adversarial review (React concurrency, architecture fit, native/test
> feasibility). The core mechanism survived; the revisions below fix the claims that didn't.

## Goal — what "transition support" means for users

1. **Plain React just works.** `startTransition(() => router.push('/slow'))` and
   `const [isPending, startTransition] = useTransition()` behave the way React promises:
   the current screen stays mounted and interactive, a navigation whose destination suspends
   (lazy bundle-split screen, `use(promise)`, suspending loader) does **not** flash the Suspense
   fallback, and `isPending` is `true` until the destination is ready and committed.
2. **React 19 async transitions are a target, verified by the spike.** We want
   `startTransition(async () => { await mutate(); router.push(…) })` to keep transition semantics
   across the `await`. After an `await` the setState is scheduled by the *router's* own
   `startTransition` — a second, independent transition — and React's association of the caller's
   async scope with it is not guaranteed. The spike proves or disproves this before it is promised.
3. **Every JS-initiated navigation is a transition.** The router wraps the rendered-state commit
   in `startTransition` itself for the imperative API (`router.push`/`back`/…), `Link` presses,
   and deep links. A bare `router.push` never flashes a Suspense fallback; the previous screen
   stays up until the destination is ready.
   **Native-induced actions stay synchronous for now** (decided after review — see D5): back
   swipe / native dismiss, native tab presses, hardware back commit urgently, because the native
   side has already committed visually and the JS echo is reconciliation, not intent.
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
`useNavigationState`, `useRouteInfo` (backs `usePathname` / `useSegments` /
`useLocalSearchParams` / `useGlobalSearchParams`), and `useImperativeApiEmitter` (queue). As long
as the tree consumes navigation state through uSES, wrapping `router.push` in `startTransition`
is a no-op by design of uSES. (`useIsFocused` also uses uSES, but it subscribes to focus/blur
*events*, not the render store — it does not de-opt navigation transitions and is **not** a
conversion target; converting it would break its context-absent fallback path.)

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

### D1 — render delivery goes through React; committed-state ownership is an open decision

**Render delivery: React state instead of uSES.**

- `BaseNavigationContainer` holds the rendered tree in React state:
  `const [renderedState, setRenderedState] = useState(seed)`.
- `dispatchRoot` writes the committed store synchronously (single writer, unchanged), then calls
  `setRenderedState(next)` — wrapped in `startTransition` for JS-initiated sources, plain (urgent)
  for native-induced ones (D5). Dispatch is therefore **source-tagged**: the entry points mark
  actions as transition-eligible or urgent, and `dispatchRoot` is the single point that applies
  the wrap. Use the module-level **`React.startTransition`**, not a `useTransition` hook's
  function: `dispatchRoot` is a `useLatestCallback`, and capturing a hook's `startTransition` in a
  stable callback risks calling a stale identity (a transition that silently detaches from
  `isPending`). The pending signal comes from an explicit counter instead (D3).
- A caller's own `startTransition(() => router.push(…))` composes for the **sync** case: D2 makes
  the dispatch synchronous, so the caller's scope is active when the setState schedules and their
  `isPending` tracks it. This is load-bearing — sync dispatch is a correctness requirement for
  composition, not just a latency win. The **async** case (Goal 2) is a spike deliverable.
- Navigators stop subscribing to the store. `useStoreSlice` becomes a read of the rendered tree
  from context (`NavigationStateContext` already carries `state`) + the existing `getCachedSlice`
  keyed by rendered-tree identity. `useNavigationState` and **`useRouteInfo`** (see D4) convert
  the same way. Unchanged slices keep their identity (root reducer guarantees it) — but see
  risk 3: context propagation bypasses `React.memo`, so identity alone does not preserve today's
  per-navigator bail-outs.

**Committed state: a cell owned by the expo-router root, inside the React hierarchy (decided).**
The committed state — the last `rootReducer` output, the base for the next dispatch — lives in a
mutable cell **created by the root component** (the container `ExpoRoot` renders), not at module
level and not read through the navigation ref. One constraint forces the cell shape: dispatch
needs synchronous read-after-write. Two dispatches in the same tick must chain (the second reduces
against the first's output, before any render), and under transitions the render lags arbitrarily
— so the committed value cannot itself be `useState` (a `setState` is not readable in the same
tick, and the rendered value is by design behind). The cell is therefore a `useRef`-style mutable
field owned by the root's instance, with `dispatchRoot` as its single writer; the rendered
`useState` tree is fed *from* it.

On mount, the root **installs the cell into `global-state/store.ts`** (and uninstalls on unmount),
so every imperative read — `store.state`, `getStateForHref`, relative-href resolution,
`canGoBack`, action targeting — is a direct field read with no `navigationRef.getRootState()` hop.
This resolves the review's blocker without giving up direct global reads: a fresh root mount means
a fresh cell and a fresh install, so `renderRouter` gets defined reset semantics with exactly one
writer (no render-time-reset vs commit-time-write race), and `getSeedState()` can never observe a
previous test's final state. `NavigationIndependentTree`: every container owns its own cell (it
lives on the instance), but only the app root installs into the global store — independent trees
are out of scope for the global imperative API, which is already conceptually true
(`router.push`/`usePathname` target *the* app router, not embedded containers).

**Mixed-priority semantics (decided, must be tested).** Urgent and transition updates to the same
`useState` are not independent: an urgent (native) dispatch that lands while a JS transition is
pending forces React to interrupt the transition, process the urgent update synchronously, then
re-run the transition behind it. We accept this: the native fact wins, the JS transition re-renders
against the post-native state and continues or becomes moot. Interleaving tests (Step 7) pin this
so it's chosen behavior, not surprise. Note the consequence honestly: a native gesture during a
pending JS navigation can force a synchronous render of the in-flight destination — if that
destination still suspends at urgent priority, its fallback shows. That is the trade-off of A
(native synchronous) and it is bounded to gesture-during-pending interleavings.

Consequences to design for, not around:

- **Store leads render during a pending transition.** `store.state` returns the already-reduced
  state while the old screen is still on screen. That is the *correct* reading for imperative
  consumers (a second dispatch must reduce against the latest state) — it just becomes observable
  for longer windows. Audit every committed-state consumer and classify: imperative/navigation
  logic → latest (store); UI/derived-display → rendered. The audit explicitly includes
  `useNavigationBuilder`'s `getState()` (public `navigation.getState()` surface — reads the live
  store while the render reads context) and the `beforeRemove` path (D4).
- **Rendered-tree consistency improves.** All render consumers read one React-committed value per
  render — no inter-slice tearing. (Tearing across rendered-vs-store *imperative* reads is the
  audit's subject, not a render problem.)
- **Commit-time effects move with the transition — per-consumer, not blanket.** `onStateChange`,
  the `'state'` emitter event, focus events, and route info all fire from effects, i.e. at
  transition commit. For pathname hooks that is the desired timing (updates together with the
  screen). For others it is **not** (review finding): browser URL/history sync subscribes to the
  `'state'` event and must not lag the store arbitrarily; `usePreventRemove` registers its guard
  in an effect, so a screen mounted during a pending transition has no guard at dispatch time
  (bypass window); `useFocusEffect` cleanups keep running for the whole suspend window. Each gets
  an explicit decision + test in Step 6.

**Alternatives considered.**
- *`useDeferredValue` layering* (container reads uSES, children render a deferred copy): gives
  automatic "keep old screen while new one suspends" for every navigation, but composes with
  neither `useTransition` (`isPending` never reflects navigation, neither ours nor the caller's)
  nor async actions, and offers no per-source urgency control (D5). Rejected as the mechanism;
  noted as a fallback if D1 hits an unfixable wall.
- *React concurrent-store API*: not shipped; nothing to build on today.

### D2 — remove the routing-queue machinery; dispatch is a plain synchronous call

The queue *mechanism* — `useImperativeApiEmitter`'s uSES subscription + `useEffect` drain — is
**deleted**. `router.push` et al. resolve their action and call the container's `dispatch`
directly, in the caller's own call stack. This preserves the sync `startTransition` scope, deletes
a full effect-tick of latency and one uSES read site, and removes the "action silently dropped
because the ref was null" class of bugs in the queue's `run()`.

Two corrections from the review:

- **A minimal pre-ready buffer stays.** `assertIsReady` is *not* on all paths today:
  `dismiss`/`dismissAll` and everything through `linkTo` (`push`/`navigate`/`replace`/`dismissTo`)
  enqueue without a readiness check and are silently buffered and replayed once the container is
  ready — e.g. `router.replace` in a root layout's first render works today. Deleting buffering
  outright is a breaking change `pendingReplayRef` cannot absorb (it needs a mounted container).
  So: keep a dumb array that buffers only pre-ready actions and drains synchronously the moment
  the ref attaches; post-ready, every call dispatches directly with no intermediary. (A buffered
  pre-ready action cannot carry a transition scope — acceptable: nothing is rendered yet.)
- **The rewiring is bigger than "call dispatch".** `ROUTER_LINK` → action resolution
  (`getNavigateAction`) currently happens at drain time inside `routingQueue.run`; it moves into
  the imperative methods at call time. That shifts relative-href resolution from drain-time route
  info to call-time route info — more correct under store-leads-render, but a behavior change to
  pin with a test.

`Link` presses and `useLinkTo`-style dispatches already go through `navigationRef.dispatch`
synchronously; verify and add coverage rather than change.

### D3 — API surface

- **No `transition` flag anywhere** — not on `Link`, not on `router.push` options. JS-initiated
  navigations are transitions by default (D1); native-induced are urgent (D5); callers can layer
  their own `startTransition`/`useTransition` for scoped `isPending`.
- **`useNavigationTransitionPending()`** (name TBD): the global pending signal. Backed by an
  **explicit pending counter** — incremented when `dispatchRoot` starts a transition-wrapped
  commit, decremented when that commit lands (transition-completion effect) — exposed via context.
  Not backed by `useTransition().isPending`: hook-`isPending` only tracks transitions started by
  that hook's own `startTransition` and is fragile for dispatches originating on non-React stacks
  (review blocker). The counter is renderer-agnostic and interruption-safe (superseded transitions
  decrement when superseded).
- **`useLinkStatus()`**: `Link`-scoped `{ pending: boolean }` for pending indicators. Backed by a
  per-Link `useTransition` wrapping that Link's dispatch (Link presses are JS-initiated → always
  transition-eligible), which stays correct under interruption.

### D5 — native-induced actions stay synchronous (for now)

**Decision (post-review):** native-originated dispatches commit urgently — plain `setState`, no
transition. The review established this is structural, not incidental:

- **Native tabs are JS-controlled.** The native tab host renders the selection JS *requests*
  (`navStateRequest={{ selectedScreenKey, baseProvenance }}` in `NativeTabsView`), derived from
  the rendered state — already through a `useDeferredValue`. Deferring the JUMP_TO commit leaves
  JS requesting the old tab after native switched: snap-back/flicker by construction, compounded
  by the double defer.
- **Native dismiss couples an urgent setState to the pop.** `onDismissed` dispatches `pop` *and*
  synchronously calls `setNextDismissedKey`; `useDismissedRouteError` logs a `console.error` if
  the route is still in state on the next render. A deferred pop makes that error fire for normal
  swipe-backs, and the `ScreenStack` reconciliation window risks resurrecting the dismissed
  screen.
- **Hardware/header back** carry the same shape: the native fact is committed; users expect the
  JS echo instantly.

So `dispatchRoot` takes a source tag (D1); native entry points (`onDismissed`,
`onNativeDismissCancelled`, `onHeaderBackButtonClicked`, native tab press, `useBackButton`) mark
their dispatches urgent. Mount-window **replay dispatches are also urgent** — they reconcile an
already-committed store, and replays run from a commit-gated effect that a transition would
delay (review finding). Deep links and the imperative API/`Link` stay transitions.

**Revisit later:** making native-induced navigations transitions is deferred, not rejected. It
requires solving the JS-controlled-native-props problem (drive `navStateRequest`/dismiss
bookkeeping from the committed store rather than the rendered tree) — tracked as follow-up work,
out of scope for this branch.

### D4 — route-info hooks and timing

Correction from the review: `useRouteInfo` is itself a uSES read site (the plan's own Blocker 1
lists it) — leaving it subscribed de-opts every transition for any screen using
`usePathname`/params hooks, i.e. almost all of them. So this is **a conversion, not just an
audit**: route info moves onto the same React-state/context channel as the rendered tree (derived
from `renderedState` at the container, delivered via context), so it updates atomically with the
screen, inside the transition. The module-level cache and `store.getRouteInfo()` remain for
imperative consumers (which want latest — e.g. `resolveHrefStringWithSegments` relative-href
resolution must resolve against the committed store, not the stale render).

The audit half (Step 6) then classifies every remaining reader — rendered vs latest — including
`useNavigationBuilder.getState()`, `usePreventRemove`/`beforeRemove` (which state does a guard
protect during a pending window?), URL/history sync, and focus-event timing.

## Risks / open questions

1. **react-native-screens + react-freeze — decided: freeze is disabled (with corrected scope).**
   Frozen (Suspense-held) subtrees can starve a transition. Expo-router forces
   `freezeOnBlur: false` on the screens it renders that have the knob — native-stack, JS stack,
   bottom-tabs, drawer, `ui` TabSlot. (native-tabs and split-view have no freeze mechanism —
   nothing to disable.) Review pushback to carry into the step: this clobbers a public, documented
   option and reverses the deliberate removal of global `enableFreeze(false)` (PR #38837), so it
   needs a loud CHANGELOG entry, and an opt-out should be considered. Residual perf risk feeds
   risk 3.
2. **Freeze off does NOT close the starvation hole — no timeout story exists.** `useLoaderData`
   suspends via `use(promise)` on loader fetches, and lazy bundle-split screens suspend in the
   `React.Suspense` wrapper in `useScreens`. A never-resolving loader or hung chunk load holds a
   transition open **forever**: `isPending` stuck true, old screen stuck on screen, no error.
   Needs a policy decided during the spike: transition timeout → bail to fallback, an app-surfaced
   error, or documented "loaders must implement their own timeout". Unresolved = launch blocker
   for the flip.
3. **Render-count regressions — bail-outs are lost, not preserved, unless we add a layer.**
   Context propagation bypasses `React.memo`; `StaticContainer` memoizes leaf screen content, not
   navigator bodies — so post-flip every `useNavigationBuilder` re-runs on every commit (today
   uSES bails unchanged slices out). Combined with freeze off (blurred screens re-render;
   `detachInactiveScreens` still renders detached screens in JS), multi-tab × deep-stack apps take
   a double hit. Scope explicitly: either a slice-keyed memo layer around navigator subtrees
   (restoring per-slice bail-out under context), or an honestly re-baselined budget. Measure the
   worst case (5 tabs × deep stacks), not just the native-tabs tripwire test.
4. **Interruption + mixed priority.** Navigate-while-pending, back-while-pending, native-urgent
   during pending JS transition (the flush semantics decided in D1). Explicit test matrix in
   Step 7.
5. **`NavigationIndependentTree` / nested containers.** Rendered state and the committed cell are
   both per-container instance (D1), so independent trees keep working; only the app root installs
   its cell into the global store, so the global imperative API addresses the app router only.
   Pin with the existing two-container test plus one asserting an independent tree neither reads
   nor clobbers `store.state`.
6. **SSR / static rendering / RSC.** uSES's `getServerSnapshot` gave defined SSR semantics and
   hydration-mismatch warnings; `useState(seed)` loses that detection — divergence becomes
   silent. Verify seed determinism explicitly (key minting, registration order under streaming
   SSR); verify `rsc/web` projects and static rendering snapshots.
7. **DevTools & `__unsafe_action__`** stay dispatch-timed while `onStateChange` is commit-timed —
   during a pending transition the two visibly diverge. Document; confirm devtools tolerate it.
8. **The behavior change is a UX inversion for slow destinations — headline it.** Deferred commit
   means: tap → no push animation, no spinner, visually inert until data/bundle resolves → then
   push. Native platform convention is the opposite (push immediately, spinner inside). Apps must
   wire pending indicators (`useNavigationTransitionPending`/`useLinkStatus`); the docs must lead
   with this, and the lazy-bundle case (most common slow destination) deserves an explicit
   recommendation — possibly that bundle-split screens keep a fallback pattern. Tests (ours and
   users') that assume a synchronous rendered commit after `router.push` also change — see risk 9.
   CHANGELOG migration note required.
9. **Test observability (was: test environment).** Review blocker: the current harness cannot
   observe the headline behaviors as written. `testing-library` helpers (`getPathname`,
   `getRouterState`) read the **store**, which *leads* during a pending transition — they assert
   the destination at dispatch, not what's rendered. RNTL 13 renders through
   `react-test-renderer` (no concurrent root) and `renderRouter` forces fake timers; sync
   `act(() => router.push())` flushes transitions to completion, so pending windows are
   unobservable in that shape. The recipe (spike deliverable): controllable suspending-promise
   fixtures resolved across separate awaited `act` boundaries; rendered-tree queries
   (`getByTestId`) instead of store-reading helpers for "what's on screen"; explicit statement of
   what is jest-assertable (final states, fallback-absence across an awaited act) vs
   simulator-only (pending-window duration, some `isPending` mid-flight shapes). May require a
   concurrent root/renderer for the transition tests; budget for that.
10. **StrictMode.** Explicit coverage for the mount-window replay under transitions and for
    `getState`/`deepFreeze` idempotency under interrupted (speculative) transition renders — pin
    the "no `getState()` consumer has side effects" invariant.

## Steps

Order: 1 → 2 → 3 (spike) → 4 → 5 (atomic core) → 6 → 7 → 8 → 9. Each step keeps the full suite
green; Step 5 is the only one allowed to be atomic-across-one-commit.

### Step 1 — Delete the routing-queue machinery, keep a minimal pre-ready buffer (D2)
Remove `useImperativeApiEmitter` and the uSES/effect drain. **Before deleting anything, sweep for
pre-ready callers** (tests, `<Redirect>` in root layouts, cold-start deep links) — the review
showed `push`/`dismiss`/`dismissAll` are silently buffered pre-ready today, so this sweep informs
the buffer's shape rather than happening after the fact. `router.*` methods resolve their action
(`getNavigateAction` moves from drain time to call time) and call the container's `dispatch`
directly; a dumb array buffers only pre-ready actions and drains synchronously when the ref
attaches.
Red: `router.push` inside an event handler commits state in the same task (no effect tick);
pre-ready `router.replace` still lands once ready (existing behavior pinned, not broken);
relative-href resolution timing pinned at call time; mount-window replay tests stay green.
Files: `global-state/routingQueue.ts` (mostly deleted), `global-state/router.ts`,
`imperative-api.tsx`, `fork/NavigationContainer.tsx`.

### Step 2 — Root-owned committed cell + rendered tree into React state (D1)
(a) the committed state becomes a mutable cell created by the root container instance, written
only by `dispatchRoot`; the root installs it into `global-state/store.ts` on mount and uninstalls
on unmount, so `store.state` and all imperative reads are direct field reads (no
`navigationRef.getRootState()` hop, no seed→live handover: the cell is initialized from the seed);
(b) `BaseNavigationContainer` holds the rendered tree in `useState`, fed from the cell by
`dispatchRoot` (not yet transition-wrapped — behavior-neutral). `useSyncState` dissolves. uSES
read sites still subscribe to the store, which still notifies, so nothing observable changes yet.
Red: commit ordering (two same-tick dispatches chain against the cell), replay/mount-window
behavior, `onStateChange` timing, `store.state` identical before/during/after mount,
`renderRouter` isolation across sequential renders, independent-tree non-interference (risk 5).
Files: `global-state/store.ts`, `react-navigation/core/BaseNavigationContainer.tsx`,
`react-navigation/core/useSyncState.tsx` (deleted or absorbed).

### Step 3 — Spike + characterization tests
Pin down reality before the flip. Deliverables:
(a) a `router-e2e` playground app with a lazy/suspending screen and a suspending loader;
(b) failing-or-documenting tests that pin current behavior (uSES still de-opts);
(c) the concurrent-testing recipe (risk 9) — including whether a concurrent root/renderer is
needed and which assertions are jest-able vs simulator-only;
(d) **isPending attribution**: does a `React.startTransition` fired from a native callback stack
commit as a transition, and does the explicit-counter design (D3) track it through interruption;
(e) **async composition** (Goal 2): does the caller's async transition scope survive
`await` + the router's own `startTransition`;
(f) native-event reconciliation on the simulator — swipe-back, native tab press, hardware back —
now to *validate* the urgent-by-rule decision (D5) and characterize the urgent-flush semantics
(D1), not to discover them;
(g) the starvation/timeout policy decision (risk 2), written down;
(h) written answers to risks 4–7 and 10 unknowns.
No production code changes beyond the playground app.

### Step 4 — Disable freeze (risk 1)
Force `freezeOnBlur: false` on every screen expo-router renders that has the knob — native-stack,
JS stack, bottom-tabs, drawer, `ui` TabSlot — overriding the per-screen option and the app-level
`enableFreeze()` default, so no frozen subtree can starve a pending transition. Loud CHANGELOG
entry (this overrides a public option and reverses PR #38837's direction); consider an opt-out.
Red: screens render unfrozen even when `enableFreeze()` was called / the option is set;
blurred-screen render-count baseline recorded for risk 3 (multi-tab × deep-stack case included).
Files: `fork/native-stack/`, `react-navigation/{bottom-tabs,drawer,stack}/views/`,
`ui/TabSlot.tsx`, `layouts/StackClient.tsx`.

### Step 5 — The flip: navigators read React state; JS-initiated commits become transitions (atomic core)
In plain English: today, every navigator independently subscribes to the store and re-reads its
slice whenever anything changes — that subscription (`useSyncExternalStore`) is exactly what
forces React to render navigation synchronously and ignore transitions. After this step, only the
container knows when state changes. It puts the new tree into React state — inside
`React.startTransition` for JS-initiated sources, plain for native/replay (source tag, D1/D5) —
and every navigator simply reads the tree its parent passed down through context
(`NavigationStateContext`), picking out its own slice with the existing `getCachedSlice`. Nothing
subscribes to the store for rendering anymore.

Why both halves land in one commit: once the reads come from React state *and* the JS-initiated
write is transition-wrapped, React can prepare the next screen in the background — the old screen
stays mounted and interactive, no Suspense fallback flashes. Landing only one half either changes
nothing (wrap without reads: uSES still de-opts) or isn't the flip (reads without wrap).

Converted read sites: `useStoreSlice`, `useNavigationState`, the `useNavigationBuilder`
projection, and **`useRouteInfo`** (route info derives from `renderedState` at the container and
flows through context — D4). `useIsFocused` is deliberately **not** converted (event
subscription, not a store read). The store's render-notify subscription path is removed; identity
assertions stay. The render-count mitigation from risk 3 (slice-keyed memo layer, if the spike
confirmed it's needed) lands here too.
Red: (from Step 3, polarity flipped) bare `router.push` to a suspending screen keeps the previous
screen mounted with no fallback flash (asserted via rendered-tree queries per the recipe); pending
counter lifecycle incl. interruption; native-urgent dispatch commits synchronously and flushes a
pending transition per the decided semantics; render-count budget tests.
Files: `react-navigation/core/useStoreSlice.tsx`, `useNavigationState.tsx`,
`core/useNavigationBuilder.tsx`, `core/BaseNavigationContainer.tsx`,
`global-state/storeContext.ts`, `global-state/useRouteInfo.ts`, `global-state/routeInfoCache.ts`.

### Step 6 — Decide what every state reader means during a pending navigation (D4)
In plain English: once navigations are transitions, there are two truthful answers to "what is
the current route" — the **latest** state (the store, already reduced, possibly ahead of the
screen) and the **rendered** state (what the user is actually looking at). Today the codebase
never had to distinguish them because they were never apart for longer than a tick. This step
walks through every reader and makes the choice explicit, with a test per reader:

- Hooks that components render with — `usePathname`, `useSegments`, `useLocalSearchParams`,
  `useGlobalSearchParams`, sitemap — describe the **rendered** screen: they keep reporting the
  old route while pending, then update together with the screen (mechanically guaranteed after
  Step 5's `useRouteInfo` conversion; this step verifies).
- Functions that feed the *next* navigation — relative-href resolution
  (`resolveHrefStringWithSegments`), action targeting, `canGoBack`, `getStateForHref` — use the
  **latest** store state: a second dispatch builds on what the first already did.
- The review's specific hazards get explicit decisions + tests here:
  **browser URL/history sync** (subscribes to the `'state'` event — must it be dispatch-timed so
  the URL bar never lags the store arbitrarily during a suspension?);
  **`usePreventRemove`/`beforeRemove`** (guards register in effects → a screen mounted during a
  pending transition has no guard at dispatch time; and does a guard protect the rendered route
  or the leading one?); **`useFocusEffect` cleanup** (blur fires at transition commit — outgoing
  screen's camera/audio/polling keeps running through the suspend window: acceptable? document or
  fix); **`useNavigationBuilder.getState()`** (public surface reading the live store while render
  reads context).
Files: `global-state/store.ts`, `global-state/router.ts`, `global-state/useRouteInfo.ts`,
`react-navigation/native/useLinking.ts`, `react-navigation/core/usePreventRemove.tsx`,
`core/useNavigationBuilder.tsx`, `hooks/*` — audit-driven.

### Step 7 — Transition semantics test pass
End-to-end unit coverage of the headline behaviors: bare `router.push` (router-owned transition),
caller `startTransition` composition and caller `isPending` (sync), async transition per the
spike's verdict, the interruption + mixed-priority matrix (second navigation while pending; back
while pending; native-urgent while pending — decided flush semantics), `beforeRemove`/protected
routes during pending transitions, StrictMode (incl. mount-window replay under transitions),
`NavigationIndependentTree` (per risk 5), `testing-library` ergonomics (risks 8–9). Mostly
tests; fix what they catch.

### Step 8 — Pending-state API: `useNavigationTransitionPending` + `useLinkStatus` (D3)
The explicit pending counter (incremented at transition-wrapped dispatch, decremented on commit,
interruption-safe) exposed via context behind `useNavigationTransitionPending()` (final name
decided here); `useLinkStatus()` exposes `{ pending }` via context from the nearest Link, backed
by a per-Link `useTransition`. Red-first per hook; RSC tests for the new exports.
Files: `link/Link.tsx`, `link/useLinkStatus.tsx` (new), `hooks/`, `exports.ts`.

### Step 9 — Verification, docs, changelog
`et check-packages expo-router`; manual verification in `apps/router-e2e` on iOS simulator + web
(lazy screen via push, suspending loader, swipe-back and native tab press with suspending targets,
pending indicators). Docs: new guide section (transitions with Expo Router) that **leads with the
UX inversion** (risk 8: tap → inert until ready; wire pending indicators; lazy-bundle
recommendation) + API reference (`useNavigationTransitionPending`, `useLinkStatus`) via
`et generate-docs-api-data --packageName expo-router`; CHANGELOG entries: behavior change +
migration note, freeze override (risk 1).

## Non-goals

- **Making native-induced navigations transitions** — deferred (decision A): requires driving
  native-controlled props (`navStateRequest`, dismiss bookkeeping) from the committed store
  instead of the rendered tree. Follow-up work.
- `useOptimistic`-based optimistic navigation state (natural follow-up once this lands).
- Driving/altering native gesture *animations* from JS — native owns the visual gesture; this
  branch only changes how the resulting JS state commit is scheduled.
- Any change to reducer/registry semantics from the base branch.
