# Plan — Router v57 new state model

Implements [RFC.md](./RFC.md). Rationale for cross-cutting choices lives in
[Decisions.md](./Decisions.md) (P-1 scope, P-2/P-4 resolution, P-3/P-9 store, P-5..P-11) — not
repeated here.

**Scope this session (P-1):** a self-contained, unit-tested greenfield state module under
`packages/expo-router/src/navigation-state/` (P-11), imported by nobody in the live render path.
The shared `renderRouter`/`store`/`ExpoRoot` path and the ~14 react-navigation-shape test files are
**not touched**. Full render integration (replacing react-navigation as the owner) is a later effort.

## Target model (from the RFC)

- Homogeneous tree, single source of truth: `{ root: NavNode }`, `NavNode = {key, routes, index}`,
  `RouteEntry = {key, name, params?, child?}` — [state shape](./RFC.md#L314), [D5](./RFC.md#L426).
  No `type` field on nodes. Single scalar `index` commits to C10 option 1 (P-10).
- Minimal tree hydrated from URL; URL is a lossy projection of the focused path —
  [D1](./RFC.md#L422), [scenario 1](./RFC.md#L9).
- Reducer is **dumb + pure + sync**; the resolution layer maps intent → primitive ops via a
  behavior `switch` keyed by node name — [C12-C](./RFC.md#L390), Decisions P-2/P-4.
- Root `useReducer`, transition-based, thin imperative bridge — [D12](./RFC.md#L433),
  [D4](./RFC.md#L425), Decisions P-3/P-9.

## Phases (each independently reviewable; TDD red→green)

### Phase 0 — resolution seam spike *(highest risk, first)*
Pure `resolve(intent, node, behavior)` (`switch` over `resolveStack`/`resolveTabs`) returning
primitive ops; behavior looked up by node name via an injected `name → behavior` map (Decisions
P-4). Strategies expose `canHandleBack(node, localInput)` (P-8). Ship intents covering RFC
[scenarios 2–6](./RFC.md#L108): stack `goBack`/`popTo`/`popToTop` = targeted remove+index--; tabs
switch/`goBack` = set-index, no route removed ([scenario 5/6](./RFC.md#L227)) (P-7).
**Exit criterion (the thesis, P-5):** resolve a `navigate`/cross-tab batch into a branch that is
**absent from state and never rendered**, producing correct ops from the map alone.

### Phase 1 — tree types + reducer primitive ops
**1a (pure, zero React):** `GlobalNavState`/`NavNode`/`RouteEntry` + pure sync reducer over ops
`insert` / `remove`(targeted, idempotent, P-7) / `setIndex` / `batch`; deterministic key minting
(P-7); actions carry `source` provenance which the reducer **ignores** (P-6). Independent oracles
(Decisions, general Delta G): reducer-purity invariant (new object, `prevState` untouched);
additivity (op A then B both present — this is where the transition "additive" claim is really
tested, P-9); stack-vs-tabs length invariant. Fixtures from RFC [scenarios 1–6](./RFC.md#L9) as
*examples*, not the sole oracle. Multi-visible node is expressible (P-10).
**1b (isolated render harness):** mount a tree-driven navigator directly (NOT via `renderRouter`)
and assert React output changes on dispatch (P-1 anti-cop-out). Per-node re-render fan-out /
selectors noted as a documented integration concern, not built now (P-9).

### Phase 2 — URL hydration → minimal tree
Hydrate the minimal active path from a URL using the existing static linking config
(`getReactNavigationConfig`/linking manifest) — [scenario 1](./RFC.md#L9). Local anchor seeding
(stack `initialRouteName` re-inserting `index` under a deep link) as a **pure batched op** with
`source: 'seed'` — [scenario 1b](./RFC.md#L46), [D8](./RFC.md#L429). The no-flash-before-paint
*timing* guarantee is a harness/integration concern, not provable here (react Delta).

### Phase 3a — action resolution + back-bubbling
Wire `navigate` / `goBack` / `goBackTo` / `replace` / `reset` / `batch`
([actions](./RFC.md#L363); `preload` dropped — navigator-local, no global effect, [D6](./RFC.md#L427))
through Phase 0's resolution to Phase 1's ops, with target `{path, scope: absolute|relative|navigator}`
([D7](./RFC.md#L428)); params merge handled via `navigate` to an existing route.
**`resolveBack(state, focusedPath, behaviorLookup, focusOrder) → { ops } | { exit: true }`** (P-8):
test scenario 5 (stack handles), scenario 6 (bubbles to tabs, set-index via injected focus-order),
and fall-through → `{ exit: true }` ([RFC.md#L312](./RFC.md#L312)).

### Phase 3b — URL projection
Project the focused path back to a URL string ([scenarios 2/3](./RFC.md#L108),
[D1](./RFC.md#L422)). Oracle: `hydrate(url)` → `project(state)` round-trips to a normalized-equal
URL across generated paths (general Delta G), not just the scenario fixtures.

### Phase 4 — thin root store + imperative-bridge proof
Root `useReducer` + context + a **minimal** module `dispatch`/committed-snapshot bridge so
`router.push`/`back` drive the Phase 1 harness end-to-end ([D12](./RFC.md#L433), Decisions P-9).
Production hardening (install timing, StrictMode survival, idempotent pending-intent drain, server
guard, `getServerSnapshot`, fan-out selectors) is **documented for the integration session**, not
built now. Concurrent transition cancellation: documented as unverified-in-unit-tests (P-9).

## Out of scope this session (RFC, but render-layer or open)
Navigator-local ephemeral state — disappearing screens ([scenario 5](./RFC.md#L227)), drawer
([D10](./RFC.md#L431)), preload/all-tabs pre-render ([D6](./RFC.md#L427)/[D11](./RFC.md#L432)),
focus-order *storage* (its *data* is injected into `resolveBack`, P-8); SplitView option choice
beyond P-10 ([C10](./RFC.md#L370)); batch animation ([C13](./RFC.md#L394)); native-first
reconciliation *wiring* (the provenance *contract* is built now, P-6) — note: Android predictive
back is cancellable/progress-driven (≠ scenario 2 fire-and-forget) and maps onto D4 transitions;
native tabs need JS as single owner of tab index; replacing react-navigation as the live owner.
Contracts above are designed not to preclude these.

## Verification
`et check-packages @expo/router` (build + lint + unit tests) green at every commit; the new module
present-but-unimported must not break `build`/`test:types`. Before each commit, ≥3 fresh challenge
agents (test coverage; does-each-test-test-what-it-means; architecture; minimalism). **Do not push.**
