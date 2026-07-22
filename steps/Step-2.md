# Step 2 — State moves into a root `useReducer`, shadowed for behavior-neutrality (D1)

Branch: `@ubax/eng-transitions-support-in-expo-router`, at `1d442dd9cc0` (`[step 1]` resequence
note). First code-bearing step on the transitions branch (Step 1's queue deletion was resequenced
into Step 5). Scope source: PLAN.md **D1** + **Step 2**. No new user-facing navigation behavior —
this replaces the render/commit substrate under the existing sync semantics, guarded by a
shadow-compare, and does the verdict elimination R2 deferred.

## ⚠️ Lead with this: a Step-2 spec sub-claim does NOT survive contact with the code (same root cause as the Step-1 resequence)

Step 2's prose bundles **two independent changes** that the plan's own execution history has
already shown cannot both land while the routing queue is still present:

**(A) The substrate swap** — replace `useSyncState` with `useReducer`, eager-reduce into the store
mirror, shadow-compare, `pendingActions`, verdict elimination, install lifecycle. This is safe now.

**(B) The resolution fusion** — "`getNavigateAction` fuses into the reducer as
`(state, action, registry, config) → state`", "five standalone `getNavigateAction` callers convert
to raw intent dispatches", "link intents resolving to *targeted* reductions". This **regresses the
exact two repro tests the Step-1 blocker identified**, for the identical reason.

### Why (B) regresses — confirmed against the live code, not assumed

- `ROUTER_LINK` is a **queue-only** intent type. `rootReducer` has **no** `ROUTER_LINK` case
  (grep: the only `ROUTER_LINK` producers/consumers are `router.ts:146` and `routingQueue.ts:52`;
  the DOM path is unrelated). Resolution (`getNavigateAction`: href → concrete `NavigationAction`)
  happens at **drain time** inside `routingQueue.run` (`routingQueue.ts:57`), **one React effect
  cycle after** `router.push` returns (uSES notify → re-render → `useEffect` → `run`).
- The **routing queue is kept until Step 5** (that is the whole content of the `[step 1]`
  resequence: "the queue's one-React-cycle deferral is load-bearing until the `useReducer` flip").
- The Step-1 blocker proved empirically (`steps/Step-1.md`, "Decisive follow-up experiments"):
  **Exp A — resolving `ROUTER_LINK` inside `dispatchRoot` at reduce time, on the sync model — still
  fails both tests.** Root cause: resolving an href against the committed tree *before* the target
  nested navigator has registered its reducer/populated its committed nested state yields a
  root-level subtree-replacing action instead of a targeted nested push → the nested layout
  **remounts** (`issues.test.ios` "can navigate during first render of nested navigator": inner
  `_layout` mounts twice) and params attach at the wrong level (`tabs.test.ios` "…when nested stack
  is used": `[id]` instead of `1234`).
- Step 2's eager-reduce path **is still synchronous** (the plan says so: "Step 2's eager-reduce
  render path is still synchronous, so it will not fix nested-navigator-during-mount"). So moving
  resolution into the reducer in Step 2 is *exactly Exp A* — it regresses. Only Step 5's
  deferred-reduction render path reproduces the queue's cross-cycle deferral natively.

### The reconciliation (what Step 2 does / defers)

Step 2's Files list and the D2 correction were both written before the Step-1 resequence renumbered
the queue deletion into Step 5. The resequence note fixed D2/Step-1 but **did not re-scope Step 2's
resolution-fusion claim**. Reconciled:

- **Step 2 = (A) only.** `dispatchRoot` keeps receiving **already-resolved** actions from the queue
  drain (`NAVIGATE`/`PUSH`/`POP`/…, never raw `ROUTER_LINK`). `router.push` et al. are **unchanged**
  — they still `routingQueue.add(ROUTER_LINK)`; the drain still calls `getNavigateAction`. The
  substrate under `dispatchRoot` changes; the input adapter does not.
- **(B) moves to Step 5**, landing atomically with the queue deletion (which is the first point a
  synchronous dispatch resolves against a fully-populated committed tree). This includes:
  `getNavigateAction`→reducer fusion, the five raw-intent caller conversions, `router.*` raw-intent
  dispatch, and the `getNavigationAction.ts` config-threading rewrite.

This keeps Step 2 behavior-neutral (its whole point — shadow-compare de-risks the substrate swap)
and honors the standing rule: **surface the mismatch instead of improvising.** The alternative
(do (B) now) is a known regression the plan already rejected once.

**PLAN.md correction to land at end of step:** Step 2's spec sentence "`getNavigateAction` fuses
into the reducer … five standalone `getNavigateAction` callers convert to raw intent dispatches …
with link intents resolving to targeted reductions" and the `getNavigationAction.ts` / the five
call sites in its Files list belong to **Step 5**, not Step 2 — the resolution boundary is
entangled with the queue deletion exactly as D2/Step-1 documented. One-line PLAN.md edit under
Step 2 pointing at Step 5, mirroring the Step-1 resequence note.

> **HELD FOR LEAD DECISION.** This re-scoping is a plan correction on a *final* plan. Per the
> kickoff ("if Step 2's spec doesn't survive contact with the code, stop and surface the mismatch
> instead of improvising") this note stops here for the lead to confirm the (A)-only scope before
> implementation proceeds. Everything below is the (A)-only design, ready to execute on
> confirmation.

---

## (A) design — the substrate swap (behavior-neutral)

### A1. `useReducer` replaces `useSyncState` in `BaseNavigationContainer`

Today `useSyncState` (`react-navigation/core/useSyncState.tsx`) is a module-local store read via
`useSyncExternalStore`; `dispatchRoot` calls `rootReducer` imperatively and pushes the result
through `setState` (sync `listener` notify, `useSyncState.tsx:27`). The uSES read is Blocker 1.

Step 2 introduces a root `useReducer(rootNavigationReducer, seed)` whose output is the
**authoritative** committed tree — but, because rendering must stay byte-identical to today until
Step 5, it does **not** yet drive render. Instead:

- **Production render path stays uSES.** Keep the sync store (`useSyncState`) alive; the eager
  reduce continues to feed it via the **sync** `setState` (not `scheduleUpdate`/`flushUpdates` —
  same-tick chaining depends on the synchronous listener notify, confirmed `useSyncState.tsx:27`).
  Every existing read site (`useStoreSlice`, `useNavigationState`, `useRouteInfo`, the
  `useNavigationBuilder` projection) behaves **exactly as today**.
- **Shadow `useReducer` reduces the same actions in parallel**, output discarded (compute-and-
  compare only). A dev-only assertion deep-equals shadow-tree vs committed-mirror every commit.

  Round-3 correction (from PLAN): the shadow drives **no render** — letting both trees render would
  double renders and split the slice cache across two tree identities. Value-neutral by
  construction; render-count budgets are meaningless until Step 5.

Concretely `dispatchRoot`'s existing body is **unchanged** — it still calls `rootReducer(committed,
action, registry, options)`, reads `.handled`/`.noop`, runs the replay gate, and `setState(.state)`
(sync store, production render). Step 2 *adds* one line: `shadowDispatch(action)` feeding the shadow
`useReducer`. A dev-only post-commit effect compares the shadow's committed tree against the sync
store's committed tree (the eager path's output).

**Shadow is a real `useReducer`** (resolved by review): a pure imperative double-call would not
exercise React's action-queue chaining — the exact Step-5 risk this de-risks — and would make the
oracle a tautology. **Load-bearing consequence:** the shadow reduces the *same action a second time*,
so key-minting paths (nanoid) mint **different** keys than the eager path; React does **not** memoize
across the eager call and the `useReducer`'s own invocation (`nanoid()` reads fresh RNG each call).
A naive `deepEqual` therefore **false-fails suite-wide** — the comparator must normalize freshly
minted keys (see "Deep-equal divergence"). This is the single riskiest test artifact in Step 2.

### A2. `rootNavigationReducer` — the `(state, action) => state` adapter for the shadow `useReducer`

`useReducer` needs a `(state, action) => state` reducer, but `rootReducer` is
`(state, action, registry, options) → RootReducerResult`. So the shadow's reducer is a thin adapter
that **closes over the `reducerRegistry`** and unwraps `.state`:
`(tree, action) => rootReducer(tree, action, reducerRegistry).state`. It lives in `rootReducer.ts`
(co-located; no move). It returns the **navigation tree directly** — no wrapper, because replay stays
ref-based (A3) and the verdict stays at the `dispatchRoot` seam (A4), so nothing extra rides in the
`useReducer` state.

`config` (linking+redirects) is **NOT** threaded — no `ROUTER_LINK`/href resolution in the reducer
yet (Step 5/(B)); the reducer reduces already-resolved actions, exactly as `rootReducer` does today.

**Shadow wiring (decided — the `reduceRoot` seam).** To keep the shadow from perturbing the
`rootReducer`-export call-count/mock unit tests (`BaseNavigationContainer.test:213,245`), split
`rootReducer.ts`:
- Extract the current `rootReducer` body verbatim into an exported pure `reduceRoot(tree, action,
  registry, options): RootReducerResult` (a pure move, zero logic change).
- `rootReducer` becomes a one-line delegator `=> reduceRoot(...)`. The eager/production path in
  `dispatchRoot` keeps calling the **`rootReducer` export** → `jest.spyOn(module,'rootReducer')` and
  the `toHaveBeenCalledTimes(1)` pin stay **exactly as today** (deterministic — the shadow bypasses
  the spy). `rootReducer`'s `RootReducerResult` return is unchanged.
- The shadow adapter closes over the registry and calls **`reduceRoot` directly** (not the spied
  export): `createShadowReducer(registry) => (tree, envelope) => reduceRoot(tree, envelope.action,
  registry, envelope.options).state`. The shadow `useReducer` is `useReducer(shadowReducer, seed)`;
  `shadowDispatch({ action, options })` feeds an **`{ action, options }` envelope** so the shadow
  reduces with the **same `originKey`** as the eager path (else origin-targeted reductions diverge —
  pinned by an input-equivalence test).

**Shadow assertion is `__DEV__`-gated with a narrowly test-scoped disable.** The two
`BaseNavigationContainer` unit tests that **mock `rootReducer`** (`:177,245`, reversing routes) make
the eager path (spied, mocked) and the shadow (unspied `reduceRoot`, real logic) diverge **by
construction** — the shadow assertion would false-fail there. Expose a `__DEV__`-guarded module
toggle from `BaseNavigationContainer` (`__setShadowAssertEnabled(false)`, default on) that only those
two reducer-mocking tests flip off. This does **not** dark the oracle suite-wide — those tests stub
the reducer, so there is nothing real to compare; the oracle stays live across every integration
canary and broad suite (where real trees reduce). A blanket env gate would be wrong; a scoped toggle
around reducer-mocking units is correct — you cannot deep-equal a shadow against a stubbed eager path.

**Residual, accepted:** the shadow's `reduceRoot` calls the **same registered leaf routers** a second
time, so instrumented per-router reduce **counts** in canaries (`nestedNavigationDispatch`, etc.)
may double. Orthogonal to the `rootReducer` seam. Per plan guidance: verify empirically, adjust only
the specific count assertions that actually inflate (with a comment noting the shadow's second
reduction), do not pre-emptively touch green tests.

### A3. Mount-window replay stays **ref-based** in Step 2 (state-carried `pendingActions` moves to Step 5)

**Review correction (all three lenses, sharpened during fold-in):** the plan converts the
mount-window replay from `pendingReplayRef` (ref) to a state-carried `pendingActions` field because
*"a pure reducer cannot requeue"* (PLAN:223). **That premise does not hold in Step 2.** In Step 2 the
reducer is still invoked **imperatively by the eager path inside `dispatchRoot`**, which retains
`pendingReplayRef` + `replayTick` and *can* requeue exactly as today. The render-authoritative pure
reducer that genuinely cannot requeue only arrives at **Step 5**. So converting ref→state in Step 2:

- buys **no** Step-2 behavior (the ref works, verdict is kept — A4);
- **costs** the three false-positive/hazard classes the reviews surfaced — nanoid divergence,
  `assertStateIsComplete`/serialization pollution (on-tree) or a wrapper-shape churn (separate slot),
  and idempotency under React's double reducer invocation (which the ref sidesteps entirely, being
  driven once per `dispatchRoot`);
- is **deleted-and-rebuilt** at Step 5 anyway (the flip is where state-carried replay is actually
  required).

**Decision: keep `pendingReplayRef` + `replayTick` + the `useEffect([replayTick])` replay effect
exactly as today.** `dispatchRoot` keeps its verdict (A4), so the existing gate
(`!result.handled && originUnregistered && isDeferrable && !isReplay`,
`BaseNavigationContainer.tsx:137-142`) is untouched. The mount-window/reconciliation canaries
(`nestedNavigationDispatch`, `routeNamesReconciliation`, `BaseNavigationContainer.test` mount-window
replay, `issues.test` first-render) stay green **by not changing this code at all**.

**PLAN correction:** Step 2's "Mount-window replay becomes the hardened state-carried `pendingActions`
mechanism … (idempotent identity-keyed append, source-gated deferrability — urgent-native never
queues, urgent replay, drop-after-one-retry)" → **Step 5**, together with the render-flip that makes
the reducer render-authoritative (the only point requeue-in-state is forced) and the D5 source tag
(which the source-gated deferrability needs). The Step-2 Red-list items that depend on it
("replay/mount-window via `pendingActions`", "native-source-never-queued targeted+untargeted") move
to Step 5. In Step 2 the existing ref-based mount-window tests are the green-bar (unchanged).

This removes the single riskiest sub-piece from Step 2 and makes it a genuinely minimal, mechanical
substrate swap + shadow-compare.

### A4. Verdict — PARTIAL elimination only (revised after 3-lens review; full elimination is Step 5)

**Review correction (correctness + arch + test lenses, all three flagged this):** the plan's
"verdict elimination in Step 2" is **over-scoped** and cannot fully land in Step 2. Two live
consumers force `dispatchRoot` to keep returning a `handled` boolean:

1. **`useNavigationBuilder.tsx:627,644`** — `RECONCILE_ROUTE_NAMES` is dispatched from a **layout
   effect** and reads the returned `handled` verdict **synchronously in the same commit** to advance
   `previousRouteKeyListRef` (and the dev identity-invariant at `:581` depends on that same-commit
   advance). PLAN **D1 item 4** explicitly assigns the `RECONCILE_ROUTE_NAMES` completion-signal
   redesign to **Step 5** ("Step 5 implements it with this exact shape"). So the `handled` boolean at
   that seam **must survive Step 2**.
2. **`useNavigationBuilder.tsx:652`** — `onAction` returns `dispatchRoot?.(…) ?? false`; that boolean
   propagates into navigation helpers. Also needs `handled`.

3. **Referential-identity noop test is WRONG for nested targets** (correctness lens, verified
   against `rootReducer.ts`): a *handled-noop* returns `currentTree`, produced by `replacePathState`
   (`:151`), which rebuilds every ancestor via `{ ...parent, routes }` even when the reduced slice is
   unchanged. So for a **nested** focused navigator (stack-under-tabs-under-root — the common case)
   a handled noop returns a **fresh, deep-equal-but-non-identical** root: `currentTree !== tree`.
   Therefore `reducer(...) !== committed` would report `canGoBack: true` for a stack that cannot pop.
   **Referential identity is unsound as a noop/canGoBack test.** Only root-targeted noops
   (`path.length === 1`) preserve identity.

**Revised A4 (behavior-neutral, minimal): Step 2 leaves the verdict entirely UNTOUCHED.** Once A3
keeps the replay ref-based (so `dispatchRoot` still needs its verdict for the replay gate) and A4's
consumers force the `handled` boolean to survive, there is **no verdict change left to make in Step
2**. `RootReducerResult { state, handled, noop, nestedBoundary }`, `canGoBack`/`canDismiss`
(`result.handled && !result.noop`), the replay gate, the noop-skip, and the RECONCILE `handled` read
all **stay exactly as today**. The reducer the `useReducer`/eager path call is today's `rootReducer`
returning `RootReducerResult`; the container reads `.state`/`.handled`/`.noop` as it does now.

**Everything the plan slated as "verdict elimination" moves to Step 5**, entangled with the
render-flip and the RECONCILE completion-signal redesign (D1 item 4, already Step 5): full
`handled`/`noop` removal, `canGoBack`/`canDismiss` → referential identity, and any `nestedBoundary`
cleanup. The referential-identity switch the plan names is **unsound until then anyway** (finding 3:
`replacePathState` returns a fresh root on nested handled-noops, so `!== committed` is not a valid
noop test — it only becomes valid once the Step-5 reducer guarantees identity on noop, which is part
of the flip's own work).

PLAN correction: Step 2's "verdict elimination (D1 item 2): `handled`/`noop` fields go,
`canGoBack`/`canDismiss` switch to referential identity, verdict-shape tests rewritten" → **Step 5**.
Note under both steps.

**Net: no verdict-shape test rewrites in Step 2.** The `rootReducer.test` verdict/`nestedBoundary`
assertions and the `BaseNavigationContainer.test` reducer mocks (`:177,245`) all stay green
unchanged, because the reducer's return shape is unchanged. (This is why keeping the verdict is
strictly the minimal move: eliminating it would force rewriting those load-bearing handled-noop /
deferred-vs-rejected pins for zero Step-2 behavior gain.)

### A5. Install lifecycle — defer the whole install to Step 5

**Resolved by review (arch + correctness):** Step 2 needs **neither** the committed mirror **nor** the
`dispatch` install. `store.state` reads live through `navigationRef.getRootState()`
(`store.ts:86-95`) → `getCommittedRootState()` → the sync store, which stays authoritative in Step 2,
so `store.state`/`getSeedState`/`HrefPreview` already work unchanged. The mirror is dead until the
Step-5 flip (and adds the `HrefPreview`/`getSeedState` tearing surface the PLAN defers to Step 6). The
installed `dispatch` has **no caller** in Step 2 — the routing queue still targets
`navigationRef.dispatch` (`routingQueue.ts:67`), and `router.*` reaches React through it as today.
Installing either is scaffolding with no Step-2 consumer.

**Decision: no install in Step 2.** Both the `dispatch` install and the committed mirror land in
**Step 5**, where the queue deletion actually needs the installed `dispatch` and the flip needs the
mirror. PLAN correction: Step 2's "The root installs `dispatch` + the committed mirror into
`global-state/store.ts` on mount" → **Step 5**. (`storeRef` is populated by `useStore`, not the
container; the container installing into it is new plumbing better introduced when it has a consumer.)

### A6. `onStateChange` timing — unchanged (characterization only)

`onStateChange`/the `'state'` emitter fire from the post-commit effect keyed on `state`
(`BaseNavigationContainer.tsx:452-459`). The sync store stays authoritative, `state` still updates
synchronously at dispatch, so the effect fires on today's cadence — **no timing change in Step 2**
(that shift is Step 5/6). PLAN Red line is a characterization pin, not a behavior change.

## What Step 2 actually reduces to (the honest scope after review)

The plan's Step 2 bundled four sub-changes. Three are entangled with the Step-5 render-flip and
defer with it; only the first is genuine Step-2 content:

1. **Substrate swap + shadow-compare** ← the whole of Step 2. Add a real shadow `useReducer` beside
   the kept sync store; assert deep-equal (key-normalized) every commit. Nothing renders from it.
2. Resolution fusion (`getNavigateAction`→reducer, five callers) → **Step 5** ((B), the original
   surfaced tension).
3. State-carried `pendingActions` → **Step 5** (ref-based replay works in Step 2 — A3).
4. Verdict elimination + `canGoBack` referential identity → **Step 5** (RECONCILE `handled` consumer
   + referential-identity unsoundness — A4).

Step 2 is therefore a **minimal, mechanical, behavior-neutral** change: introduce the shadow, prove
it matches. That is exactly the "shadowed for behavior-neutrality" intent — the de-risking artifact
for the Step-5 flip, and nothing more.

## Deep-equal divergence (nanoid minting) — the comparator (load-bearing)

Confirmed real and suite-wide (test lens): the eager path and the shadow `useReducer` each reduce the
action, and key-minting paths mint different nanoids — `BaseRouter.tsx:64` (keyless `RESET` payload
routes: `` `${route.name}-${nanoid()}` ``) and `StackRouter.tsx:197` (empty-reconciliation fallback).
React does **not** memoize across the two reductions. A naive `deepEqual` false-fails on every
RESET-to-compiled-state and every empty-reconciliation across the suite — a large blast radius.

**Comparator (decided):** a dev-only, key-normalizing deep-compare scoped to the shadow assertion. It
compares the two trees structurally, treating a `route.key` matching the minted shape
(`` `${route.name}-<nanoid>` ``, ~21-char suffix) as equal **by presence, not value** — but only when
no stable committed key existed for that route pre-action. It must **not** globally strip keys (stable
keys must still match, or real divergence is masked). Reject "make keys deterministic first" — a
broader behavior change with its own regression surface (Step-1-style risk).

The comparator needs its own paired red-first test proving it does **not** false-positive **and** does
**not** false-negative: (a) keyless-`RESET` + empty-reconciliation → assertion does **not** throw;
(b) an injected divergence (different route **name**, or an extra route) → assertion **does** throw.
Without (b) the comparator could degenerate to "always equal" and silently defeat the whole oracle.

**Second false-positive class (test lens) — router-spy double-count.** Several canaries
(`nestedNavigationDispatch`, `routeNamesReconciliation`, `seedFidelity`, `routeNamesOrder`,
`notFoundRouteNames`) spy on router reduction **counts** via instrumented router entries. The shadow
reduces every action a second time; if it goes through the same instrumented leaf routers, those
counts inflate → false-fail. **Mitigation:** verify empirically first; if counts inflate, the shadow
must reduce via the same registry the eager path uses **without** re-invoking through the spied
wrappers a second time in a way the count assertions see — likely by scoping those tests' spies to the
eager path, or (cleaner) recognizing the shadow's second reduction is inherent and adjusting the
count-based tests to the doubled cadence with a comment. Decide when the failure (if any) is observed;
do not pre-emptively rewrite green tests.

## Tests: red → green (A-only)

Phase 1 — new red-first units (write failing first):
- **Comparator pair** (above): keyless-RESET/empty-reconcile does not throw; injected divergence
  throws. Red before the comparator exists.
- **Shadow input equivalence**: the shadow reduces with the **same `options.originKey`** as the eager
  path (A2 envelope) — a test that an origin-targeted reduction produces equal trees (fails if the
  shadow drops `originKey`).

Phase 2 — characterization pins (assert unchanged; suite-green + shadow-compare are the real oracle):
- **Two same-tick dispatches chain** — shadow committed tree == eager tree (pins React's queue-chaining
  agrees with the eager path; the Step-5 precondition).
- **`onStateChange` timing** — same commit cadence as today.
- **same-tick `push(); canGoBack()`** — answers post-push (unchanged in Step 2; the behavior *change*
  is Step 5).
- **`renderRouter` isolation across sequential renders** — per-root `useReducer` + `storeRef` reset;
  two sequential renders don't leak.
- **Independent-tree non-interference (risk 5)** — a `NavigationIndependentTree` keeps its own
  `useReducer`; neither reads nor clobbers `store.state`.

Phase 3 — integration canaries stay green **unchanged** (proof the deferrals are correct):
- `issues.test` first-render + `tabs.test` nested-href (proof (B)/resolution deferred).
- `nestedNavigationDispatch` / `routeNamesReconciliation` / `seedFidelity` / `routeNamesOrder` /
  `notFoundRouteNames` (mount-window/reconcile; **watch shadow double-count**, above).
- `singleWriter.test` greps source for `useSyncState<` — stays valid since (A) keeps `useSyncState`.
- Broad suites (`navigation`/`smoke`/`redirects`/`stacks`/`protected`/`headless-tabs`) + the four
  `__rsc_tests__`. **RSC/prod:** the shadow assertion must be **dev-only** and never throw in server
  rendering; confirm it is stripped from the RSC/prod path.

**No verdict-shape rewrites, no `pendingActions` units** — those moved to Step 5 with the verdict and
the state-carried replay. **Regression-risk order:** comparator + shadow wiring (highest) → same-tick
chain / input-equivalence → mount-window/reconcile canaries (double-count watch) → broad suites + RSC.

**Full-suite gate:** `CI=1 pnpm test`, `pnpm build`, `pnpm lint`, `et check-packages expo-router`.

## Verification

Monorepo sweep for stragglers touching what changed (`useSyncState` should still exist — kept). No
public API change (verdict/reducer shapes unchanged in (A)). Commit `[step 2] <one line>` (no body, no
Claude mention), push. PLAN.md edits: the (B), `pendingActions`, verdict, and install corrections all
point at Step 5 (mirror the Step-1 resequence note), with a matching pickup note under Step 5.

## Review fold-in (3-lens plan review: correctness / architecture-fit / test-strategy)

Three fresh Opus agents reviewed the initial (A)-only note against the live code. The findings
**materially shrank** Step 2 — three of its four sub-changes are entangled with the Step-5 flip and
defer with it. Folded in above; summary of what changed:

- **[correctness/arch/test, HIGH] Verdict cannot be eliminated in Step 2.** `dispatchRoot`'s boolean
  return has live consumers in `useNavigationBuilder` (`:627,644` RECONCILE completion signal read
  same-commit from a layout effect; `:652` `onAction` return). The RECONCILE completion-signal
  redesign is explicitly Step 5 (PLAN D1 item 4). → **A4: keep the verdict untouched; elimination →
  Step 5.**
- **[correctness, HIGH] Referential-identity noop test is unsound.** `replacePathState`
  (`rootReducer.ts:151`) rebuilds ancestors on nested handled-noops, so `reducer(...) !== committed`
  wrongly reports `canGoBack: true`. → reinforces A4 (identity switch → Step 5, where the flip
  guarantees noop identity).
- **[correctness/arch/test, HIGH→resolved] State-carried `pendingActions` is unnecessary in Step 2.**
  Its premise ("a pure reducer cannot requeue") is false while the reducer is invoked imperatively in
  `dispatchRoot` (which keeps `pendingReplayRef`). Converting ref→state buys no Step-2 behavior and
  costs nanoid/serialization/idempotency hazards. → **A3: keep replay ref-based; `pendingActions` →
  Step 5.**
- **[test, HIGH] Nanoid comparator is mandatory and non-trivial**, with a paired
  no-false-positive/no-false-negative test; plus a **second** false-positive class (router-spy
  double-count) to watch. → Deep-equal section rewritten with the concrete comparator + test.
- **[arch, HIGH] `pendingActions` shape** (wrapper vs slot vs on-tree) — **mooted** by A3 keeping
  replay ref-based; the `useReducer` state is the plain nav tree.
- **[arch/correctness, resolved] Install lifecycle** — mirror and `dispatch` install both dead in
  Step 2. → **A5: defer the whole install to Step 5.**
- **[correctness/test, confirmed] Red-list demotions** — same-tick `push();canGoBack()` and
  native-source-never-queued are characterizations/Step-5 pins, not Step-2 reds. Confirmed.
- **[arch, confirmed] Shadow = real `useReducer`** (not an imperative double-call) — needed to
  exercise React's action queue (the Step-5 de-risk). → A1/A2.

Bottom line: Step 2 = **substrate swap + shadow-compare, nothing else.** Every other sub-change the
plan bundled defers to Step 5, each for a code-verified reason.

## Impl-review fold-in (3 fresh Opus agents on the staged diff)

All three confirmed the diff is **correct for production and behavior-neutral** (fully dev-gated;
`reduceRoot`/`rootReducer` split is a pure passthrough; seed identity, comparator, and dev-gating all
sound; the kept substrate — verdict, `canGoBack`/`canDismiss`, `builderContext`, ref-based
mount-window replay — provably untouched; Step-5 deletion is a clean grep-and-delete). Folded in:

- **[test, MUST] Shadow `originKey` input-equivalence had no unit pin.** Added
  `shadowReducer.test` cases for origin-targeted deep-nested dispatch and tabs+sibling-preload;
  verified red-first by breaking the `options` threading (drops make 3 silent tests fail). This is
  the load-bearing envelope seam.
- **[correctness, MEDIUM] Batched multi-dispatch could skip intermediate `seq`s.** Investigated:
  empirically `pending.length` is **never >1** in the suite (each `act`-wrapped `dispatchRoot`,
  including mount-window replay, commits the shadow separately). Built an accumulation+drain variant
  to close the theoretical gap, but its extra drain-dispatch perturbed a render-count assertion
  (`prefetch.test` "…while prefetching in tabs"). Reverted to the simpler single-seq design (no
  extra render) and **documented the coalescing case as a known limitation** in the compare-effect
  comment (the map sweep still guards against a leak if React ever coalesces). Correct trade for
  throwaway dev-only scaffolding; the gap only ever hides a *transient* divergence healed within one
  commit, and the flip's real coverage is Step 5's own tests.
- **[test] Documented why the `noop:true` reducer-mock test needs no `__setShadowAssertEnabled`
  toggle** (the noop gate keeps the shadow dormant) — a comment so a future `noop:false` edit isn't
  mystified by a spurious oracle fire.
- **[arch, LOW] `MockRouterKey` still used** for the container/state key (line 34) — not dead; the
  counter→nanoid change touched only the two route-key mints. Confirmed no test asserts the old
  `name-<counter>` shape.
- **[correctness/arch, accepted LOW] Comparator greedy-`.+` regex** can match a stable key of shape
  `X-<21 url-safe chars>`, but harmlessly (such keys are preserved identically by both reductions, so
  they pass the `===` branch anyway; only differing keys matter, and only minted keys differ). Left
  as-is.

Bottom line: no blocking findings; production-correct, behavior-neutral, cleanly Step-5-deletable.
