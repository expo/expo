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
  Corrections the reviews forced on how this is done:
  - **The reducer's inputs must be explicit — and *current*, not init-frozen.** `getNavigateAction`
    today reads module-global mutables (`store.linking`/`getStateFromPath`, `store.redirects`,
    and — worst — `navigationRef.getRootState()` live, plus `store.assertIsReady` which throws).
    Inside a render-pure, replayable reducer those are purity violations. The fused reducer
    signature is `(state, action, registry, config) → state`, the state read is *only* the
    reducer's argument, and nothing reads through the ref or throws for readiness. Round-3
    correction: `config` **cannot be captured once at init** — `useStore` rebuilds
    `linking`/`redirects` on every render (Fast Refresh / route-file changes regenerate the
    linking config), so an init capture would misroute `router.push('/new-route')` after any
    route-tree change. `config` is threaded per reduction from a render-updated source (stable
    within a render pass — still an explicit input, just the current one), pinned with a
    Fast-Refresh/route-change test.
  - **Five standalone `getNavigateAction` callers convert to raw intents; one keeps resolving.**
    `usePreloadRoutes`/`usePreloadAnchor`, native-tabs first-visit tab press, the link-preview
    `__internal__PreviewKey` path, and warm deep links dispatch raw intent actions (the
    preview/PRELOAD variants become intent-action fields; preload `originKey` rides on the
    intent). **Exception: `TabsClient`'s `unstable_tabBarNavigateAction`** — it is a public typed
    option (`() => NavigationAction`) dispatched as-is by the vendored `BottomTabBar`; converting
    it breaks an external contract the other sites don't have. It keeps returning a resolved
    action (or its signature change gets its own CHANGELOG entry — decide at Step 2).
  - **Deep links, corrected (round 3).** Cold-start deep links never dispatch at all — `useStore`
    compiles the initial URL into the *seed* (the `hasPendingInitialURL` gate holds mount), so the
    mount-window worry doesn't apply to them. Warm links today dispatch **targeted** resolved
    actions (never deferrable); the raw-intent conversion must not regress that: the reducer
    resolves link intents into targeted reductions (carrying `payload.state` at the divergent
    boundary, as `getNavigateAction` does today) so they are never queue-eligible, and the
    malformed-link fallback (today: `getActionFromState` → `resetRoot`) gets an explicit
    reducer-side story rather than silently disappearing with the old try/catch.
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
   header-back-menu gating). Accepted regressions until the follow-up, enumerated (round 3):
   (a) no screen can block a native swipe-back; (b) **web modals with unsaved state become
   gesture-dismissible** (vaul's `dismissible={false}` is a data-loss guard, not styling);
   (c) the header-back-button long-press menu can no longer be disabled for guarded routes
   (multi-screen route-around); (d) the `useInvalidPreventRemoveError` diagnostic goes with it.
   These exports are public on the `expo-router/react-navigation` subpath — breaking-change
   CHANGELOG entry required.
   **TODO(prevent-remove)** markers at every removal site are the reintroduction checklist; the
   follow-up design is planned separately. Note (review correction): protected/guarded routes are
   unaffected — they are conditional rendering (`Protected` → `Redirect` + guarded-route reset),
   independent of prevent-remove, not reducer logic.
2. **The unhandled-action *reporting* machinery is removed fully (base-branch step R2), including
   `lastUnhandled` — but the verdict fields survive R2 (round-3 correction).**
   `UnhandledActionContext`, the `onUnhandledAction` container prop, the default console error,
   ExpoRoot's test-env throw, and the `UNSTABLE_routeNamesChangeBehavior: 'lastUnhandled'`
   route-restore feature that rides on the context all go in R2. R2 also removes
   **`__unsafe_action__`** and expo-router's public `actionDispatched` re-emit. But the
   `handled`/`noop` verdict fields themselves are **load-bearing beyond reporting** on the base
   branch — `canGoBack`/`canDismiss` consume them, the noop-`setState` skip depends on them, and
   the replay gate reads `handled` — so removing them in R2 would break the build. The verdict is
   eliminated on the *transitions* branch in Step 2, where `pendingActions` replaces the replay
   gate and `canGoBack`/`canDismiss` switch to referential identity
   (`rootReducer(state, GO_BACK, …) !== state` — the reducer already returns identical state for
   noops). Shared verdict-shape test assertions are **rewritten** to referential-identity form,
   not deleted. **TODO(action-telemetry): `expo-observe` consumes `__unsafe_action__` for EAS
   Observe action timing, and `actionDispatched` is public — a follow-up provides a replacement
   dispatch-time telemetry signal and migrates `expo-observe`; leave `TODO(action-telemetry)`
   markers at the removal sites.** Breaking-change CHANGELOG entries for `onUnhandledAction`,
   `lastUnhandled`, and `actionDispatched`.
3. **Mount-window replay** is redesigned to fit the pure reducer — see below.
4. **`RECONCILE_ROUTE_NAMES` needs a new completion signal** (review finding, sharpened round 3).
   `useNavigationBuilder` dispatches it from a layout effect and reads the returned `handled`
   verdict synchronously to advance its route-key ref **within the same commit**; the dev
   identity-invariant tolerates render divergence only while a reconcile is pending — a
   same-commit contract. Under `useReducer`, dispatch returns void and the reconcile lands one
   commit later, adding an intermediate commit the invariant as written would false-positive on.
   The redesign: the reconcile dispatch is urgent (internal bookkeeping, not navigation); the ref
   advance happens in the same render that first observes the reconciled committed slice; and the
   invariant's tolerance widens to "reconcile pending **or** reconcile committed but ref not yet
   advanced". Spike item (h) covers it; Step 5 implements it with this exact shape.

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
  non-idempotent append would double-queue. (Two identical pushes are distinct objects and both
  land; verify none of the converted call sites dispatch a *reused* action object twice.)
- **Deferrability is gated by source, not just target (round-3 correction).** The old gate
  (`PRELOAD` or target-less) is not enough: native *dismiss* paths carry `target`, but Android
  hardware back dispatches `GO_BACK` and the native-tabs press fallback dispatches `NAVIGATE` —
  both target-less. Under the old gate a native GO_BACK in a mount window would be queued and
  urgently replayed: the double-pop the plan previously called impossible. The rule:
  **urgent-native-source actions never enter `pendingActions`, regardless of target** (the D5
  source tag decides), and JS-side deferrability keeps the `PRELOAD`/target-less shape. Pinned by
  tests covering *untargeted* native GO_BACK/NAVIGATE, not just targeted POP/JUMP_TO.
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
+ test. Also owned plainly (round 3): re-introducing a committed-tree mirror **reverts the base
branch's own "retire the state mirror" commit** (which made `store.state` a live ref read) —
`navigationRef.getRootState()` re-points at the mirror, published from the container's commit
path, and the base branch's single-source-of-truth note gets updated accordingly. The audit (Step 6) must also cover the two bare `store.state` readers the review found
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

**Install lifecycle — scoped precisely (round 3).** The root installs its `dispatch` and the
committed-tree mirror into `global-state/store.ts` on mount, uninstalls on unmount — `router.*`
reaches React through that. **Only those two install on mount**: the seed, `linking`,
`redirects`, and `routeNode` stay render-populated by `useStore` exactly as today, because
`getSeedState` (the `useReducer` initializer) and `HrefPreview` read them *during the first
render*, before any effect. Test isolation and `NavigationIndependentTree` resolve per root
instance by construction; only the app root installs globally.

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
evaluate **supersede-over-flush** — with the round-3 correction on what is mechanically possible:
React's queue cannot *dequeue* a pending update; the superseded transition action **will**
re-reduce after the urgent one. Supersede is therefore **reduce-to-no-op**: the reducer must
recognize, from committed state alone, that a re-reduced transition action is stale (the urgent
action recorded enough for that judgment) and return state unchanged — recording the abandoned
navigation id (D3). The spike's deliverable is that staleness predicate, not a yes/no; Step 7
tests it.

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

> **Correction (found during execution, 2026-07-22 — Step 1). This deletion cannot happen before the
> Step 5 render-flip; it is moved into Step 5** (see Steps). The routing queue's `useSyncExternalStore`
> notify + `useEffect` drain provide a **one-React-cycle deferral** that turns out to be load-bearing:
> a navigation that targets — or is fired from the mount effect of — a **nested navigator still
> mid-mount** must resolve *after* that navigator has populated its committed nested state (which
> lands a later commit). Resolving synchronously at dispatch — whether at the call site **or inside
> the reducer** (both verified empirically) — sees the nested route *without* its state, so
> `getNavigateAction` emits a root-level **subtree-replacing** action → the nested layout **remounts**
> and params attach at the wrong level. Only a render path driven by React's **deferred reduction**
> (the Step 5 `useReducer` flip) reproduces the queue's deferral natively — Step 2's eager-reduce
> render path is still synchronous, so removing the queue at Step 1 *or* Step 2 regresses
> nested-navigator navigation (repro: `__tests__/issues.test` "can navigate during first render of
> nested navigator" → double-mount; `__tests__/tabs.test` "set params for dynamic route via href,
> nested stack" → param lands as `[id]`). The design below is the end state; it now lands in **Step 5**.

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
  the round-2 review and pinned down per round 3. A naive increment-at-dispatch /
  decrement-at-commit counter is **not well-defined** under React's transition semantics
  (entangled transitions: two increments, one completion; superseded transitions never
  "complete"). Instead, pending is **derived from committed state via monotonic ids**: every
  transition-wrapped dispatch is tagged with a monotonic navigation id; "last issued id" lives in
  a small piece of state updated **urgently** (outside the transition scope — mandatory, or the
  indicator would be deferred behind the very slow commit it exists to cover); the reducer
  records the id inside the navigation state; `pending = lastIssued > lastReduced`, computed from
  committed values. **The accounting invariant (round 3 — this is what makes it correct): every
  issued id is eventually recorded in committed state, as applied or abandoned.** Concretely,
  the reducer sets `lastReduced = max(lastReduced, action.navId)` whenever the action carries an
  id — including when the reduction is a **noop** (recording the id changes state identity, which
  also defeats React's identical-state bailout that would otherwise swallow the commit), when the
  action is **appended to `pendingActions`** and later **dropped** (the drop is itself a
  reduction that records the id), and when a **supersede** turns the replayed transition action
  into a no-op (abandonment counts as accounted). Urgent native dispatches carry no id and never
  touch the field. Without this invariant, a superseded or dropped navigation wedges the
  indicator at `pending: true` forever. Not backed by `useTransition().isPending`:
  hook-`isPending` only tracks that hook's own `startTransition` and is fragile for dispatches
  originating on non-React stacks.
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
   duration, mid-flight pending values, native-urgent-flush interleavings). **Round-3 verdict:
   the concurrent-root branch is effectively dead** — React 19 + RNTL 13.3 renders through
   react-test-renderer's legacy root with forced fake timers; a transition cannot yield
   mid-render in that stack. So the decision is made now, not at Step 3: **mid-flight assertions
   (pending values, urgent-flush, supersede) are simulator-only**; jest keeps final committed
   states, fallback-absence across an awaited `act` (rendered-tree queries + controllable
   promises), `pendingActions` replay final states, the same-tick `canGoBack` change, and the
   Step-2 shadow deep-equal. Step 3's recipe work is reduced to building the fixtures and
   confirming this classification, and Step 5's red list is scoped to the jest-able set up front.
   **Step-3 confirmation (empirical, `transitions-characterization.test.ios.tsx`):** the
   classification holds. The two jest-observable suspense shapes are (i) fallback-present +
   origin-unmounted immediately after `act(() => router.push())` to a still-pending screen, and
   (ii) destination committed when the promise resolves *inside the same act* that commits the
   navigation (no timer flush needed). The fallback→content *recovery* across separate act
   boundaries is **not** observable (no fake/real-timer or `runAllTimersAsync` flush surfaces it) —
   direct evidence for the simulator-only verdict. So a route's own `SuspenseFallback` at a leaf is
   ignored (only layout fallbacks are honored — `useScreens.tsx`); attach it at a nested layout.
   Step 5's red list asserts final committed states via rendered-tree queries, never a mid-flight
   recovery. See `steps/Step-3.md`.
10. **StrictMode.** Explicit coverage for the mount-window replay under transitions and for
    `getState`/`deepFreeze` idempotency under interrupted (speculative) transition renders — pin
    the "no `getState()` consumer has side effects" invariant.

## Steps

Order: **R1 → R2 (standalone, on the base branch)**, then 2 → 3 (spike) → 4 → 5 (atomic core;
**absorbs the former Step 1** queue deletion — see below) → 6 → 7 → 8 → 9 on the transitions branch.
Each step keeps the full suite green; Step 5 is the only one allowed to be atomic-across-one-commit.
(**Step 1 was resequenced into Step 5 during execution** — the routing queue can't be removed until
the render path is driven by deferred reduction; see the D2 correction and the Step 1 note below.)

### Step R1 (base branch) — Remove prevent-remove fully
Landed as a standalone step directly on
`@ubax/eng-21996-change-the-state-in-expo-router-to-be-global` (the transitions branch rebases on
top). Remove the entire prevent-remove path per D1 item 1: `shouldPreventRemove` in
`dispatchRoot`, the `changedSlices` production in `rootReducer` (sole consumer), the
`beforeRemove` emission, `usePreventRemove`/`usePreventRemoveContext`/`PreventRemoveProvider`,
and the render-time consumers (`preventNativeDismiss` + header-back-menu gating in
native-stack, the experimental-stack equivalent, web `ModalStack` `dismissible` gating).
`TODO(prevent-remove)` markers at every removal site. Delete the feature's tests with it — and
rework the tests that depend on the wrapper indirectly: `SuspenseFallback.test` filters a
console-error spy by the `PreventRemoveProvider` component name, so its premise must be
re-examined when the wrapper disappears from every navigator's tree.
Red: suite green with the surface gone; an iOS characterization note records the accepted
regressions (D1 item 1's enumerated list). Breaking-change CHANGELOG entry
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

### Step 1 — Delete the routing-queue machinery, keep a minimal pre-ready buffer (D2) — RESEQUENCED INTO STEP 5
> **Resequenced (2026-07-22).** Attempted as a standalone step; execution proved the queue's
> one-React-cycle deferral is load-bearing until the Step 5 `useReducer` render-flip (see the D2
> correction). Removing the queue here — before deferred reduction drives rendering — regresses
> nested-navigator-during-mount navigation, and no resolution-site move fixes it (call-time **and**
> reduce-time both verified to fail; the committed nested route has no state yet at synchronous
> resolution time). So the queue deletion + pre-ready buffer **move into Step 5**, which is the first
> point a synchronous dispatch resolves against a fully-populated tree. The original spec below is
> preserved as the *design* for that deletion, to be applied in Step 5. (Workflow artifacts from the
> attempt: a red-first test rewrite that proved the mismatch — reverted; not committed.)

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
> **Corrections (found during execution, 2026-07-22 — Step 2).** Step 2 as executed = **the
> substrate swap + shadow-compare only** (behavior-neutral). Four originally-bundled sub-changes are
> entangled with the Step-5 render-flip and **moved to Step 5** (full analysis in `steps/Step-2.md`,
> scope checklist under Step 5), each one line:
> - **(a) Resolution fusion** (`getNavigateAction`→reducer + five caller conversions) — reduce-time
>   resolution regresses nested-navigator-during-mount; the queue's deferral is load-bearing until the flip.
> - **(b) State-carried `pendingActions`** — a pure reducer can't requeue only once render-authoritative;
>   Step 2's reducer still runs imperatively, so mount-window replay stays ref-based (`pendingReplayRef`).
> - **(c) Verdict elimination** — `dispatchRoot`'s boolean has same-commit `useNavigationBuilder`
>   consumers tied to the Step-5 `RECONCILE_ROUTE_NAMES` redesign; the referential-identity `canGoBack`
>   the plan named is a **bug** (see Step 5).
> - **(d) Install lifecycle** — neither the mirror nor the installed `dispatch` has a Step-2 consumer.
>
> The Step-2 Red-list items depending on (a)–(d) (replay via `pendingActions`, native-source-never-queued,
> the same-tick `push();canGoBack()` behavior *change*) are correspondingly Step-5 pins or Step-2
> characterizations (behavior unchanged in Step 2). The design paragraphs below are the end state.

`BaseNavigationContainer` replaces `useSyncState` with
`useReducer(rootNavigationReducer, seed)` (R1/R2 already stripped the dispatch-time side
channels on the base branch, so `dispatchRoot` collapses to `dispatch(action)` — not yet
transition-wrapped). `getNavigateAction` fuses into the reducer as
`(state, action, registry, config) → state` with `config` (linking + redirects) threaded per
reduction from the render-updated source and no module-global/ref reads (D1); five standalone
`getNavigateAction` callers convert to raw intent dispatches (`unstable_tabBarNavigateAction`
keeps resolving — D1), with link intents resolving to *targeted* reductions and the
malformed-link fallback preserved (D1). Mount-window replay becomes the hardened state-carried
`pendingActions` mechanism (idempotent identity-keyed append, source-gated deferrability —
urgent-native never queues, urgent replay, drop-after-one-retry — D1). The root installs
`dispatch` + the committed mirror into `global-state/store.ts` on mount, uninstalls on unmount
(seed/linking/redirects stay render-populated — D1 install lifecycle).
Staging scaffolding for behavior-neutrality: a temporary eager reduce (same pure fused reducer,
last committed tree, same `config`) feeds the store mirror synchronously through the sync
`setState` path (not the batched one — same-tick chaining depends on it), so the existing uSES
read sites behave exactly as today. The shadow `useReducer` reduces the same actions in parallel
**but its output drives no render** (compute-and-compare only, discarded until Step 5) — round-3
correction: letting both trees drive rendering would double renders per dispatch and split the
slice cache across two tree identities, so the shadow is **value-neutral by construction, and
render-count budgets are meaningless until Step 5 regardless**. A dev assertion checks both trees
deep-equal every commit (the shadow-compare that de-risked the base branch's own flip). Two more
review-found caveats: the deep-equal can legitimately diverge on the two nanoid-minting paths
(keyless `RESET` payloads in `BaseRouter`, the empty-reconciliation fallback in `StackRouter`) —
special-case or make those keys deterministic first; and with R1/R2 landed the reducer path has
no side effects left, which is what makes double-reduction safe at all. This scaffolding has no
product role and is deleted in Step 5. Step 2 also performs the verdict elimination deferred from
R2 (D1 item 2): `handled`/`noop` fields go, `canGoBack`/`canDismiss` switch to referential
identity, verdict-shape tests rewritten.
Red: two same-tick dispatches chain correctly (incl. relative hrefs), replay/mount-window behavior
via `pendingActions` (incl. native-source-never-queued, targeted *and* untargeted —
GO_BACK/tab-NAVIGATE), `onStateChange` timing,
same-tick `push(); canGoBack()` behavior change pinned, shadow deep-equal across the suite,
`renderRouter` isolation across sequential renders, independent-tree non-interference (risk 5).
Files: `global-state/store.ts`, `global-state/rootReducer.ts`,
`global-state/getNavigationAction.ts`, `global-state/router.ts`,
`react-navigation/core/BaseNavigationContainer.tsx`,
`react-navigation/core/useSyncState.tsx` (deleted or absorbed), the five raw-intent call sites.

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
**Exit criteria (risk 9, pre-decided per round 3)**: confirm the simulator-only classification of
mid-flight assertions and deliver the jest fixtures (controllable suspending promises, non-sync
import-mode escape hatch) for the jest-able set.
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
Files (round-3 corrected — `fork/native-stack/`'s view wrapper is dead code and
`layouts/StackClient.tsx` renders no screen):
`react-navigation/native-stack/views/NativeStackView.native.tsx`,
`react-navigation/stack/views/Stack/CardStack.tsx`,
`react-navigation/bottom-tabs/views/BottomTabView.tsx`,
`react-navigation/drawer/views/DrawerView.tsx`, `ui/TabSlot.tsx` (forwards straight to
rn-screens' `<Screen>` — no react-freeze anywhere in expo-router, prop injection suffices).

### Step 5 — The flip: navigators read React state; JS-initiated commits become transitions (atomic core)
> **Pickup from Step 2 (2026-07-22).** Step 2 executed as the substrate-swap + shadow-compare only.
> Four sub-changes deferred here (detail + code-verified rationale in `steps/Step-2.md`):
> - **(a) Resolution fusion** — `getNavigateAction`→reducer + the five raw-intent caller conversions
>   (queue deferral is load-bearing until this flip; already the absorbed D2 work below).
> - **(b) State-carried `pendingActions`** replay redesign — a pure reducer can't requeue only once
>   it's render-authoritative; Step 2 kept `pendingReplayRef` because its reducer still ran imperatively.
> - **(c) Verdict elimination** (`handled`/`noop` removal, `canGoBack`/`canDismiss` off the verdict)
>   — `dispatchRoot`'s boolean has same-commit consumers in `useNavigationBuilder` tied to the
>   `RECONCILE_ROUTE_NAMES` redesign already scoped here; verdict-shape test rewrites belong here too.
> - **(d) Install lifecycle** — `dispatch` + committed mirror into the global store (the queue
>   deletion needs the installed `dispatch`; the flip needs the mirror).
>
> **⚠ Plan bug to fix, not implement as written (do NOT ship `canGoBack`/`canDismiss` as
> `reducer(...) !== committed`).** The plan's referential-identity switch is **unsound**:
> `rootReducer`'s handled-noop path returns `currentTree` from `replacePathState` (`rootReducer.ts`),
> which rebuilds every ancestor via `{ ...parent, routes }` *even when the reduced slice is
> unchanged*. So for a **nested** focused navigator (stack-under-tabs-under-root — the common case) a
> genuine no-op returns a **fresh, deep-equal-but-non-identical** root: `currentTree !== tree`.
> `reducer(GO_BACK) !== committed` would then report `canGoBack: true` for a stack that cannot pop.
> Only root-targeted noops preserve identity. Step 5 must **either** make the reducer return the
> identical `tree` reference on every no-op (add a `changed ? currentTree : tree` guard at each
> handled-noop return — part of the flip's own "reducer guarantees noop identity" work) **or** keep
> an explicit `changed` bit rather than relying on referential identity. Pin with a nested-noop
> `canGoBack` test.
>
> **Accumulated Step-5 scope (checklist + suggested internal sub-order).** This step now carries a
> large pile; sequence it rather than discovering it:
> 1. **Reducer noop-identity guarantee** (the (c) prerequisite above) — make no-op reductions return
>    the identical tree reference; land + test first, everything else leans on it.
> 2. **`RECONCILE_ROUTE_NAMES` completion-signal redesign** (D1 item 4) — urgent dispatch + same-render
>    committed-slice observation; widen the `useNavigationBuilder` dev identity-invariant tolerance.
> 3. **Verdict elimination** (c) — remove `handled`/`noop`; switch `canGoBack`/`canDismiss` to the
>    noop-identity check from (1); rewrite verdict-shape tests (`rootReducer.test`,
>    `BaseNavigationContainer.test` reducer mocks) to the new observable.
> 4. **The flip** — navigators read the `useReducer` tree via context; JS-initiated dispatch wrapped
>    in `React.startTransition` (source tag, D5); native/replay stay urgent; slice-keyed memo layer
>    (risk 3); delete the Step-2 shadow scaffolding (grep `shadow`/`createShadowReducer`/`reduceRoot`
>    split/`__setShadowAssertEnabled`/`shadowCompare.ts`).
> 5. **Queue deletion + resolution fusion** (a) — delete `useImperativeApiEmitter` uSES/effect drain;
>    fuse `getNavigateAction` into the reducer (`(state, action, registry, config)`); convert the five
>    raw-intent callers; keep the minimal pre-ready buffer. Pin with the two repro canaries
>    (`issues.test` nested-first-render single-mount; `tabs.test` dynamic-href param).
> 6. **State-carried `pendingActions`** (b) — replace `pendingReplayRef` with the hardened
>    identity-keyed append; source-gated deferrability (needs the D5 tag from step 4).
> 7. **Install lifecycle** (d) — install `dispatch` + committed mirror into `global-state/store.ts`.
> (Steps 1–4 are the atomic core that must land together; 5–7 ride in the same commit but are listed
> separately so they can be built and tested incrementally before squashing.)

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

**Absorbs the former Step 1 (D2 queue deletion), now safe here.** With rendering driven by the
`useReducer` (reduction deferred to render, after mount/registration effects), the routing queue's
one-React-cycle deferral is finally redundant, so this step also deletes `useImperativeApiEmitter`'s
uSES subscription + `useEffect` drain, points `router.*` at the installed `dispatch` directly (raw
intents resolved in the reducer — D1/D2), and keeps the **minimal pre-ready buffer** (a dumb array
that buffers only pre-ready intents and drains when the ref attaches). This is the first point a
synchronous dispatch resolves against a fully-populated committed tree, so the
nested-navigator-during-mount regression that blocked doing it earlier does not occur — pin it with
the two repro tests from the D2 correction (`issues.test` nested-first-render single-mount;
`tabs.test` dynamic-href param). See the preserved Step 1 spec for the deletion's design detail.

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
`global-state/storeContext.ts`, `global-state/useRouteInfo.ts`, `global-state/routeInfoCache.ts`;
plus the absorbed D2 queue deletion — `global-state/routingQueue.ts` (mostly deleted),
`global-state/router.ts`, `imperative-api.tsx`, `fork/NavigationContainer.tsx`.

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
recommendation) and includes a **concrete global-pending-indicator pattern that actually works on
iOS** (round-3 finding: a sibling `View` in the root `_layout` does *not* overlay a native
`ScreenStack` or modal presentations — the pattern must use react-native-screens'
`FullWindowOverlay`, or steer to per-Link `useLinkStatus` rendered inside the screen as the
primary recommendation) + API reference
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
