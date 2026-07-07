# Meta-plan: Execute Steps 5–9 of the Global Navigation State refactor

> The technical, step-by-step spec lives in `~/Documents/notes/expo-rotuer/global-state-rfc/PLAN.md`
> (referred to below as the **RFC plan**). This file is the *execution* plan — how each step gets
> planned, reviewed, implemented, reviewed again, and committed.

## Context

The RFC plan inverts Expo Router's navigation dispatch from per-navigator, render-time reducers to a
container-scoped **reducer registry** + a single **root reducer**. Steps 1–3 landed. This meta-plan
does not re-derive that technical content — it orchestrates *how* Steps 5–9 get executed, one step
at a time, each wrapped in a fixed review-driven workflow, so each lands green and reviewed before
the next begins.

**Step 4 is already done** (confirmed on this branch, not re-planned here):
`StackRouter.tsx:457-460` and `TabRouter.tsx` attach `payload.state` verbatim to freshly-minted
routes; the dev tripwire `assertSubtreeKeyMatchesRoute` lives in `getRouteKey.tsx:80-96`; dedicated
`// Step 4` sections exist in `routers/__tests__/{StackRouter,TabRouter}.test.tsx`. So this plan
**starts at Step 5**. The router-side subtree insert is a *consumer* that already exists and is
dormant — Steps 5 (emit) and 7 (root-reducer insert) light it up.

**Dependency order (do not reorder):** 5 → (6, 7) → **8 (atomic)** → 9. Steps 6 and 7 are both
additive/dormant and independent of each other (either order); 8 is the single atomic flip; 9 is
staged (9a/9b/9c).

---

## The per-step workflow (applies to every step below)

Run these seven substeps in order for each step. Do not start substep N+1 until N is complete.

1. **Detailed plan** → write `~/Documents/notes/expo-rotuer/global-state-rfc/Step X.md`. Keep it
   short and scannable (per standing preference): what changes, files, the red→green test list,
   known unknowns, and the decision(s) resolved. Not a restatement of the RFC plan.
2. **Challenge the plan** → launch **3 fresh review agents in parallel**, distinct lenses:
   (a) correctness / edge-cases, (b) architecture-fit within expo-router + the RFC's four
   invariants, (c) test strategy / red-green completeness. Fold their findings into `Step X.md`.
3. **Implement** → TDD, red first: write the failing test, watch it fail, then implement to green.
   Keep the full suite green (only Step 8 is allowed to be atomic across a single commit).
4. **Challenge the implementation** → launch **3 fresh review agents in parallel** (same three
   lenses, now aimed at the diff + tests): hunt edge cases, over-engineering, missed invariants,
   weak assertions. Address findings.
5. **Commit** → once the implementation-review agents' findings are addressed, commit directly:
   `[step x] <one-line message>` — one line, no body. No per-commit human review gate.
6. **Update the RFC plan** → in `~/Documents/notes/expo-rotuer/global-state-rfc/PLAN.md`, mark the
   step landed and record any correction/deviation discovered during implementation (like the
   existing "one correction to the RFC" note).
7. **Clean context** → clear the conversation and start the next step fresh.

**When a complex decision arises mid-step** (e.g. "where does `beforeRemove` live", "how does the
emitter mint keys against live state"): launch a fresh agent to weigh the approaches and recommend
one *before* committing to code. Record the decision in `Step X.md`.

---

## Step 5 — Switch `getNavigateAction` wire → `target` + `payload.state`

**What to address.** Replace `getPayloadFromStateRoute`'s nested `screen`/`params`/`initial`
flatten with a builder that emits the divergent subtree as `payload.state`, `target` staying
`navigationState.key`. Fold `withAnchor` into the emitted subtree; keep `singular`. Prove it under
the **old** `useOnAction` path — the Step-4 router insert consumes `payload.state`; nothing about
dispatch changes yet. Leave the `useNavigationBuilder` nested-param expansion in place (still used
by `navigation.navigate({screen})` / `reset(state)`).
- Files: `global-state/getNavigationAction.ts`, `global-state/stateUtils.ts`. Rewrite
  `global-state/__tests__/getNavigationAction.test.ios.ts`.
- Green: full navigation / tabs / push / dismissTo / protected / nested suites stay green.

**Known unknowns / risks.**
- **Key minting is a hard failure, not silent.** `assertSubtreeKeyMatchesRoute` (`getRouteKey.tsx:80`)
  throws in dev when the emitted subtree key ≠ the router's minted key. `getStateFromPath` keys in
  isolation; the router mints against *live* state via `getNextRouteKeyFromState`. Canonical trap:
  `push('bar')` when a live `bar` exists → router mints `…:1`, isolated build yields `…:0`.
  **Decision to resolve (spawn an agent):** how the emitter derives keys that agree with the live
  state — pass live state into the builder, or emit keyless subtrees and let the router key them.
- **Two subtree formats coexist after this step** (nested params + `payload.state`) until Step 9b.
  Decide how `initial`/`withAnchor` semantics map onto the new subtree vs. staying on the params.
- **`findDivergentState`'s "look through tabs" path** (`stateUtils.ts:51-71`) is flagged as
  superseded by Step-4 subtrees — decide whether Step 5 narrows/retires `tabNavigatorKeys` or defers.
- Preloaded/live routes deliberately ignore `payload.state`; the emitter must not assume it always
  wins. TabRouter's REPLACE→JUMP_TO wrapper rewrite must preserve `payload.state`.

---

## Step 6 — Reducer registry (dormant) + per-navigator registration

**What to address.** A **per-container** registry (never module-global; per-request isolated for
SSR/RSC) with idempotent `addReducer`/`removeReducer`. `useNavigationBuilder` registers
`key → (s,a) ⇒ router.getStateForAction(s, a, latestConfigRef.current)` in a **layout effect**,
deps `[key, backBehavior]`, cleanup removes. Must not dispatch. Nothing reads it yet.
- Files: `global-state/storeContext.ts`, `react-navigation/core/BaseNavigationContainer.tsx`,
  `react-navigation/core/useNavigationBuilder.tsx`.
- Green: new test — one entry per mounted navigator, correct deterministic key, StrictMode
  mount/unmount/mount leaves no duplicates.

**Known unknowns / risks.**
- **Host in the container, not a global.** `BaseNavigationContainer` already owns `useSyncState` and
  focus-listener routing; `NavigationIndependentTree` (`BaseNavigationContainer.tsx:65-72`) means a
  singleton registry would cross-wire independent trees. Container-scoped is mandatory.
- **`latestConfigRef`** — the registered reducer must read the *current* `routerConfigOptions`
  (routeNames/paramList/getIdList), not a stale snapshot; the router + options are built at
  `useNavigationBuilder.tsx:829-843`.
- StrictMode double-invoke and Concurrent: the layout-effect register/cleanup must be idempotent and
  survive mount→unmount→mount without leaking or duplicating entries.
- Confirm the deterministic `key` used for registration equals the key the compiler/root reducer
  address by (`getStateKey`/`getRouteKey`).

---

## Step 7 — Root reducer (pure) + `store.dispatch` (dormant) + dev shadow-compare

**What to address.** `rootReducer(tree, action, registry)`: `structuredClone`; start at
`action.target`; `while registry.has(key)` run the slice reducer (null → break; `GO_BACK` pops the
descent stack to the parent key and retries — structurally identical to `onActionParent`); splice;
descend into `reduced.routes[reduced.index].state`; insert `payload.state` at the first unmounted
boundary; one commit + `assertStateIsComplete`. **Preserve `beforeRemove`/`shouldPreventRemove`.**
Behind `__DEV__`, run alongside each old-path commit and assert deep-equal (de-risks Step 8).
- Files: `global-state/store.ts` or new `global-state/rootReducer.ts`.
- Green: unit tests over fixture trees (cross-branch navigate, GO_BACK ascend, boundary insert, tab
  jump); shadow assertion rides the existing suite.

**Known unknowns / risks.**
- **Where does `beforeRemove`/`shouldPreventRemove` live** once the walk is centralized? Today it's
  interleaved per-navigator in `useOnAction.tsx:95-107`, between `getStateForAction` and `setState`,
  and can abort. The root reducer computes the whole diff in one pass and must interleave prevention
  at each affected level and abort the *entire* action if any level prevents. Preserve the
  ENG-22012 preloaded/inactive-route hazard. **Decision to resolve (spawn an agent).**
- **Focus bubbling** (`shouldActionChangeFocus` + `onRouteFocusParent`, `useOnAction.tsx:110-118`)
  must be reproduced as a multi-level registry walk.
- **GO_BACK ascent** — the descent-stack pop must exactly mirror today's `onActionParent` chain,
  including the loop-guard semantics (`visitedNavigators`).
- **Shadow-compare fidelity** — deep-equal will surface any divergence (key ordering, frozen-object
  identity, `assertStateIsComplete` on tab/drawer partial state). This is the safety net for Step 8,
  so invest in making the comparison exhaustive and the failure message diagnostic.
- `structuredClone` cost/frozen-state interaction with `useSyncState`'s `deepFreeze`.

---

## Step 8 — Flip dispatch to the root reducer  ⚠️ ATOMIC

**What to address.** Point **both** entry points at `store.dispatch({ target: key, ...action })`:
per-navigator `navigation.dispatch` (via `useNavigationBuilder`/`useNavigationHelpers`) and the
container `dispatch` (`BaseNavigationContainer.tsx`, dropping the `listeners.focus[0]` routing).
`store.dispatch` runs `rootReducer` against `useSyncState.getState()` and commits via the existing
`setState` → one notify. Cannot be split: a half-flip double-applies actions against one tree.
- Files: `BaseNavigationContainer.tsx`, `useNavigationBuilder.tsx`, `core/useNavigationHelpers.tsx`.
- Green: full suite — `navigation-events`, `resetRoot`, `canDismiss`, `prefetch`, `protected`,
  nested go-back. **The Step-7 shadow-compare is the safety net.**

**Known unknowns / risks.**
- **Atomic by nature** — the only step allowed to be a single all-or-nothing commit. Both dispatch
  front doors must flip together.
- **`resetRoot`, `canGoBack`, `canDismiss`** also route through `listeners.focus[0]`
  (`BaseNavigationContainer.tsx:108-152`) — decide their new path (registry lookup vs. root reducer).
- **Legacy dispatch paths can be dropped** (decided): `NAVIGATE_DEPRECATED` down-bubbling and
  `navigationInChildEnabled` targeted-child dispatch (`useOnAction.tsx:131-145`) are not contractual
  — the root reducer need not reproduce them. Leave a `TODO` comment where they're removed so the
  drop is discoverable if a consumer ever surfaces.
- **Batching / commit timing** — today `useScheduleUpdate` + `useSyncState.batchUpdates` coalesce
  multiple per-navigator setStates per render into one notify. A single root-reducer commit changes
  the timing; the routing queue (`global-state/routing.ts`, `routingQueue.ts`) must stay compatible.
- **Devtools** `onDispatchAction`/`__unsafe_action__` emit must still fire.
- Verification here is heavyweight: full `CI=1 pnpm test` (incl. `rsc/*`) + `pnpm build`, plus
  the on-device e2e matrix. Per project rules, this is a mandatory fresh-review-agent checkpoint on
  the registry/root-reducer design.

---

## Step 9 — Read slices from store; relocate normalization; gut the imperative core (staged 9a/9b/9c)

**Staging is delegated to the Step 9 planning agents** — one `Step 9.md` with three commits vs.
three independent cycles is their call, based on how coupled 9a/9b/9c turn out to be.

**What to address.** Three sub-stages, each its own red→green:
- **9a** Switch navigator state *read* to `useStoreSlice(key)` — a selector over the committed tree
  with a WeakMap `tree → key → slice` snapshot cache (referentially stable `getSnapshot`, avoids the
  React tearing guard). Leave dead machinery bypassed. Replaces the `NavigationStateContext` +
  `SceneView` positional walk (`SceneView.tsx:55-60`).
- **9b** Move nested `screen`/`state`/`initial` → `payload.state` normalization out of the hook and
  into the dispatch boundary (`store.dispatch`/`normalizeAction`), so `navigation.navigate({screen})`
  and `reset(state)` keep working once the hook's expansion is gone.
- **9c** Delete the bypassed machinery: `useOnAction` wiring, compose-up `setState`,
  `useScheduleUpdate`, render-time `state = nextState`, `stateRef`, the reactive nested-param
  expansion, the Activity `stateCleanupRef`/`lastStateRef` reuse (store retains unmounted slices).
- Files: `useNavigationBuilder.tsx`, `core/useNavigationHelpers.tsx`, new `useStoreSlice`.
- Green: full suite incl. `smoke`, `renderCount`, `useFocusEffect`, Activity/hidden-tab tests.

**Known unknowns / risks.**
- **Render-phase state coherence — the `stateRef` hazard.** `stateRef`
  (`useNavigationBuilder.tsx:752-758`) + its consumer (`useNavigationHelpers.tsx:126-137`) exist
  because the sync store lags a not-yet-committed render-phase state. 9a must confirm the
  pre-seeded-complete model makes render-phase divergence impossible before 9c deletes `stateRef`;
  otherwise `useNavigationState`/`useIsFocused` read stale mid-render. **Highest risk in Step 9.**
- **Route-names-change / conditional rendering** (`getStateForRouteNamesChange`,
  `UNSTABLE_routeNamesChangeBehavior === 'lastUnhandled'`, `useNavigationBuilder.tsx:558-611`) is the
  one path where a child mutates its own slice at render outside a dispatch. The root-reducer model
  doesn't cover it — **this is Step 10's job**, so 9c must not delete machinery that Step 10 still
  needs. Draw the 9c/Step-10 boundary explicitly in `Step 9.md`.
- **`useStoreSlice` tearing** — the WeakMap snapshot cache must return a referentially stable slice
  for an unchanged tree, or `useSyncExternalStore` throws its tearing guard.
- **Orthogonal context survivors** — `getKey`/`setKey`/`getIsInitial`/`addOptionsGetter` still flow
  through `NavigationStateContext`/`SceneView` (`SceneView.tsx:136-147`) and must keep working after
  the *state* read is repointed.
- `renderCount` test is the guardrail that the read path didn't add renders.

---

## Verification (per step)

- Per step: `pnpm test <file>` red→green in `packages/expo-router`; `pnpm test:types` on
  type-touching steps.
- After Step 8 (and later Step 11): full `CI=1 pnpm test` incl. `rsc/*` projects + `pnpm build`.
- On-device e2e via `apps/router-e2e/__e2e__/` (iOS + `/android-e2e-testing`): deep-link into nested
  tabs→stack, tab press onto a never-visited tab, `GO_BACK` ascending across navigators, web browser
  back/forward, `+not-found`, catch-all wildcard round-trip.
- Mandatory fresh-review-agent challenge after Step 8 on the registry/root-reducer design
  (StrictMode/Concurrent, `beforeRemove`, SSR/RSC registry isolation, the one-tick implicit-anchor
  window).

## Not in scope

Steps 10–19 (route-names reconcile, dead-code deletion, legacy wire-format retirement) are planned
in the RFC plan and executed in later cycles under this same per-step workflow.
