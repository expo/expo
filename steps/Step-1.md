# Step 1 — Delete the routing-queue machinery, keep a minimal pre-ready buffer (D2)

Branch: `@ubax/eng-transitions-support-in-expo-router` (transitions branch), rebased onto base
tip `d28c8dbc7f8` (R2; R1 = `c13ecf90d8b`). First step on the transitions branch after R1/R2.
Scope source: PLAN.md **D2** + **Step 1**. No new user-facing behavior — this is a rewiring that
preserves today's semantics while deleting the queue indirection. Full suite stays green.

## ⚠️ Lead with this: where resolution lives after Step 1 but before Step 2 (the one spec tension)

Step 1's prose says _"`router.*` methods call the installed root `dispatch` directly with raw
intent actions (resolution stays in the reducer, D1)"_. Taken literally that **cannot hold at
Step 1**, and the code proves it:

- `ROUTER_LINK` is a **queue-only** intent type. `rootReducer` has no `ROUTER_LINK` case
  (grep: the only handlers are `routingQueue.run` and the unrelated DOM-component path). Dispatching
  a raw `ROUTER_LINK` to `dispatchRoot` today is an unhandled action.
- Resolution (`getNavigateAction`: href → concrete `NavigationAction`) currently happens at **drain
  time** inside `routingQueue.run` (`routingQueue.ts:57`). It reads live module-globals
  (`store.navigationRef.getRootState()`, `store.linking`, `store.redirects`) and calls
  `store.assertIsReady()` — so it also **throws pre-ready**.
- The `getNavigateAction`→reducer fusion (`(state, action, registry, config) → state`, raw intents,
  reducer-side resolution) is **Step 2** (PLAN.md D1 + Step 2 Files list explicitly names
  `getNavigationAction.ts`, `rootReducer.ts`). It is not part of Step 1.

**Resolution (settled, behavior-preserving — surfaced to the user, not improvised):** in Step 1,
resolution moves from `routingQueue.run` to the **call site** in `router.ts`, not into the reducer:

- **Post-ready** (`store.navigationRef.isReady()`): `router.*` resolves the intent immediately
  (`linkTo` → `getNavigateAction`; `dismiss`/`dismissAll` build their `POP`/`POP_TO_TOP`;
  `goBack` its `GO_BACK`) and calls `store.navigationRef.dispatch(action)` **directly, in the
  caller's own call stack** — no `routingQueue`, no uSES read, no effect tick.
- **Pre-ready**: the **unresolved intent** is pushed to a dumb module-level array and
  resolve+dispatched synchronously once the ref attaches (flush). It must stay unresolved because
  `getNavigateAction` throws pre-ready; this matches today exactly (today the `ROUTER_LINK` sits in
  `routingQueue.queue` unresolved and is resolved in `run()` post-ready).

Step 2 then moves resolution into the reducer and switches to true raw-intent dispatches. Net for
Step 1: **observably identical except post-ready resolution now happens at call time instead of one
effect tick later** — minus a uSES read site, minus the "action silently dropped because the ref was
null" class of bug in `run()`. The one theoretical divergence (correctness-review, MEDIUM): if an
*interleaving* dispatch changed the committed root state between a `router.push` call and the old
effect-tick drain, today's drain resolved a relative href against that newer state; call-time
resolves against the state at call time. Call-time is arguably more correct and the window is
sub-tick; noted, not "identical."

**PLAN.md correction (Step 9 / end-of-step):** Step 1's parenthetical "(resolution stays in the
reducer, D1)" is accurate for the end state but not for Step 1 in isolation. The accurate Step-1
statement is "resolution moves to the call site (was drain time); Step 2 moves it into the reducer."
Note it in the final report + a one-line PLAN.md edit.

## What goes / what changes (grouped by file)

**`global-state/routingQueue.ts` — gut to a dumb pre-ready buffer (mostly deleted).**
Delete the whole uSES-subscription surface: `queue`/`subscribers`/`subscribe`/`snapshot`/`add`
(notify) /`run(ref)`. Keep only:
- the `LinkAction` type (still the shape of an unresolved link intent);
- a module-level `preReadyActions: (NavigationAction | LinkAction)[]` array;
- `dispatchAction(action)` — the single funnel: if `store.navigationRef.isReady()`, resolve
  (`ROUTER_LINK` → `getNavigateAction`, else pass through) and `store.navigationRef.dispatch(...)`;
  else push the unresolved action to `preReadyActions`;
- `flushPreReadyActions()` — if `isReady()` and the buffer is non-empty, splice it and
  `dispatchAction` each (they're all ready now, so they resolve+dispatch); no-op otherwise.
Resolution helper (shared by direct + flush) is the same six-arg `getNavigateAction(href, options,
options.event, options.withAnchor, options.dangerouslySingular, !!options.__internal__PreviewKey)`
call `run()` used, and the same "skip dispatch if it returns undefined" (redirect-already-handled)
guard. Keep the file name (`routingQueue.ts`) — plan lists it as "mostly deleted", avoids a file
move (which would force `pnpm clean`). The module comment is rewritten to describe the pre-ready
buffer, not a queue.

**`global-state/router.ts` — dispatch directly / buffer, via the funnel.**
- `linkTo`: replace `routingQueue.add(linkAction)` with `dispatchAction(linkAction)` (same
  `ROUTER_LINK` shape). The external-URL / `..`-`../` / DOM short-circuits are unchanged.
- `dismiss`: `dispatchAction({ type: 'POP', payload: { count } })`.
- `dismissAll`: `dispatchAction({ type: 'POP_TO_TOP' })`.
- `goBack`: keep `store.assertIsReady()` (call-time throw preserved — see below), then
  `dispatchAction({ type: 'GO_BACK' })`. Since `assertIsReady` guarantees ready, this dispatches
  directly.
- `setParams` and the `..` path already dispatch synchronously via `store.navigationRef.current`;
  **unchanged**.
- Import `dispatchAction` (from `./routingQueue`), drop the `routingQueue` import.

**`imperative-api.tsx` — replace the emitter hook with a flush hook.**
Delete `useImperativeApiEmitter` (the uSES subscription + effect drain). Replace with
`useFlushPreReadyActions()`: a no-dep `useEffect(() => { flushPreReadyActions() })` (no ref argument —
the buffer talks to `store.navigationRef`, the app-root ref the imperative API already targets). Runs
after every commit of the container; `flushPreReadyActions` is a cheap no-op when the buffer is empty
or not ready.

**Accuracy correction (plan-review finding, HIGH → resolved):** do NOT claim "drains synchronously
the moment the ref attaches." Today's queue is *self-driving* — `routingQueue.add` notifies uSES
subscribers, which schedules a container re-render, whose effect drains — so any pre-ready `add`
schedules its own drain. A bare `useEffect(() => flush())` only fires when the container itself
commits. The accurate claim: **pre-ready actions flush on the container's next commit once
`isReady()`; in the common (and only non-broken-today) case that is the first-mount commit** — the
root layout renders a navigator on first render, so the container is ready by its first commit and
the mount-time flush drains the buffer. The pathological "container mounted but never becomes ready,
plus an async pre-ready dispatch, and no further commit" case strands the action — but that case
**throws-and-loses-the-action today** (the first-commit `run()` empties the queue then
`getNavigateAction` throws on `!isReady()`), so `isReady()`-gated buffering is *strictly no worse*
(it waits instead of throwing). We deliberately do NOT rebuild a notify subscription — that is
exactly the uSES machinery D2 deletes, and the gap it would close is already broken today. Pinned by
the `issues.test.ios.tsx` "can navigate during first render" canary (stays green) + a pre-ready
integration test (below).

**`fork/NavigationContainer.tsx` — call the flush hook.**
`useImperativeApiEmitter(refContainer)` → `useFlushPreReadyActions()`. Drop the now-unused
`refContainer` argument at the call site (the ref is still used by `useBackButton`/`useDocumentTitle`
/`useLinking`/devtools, so the ref itself stays).

**Comment-only touch-up (arch-review finding — not grep-catchable).** `react-navigation/core/
BaseNavigationContainer.tsx:113-116` describes `pendingReplayRef` as *"deliberately separate from the
module-global `routingQueue` … which the public `dispatch` that drains `routingQueue` doesn't
carry."* After Step 1 `routingQueue` no longer *drains* (no `run()`, no `ref.current` loop) — it
buffers pre-ready and dispatches directly. Update that clause (`"drains"` → `"buffers pre-ready
actions for"`) so the prose stays true. The Step-1 symbol sweep won't catch it (the identifier
`routingQueue` survives as the file/export name); it's a manual read. `dispatchRoot`/`pendingReplayRef`
logic itself is untouched (R1/R2/Step-2 territory).

**Dead import.** `routingQueue.ts:1` imports `RefObject` only for `run(ref: RefObject<…>)`. With
`run` gone, drop the import (lint would catch it; listing it so it isn't missed).

## Why behavior is preserved (the load-bearing arguments)

1. **Same-task commit (D2 headline).** Post-ready `router.push` now runs `getNavigateAction` +
   `dispatch` synchronously in the event handler. `dispatch` → `dispatchRoot` → sync `setState`
   commits the store synchronously (base-branch single-writer sync store — untouched here). So state
   is committed in the same task, no effect tick. Today it took one `useEffect` tick.
2. **Two same-tick relative pushes chain.** `push('/a'); push('/b')` from the same handler: the
   first resolves against `getRootState()` (committed), dispatches, sync `setState` updates the
   committed tree; the second resolves against the **now-updated** committed tree → correct chain.
   Today the drain achieved the same by resolving each in sequence during `run()`. Pinned with a
   test (relative hrefs).
3. **Pre-ready buffering unchanged.** `push`/`navigate`/`replace`/`dismiss`/`dismissAll`/`dismissTo`
   /`prefetch` do not `assertIsReady` at call time today → they buffer. `goBack`/`setParams` **do**
   `assertIsReady` at call time today → they throw pre-ready, never buffered. Step 1 keeps this
   split exactly: the funnel buffers when `!isReady()`; `goBack`/`setParams` keep their call-time
   assert (so they still throw pre-ready, unbuffered).
4. **Flush target.** Both direct dispatch and flush go through `store.navigationRef` — the app-root
   ref the module `router` already targets (`goBack`/`setParams`/`canGoBack` use
   `store.navigationRef.current` today). Today's queue drained via the fork's local `refContainer`;
   for the app root `refContainer.current === store.navigationRef.current`, so no difference. See
   gray area 1 for the independent-tree consequence.

## Scope decisions to challenge (gray areas — for the 3-lens plan review)

1. **Independent trees (`NavigationIndependentTree`).** Today `useImperativeApiEmitter(refContainer)`
   runs in **every** `NavigationContainer` and drains the **global** `routingQueue` into **that
   container's** `refContainer`. So a global `router.push` could be drained into an independent
   tree's ref (latent: the module `router` is documented as the app-root API). Step 1 routes both
   direct dispatch and flush through `store.navigationRef` (app root) consistently. **Resolved
   (correctness + arch review): a confirmed, deliberate behavior change, not pure preservation** —
   today's drain into per-container `refContainer` let a global `router.push` fired while an
   independent tree is mounted land non-deterministically in that tree (last-writer-wins across N
   containers). After Step 1 it deterministically targets only the app-root `store.navigationRef`
   (the ref `ExpoRoot.tsx:159` installs, and the ref every other `router.ts` method already uses).
   Grep confirmed **no test** renders `NavigationContainer`/`NavigationIndependentTree` to assert
   imperative-API delivery, so nothing pins the old (buggy) behavior; state is untouched so risk-5's
   independent-tree invariant holds. **Kept.**
2. **Flush-effect placement + cadence.** A no-dep `useEffect(() => flushPreReadyActions())` runs
   after every commit of every `NavigationContainer`. Cheap (early-return when empty/not-ready), but
   it is N containers × every commit. **Lean: acceptable** (the guard makes it O(1) when idle; the
   emitter it replaces also re-ran on every queue change). Alternative considered: gate on `isReady`
   in a `useLatestCallback` + run once — rejected, doesn't cover the "ref attaches a commit later"
   case (gray area 3). Flag for arch review.
3. **`isReady()` vs `ref.current` gate — a deliberate, strictly-safer change.** Today `run()` gates
   on `if (ref.current)` and then `getNavigateAction` throws if `!isReady()`. There is a window
   (ref attached, focus listener not yet registered — e.g. a root layout that mounts its navigator a
   commit later) where today's drain would **throw**. Step 1 gates the funnel + flush on
   `isReady()`, so a buffered action waits for readiness instead of throwing. This is *at least as
   good* as today (the common navigator-on-first-render case is identical: ready by first commit).
   **Lean: gate on `isReady()`** — it is exactly `getNavigateAction`'s own precondition, so it can
   never throw at flush. Flag: is there any test asserting the pre-ready throw? (If so, it's testing
   a bug; rework per the "lands once ready" red criterion.)
4. **`store.assertIsReady()` in `getNavigateAction`.** With the funnel gating on `isReady()` before
   calling `getNavigateAction`, the `assertIsReady()` inside `getNavigateAction` becomes redundant
   on the router.* path — but `getNavigateAction` is also called from other sites (Step 2 territory)
   and is Step-2-owned code. **Lean: do not touch `getNavigateAction` in Step 1** (it's not in the
   Step 1 Files list; leaving the redundant assert is harmless and keeps the diff minimal).

## Tests: red → green

**Delete (queue-mechanism tests — the mechanism is gone):**
- `global-state/__tests__/routingQueue.test.ios.ts` — tests `add`/`subscribe`/`snapshot`/`run`,
  all deleted surface. Delete the whole file (mirrors R1/R2 deleting feature tests with the feature).
  **But re-home its two behavioral cases** (test-review finding) onto the new buffer unit tests:
  (i) the "does not dispatch when `getNavigateAction` returns undefined" skip (redirect-already-handled),
  and (ii) the "ref not ready → not dispatched" case (the old `run() with ref.current null` at
  `routingQueue.test.ios.ts:146`, re-expressed as `dispatchAction` pre-ready → buffered, not dropped).
  These pin exactly the class of behavior Step 1 changes; don't let them vanish with the file.

**Rework — `global-state/__tests__/router.test.ios.ts`:** it currently mocks `routingQueue.add` and
asserts each `router.*` enqueues a specific action. Rewrite to the new contract. **Mock reality
(correctness + test review — these WILL break the rewrite if missed):**
- Add `jest.mock('../getNavigationAction', () => ({ getNavigateAction: jest.fn(), … }))` — resolution
  now runs *inside* `router.ts`'s module (was in `routingQueue.run`), so the real resolver would run
  against the plain-object `store` mock and mis-resolve. Mock it exactly as `routingQueue.test.ios.ts`
  did.
- Drop the `jest.mock('../routingQueue', …)` add-spy. The funnel calls **`store.navigationRef.dispatch`**
  (the proxy), so the `store` mock must expose `dispatch` at **`navigationRef.dispatch`** (the current
  mock only has it on `navigationRef.current`). Keep `isReady: () => true`.
- `linkTo`/`navigate`/`push`/`replace`/`prefetch`/`dismissTo`: assert `getNavigateAction` is called
  with **all six args** `(href, options, options.event, options.withAnchor, options.dangerouslySingular,
  !!options.__internal__PreviewKey)` (the old drain test checked all six — don't weaken to two), and
  `store.navigationRef.dispatch` is called with its mocked return. Add a case: `getNavigateAction`
  returns `undefined` → `dispatch` **not** called (re-homed skip).
- `dismiss(2)`/`dismiss()`/`dismissAll`/`goBack`: assert `store.navigationRef.dispatch` called with
  `{type:'POP',payload:{count}}` / `{type:'POP_TO_TOP'}` / `{type:'GO_BACK'}`. DOM short-circuit guards
  stay **before** the funnel call (assert `dispatch` not called on short-circuit). `goBack` still
  asserts `store.assertIsReady` first, **and gets a dedicated pre-ready test**: with `isReady()` false,
  `goBack()` throws (via `assertIsReady`) and does **not** buffer — pins the gray-area-3 split.
- External-URL, `..`/`../`, `canGoBack`/`canDismiss`, `setParams` tests: unchanged (paths unchanged).

**Add (new coverage the plan's red list mandates):**
- **Buffer unit tests** (`global-state/__tests__/routingQueue.test.ios.ts` rewritten, or folded into
  `router.test`): (a) `dispatchAction` post-ready dispatches immediately, buffer stays empty;
  (b) `dispatchAction` pre-ready (`isReady()` false) buffers and does **not** dispatch (re-homed
  "not dropped" case); (c) `flushPreReadyActions` post-ready drains in order and dispatches each,
  resolving `ROUTER_LINK` via `getNavigateAction` per item (so multi-buffered relative hrefs chain via
  the same code path as the post-ready case — arch-review note); (d) flush pre-ready is a no-op
  (buffer retained).
- **The "same-task, no effect tick" claim is a UNIT red, not an integration one** (test-review,
  important). An `act(() => router.push('/b'))` integration assertion is **not** a real red — `act`
  flushes effects synchronously both before and after the change, so it passes unchanged. The genuine
  red→green is at unit level: `router.push('/x')` calls `store.navigationRef.dispatch` **synchronously
  within its own call frame** (no `act`, no tick) — before Step 1 `push` only calls `routingQueue.add`.
  The reworked `router.test` (dispatch-spy asserted right after the synchronous `push()` call) IS this
  red. Don't add a tautological integration test for timing.
- **Integration (rendered-tree assertions, per PLAN risk 9 — read the screen, not the store):**
  **Two same-tick relative pushes chain** (a relative href resolving against the first push's commit).
  **Pre-ready action lands once ready** — model on the existing `issues.test.ios.tsx` "can navigate
  during first render" canary (navigate from an effect before the navigator mounts), asserting the
  final on-screen route via `getByTestId`, **not** dispatch count (render-body/StrictMode double-invoke
  makes count flaky — correctness-review LOW). For a *true* pre-ready-buffer case, a `_layout`
  render-body `router.replace('/target')` asserts `/target` visible after mount; if it proves flaky
  under StrictMode double-render, fall back to the effect-before-navigator canary shape.
- **Mount-window replay stays green** — the existing `pendingReplayRef`/`RECONCILE_ROUTE_NAMES`
  tests (`nestedNavigationDispatch`, `routeNamesReconciliation`, mount-window replay in
  `BaseNavigationContainer.test`) must pass unchanged: Step 1 does not touch `dispatchRoot`'s
  internal replay, only the external input adapter. (Lowest regression risk — confirmed independent
  of `routingQueue` per `BaseNavigationContainer.tsx:113-116`.)

**Regression-risk order (run first → last):** hand-rewritten `router.test` + buffer unit tests
(highest risk) → `issues.test.ios.tsx` "can navigate during first render" (best canary for the
`isReady()`-vs-`ref.current` gate) → integration suites (`navigation`/`smoke`/`redirects`/`stacks`/
`protected`/`headless-tabs` — medium in theory, low in practice: every `router.*` there is already
`act`-wrapped, absorbing the effect-tick difference) → mount-window replay (lowest).

**Verify unaffected:** `navigation.test`, `smoke.test`, `redirects.test`, `stacks.test`,
`protected.test`, `headless-tabs.test` — full flows through `router.*` must still pass (they
exercise the funnel end-to-end).

## Verification

`CI=1 pnpm test` in `packages/expo-router`; `pnpm build`; `pnpm lint`; then
`et check-packages expo-router`. Monorepo sweep for `routingQueue`/`useImperativeApiEmitter`/
`ROUTER_LINK` stragglers (confirmed in-package only at plan time — re-check). No CHANGELOG entry:
no public API changes (the queue is internal; `router.*` signatures/behavior unchanged). Commit
`[step 1] <one line>` (no body, no Claude mention), push to origin transitions branch. Update
PLAN.md only for the Step-1 resolution-location correction (see lead).

## Review fold-in (3-lens plan review: correctness / architecture-fit / test-strategy)

Three fresh agents reviewed this note against the live code. Folded in above; summary of what changed
and what was confirmed:

- **[correctness, HIGH] Flush is a passive effect, not notify-driven.** Toned down the "synchronous
  the moment the ref attaches" claim; documented that the only stranding case is already
  throws-and-loses today, so `isReady()`-gated buffering is strictly no worse. Deliberately not
  rebuilding a notify subscription (that's the uSES machinery D2 deletes). Pinned by the
  `issues.test` canary. (imperative-api section updated.)
- **[correctness/test, HIGH] Test-mock reality.** The `router.test` rewrite MUST `jest.mock('../getNavigationAction')`
  and expose `dispatch` on `navigationRef` (not just `.current`), and assert all six `getNavigateAction`
  args. Would otherwise break the rewrite. (Tests section updated.)
- **[correctness, MEDIUM] Downgraded "identical observable behavior"** to "identical except call-time
  vs effect-tick resolution," noting the sub-tick interleaving edge.
- **[correctness, CONFIRMED] Same-tick chaining holds** — verified the sync store uses direct
  `setState` (`useSyncState.tsx:27`), not the batched `scheduleUpdate`/`flushUpdates` path;
  `dispatchRoot` calls `setState` directly (`BaseNavigationContainer.tsx:164`). Call-time resolution
  being mandatory at Step 1 (no `rootReducer` `ROUTER_LINK` case) — CONFIRMED, load-bearing.
- **[arch, MEDIUM] Stale prose in `BaseNavigationContainer.tsx:113-116`** ("drains `routingQueue`") —
  added as a comment-only touch-up; not grep-catchable.
- **[arch, LOW] `RefObject` dead import** in `routingQueue.ts` — added to deletions. Keeping the
  `routingQueue.ts` filename is the right minimalism call (avoids `pnpm clean` on move; plan doesn't
  rename it); the docblock rewrite must **preserve the contrast with `pendingReplayRef`** (still true).
  `LinkAction` retention, `dispatchAction`/`flushPreReadyActions` split, and flush-hook placement in
  `fork/NavigationContainer.tsx` all CONFIRMED as the smallest correct shape.
- **[arch/correctness, RESOLVED] gray area 1** reworded as a *confirmed deliberate behavior change*
  (deterministic app-root targeting), with grep-confirmed no test pinning the old per-container drain.
- **[test, HIGH] "same-task, no effect tick" is a unit red, not an integration one** — an `act()`
  integration test would be tautological. Rewrote the red plan accordingly.
- **[test, MEDIUM] Re-home** the deleted queue test's "undefined → skip" and "not-ready → not
  dispatched" cases onto the buffer unit tests; assert final on-screen state (not dispatch count) for
  pre-ready fixtures (StrictMode double-invoke). Regression-risk order recorded.

## ⛔ BLOCKER surfaced during implementation — Step 1 can't hold as specified (resolution timing)

The call-time-resolution reconciliation (the only way to remove the queue *without* Step 2's reducer
resolution) **is not behavior-preserving**. Implemented it; the unit + buffer tests go green, but two
full-suite integration tests regress, both tracing to **one** root cause:

- `__tests__/issues.test.ios.tsx` → **"can navigate during first render of nested navigator"**:
  `inner/_layout` mounts **twice** (a remount) instead of once.
- `__tests__/tabs.test.ios.tsx` → **"can set params for dynamic routes using href when nested stack
  is used"**: the dynamic param renders as `[id]` instead of `1234` (params not threaded into the
  nested state).

**Root cause (confirmed empirically — stash → both pass; not the mount-window replay path, no
stash/replay logs; microtask-deferral does NOT fix it):** `getNavigateAction` resolves an href
against the **committed tree at the moment it is called**. When a navigation targets (or is fired
from the mount effect of) a **nested navigator that has not yet registered its reducer**, the
committed tree lacks that navigator's nested state, so `getNavigateAction` produces a **subtree-
replacing / higher-targeted** action instead of a targeted nested push — hence the remount and the
dropped param. The deleted routing queue **deferred resolution by a full React effect cycle** (uSES
notify → re-render → `useEffect` drain), so resolution ran *after* the nested navigator registered
and the committed tree was complete → correct targeted action. Synchronous **call-time** resolution
runs strictly earlier, before registration.

**This is exactly what D2's own wording forbids:** _"call the installed root dispatch directly …
passing the raw intent action (D1 — **no resolution at call time**)."_ D2 is written assuming Step 2's
**reducer-time** resolution already exists (the registry is consulted at reduce time — a newer
registry than dispatch time — which resolves the nested case correctly). It does not exist yet
(Step 2). So the queue-deletion (Step 1) and reducer-resolution (Step 2) are **not cleanly separable
at the resolution boundary**: removing the queue forces resolution to move, and the only pre-Step-2
home (call time) regresses.

**Per the kickoff's explicit instruction** ("reconcile where resolution lives … surface it if the
wording can't hold yet") **and the standing rule** ("if Step 1's spec doesn't survive contact with
the code, stop and surface instead of improvising") — **stopped and surfaced to the user.**

**Decisive follow-up experiments (after the user first picked "Option 1 — combine steps"):**
- **Exp A — resolve `ROUTER_LINK` inside `dispatchRoot` (reduce-time, sync model):** both tests
  still fail. → It is **not** about *where* resolution happens.
- **Instrumented the resolved action for `/inner/second`:** at sync-resolution time
  `committedInnerHasState=FALSE` → `getNavigateAction` emits `PUSH target=@:__root:0 name=inner`
  (a root-level subtree replace carrying the nested state) instead of a targeted push into the inner
  stack. The inner navigator hasn't populated its committed nested state yet (that lands a later
  React cycle, after it mounts/reconciles).
- **Conclusion:** the regression is caused by resolving **before the target nested navigator's
  committed state exists**. The deleted queue worked purely by **deferring resolution a full React
  cycle**. Neither call-time nor sync-reduce-time resolution replaces that; Step 2's eager-reduce
  render path is also synchronous, so **combining 1+2 as written does not fix it** — only a render
  path driven by React's **deferred reduction** (the Step 5 flip) does. The queue's cross-cycle
  deferral is **load-bearing until Step 5**.

**Recommendation to the user: keep the routing queue; move its deletion to the Step 5 flip (Option
A). Step 1 as an independent step is sequenced too early.** Awaiting the decision (A vs. a full
1+2+5-core flip now).

## Round-2 impl review fold-in (3 fresh agents on the diff + tests)

_(pending the blocker decision)_
