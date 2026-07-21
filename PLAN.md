# Plan: React transition (`startTransition` / `useTransition`) support in Expo Router

> Stacked on `@ubax/eng-21996-change-the-state-in-expo-router-to-be-global` (the global-state
> refactor: reducer registry + root reducer + single committed store). This plan is the *technical*
> spec for the transitions branch. Execution follows the same per-step workflow as the base
> branch's meta-plan (detailed step note → 3-lens plan review → red/green TDD → 3-lens
> implementation review → commit `[step x] <one-line>`).
>
> Revised after two rounds of 3-lens adversarial review (React concurrency, architecture fit,
> native/test feasibility). The core mechanism survived both; the revisions below fix the claims
> that didn't. Round 2 moved the feature removals onto the **base branch** as standalone
> prerequisite steps (R1/R2 below).

## Goal — what "transition support" means for users

1. **Plain React just works — for JS-initiated navigation.** `startTransition(() =>
   router.push('/slow'))` and `const [isPending, startTransition] = useTransition()` behave the
   way React promises: the current screen stays mounted and interactive, a JS-initiated
   navigation whose destination suspends (lazy bundle-split screen, `use(promise)`, suspending
   loader) does **not** flash the Suspense fallback, and `isPending` is `true` until the
   destination is ready and committed. (Native-initiated navigation to suspending content commits
   urgently and **will** show the fallback — intended, see D5; the native side has already moved.)
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
- ~~Dispatch-time semantics~~ — the base branch runs `shouldPreventRemove` / `beforeRemove`,
  the unhandled-action machinery, and `__unsafe_action__` synchronously at dispatch. **These
  surfaces are removed in standalone prerequisite steps R1/R2, landed directly on the base
  branch** (`@ubax/eng-21996-change-the-state-in-expo-router-to-be-global`) before the
  transitions work begins — see the Steps section.

## Design

### D1 — the state lives in a root `useReducer`; all navigation logic happens in the reducer

**Decided (supersedes the earlier "root-owned cell" design):** the navigation state is React
state at the root, full stop — `const [state, dispatch] = useReducer(rootNavigationReducer, seed)`
in `BaseNavigationContainer`. There is no committed cell outside React and no external store
feeding render. `router.push` (and every other source) does exactly one thing: **dispatch an
action**. All logic — href resolution, action targeting, chaining, reduction — happens inside the
reducer.

Why the "synchronous read-after-write" objection to `useState` dissolves under `useReducer`:
React chains queued actions natively. `dispatch(a); dispatch(b)` in one tick queues both, and
React reduces them in order at render time — `b` against `a`'s output. Nothing outside the
reducer ever needs "the state after `a` but before render", *provided the logic that needs it
lives in the reducer*. That is exactly the boundary this design draws, and it forces the right
factoring:

- **Raw intent in, resolution inside (decided: resolution stays in the reducer).**
  `router.push(href, options)` dispatches `{ type: 'ROUTER_LINK', href, options }` verbatim. The
  reducer resolves the href (relative resolution against route info derived from *its own state
  argument* — the chained latest), computes the target, and reduces: today's `getNavigateAction`
  + `rootReducer` fuse into one pure function. Same for `dismiss`/`goBack`/`setParams`.
  Two corrections the review forced on how this is done:
  - **The reducer's inputs must be explicit and stable.** `getNavigateAction` today reads
    module-global mutables (`store.linking`/`getStateFromPath`, `store.redirects`, and — worst —
    `navigationRef.getRootState()` live, plus `store.assertIsReady` which throws). Inside a
    render-pure, replayable reducer those are purity violations. The fused reducer signature is
    `(state, action, registry, config) → state` where `config` (linking config + redirects) is
    captured once at root init (it is init-time-stable), the state read is *only* the reducer's
    argument, and nothing reads through the ref or throws for readiness.
  - **The six standalone `getNavigateAction` callers convert to raw intents.** Deep links
    (`fork/useLinking.native.ts`), `usePreloadRoutes`/`usePreloadAnchor`, `TabsClient`'s
    `unstable_tabBarNavigateAction`, native-tabs first-visit tab press, and the link-preview
    `__internal__PreviewKey` path all build actions before dispatch today; they dispatch raw
    intent actions instead (the preview/PRELOAD variants become intent-action fields).
- **Transitions are just the dispatch wrapper.** JS-initiated sources call
  `React.startTransition(() => dispatch(action))`; native-induced sources call `dispatch(action)`
  plain (urgent, D5). Source-tagging is nothing more than which wrapper the entry point uses.
  (Module-level `React.startTransition`, not a `useTransition` hook's function — stale-identity
  hazard per the review; the pending signal is the monotonic-id mechanism, D3.)
- A caller's own `startTransition(() => router.push(…))` composes for the **sync** case: D2 makes
  dispatch synchronous, so the caller's scope is active when the dispatch schedules and their
  `isPending` tracks it. Load-bearing, not a latency nicety. The **async** case (Goal 2) is a
  spike deliverable.
- Navigators read the reduced tree from context, as before: `useStoreSlice` → context +
  `getCachedSlice` keyed by tree identity; `useNavigationState` and **`useRouteInfo`** (D4)
  convert the same way; `useIsFocused` does not (event subscription). Unchanged slices keep their
  identity (root reducer guarantees it) — but see risk 3: context propagation bypasses
  `React.memo`, so identity alone does not preserve today's per-navigator bail-outs.

**The purity contract (new, load-bearing).** The reducer now runs inside React's render — during
transitions, speculatively, possibly replayed after an interruption — and React may also invoke
it eagerly at dispatch as a bail-out optimization. It must be strictly pure: no listener
callbacks, no console output, no registry mutation, no module-global writes, no side-channel
outputs consumed at dispatch time. The dispatch-time behaviors that conflict with this are
**removed in standalone steps R1/R2 on the base branch** (decided — see Steps); one is redesigned
here:

1. **Prevent-remove is removed fully (base-branch step R1).** Everything goes: the
   `shouldPreventRemove` consultation in `dispatchRoot`, the `changedSlices` side-channel the
   root reducer produces for it (its only consumer), the `beforeRemove` event emission, the
   `usePreventRemove`/`usePreventRemoveContext`/`PreventRemoveProvider` surface, **and the
   render-time native lock it feeds** (`preventNativeDismiss` on `ScreenStackItem`, the
   experimental-stack equivalent, web `ModalStack` `dismissible` gating, and the
   header-back-menu gating). Accepted regression until the follow-up: no screen can block a
   native swipe-back / modal dismiss. These exports are public on the
   `expo-router/react-navigation` subpath — breaking-change CHANGELOG entry required.
   **TODO(prevent-remove)** markers at every removal site are the reintroduction checklist; the
   follow-up design is planned separately. Note (review correction): protected/guarded routes are
   unaffected — they are conditional rendering (`Protected` → `Redirect` + guarded-route reset),
   independent of prevent-remove, not reducer logic.
2. **The unhandled-action machinery is removed fully (base-branch step R2), including
   `lastUnhandled`.** The `handled`/`noop` verdict, `UnhandledActionContext`, the
   `onUnhandledAction` container prop, the default console error, ExpoRoot's test-env throw, and
   the `UNSTABLE_routeNamesChangeBehavior: 'lastUnhandled'` route-restore feature that rides on
   the context all go — the reducer simply returns state unchanged for actions it cannot handle.
   R2 also removes **`__unsafe_action__`** and expo-router's public `actionDispatched` re-emit.
   **TODO(action-telemetry): `expo-observe` consumes `__unsafe_action__` for EAS Observe action
   timing, and `actionDispatched` is public — a follow-up provides a replacement dispatch-time
   telemetry signal and migrates `expo-observe`; leave `TODO(action-telemetry)` markers at the
   removal sites.** Breaking-change CHANGELOG entries for `onUnhandledAction`, `lastUnhandled`,
   and `actionDispatched`.
3. **Mount-window replay** is redesigned to fit the pure reducer — see below.
4. **`RECONCILE_ROUTE_NAMES` needs a new completion signal** (review finding).
   `useNavigationBuilder` dispatches it from a layout effect and reads the returned `handled`
   verdict synchronously to advance its route-key bookkeeping; a dev invariant tolerates render
   divergence only while a reconcile is pending. Under `useReducer`, dispatch returns void. The
   reconcile dispatch is urgent (it is internal bookkeeping, not navigation), and the effect
   detects completion by observing the committed slice instead of a return value. Spike item (h)
   covers it; the flip step implements it.

**What mount-window replay is.** Navigator reducers register into the registry from *layout
effects*, i.e. only after a commit. So there is a window — the "mount window" — where a route is
already in the tree but its navigator's reducer is not yet registered: the first render before
any effects run, or right after a navigation commits a subtree whose navigators haven't
registered yet. An action dispatched *inside that window* (canonical case: a descendant's mount
effect calls `router.navigate(…)` or `preload` — e.g. a `<Redirect>` screen — before its
ancestor navigators' registration effects have run) cannot be reduced: the root reducer walks the
registry and finds no reducer at the origin key. The base branch handles this in `dispatchRoot`
(`pendingReplayRef` + `replayTick`): the unhandled action is stashed, and after the next commit —
by which point the registration effects have run — it is re-dispatched exactly once (`isReplay`
bounds the retry), falling through to unhandled reporting if it still cannot be reduced.

Under `useReducer` the stash-and-retry cannot live in `dispatchRoot` (there is no dispatch-time
reduction to produce the "unhandled" verdict, and a pure reducer cannot requeue). The redesign
moves the queue **into the state itself**, hardened per the round-2 review (decided):

- When the reducer receives an unhandled action, it returns state with the action appended to a
  `pendingActions` field. The append is **idempotent, keyed by action identity** — React invokes
  the reducer eagerly at dispatch *and* again at render (and again on replayed transitions), so a
  non-idempotent append would double-queue.
- **The `isDeferrable` gate carries over verbatim**: only `PRELOAD` and target-less actions are
  ever queued (as in today's `dispatchRoot`). Native dispatches always carry an explicit
  `target`, which is exactly what makes a replayed double-pop impossible — a targeted native
  `POP`/`JUMP_TO` must never enter `pendingActions` (pinned by test).
- A container effect runs after every commit (registration effects have run by then),
  re-dispatches anything in `pendingActions` **urgently** (D5) with a replay marker, and the
  reducer clears the field; a replay-marked action that still finds no reducer is **dropped**.
- **Known bound, stated explicitly:** the one-retry semantics assume the origin navigator
  registers by the next commit — true for synchronous mounts (registration is an insertion-phase
  effect, ordered before the replay's passive effect), false for lazy/RSC navigators that
  register commits later, where the action is dropped exactly as it is on the base branch today.
  We keep drop-after-one-retry (no persistence) and pin it with a lazy-navigator test.
- StrictMode double-effects and interruption are explicit test targets (Step 7); spike item (h)
  validates the mechanism under interrupted transitions before the flip.

**"Store leads render" disappears — and that is a same-tick behavior change to own.** There is no
leading committed state — unreduced actions live invisibly in React's queue. Every read outside
the reducer reads the last *committed* tree: `store.state` becomes a mirror of it (maintained
alongside the existing route-info derivation), serving imperative consumers (`getStateForHref`,
sitemap, devtools). Queries that ask "what would happen" — `canGoBack`, `canDismiss` — call the
pure reducer imperatively against the last committed state (a pure function is callable
anywhere). Review correction to own explicitly: **today `store.state` reflects a dispatch
synchronously** (the sync store's closure updates inside `dispatchRoot` before it returns), so
`router.push(); router.canGoBack()` in one tick currently answers post-push — under this design
it answers for the committed (pre-push) state. Deliberate, but a behavior change: CHANGELOG note
+ test. The audit (Step 6) must also cover the two bare `store.state` readers the review found
unprotected: `HrefPreview` (reads `store.state` in a loop to render a parallel preview tree — the
sharpest tearing edge) and `getSeedState`. D4's audit otherwise shrinks: hooks read rendered; the
only "latest" reader left is the reducer itself.

**Registry at reduce time.** The reducer consults the reducer registry when React runs it (render
time), not at dispatch time. Registration happens in layout effects — between renders — so the
registry is stable within a render pass, but reduce-time may see a *newer* registry than
dispatch-time did (a navigator mounted in between). Usually strictly better (fewer unhandled
actions); the spike pins the replay semantics (an interrupted transition re-reduces the same
action against a possibly different registry — purity guarantees no corruption, but the outcome
can differ; decide and test what we promise).

**Install lifecycle.** The root installs its `dispatch` (and the committed-tree mirror) into
`global-state/store.ts` on mount, uninstalls on unmount — `router.*` reaches React through that.
Test isolation and `NavigationIndependentTree` resolve per root instance by construction; only
the app root installs globally.

**Mixed-priority semantics (decided, must be tested).** Urgent and transition dispatches to the
same `useReducer` are not independent: an urgent (native) dispatch that lands while a JS
transition is pending forces React to interrupt the transition, process the urgent update
synchronously, then re-run the transition behind it. We accept this: the native fact wins, the JS
transition re-reduces against the post-native state and continues or becomes moot. Interleaving
tests (Step 7) pin this so it's chosen behavior, not surprise. Note the consequence honestly: a
native gesture during a pending JS navigation can force a synchronous render of the in-flight
destination — if that destination still suspends at urgent priority, its fallback shows. The
round-2 review is right that this interleaving is **common, not rare**: the dead-tap UX (risk 8)
itself provokes the second gesture (tap slow link → nothing visible → user swipes back or taps a
tab, landing an urgent dispatch exactly while the push transition is pending). So the spike must
evaluate **supersede-over-flush**: the reducer sees the urgent action and can *drop* the stale
pending navigation (reduce the urgent action against committed state and discard the queued
intent) instead of letting React flush the abandoned destination's fallback. The `useReducer`
model makes this expressible; decide it in the spike, test it in Step 7.

Consequences to design for, not around:

- **Rendered-tree consistency improves.** All render consumers read one React-committed value per
  render — no inter-slice tearing, and no leading/lagging split to audit for render code.
- **Commit-time effects move with the transition — per-consumer, not blanket.** `onStateChange`,
  the `'state'` emitter event, focus events, and route info all fire from effects, i.e. at
  transition commit. For pathname hooks that is the desired timing (updates together with the
  screen). For others it is **not** (review finding): browser URL/history sync subscribes to the
  `'state'` event and must not lag the store arbitrarily; `useFocusEffect` cleanups keep running
  for the whole suspend window. Each gets an explicit decision + test in Step 6. (The review's
  third hazard here — `usePreventRemove` guard-registration lag — is mooted by removing the
  prevent-remove surface, D1 item 1.)

**Alternatives considered.**
- *`useDeferredValue` layering* (container reads uSES, children render a deferred copy): gives
  automatic "keep old screen while new one suspends" for every navigation, but composes with
  neither `useTransition` (`isPending` never reflects navigation, neither ours nor the caller's)
  nor async actions, and offers no per-source urgency control (D5). Rejected as the mechanism;
  noted as a fallback if D1 hits an unfixable wall.
- *React concurrent-store API*: not shipped; nothing to build on today.

### D2 — remove the routing-queue machinery; dispatch is a plain synchronous call

The queue *mechanism* — `useImperativeApiEmitter`'s uSES subscription + `useEffect` drain — is
**deleted**. `router.push` et al. call the installed root `dispatch` directly, in the caller's own
call stack, passing the raw intent action (D1 — no resolution at call time). This preserves the
sync `startTransition` scope, deletes a full effect-tick of latency and one uSES read site, and
removes the "action silently dropped because the ref was null" class of bugs in the queue's
`run()`.

Two corrections from the review:

- **A minimal pre-ready buffer stays.** `assertIsReady` is *not* on all paths today:
  `dismiss`/`dismissAll` and everything through `linkTo` (`push`/`navigate`/`replace`/`dismissTo`)
  enqueue without a readiness check and are silently buffered and replayed once the container is
  ready — e.g. `router.replace` in a root layout's first render works today. Deleting buffering
  outright is a breaking change `pendingReplayRef` cannot absorb (it needs a mounted container).
  So: keep a dumb array that buffers only pre-ready actions and drains synchronously the moment
  the ref attaches; post-ready, every call dispatches directly with no intermediary. (A buffered
  pre-ready action cannot carry a transition scope — acceptable: nothing is rendered yet.)
- **The rewiring goes further than "call dispatch".** `ROUTER_LINK` → action resolution
  (`getNavigateAction`) currently happens at drain time inside `routingQueue.run`; per D1 it moves
  **into the reducer**. Relative-href resolution therefore happens against the reducer's chained
  state at reduce time — strictly more correct than both drain-time and call-time (two same-tick
  relative pushes chain properly); pin with a test.

`Link` presses and `useLinkTo`-style dispatches already go through `navigationRef.dispatch`
synchronously; verify and add coverage rather than change.

### D3 — API surface

- **No `transition` flag anywhere** — not on `Link`, not on `router.push` options. JS-initiated
  navigations are transitions by default (D1); native-induced are urgent (D5); callers can layer
  their own `startTransition`/`useTransition` for scoped `isPending`.
- **`useNavigationTransitionPending()`** (name TBD): the global pending signal, redesigned per
  the round-2 review. A naive increment-at-dispatch / decrement-at-commit counter is **not
  well-defined** under React's transition semantics: transitions scheduled before a commit
  entangle into one commit (two increments, one completion) and a superseded transition never
  "completes" — the counter deadlocks at pending. Instead, pending is **derived from committed
  state via monotonic ids**: every transition-wrapped dispatch is tagged with a monotonic
  navigation id; "last issued id" lives in a small piece of state updated **urgently** (outside
  the transition scope — mandatory, or the indicator would be deferred behind the very slow
  commit it exists to cover); the reducer records "last reduced id" inside the navigation state;
  `pending = lastIssued > lastCommitted`, computed from committed values — no transition
  lifecycle to reconcile, interruption-safe by construction (a superseding dispatch bumps both).
  Not backed by `useTransition().isPending`: hook-`isPending` only tracks that hook's own
  `startTransition` and is fragile for dispatches originating on non-React stacks.
- **`useLinkStatus()`**: `Link`-scoped `{ pending: boolean }` for pending indicators. Backed by a
  per-Link `useTransition` wrapping that Link's dispatch (Link presses are JS-initiated → always
  transition-eligible), which stays correct under interruption.

### D5 — native-induced actions stay synchronous (for now)

**Decision (post-review):** native-originated dispatches commit urgently — a plain, unwrapped
`dispatch`, no transition. The review established this is structural, not incidental:

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
already-committed navigation fact, and replays run from a commit-gated effect that a transition would
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
from the `useReducer` state at the container, delivered via context), so it updates atomically
with the screen, inside the transition. The module-level cache and `store.getRouteInfo()` remain
for imperative consumers reading the last committed value; relative-href resolution no longer
consumes them at dispatch — it happens inside the reducer against the chained state (D1).

The audit half (Step 6) then classifies every remaining reader — including
`useNavigationBuilder.getState()`, `HrefPreview`, `getSeedState`, URL/history sync, and
focus-event timing.

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
   a double hit. **Decided (round-2): the slice-keyed memo layer around navigator subtrees is
   committed Step 5 work, not spike-conditional** — context bypasses `React.memo`, so nothing
   short of it restores per-slice bail-out. Measure the worst case (5 tabs × deep stacks), not
   just the native-tabs tripwire test.
4. **Interruption + mixed priority.** Navigate-while-pending, back-while-pending, native-urgent
   during pending JS transition (the flush semantics decided in D1). Explicit test matrix in
   Step 7.
5. **`NavigationIndependentTree` / nested containers.** State lives on each container's
   `useReducer` (D1), so independent trees keep working; only the app root installs its `dispatch`
   and committed mirror into the global store, so the global imperative API addresses the app
   router only. Pin with the existing two-container test plus one asserting an independent tree
   neither reads nor clobbers `store.state`.
6. **SSR / static rendering / RSC.** Downgraded per round-2 review: today's uSES passes the same
   getter as both client and server snapshot, so no mismatch detection is actually lost. The
   real requirement is **seed idempotency** (key minting, registration order under streaming
   SSR); verify `rsc/web` projects and static rendering snapshots.
7. **Telemetry/devtools removals (R2).** `__unsafe_action__` is consumed by `expo-observe` (EAS
   Observe action timing) and re-emitted as expo-router's public `actionDispatched` event;
   `onUnhandledAction` is a public container prop; `lastUnhandled` is a documented behavior.
   All removed in R2 with `TODO(action-telemetry)` — coordinate the `expo-observe` migration and
   write the breaking-change CHANGELOG entries. `onStateChange` becomes commit-timed; confirm
   remaining devtools tolerate the new timing.
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
   unobservable in that shape. `renderRouter` also forces `EXPO_ROUTER_IMPORT_MODE='sync'`, so
   the lazy-bundle case — the primary suspending scenario — cannot suspend in tests without new
   fixtures. The recipe (spike deliverable): controllable suspending-promise fixtures resolved
   across separate awaited `act` boundaries; rendered-tree queries (`getByTestId`) instead of
   store-reading helpers for "what's on screen"; explicit statement of what is jest-assertable
   (final states, fallback-absence across an awaited act) vs simulator-only (pending-window
   duration, mid-flight pending values, native-urgent-flush interleavings). **Step 3's exit
   criteria include the binding decision** — stand up a concurrent root for the transition tests,
   or reclassify those assertions simulator-only and shrink Step 5's jest red tests to
   final-state + fallback-absence — made *before* Step 5 starts, not discovered during it.
10. **StrictMode.** Explicit coverage for the mount-window replay under transitions and for
    `getState`/`deepFreeze` idempotency under interrupted (speculative) transition renders — pin
    the "no `getState()` consumer has side effects" invariant.

## Steps

Order: **R1 → R2 (standalone, on the base branch)**, then 1 → 2 → 3 (spike) → 4 → 5 (atomic
core) → 6 → 7 → 8 → 9 on the transitions branch. Each step keeps the full suite green; Step 5 is
the only one allowed to be atomic-across-one-commit.

### Step R1 (base branch) — Remove prevent-remove fully
Landed as a standalone step directly on
`@ubax/eng-21996-change-the-state-in-expo-router-to-be-global` (the transitions branch rebases on
top). Remove the entire prevent-remove path per D1 item 1: `shouldPreventRemove` in
`dispatchRoot`, the `changedSlices` production in `rootReducer` (sole consumer), the
`beforeRemove` emission, `usePreventRemove`/`usePreventRemoveContext`/`PreventRemoveProvider`,
and the render-time consumers (`preventNativeDismiss` + header-back-menu gating in
native-stack, the experimental-stack equivalent, web `ModalStack` `dismissible` gating).
`TODO(prevent-remove)` markers at every removal site. Delete the feature's tests with it.
Red: suite green with the surface gone; an iOS characterization note records the accepted
regression (guarded screens become natively swipeable). Breaking-change CHANGELOG entry
(`expo-router/react-navigation` subpath exports).
Files: `react-navigation/core/{usePreventRemove,usePreventRemoveContext,PreventRemoveProvider,
useOnPreventRemove}*`, `core/BaseNavigationContainer.tsx`, `global-state/rootReducer.ts`,
`react-navigation/native-stack/views/NativeStackView.native.tsx`,
`layouts/experimental-stack/ExperimentalStackView.tsx`, web modal stack, `core/index.tsx`.

### Step R2 (base branch) — Remove the unhandled-action machinery and `__unsafe_action__` fully
Also standalone on the base branch. Remove per D1 item 2: the `handled`/`noop` verdict plumbing,
`UnhandledActionContext`, the `onUnhandledAction` container prop (public), the default console
error, ExpoRoot's test-env throw, the `UNSTABLE_routeNamesChangeBehavior: 'lastUnhandled'`
route-restore feature (capture + restore in `useNavigationBuilder`, threaded through every
navigator), `__unsafe_action__` (`onDispatchAction`/emitter), and expo-router's public
`actionDispatched` re-emit in `navigationEvents/`. `TODO(action-telemetry)` markers where
`__unsafe_action__`/`actionDispatched` are removed (expo-observe migration + replacement signal
are follow-up work). Delete the features' tests with them.
Red: suite green with the surfaces gone; breaking-change CHANGELOG entries (`onUnhandledAction`,
`lastUnhandled`, `actionDispatched`, `__unsafe_action__`).
Files: `core/BaseNavigationContainer.tsx`, `core/UnhandledActionContext.tsx`,
`core/useNavigationBuilder.tsx`, `navigationEvents/`, `ExpoRoot.tsx`, navigator factories,
`core/types.tsx`.

### Step 1 — Delete the routing-queue machinery, keep a minimal pre-ready buffer (D2)
Remove `useImperativeApiEmitter` and the uSES/effect drain. **Before deleting anything, sweep for
pre-ready callers** (tests, `<Redirect>` in root layouts, cold-start deep links) — the review
showed `push`/`dismiss`/`dismissAll` are silently buffered pre-ready today, so this sweep informs
the buffer's shape rather than happening after the fact. `router.*` methods call the installed
root `dispatch` directly with raw intent actions (resolution stays in the reducer, D1); a dumb
array buffers only pre-ready intent actions and drains synchronously when the ref attaches.
Red: `router.push` inside an event handler commits state in the same task (no effect tick);
pre-ready `router.replace` still lands once ready (existing behavior pinned, not broken);
mount-window replay tests stay green.
Files: `global-state/routingQueue.ts` (mostly deleted), `global-state/router.ts`,
`imperative-api.tsx`, `fork/NavigationContainer.tsx`.

### Step 2 — State moves into a root `useReducer`, shadowed for behavior-neutrality (D1)
`BaseNavigationContainer` replaces `useSyncState` with
`useReducer(rootNavigationReducer, seed)` (R1/R2 already stripped the dispatch-time side
channels on the base branch, so `dispatchRoot` collapses to `dispatch(action)` — not yet
transition-wrapped). `getNavigateAction` fuses into the reducer as
`(state, action, registry, config) → state` with `config` (linking + redirects) captured at root
init and no module-global/ref reads (D1); the six standalone `getNavigateAction` callers convert
to raw intent dispatches. Mount-window replay becomes the hardened state-carried `pendingActions`
mechanism (idempotent identity-keyed append, `isDeferrable` gate carried over, urgent replay,
drop-after-one-retry — D1). The root installs `dispatch` + the committed mirror into
`global-state/store.ts` on mount, uninstalls on unmount.
Staging scaffolding for behavior-neutrality: a temporary eager reduce (same pure fused reducer,
last committed tree, same `config`) feeds the store mirror synchronously through the sync
`setState` path (not the batched one — same-tick chaining depends on it), so the existing uSES
read sites behave exactly as today — while React's `useReducer` reduces the same actions in
parallel and a dev assertion checks both trees deep-equal every commit (the shadow-compare that
de-risked the base branch's own flip). Two review-found caveats: the deep-equal can legitimately
diverge on the two nanoid-minting paths (keyless `RESET` payloads in `BaseRouter`, the
empty-reconciliation fallback in `StackRouter`) — special-case or make those keys deterministic
first; and with R1/R2 landed the reducer path has no side effects left, which is what makes
double-reduction safe at all. This scaffolding has no product role and is deleted in Step 5.
Red: two same-tick dispatches chain correctly (incl. relative hrefs), replay/mount-window behavior
via `pendingActions` (incl. targeted-native-action-never-queued), `onStateChange` timing,
same-tick `push(); canGoBack()` behavior change pinned, shadow deep-equal across the suite,
`renderRouter` isolation across sequential renders, independent-tree non-interference (risk 5).
Files: `global-state/store.ts`, `global-state/rootReducer.ts`,
`global-state/getNavigationAction.ts`, `global-state/router.ts`,
`react-navigation/core/BaseNavigationContainer.tsx`,
`react-navigation/core/useSyncState.tsx` (deleted or absorbed), the six raw-intent call sites.

### Step 3 — Spike + characterization tests
Pin down reality before the flip. Deliverables:
(a) a `router-e2e` playground app with a lazy/suspending screen and a suspending loader;
(b) failing-or-documenting tests that pin current behavior (uSES still de-opts);
(c) the concurrent-testing recipe (risk 9) — including whether a concurrent root/renderer is
needed and which assertions are jest-able vs simulator-only;
(d) **isPending attribution**: does a `React.startTransition` fired from a native callback stack
commit as a transition, and does the monotonic-id pending design (D3) track it through
interruption;
(e) **async composition** (Goal 2): does the caller's async transition scope survive
`await` + the router's own `startTransition`;
(f) native-event reconciliation on the simulator — swipe-back, native tab press, hardware back —
to *validate* the urgent-by-rule decision (D5), characterize the urgent-flush semantics, and
**decide supersede-over-flush** (D1: should an urgent native action drop a stale pending JS
navigation instead of flushing it?);
(g) the starvation/timeout policy decision (risk 2), written down;
(h) **useReducer mechanics** (D1): registry-at-reduce-time semantics under interrupted/replayed
transitions, React's eager reducer invocation at dispatch (purity contract holds, no double
work with the Step-2 shadow scaffolding), the state-carried `pendingActions` replay under
interrupted transitions, and the `RECONCILE_ROUTE_NAMES` completion-signal redesign;
(i) written answers to risks 4–7 and 10 unknowns.
**Exit criteria include the testing-recipe decision (risk 9)**: concurrent root for transition
tests, or reclassify the mid-flight assertions simulator-only — decided here, before Step 5.
No production code changes beyond the playground app.

### Step 4 — Disable freeze (risk 1)
Inject `freezeOnBlur: false` at the five render sites — this is a code change, not a config
toggle: expo-router today only *forwards* `descriptor.options.freezeOnBlur`, so the override must
be applied where each navigator renders its screen (`ScreenStackItem` in native-stack,
`CardStack`/`MaybeScreen` in JS stack, `BottomTabView`, `DrawerView`, `ui` TabSlot) — overriding
the per-screen option and the app-level `enableFreeze()` default (an explicit `false` is airtight
against `enableFreeze(true)`), so no frozen subtree can starve a pending transition. Loud CHANGELOG
entry (this overrides a public option and reverses PR #38837's direction); consider an opt-out.
Red: screens render unfrozen even when `enableFreeze()` was called / the option is set;
blurred-screen render-count baseline recorded for risk 3 (multi-tab × deep-stack case included).
Files: `fork/native-stack/`, `react-navigation/{bottom-tabs,drawer,stack}/views/`,
`ui/TabSlot.tsx`, `layouts/StackClient.tsx`.

### Step 5 — The flip: navigators read React state; JS-initiated commits become transitions (atomic core)
In plain English: today, every navigator independently subscribes to the store and re-reads its
slice whenever anything changes — that subscription (`useSyncExternalStore`) is exactly what
forces React to render navigation synchronously and ignore transitions. After this step, only the
container knows when state changes: the `useReducer` tree (authoritative since Step 2, shadowed
until now) becomes what everything renders from, dispatches are wrapped in
`React.startTransition` for JS-initiated sources and left plain for native/replay (source tag,
D1/D5), and every navigator simply reads the tree its parent passed down through context
(`NavigationStateContext`), picking out its own slice with the existing `getCachedSlice`. Nothing
subscribes to the store for rendering anymore; the store mirror updates at commit, not at
dispatch, and the Step-2 shadow scaffolding is deleted.

Why both halves land in one commit: once the reads come from the `useReducer` tree *and* the
JS-initiated dispatch is transition-wrapped, React can prepare the next screen in the background —
the old screen stays mounted and interactive, no Suspense fallback flashes. Landing only one half
either changes nothing (wrap without reads: uSES still de-opts) or isn't the flip (reads without
wrap).

Converted read sites: `useStoreSlice`, `useNavigationState`, the `useNavigationBuilder`
projection, and **`useRouteInfo`** (route info derives from the `useReducer` state at the
container and flows through context — D4). `useIsFocused` is deliberately **not** converted
(event subscription, not a store read). The store's render-notify subscription path and the
Step-2 shadow assertion are removed; identity assertions stay. Two committed sub-pieces land
here too: the **slice-keyed memo layer** (risk 3 — decided, not spike-conditional) and the
**`RECONCILE_ROUTE_NAMES` completion-signal redesign** (urgent dispatch + committed-slice
observation, per the spike's verdict).
Red: (from Step 3, polarity flipped, scoped by the Step-3 testing-recipe decision) bare
`router.push` to a suspending screen keeps the previous screen mounted with no fallback flash
(asserted via rendered-tree queries); pending-id lifecycle incl. interruption (jest or simulator
per the recipe); native-urgent dispatch semantics per the supersede-vs-flush decision;
render-count budget tests incl. the multi-tab worst case.
Files: `react-navigation/core/useStoreSlice.tsx`, `useNavigationState.tsx`,
`core/useNavigationBuilder.tsx`, `core/BaseNavigationContainer.tsx`,
`global-state/storeContext.ts`, `global-state/useRouteInfo.ts`, `global-state/routeInfoCache.ts`.

### Step 6 — Decide what every state reader means during a pending navigation (D4)
In plain English: once navigations are transitions, "what is the current route" has a pending
window between a dispatch and its commit. Under the `useReducer` model (D1) the split is simple:
**everything outside the reducer reads the last committed tree; only the reducer sees the chained
latest.** This step walks through every reader, verifies it lands on the right side, with a test
per reader:

- Hooks that components render with — `usePathname`, `useSegments`, `useLocalSearchParams`,
  `useGlobalSearchParams`, sitemap — describe the **rendered** screen: they keep reporting the
  old route while pending, then update together with the screen (mechanically guaranteed after
  Step 5's `useRouteInfo` conversion; this step verifies).
- Logic that feeds the *next* navigation lives **inside the reducer** (relative-href resolution,
  action targeting — D1) and chains automatically. Imperative queries — `canGoBack`,
  `canDismiss`, `getStateForHref` — call the pure reducer against the last committed tree; verify
  each caller tolerates the pending window (a `canGoBack` during a pending push answers for the
  committed state, by design).
- The review's specific hazards get explicit decisions + tests here:
  **browser URL/history sync** (subscribes to the `'state'` event — must it be dispatch-timed so
  the URL bar never lags arbitrarily during a suspension?);
  **`useFocusEffect` cleanup** (blur fires at transition commit — outgoing screen's
  camera/audio/polling keeps running through the suspend window: acceptable? document or fix);
  **`useNavigationBuilder.getState()`** (public surface — must return the last committed tree,
  consistent with everything else outside the reducer);
  **`HrefPreview`** (reads `store.state` bare in a loop to render a parallel preview tree — the
  sharpest tearing edge; pin what it sees during a pending transition);
  **`getSeedState`** (bare `store.state` read at seed time — verify install-lifecycle reset
  makes it safe across sequential roots).
Files: `global-state/store.ts`, `global-state/router.ts`, `global-state/useRouteInfo.ts`,
`global-state/seedState.ts`, `link/preview/HrefPreview.tsx`,
`react-navigation/native/useLinking.ts`, `core/useNavigationBuilder.tsx`, `hooks/*` —
audit-driven.

### Step 7 — Transition semantics test pass
End-to-end unit coverage of the headline behaviors: bare `router.push` (router-owned transition),
caller `startTransition` composition and caller `isPending` (sync), async transition per the
spike's verdict, the interruption + mixed-priority matrix (second navigation while pending; back
while pending; native-urgent while pending — per the supersede-vs-flush decision),
protected/guarded routes (conditional-render + reset based, unaffected by R1) during pending
transitions, StrictMode (incl. `pendingActions` replay under transitions),
`NavigationIndependentTree` (per risk 5), `testing-library` ergonomics (risks 8–9). Mostly
tests; fix what they catch.

### Step 8 — Pending-state API: `useNavigationTransitionPending` + `useLinkStatus` (D3)
The monotonic-id pending signal (urgent "last issued id" + reducer-recorded "last reduced id";
pending derived from committed values — D3) exposed via context behind
`useNavigationTransitionPending()` (final name decided here); `useLinkStatus()` exposes
`{ pending }` via context from the nearest Link, backed by a per-Link `useTransition`. Red-first
per hook; RSC tests for the new exports.
Files: `link/Link.tsx`, `link/useLinkStatus.tsx` (new), `hooks/`, `exports.ts`.

### Step 9 — Verification, docs, changelog
`et check-packages expo-router`; manual verification in `apps/router-e2e` on iOS simulator + web
(lazy screen via push, suspending loader, swipe-back and native tab press with suspending targets,
pending indicators). Docs: new guide section (transitions with Expo Router) that **leads with the
UX inversion** (risk 8: tap → inert until ready; wire pending indicators; lazy-bundle
recommendation) and includes a **concrete root-`_layout` overlay pattern for a global pending
indicator** (review finding: native screen stacks have no natural host for one — show exactly
where to mount it, and steer to per-Link `useLinkStatus` as the primary pattern) + API reference
(`useNavigationTransitionPending`, `useLinkStatus`) via
`et generate-docs-api-data --packageName expo-router`; CHANGELOG entries: behavior change +
migration note, freeze override (risk 1), same-tick `canGoBack` change (D1); R1/R2 already carry
their own breaking-change entries on the base branch.

## Non-goals

- **TODO(prevent-remove): re-introduce navigation prevention** — the full surface (guards *and*
  the native swipe-block/`preventNativeDismiss` wiring) is removed in base-branch step R1; a
  separately-planned follow-up designs the replacement on top of the reducer model. The
  `TODO(prevent-remove)` markers left at the removal sites are the checklist.
- **TODO(action-telemetry): replacement dispatch-time telemetry** — `__unsafe_action__` and the
  public `actionDispatched` event are removed in base-branch step R2; a follow-up provides a
  replacement signal and migrates `expo-observe` (EAS Observe action timing). The
  `TODO(action-telemetry)` markers are the checklist. The removed `lastUnhandled` route-restore
  behavior is likewise a candidate to re-design on top of `pendingActions` if it proves missed.
- **Making native-induced navigations transitions** — deferred (decision A): requires driving
  native-controlled props (`navStateRequest`, dismiss bookkeeping) from the committed store
  instead of the rendered tree. Follow-up work.
- `useOptimistic`-based optimistic navigation state (natural follow-up once this lands).
- Driving/altering native gesture *animations* from JS — native owns the visual gesture; this
  branch only changes how the resulting JS state commit is scheduled.
- Any change to reducer/registry semantics from the base branch.
