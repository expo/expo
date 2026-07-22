# Step 5 — The flip: navigators read React state; JS-initiated commits become transitions (atomic core)

Branch: `@ubax/eng-transitions-support-in-expo-router`, at `602d3117f6c` (`[step 4]` freeze-off +
render-count-baseline PLAN correction). Scope source: PLAN.md **Step 5** (the accumulated 7-item
checklist + suggested sub-order), **D1–D5**, **risks 3/9**, and the deferral detail in
`steps/Step-2.md` / `steps/Step-1.md` (resolution fusion) / `steps/Step-3.md` (jest classification,
rendered-tree-query rule) / `steps/Step-4.md` (freeze baseline, render-count worst case deferred here).

This is the atomic core: the first step that changes user-facing navigation behavior. It lands as a
single commit but is built and tested in the 7 sub-steps below (PLAN's suggested sub-order), each
kept green before the next.

## ⚠️ Lead with this — the one genuine scoping question I need to resolve before coding

The PLAN's Step-5 sub-order item 5 says "fuse `getNavigateAction` into the reducer
(`(state, action, registry, config)`); convert the five raw-intent callers." Reading the live code,
**only ONE of the "five callers" produces a queue-eligible `ROUTER_LINK` intent that the
mount-window deferral is load-bearing for: `router.push`/`linkTo` (via `routingQueue`).** The other
four are already **resolved-action** dispatches fired from **post-commit effects**, not call-time:

- `usePreloadRoutes` / `usePreloadAnchor` → `getPreloadAction(...)` → a fully-resolved
  `PRELOAD`/`FRONT_PRELOAD` action carrying `payload.state`, dispatched via `navigation.dispatch`
  (targeted by `originKey`) **from a `useEffect`**. The reducer already has PRELOAD handling.
- native-tabs first-visit (`NativeBottomTabsNavigator.tsx:201`) → `getNavigateAction(href, {})`
  computed in render but only dispatched on a tab press callback.
- link-preview `__internal__PreviewKey` → rides the `ROUTER_LINK` path (it is a `linkTo` option), so
  it is *already* the `router.push` case, not a separate caller.

So the true fusion requirement is narrower than "five callers": **`ROUTER_LINK` must resolve inside
the reducer** (that is the load-bearing mount-window case — Step 1/2 proved call-time and
eager-reduce-time both regress the two canaries). The preload/native-tabs sites read the *committed*
tree from an effect, after registration, so their resolution is already safe where it runs and does
**not** need to move into the reducer to fix a canary. Moving them buys purity-cleanliness (no
module-global reads from an effect) but is **not** required for correctness or the canaries.

**Decision (surfaced, not improvised):** fuse **`ROUTER_LINK` resolution into the reducer** (the
load-bearing case). For the preload/native-tabs/deep-link sites, convert them to **raw intents
resolved in the reducer only if doing so is behavior-neutral and reduces purity risk**; otherwise
leave them resolving in their effect (they already read the committed tree correctly there) and
record the residual `store`-global read as a Step-6 audit item. The PLAN's "five callers" language
predates the Step-1/2 discovery that resolution timing — not resolution *location* — is what the
queue deferral solved; the canaries only exercise the `ROUTER_LINK`/`router.push` path.

**If a review agent shows a preload/deep-link site genuinely needs reducer-fusion to stay green or
to satisfy the purity contract under transitions, I fold it in; otherwise the minimal correct fusion
is `ROUTER_LINK` only.** This is the single place Step 5's spec meets the code with a scope choice —
resolving it before coding, per the kickoff rule.

## 3-lens review fold-in (correctness / architecture / test-strategy — fresh Opus agents on this note vs live code)

Three findings materially change the design. Folded into the sub-steps below; the load-bearing ones:

**[correctness, HIGH] `applyRedirects` calls `Linking.openURL` and `getNavigateAction` calls
`console.error` — both are side effects that CANNOT run inside the double-invoked pure reducer.**
Confirmed: `getRoutesRedirects.tsx:33` (`Linking.openURL` on an external redirect) and
`getNavigationAction.ts:57` (malformed-link `console.error`). React invokes the reducer eagerly at
dispatch + at render + on replay, so a verbatim fusion fires `openURL` 2+ times and double-logs.
**Design consequence (sub-step 5):** the `ROUTER_LINK` resolver split into a **pure core** (href →
`getStateFromPath` → `findDivergentState` → resolved action, reading only `state`+`config`+registry)
that runs in the reducer, and the **effectful pre-steps** (external-redirect `openURL`, redirect
following that terminates in an external hop, malformed-link logging) that stay in the **dispatch
funnel** in `router.ts` *before* the raw intent is dispatched. External redirects and malformed
links never become a `ROUTER_LINK` reduction at all — the funnel handles them (open URL / drop) and
dispatches nothing. Only internal, resolvable links dispatch `ROUTER_LINK` and resolve purely in the
reducer. This preserves the funnel's current external/malformed behavior and keeps the reducer pure.

**[architecture, HIGH] The slice-keyed memo layer must NOT be a new wrapper + new context. The
per-navigator slice channel already exists.** Confirmed against `SceneView.tsx:107-122` +
`useDescriptors`: `SceneView` already provides `NavigationStateContext value={{ state: routeState,
… }}` where `routeState` is the child navigator's slice, and the child `useNavigationBuilder` reads
it back as `currentState` (`:435`). Today the child **discards** it for render and re-subscribes via
`useStoreSlice(key)` (`:460`) — the uSES subscription is the bail-out. **Corrected flip shape:**
render each navigator from the parent-handed `currentState` (drop the `useStoreSlice` render read;
keep `getCachedSlice` only in the imperative `getState`), and put a `React.memo` bail-out at the
`SceneView` boundary keyed on `routeState` **object identity** (root reducer + sub-step 1 guarantee
an unchanged child slice keeps identity). This restores today's per-slice bail-out with the existing
propagation path — no second slice context, no root-tree re-walk per navigator. Only the **container**
consumes the root `useReducer` tree; every navigator consumes only its handed slice. **Memo-key
constraint (HIGH-3):** the key must be the full `routeState` object, not a derived focused key — a
focus change *is* a slice-identity change, so the boundary re-renders on focus and `useIsFocused`
(unconverted, event+`FocusedRouteKeyContext`) keeps working. Pin with a `useIsFocused`-across-tab-
switch test.

**[test, HIGH] `singleWriter.test.ios.tsx` is missing from the red list and directly contradicts the
flip** (source-string pin: exactly one `setState(result.state)` in `dispatchRoot`; `store.state ===
getRootState()` as a *live* read). The flip moves `setState` to a commit effect and makes
`store.state` a *lagging* commit mirror. **Add its rewrite to sub-step 4/7** — rename/repin to the
new lagging-mirror invariant (store answers the committed/pre-transition tree).

**[correctness+test, HIGH] Verdict collapse must keep an unhandled-vs-handled-noop signal for the
replay gate.** Both become `state===tree` under sub-step 1, but the mount-window gate needs to know
"unregistered-origin `ROUTER_LINK`/nested intent that couldn't reduce" (deferrable) vs "handled
no-op". The reducer keeps emitting a **deferrable marker** (via `nestedBoundary`/an explicit
`deferred` flag) for the replay-eligible case; `canGoBack`/`canDismiss` use pure identity
(`state!==committed`), independent of that marker. Verdict-shape test rewrites assert the surviving
marker, NOT bare identity (else tautology).

**Other folded corrections:**
- [correctness, HIGH] `pendingActions` dedupe key = the **raw `ROUTER_LINK` intent identity** (stable
  — `router.push` dispatches one object), never the resolved action (fresh each invocation).
- [correctness, MEDIUM] two more direct `getNavigateAction` callers the "five" language missed:
  `TabsClient.tsx:92/122` (`unstable_tabBarNavigateAction` — the PLAN's explicit KEEP-resolving
  exception) and `fork/useLinking.native.ts:195` (warm deep link). Both run post-commit (safe where
  they run) but **break if `getNavigateAction`'s signature changes.** Keep a thin store-reading
  wrapper (`getNavigateActionFromStore(href, options)`) for these two + native-tabs; the pure core
  is a separate export the reducer uses. No behavior change to these sites.
- [architecture, MEDIUM] two funnels: transition-wrap the **`router.ts` imperative funnel + `Link`
  press only**; `dispatchRoot` decides urgent-vs-transition by an `urgent` option (native views reach
  `dispatchRoot` via `onAction`, not `router.ts`). A single `dispatchRouterAction(action,{urgent})`
  in `router.ts` is the JS funnel; the module-level `React.startTransition` wraps its `dispatch` call.
- [architecture, MEDIUM] store mirror = a plain `React.useRef` written from the commit effect, not a
  resurrected uSES `createStore` (the flip removes the store's only reason to exist — its render
  `subscribe`). Point `getState`/`getRootState`/`store.state` at the ref. `deepFreeze` moves to the
  mirror write; the in-flight `useReducer` value stays unfrozen (never freeze a speculative render).
- [architecture, MEDIUM] install gated on `!independent` (already computed
  `BaseNavigationContainer.tsx:82`); uninstall via compare-and-clear (only clear if the installed
  `dispatch`/mirror is still this one — mirror `removeEntry`'s identity guard, `storeContext.ts:38`).
- [architecture, LOW] `useNavigationState` reads `NavigationStateListenerProvider` (commit-timed
  layout-effect broadcast of the render `state`), NOT the nav store — it may need **no change**;
  verify and drop from the conversion list if so (it is not a real Blocker-1 de-opt, like
  `useIsFocused`'s event subscription).
- [correctness/arch, HIGH-5] RECONCILE ref-advance must be **monotonic** (once `routeKeyList`
  observed committed, never un-advance) to survive an interrupted transition regressing the handed
  slice; invariant tolerance = "pending OR committed-not-advanced OR advanced".
- [test] red-item tightening: item 1 asserts **referential** `reduceRoot(...).state === committed`
  (not `toMatchObject`, which passes on the buggy deep-equal tree); item 7 must vary the SOURCE
  dimension (same untargeted action: native → not queued, JS → queued) or it's a tautology; item 9
  reuses the exact-count shape from `renderCount.test:49-57` (+ assert tab N's counter stays 0 on a
  commit that doesn't change its slice), not a loose `<=N` budget; item 2 spies `console.error` to
  prove the dev invariant does not false-fire; item 8's `push();canGoBack()` must NOT be `act`-wrapped
  (or it flushes and becomes a tautology). Rewrite `BaseNavigationContainer.test` reducer mocks
  (`:177,245`) + the `__setShadowAssertEnabled(false)` call in the same commit (shadow deleted).

## The 7 sub-steps (PLAN sub-order) — design

### Sub-step 1 — Reducer noop-identity guarantee (prerequisite for verdict elimination)

**The plan bug (confirmed against `rootReducer.ts`).** A handled no-op returns `currentTree`, which
went through `replacePathState` (`:280`): for a nested focused navigator every ancestor is rebuilt
`{ ...parent, routes }` **even when the reduced slice is unchanged**, so `currentTree !== tree` on a
genuine no-op. `reducer(GO_BACK) !== committed` would then falsely report `canGoBack: true`.

**Fix:** make `reduceRoot` return the **identical `tree` reference on every no-op**. The reducer
already tracks a `changed` bit (`rootReducer.ts:102`, set at `:183`/`:193`). Every `return`
currently does `noop: !changed` — but returns `currentTree` regardless. Change every handled return
to `state: changed ? currentTree : tree`. Then `noop ⟺ state === tree` becomes an exact,
referentially-observable invariant, and `canGoBack`/`canDismiss` can switch to
`reduceRoot(...).state !== committed` (equivalently the identity check) safely at any nesting depth.

Pin: a nested-noop `canGoBack` test (stack-under-tabs-under-root, focused stack has one entry →
`canGoBack()` must be `false`), red-first by asserting identity before the guard exists.

Note: `focusAncestors` can also rebuild ancestors while reporting `changed:false` for a
pure-refocus that is actually a no-op — the `changed ? currentTree : tree` guard at the return sites
subsumes it because `changed` already OR-accumulates `focusResult.changed`. Verify the guard is at
**every** `handled` return (there are ~6 in `reduceRoot`).

### Sub-step 2 — `RECONCILE_ROUTE_NAMES` completion-signal redesign (D1 item 4)

Today (`useNavigationBuilder.tsx:621-647`): a **layout effect** dispatches `RECONCILE_ROUTE_NAMES`
and reads the returned `handled` boolean **synchronously in the same commit** to advance
`previousRouteKeyListRef`. The dev identity-invariant (`:581-591`) tolerates render/committed
divergence only while `needsRouteNamesReconcile` is true — a same-commit contract.

Post-flip, `dispatchRoot` no longer returns a synchronous verdict at all (verdict eliminated,
sub-step 3), and dispatch is `React.useReducer`-backed so the reconcile lands one commit later. The
redesign (PLAN D1 item 4 / Step-3 (h) validated shape):

- The reconcile dispatch is **urgent** (internal bookkeeping — never a transition).
- The ref advance happens in the render that **first observes the reconciled committed slice**
  (i.e. `reconciliationState.routeNames` now equals `routeNames` and `routeKeyList` matches), not
  synchronously off a boolean.
- The dev invariant's tolerance widens to **"reconcile pending OR (reconcile committed but ref not
  yet advanced)"** — one extra intermediate commit is legal.

Mechanically: replace the `const handled = dispatchRoot?.(...)` + `if (handled)` with an
unconditional urgent `dispatchRoot(reconcileAction, { originKey, urgent: true })` when
`needsRouteNamesReconcile`, and advance `previousRouteKeyListRef.current = routeKeyList` in the
layout effect **guarded by "the committed slice now reflects this routeKeyList"** (compare
`reconciliationState` route-name/key list against `routeKeyList`). The invariant check gains the
"committed-but-not-advanced" clause.

### Sub-step 3 — Verdict elimination

Remove `handled`/`noop`/`nestedBoundary` from `RootReducerResult`? **No — `nestedBoundary` stays**
(it drives `pendingActions` deferrability, sub-step 6). What goes: the `handled`/`noop` booleans as a
*return-value contract consumed at dispatch time*.

- `RootReducerResult` collapses toward `{ state, nestedBoundary? }`. `reduceRoot` still needs to
  distinguish "unhandled" (return `tree` + a signal) from "handled no-op" (return `tree`) — but with
  sub-step 1's identity guarantee, **`state === tree` means no-op** and the only remaining
  dispatch-time consumer that needed `handled` is the mount-window replay gate. Replace the gate's
  `!result.handled && originUnregistered` with the `pendingActions`/`nestedBoundary` mechanism
  (sub-step 6). Until then (sub-order), keep an internal `handled` for the gate and remove it when
  sub-step 6 lands — or land 3+6 together. **Prefer landing 3 and 6 together** to avoid a transient
  `handled`-with-no-consumer.
- `canGoBack`/`canDismiss` (in `BaseNavigationContainer.tsx:257-283`): switch from
  `result.handled && !result.noop` to `reduceRoot(...).state !== committedTree` (sub-step 1 makes
  this sound at any depth).
- `useNavigationBuilder.tsx:649-657` `onAction` returns `dispatchRoot(...) ?? false`. Its boolean
  propagates into navigation helpers. Audit consumers of the `onAction`/`navigation.dispatch` return
  — react-navigation helpers historically ignore it; confirm by grep. If nothing consumes it, drop
  the return; if something does, return `void`/`undefined` and fix the consumer.
- Rewrite verdict-shape tests: `rootReducer.test` (`handled`/`noop`/`nestedBoundary` assertions →
  identity/`state===tree` form) and `BaseNavigationContainer.test` reducer mocks (`:177,245`) that
  return `{ state, handled, noop }` → new shape.

### Sub-step 4 — The flip

Navigators read the `useReducer` tree via context; JS-initiated dispatch wrapped in
`React.startTransition`; native/replay urgent (source tag); slice-keyed memo layer (risk 3);
delete Step-2 shadow scaffolding.

**Render channel swap.** Today `BaseNavigationContainer` provides `NavigationSyncStateContext` =
the uSES `store`, and `useStoreSlice`/`useNavigationBuilder` read it via `store.subscribe` + uSES.
After the flip:

- `BaseNavigationContainer` makes the `useReducer` tree authoritative (`state` from `useReducer`
  replaces `useSyncState`'s `state`). It stops rendering from the uSES store.
- The render channel becomes **context carrying the current committed tree** (the `useReducer`
  value). `useStoreSlice(key)` reads that context + `getCachedSlice(tree, key)` — **no uSES**.
  `useNavigationState` reads the same context. `useNavigationBuilder`'s `state = storeSlice ??
  currentState` projection reads it. `useRouteInfo` derives from it (D4).
- `useIsFocused` is **not** converted (it subscribes to focus/blur *events* via
  `FocusedRouteKeyContext` — leave it).

**Slice-keyed memo layer (risk 3).** Context propagation bypasses `React.memo`, so every
`useNavigationBuilder` re-runs on every commit unless we add a bail-out. Introduce a memo wrapper
around each navigator subtree keyed by its slice identity: a component that reads the root tree from
context, extracts its slice via `getCachedSlice(tree, key)` (stable identity when the slice is
unchanged — root reducer guarantees it, and sub-step 1 hardens noop identity), and provides that
slice down through a **per-navigator context** so a child navigator re-renders only when *its* slice
identity changes. This restores today's per-slice uSES bail-out. Budget test: 5 tabs × deep stacks,
assert a navigation into one tab does not re-render the others' navigator bodies beyond the
unavoidable root pass (render-count instrumentation via a render counter in a test navigator).

Note (Step-4 inheritance): freeze is now off, so blurred-but-attached screens re-render; the memo
layer is what keeps that from cascading. The worst-case measurement lands here.

**Dispatch source tag + transition wrap.** `dispatchRoot` gains a `source`/`urgent` option.
JS-initiated entry points (`router.push`/`linkTo`, `Link` press, deep links) wrap the dispatch in
module-level `React.startTransition(() => dispatch(action))`. Native-induced
(`onDismissed`/`onNativeDismissCancelled`/`onHeaderBackButtonClicked`/native tab press/`useBackButton`)
and **replay** dispatch plain (urgent). The wrap lives at the dispatch funnel (`dispatchAction` in
the former `routingQueue`, and the container's replay effect stays urgent). Use module-level
`React.startTransition`, not a `useTransition` hook (D1 stale-identity hazard; pending signal is D3,
Step 8 — not this step).

**Delete Step-2 shadow scaffolding.** grep `shadow`/`createShadowReducer`/`__setShadowAssertEnabled`,
delete `shadowCompare.ts`, the shadow `useReducer`/`shadowDispatch`/`eagerSeqRef`/`eagerBySeqRef`,
the compare effect, `ShadowState`/`ShadowEnvelope` types. The `reduceRoot`/`rootReducer` split can
collapse back (the split existed only to keep the shadow off the spy) — but check no test still
spies `rootReducer` expecting the delegator; if so keep the export.

**Store mirror at commit.** The uSES store no longer drives render, but imperative readers
(`store.state` via `navigationRef.getRootState()`, `getStateForHref`, sitemap, devtools,
`HrefPreview`, `getSeedState`) still need the last committed tree. `getRootState()` must return the
committed `useReducer` tree. Options: (a) keep the sync store as a **commit-time mirror** —
container writes `setState(tree)` from a post-commit effect (not synchronously at dispatch), and
`getRootState`/`store.state` read it; (b) a plain ref updated at commit. (a) reuses existing
plumbing (`useSyncState`'s `store.getState`) and keeps `getRootState` pointing at the same object;
prefer (a) but driven from the commit effect, not `dispatchRoot`. **This is the D1 "store leads
render disappears" change — `store.state` now answers for the committed (pre-transition) tree**;
CHANGELOG + the same-tick `push();canGoBack()` behavior-change test (jest-able per risk 9).

### Sub-step 5 — Queue deletion + `ROUTER_LINK` resolution fusion (absorbed Step 1 / D2)

Per `steps/Step-1.md` design (preserved) + the fusion. Now safe because reduction is deferred to
render (after mount/registration effects), so a `router.push` targeting a mid-mount nested navigator
resolves against a fully-populated committed tree — the canaries pass.

- Delete `useImperativeApiEmitter` (uSES subscription + effect drain). Replace with a flush hook
  (`useFlushPreReadyActions`) or drive the pre-ready flush from the container commit effect.
- `router.*` dispatch **raw intents** directly to the installed `dispatch` (sub-step 7). `linkTo`
  dispatches `{ type: 'ROUTER_LINK', payload: { href, options } }` (raw — no call-time resolution).
  `dismiss`/`dismissAll`/`goBack` dispatch their `POP`/`POP_TO_TOP`/`GO_BACK`.
- Keep the **minimal pre-ready buffer** (dumb array; buffers pre-ready intents; drains when ref
  attaches). `goBack`/`setParams` keep their call-time `assertIsReady` (throw pre-ready, unbuffered).
- **`ROUTER_LINK` resolution moves into the reducer.** `reduceRoot` gains a `ROUTER_LINK` case:
  resolve the href via a pure form of `getNavigateAction` — `(state, action, registry, config) →
  resolved action` — reading **only** the reducer's `state` arg (not `navigationRef.getRootState()`),
  the threaded `config` (linking + redirects, D1 round-3: threaded per reduction from a
  render-updated source, NOT init-captured), and `registry.hasReducer` (already available). Then
  reduce the resolved action in the same pass (chained). The malformed-link fallback (today
  `getNavigateAction` returns undefined → skip; the plan wants an explicit reducer-side story) →
  reduce to a no-op (return `tree`) or a `resetRoot`-equivalent per the current behavior; match
  what the drain does today (skip dispatch on undefined) → reduce-to-noop.
- `config` threading: `dispatchRoot` receives `config` from a render-updated source (the container
  reads `store.linking`/`store.redirects` per render — they are stable within a render pass but
  regenerate on Fast Refresh / route-file change). Thread it into `reduceRoot`. Pin with a
  Fast-Refresh/route-change test (a new route added after mount resolves correctly).

**The two repro canaries flip from pinned-green (behavior preserved) to still-green under the new
path** — they were kept green through Steps 1–4 by NOT deleting the queue. Here the queue is deleted
AND resolution moves to the reducer; the canaries must **stay green** (single inner-layout mount;
`[id]` param = `1234`). If they regress, the deferred-reduction claim is wrong — stop and surface.

### Sub-step 6 — State-carried `pendingActions` (replaces `pendingReplayRef`)

A render-authoritative pure reducer cannot requeue via a ref. The mount-window replay moves into
state:

- `reduceRoot` returns state with the unhandled action appended to a `pendingActions` field
  (**idempotent, keyed by action identity** — React invokes the reducer eagerly at dispatch AND at
  render AND on replayed transitions; a non-idempotent append double-queues).
- **Deferrability gated by SOURCE, not just target (D1 round-3):** urgent-native-source actions
  **never** enter `pendingActions` regardless of target (the D5 source tag decides); JS-side keeps
  the `PRELOAD`/target-less shape. Pin with *untargeted* native GO_BACK/NAVIGATE tests, not just
  targeted POP/JUMP_TO.
- A container commit effect re-dispatches `pendingActions` **urgently** with a replay marker; the
  reducer clears the field; a replay-marked action still unhandled is **dropped**
  (drop-after-one-retry; lazy/RSC navigators registering later are dropped, as today). Pin with a
  lazy-navigator test.
- **Idempotency + nanoid hazard:** the ref-based replay minted keys once per `dispatchRoot`; the
  state-carried form re-reduces under React's double-invocation. The append must be identity-keyed
  (dedupe by action object identity or a minted `navId`), and the reduction must be
  deterministic-enough that double-invocation doesn't double-mint into committed state. This is the
  `pendingReplayRef` double-invocation hazard the Step-2 note deferred here.

### Sub-step 7 — Install lifecycle

The root installs its `dispatch` (raw-intent funnel target for `router.*`) and the committed-tree
mirror into `global-state/store.ts` on mount; uninstalls on unmount. **Only these two install on
mount** — seed/`linking`/`redirects`/`routeNode` stay render-populated by `useStore` (`getSeedState`
+ `HrefPreview` read them during the first render, before any effect). Test isolation +
`NavigationIndependentTree` resolve per root by construction; only the app root installs globally.

- `router.*` reaches React through the installed `dispatch` (replacing `navigationRef.dispatch` /
  the queue). `getRootState`/`store.state` read the installed committed mirror.
- Reverts the base branch's "retire the state mirror" commit at the `store.state` level:
  `navigationRef.getRootState()` re-points at the mirror, published from the container commit path.

## What is jest-able here (risk 9 / Step-3, scoped up front)

- Final committed states via **rendered-tree queries** (`getByTestId`, Link/button disabled state) —
  NOT `router.canGoBack()`/`getRouterState()` (imperative store lags post-flip).
- Fallback-absence across an awaited `act` (bare `router.push` to a suspending screen keeps previous
  screen mounted, no fallback) — the Step-3 fixture (`transitions-characterization.test.ios.tsx`),
  polarity flipped.
- `pendingActions` replay final states; the same-tick `canGoBack` behavior change; render-count
  budget (5 tabs × deep stacks).
- **Simulator-only (do NOT jest-assert):** mid-flight pending values, urgent-flush interleavings,
  supersede. Those are Step 7 / Step 9 simulator work.

## Red list (polarity from Step 3, scoped)

1. nested-noop `canGoBack` = false (sub-step 1).
2. RECONCILE completion signal: route-names reconciliation still converges, dev invariant does not
   false-fire on the extra commit (sub-step 2).
3. verdict-shape tests rewritten to identity form (sub-step 3).
4. bare `router.push` to a `use(promise)`-suspending screen keeps the origin `index` mounted with no
   fallback (rendered-tree query), flipped from Step-3's baseline (sub-step 4).
5. the two repro canaries stay green under queue-deletion + reducer resolution (sub-step 5).
6. two same-tick relative pushes chain; Fast-Refresh/route-change resolves a new route (sub-step 5).
7. `pendingActions` replay final states incl. untargeted native GO_BACK/NAVIGATE never queued;
   lazy-navigator drop (sub-step 6).
8. same-tick `push(); canGoBack()` answers for committed (pre-push) — behavior change (sub-step 4/7).
9. render-count budget, 5 tabs × deep stacks (sub-step 4).

## Gates

`CI=1 pnpm test` (baseline 356 suites / 4659 tests), `pnpm build`, `pnpm lint`,
`et check-packages expo-router` (35 checks). CHANGELOG: behavior change + migration note; same-tick
`canGoBack` change; store-mirror re-introduction note. Commit `[step 5] <one line>` (no body, no
Claude mention). PLAN.md edit only for a genuine correction (the "five callers" scope narrowing is a
candidate — confirm with lead if a review agent doesn't overturn it).

## Splittability (kickoff instruction)

If the 7 sub-steps can't land atomically, the only safe intermediate is **after sub-step 3** (reducer
noop-identity + RECONCILE redesign + verdict elimination — all behavior-neutral internal refactors,
suite stays green, nothing flipped yet). Sub-steps 4–7 are the flip proper and MUST land together
(reads-from-React + transition-wrap + queue-deletion + install are mutually dependent — half is a
regression per PLAN). Surface to lead before splitting.

## Implementation status (checkpoint — NOT yet green, uncommitted)

Sub-step 1 landed green (full suite 4660) and is the one verified-safe intermediate. The full flip
(sub-steps 2–7) is implemented end-to-end and **production code typechecks (0 non-test tsc errors)**,
but is not green. Diagnosed residue:

1. **useRouteInfo double-render (biggest cluster).** `useRouteInfo` still reads route info via the
   commit-timed uSES notify (`routeInfoSubscribers`, fired from `store.setFocusedState` in
   `useScreens.tsx:344`), so `usePathname`/`useSegments` consumers render once for the tree change and
   again for the routeInfo notify. Fix = D4: derive route info from the reducer tree via context so it
   updates atomically. Subtlety: route info is computed at the deepest focused leaf but read
   everywhere, and `BaseNavigationContainer` can't statically import `getCachedRouteInfo` (core↔
   global-state cycle, see `seedState.ts`). A `RouteInfoContext` scaffold was added in `useRouteInfo.ts`
   but the provider isn't wired. Candidate: provide it from a `global-state` component that reads the
   root tree from `NavigationStateContext` and can import `getCachedRouteInfo` without the cycle,
   rendered high enough that all consumers see it; keep `store.setFocusedState` for imperative
   `store.getRouteInfo()` only.
2. **JS-tabs nested-param regression** (`tabs.test` "can set params for dynamic routes using href when
   nested stack is used" → `[id]` not `1234`). First-visit tab press via `unstable_tabBarNavigateAction`.
   NOT the transition wrap (disabling it didn't fix it). Un-root-caused; likely the deferred reduction
   of the resolved NAVIGATE-with-payload.state, or the param-merge interacting with the flip. Trace the
   reduced action's target/payload.
3. **RECONCILE re-dispatch guard missing.** The effect can re-dispatch RECONCILE every render while the
   now-deferred reduction is pending. Add an in-flight ref keyed on the dispatched `routeKeyList`.
4. **Memo layer (risk 3) not added** — perf only. Belongs at the `SceneView` boundary keyed on
   `routeState` identity, but `options`/`clearOptions` churn per render so a plain `React.memo` won't
   bail; needs a comparator on the identity-bearing props.
5. **Four test files need rewriting** for the new architecture: `routingQueue.test`, `router.test.ios`,
   `BaseNavigationContainer.test` (mocks `rootReducer`/`__setShadowAssertEnabled` — the dispatch path is
   now `reduceRootNavigation`, not the `rootReducer` export), `singleWriter.test` (pins the old
   single-`setState`/live-store invariant the flip inverts).

Progress signal: the tabs suite went 18→4 failing after fixing the `useStoreSlice`-in-`BottomTabBar`
crash (BottomTabBar/native-tabs read the rendered=committed slice now). The mechanism largely works;
residue is route-info timing + the nested-param case + test rewrites.
