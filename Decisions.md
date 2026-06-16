# Decisions & Observations — Router v57 New State Model

Running log of decisions and observations made while planning and implementing the
[RFC](./RFC.md) (Router v57, new global state model). Newest entries at the bottom of each section.

## Observations about the current codebase (2026-06-16)

- **State lives in react-navigation today.** The navigation tree is owned by
  react-navigation's `NavigationContainer` ref (`global-state/store.ts`). The imperative
  `router` API queues actions (`global-state/routingQueue.ts`) that are dispatched to the
  container; `onStateChange` mirrors the result into a module-level `storeRef.current.state`
  and notifies `useSyncExternalStore` subscribers (`useRouteInfo`). There is **no** React-owned
  reducer today — this is exactly what RFC D12 changes.
- **Static layout config already exists.** `getRoutesCore.ts` computes a `RouteNode` tree with
  `type: 'route' | 'layout' | ...` and `initialRouteName` per layout. `getReactNavigationConfig`
  and `getLinkingConfig` derive linking/screen config from it. This is the raw material for the
  RFC's "resolve action semantics from static config" (C12-A / D8) — but it does not yet record
  *navigator type* (stack/tabs) statically; that's only known from the rendered `_layout`.
- **`standard-navigation/` is the seed of the new render contract.** It already exposes the
  homogeneous `{index, routes:[{key,name,params,href}]}` shape (RFC "Proposed state shape") and
  `unstable_integrateWithRouter`, but currently adapts react-navigation's builder output rather
  than owning state. No production navigator consumes it yet.

## Decisions

### P-1 — Implementation strategy: greenfield module alongside (no live re-wiring)
*(challenged by two independent scoping agents, both agree)*

Build the new state layer as a **self-contained module under a new directory**, fully unit-tested,
imported by nobody in the live render path this session. Rationale: ~14 test files hard-assert
react-navigation's nested state shape (`store.state.routes[0].state.routes[...]`,
`getRouterState()` in `testing-library/index.tsx`). Any live re-wiring of the shared
`renderRouter`/`store`/`ExpoRoot` path breaks them all at once and cannot land in reviewable
parts. RFC [D3](./RFC.md#L424) ("Greenfield state layer … Native becomes a render target") and
[C12](./RFC.md#L382) ("the global layer must work correctly on its own") explicitly make the
state/action core provable **independent of the render tree**, so a proven pure-logic core +
isolated render proof is a faithful deliverable, not a cop-out. Full render integration (replacing
react-navigation as the owner) is a later, separate effort.

**Anti-cop-out guard:** the core must be proven against React with an **isolated render harness**
(a `*.test.tsx` that mounts a tree-driven navigator directly from `{root: NavNode}` with its own
provider/dispatch — never going through the shared `renderRouter`/`store`), so we prove the model
drives real React output, not just transforms JSON.

### P-2 — Action semantics: dispatch-time resolution + behavior registry (RFC C12 → C+B, not A)
*(challenged by a dedicated C12 agent; deviates from the RFC's stated preference for option A)*

The RFC's [C12 option A](./RFC.md#L388) ("resolve navigator type from static layout config") is
**aspirational** against today's code: navigator type is *not* in static config. `RouteNode.type`
is only `'route'|'api'|'layout'|'redirect'|'rewrite'` (`Route.tsx`), `getReactNavigationConfig`
emits a type-agnostic `Screen`, and type is established purely at render by which component a
`_layout` mounts (`createNativeStackNavigator` etc., `withLayoutContext.tsx`). Worse, custom and
`standard-navigation` navigators express behavior as a **router function** (`getStateForAction`),
not an enum — a static `kind` tag can't reconstruct that.

Decision: ship RFC [C12 option C](./RFC.md#L390) (the **dispatch/resolution layer** turns an
intent like `goBack` into explicit primitive ops before the dumb reducer sees them), with the
type data sourced from a **behavior registry** ([option B](./RFC.md#L389)'s storage, but in a side
table — NOT a field on the node, preserving [D5](./RFC.md#L426) homogeneity). Each behavior
("stack", "tabs", and custom) registers a pure strategy keyed by **layout name / `contextKey`**.
Nodes stay shapeless; no new user-facing syntax (users still declare type by rendering `<Stack/>`
or passing `StackRouter`). [D8](./RFC.md#L429)'s "navigator types live in static config" is
treated as a **TODO**, not a precondition. Dispatch-time resolution satisfies C12 because it
happens in JS, not in the render tree — so background tabs / pre-mount deep links resolve fine.

### P-3 — Store mechanism: root `useReducer` + thin client-only bridge (RFC D12/D4, with guardrails)
*(challenged by a dedicated D12 agent)*

Adopt RFC [D12](./RFC.md#L433) root `useReducer` distributed via context — but adopt it **for
deferrable transitions** (RFC [D4](./RFC.md#L425)), not for purity; `useSyncExternalStore` (today's
approach) is otherwise the more tearing-proof choice. Guardrails the RFC under-specifies:

- **Reducer purity is the real source of "additive / never lost"** ([D4](./RFC.md#L425)): every op
  must derive only from `prevState`. This is an invariant to enforce with tests, not a free
  property of `useReducer`.
- **Bridge** = module-level `dispatch` ref + **committed** snapshot ref, installed in a
  **client-only effect** (not during render, unlike today's `useStore.ts`), torn down on unmount,
  **no-op/guarded on server** (RSC has no single mutable module state per request — bleed hazard).
- `router.canGoBack()` etc. read the **committed** snapshot (correct — in-flight transition state
  may be cancelled). To close the stale-read window under transitions, keep a **pending-intent
  channel** (the existing `routingQueue` pattern) so synchronous reads can answer "committed +
  pending".
- **Narrow the claims:** "no tearing" holds for *render* consumers only; imperative reads are
  last-committed by contract. Budget for **context fan-out** (one root reducer re-renders all
  consumers) via context splitting or selectors when wiring real consumers.
- **De-risk first** with a tiny test: two back-to-back `startTransition(dispatch(push))`, assert
  final committed state contains both pushes (additivity) and the intermediate render is discarded.

### P-4 — Resolution seam, not a registry (refines P-2)
*(general + react-native plan reviews)*

Only `stack` and `tabs` ship this session and neither is registered dynamically, so the "registry"
is over-built — the existing `getNavigationAction.ts` resolves intents with plain logic and no
registry. Ship a pure `resolve(intent, node, behavior)` that `switch`es over `resolveStack` /
`resolveTabs`. Keep the **seam** (resolution keyed by a behavior name, separate from the dumb
reducer — RFC [C12-C](./RFC.md#L390)); drop the registry machinery. The behavior for a node is
looked up by **node name** via a static `name → behavior` map (the stand-in for [D8](./RFC.md#L429)'s
"merged manifest"); in real integration that map is populated from the navigator's router/`contextKey`
at mount, but the resolver only needs the map as an injected input. A registry can be extracted later
when a third behavior or a custom-navigator consumer actually exists.

### P-5 — The thesis test: resolve against an unmounted/inactive branch
*(general Delta D + react-native 2c)*

The whole reason [C12](./RFC.md#L382) was reopened is that global must resolve an action for a
navigator that **isn't rendered** (background tab, pre-mount deep link, batched op on an inactive
branch). So the load-bearing test — and **Phase 0 exit criterion** — is: from a minimal state where
a branch (e.g. `search`) is absent, resolve a `navigate`/cross-tab batch into that branch and assert
correct ops are produced **without the branch ever being in state or rendered**, using only the
injected `name → behavior` map. If that test can't be written with the Phase 0 API, the API doesn't
prove the RFC.

### P-6 — Commit provenance is part of the action contract
*(react-native Delta 1a)*

RFC [scenario 2](./RFC.md#L108) (native already animated) and [scenario 3](./RFC.md#L153) (JS-first)
produce **byte-identical** state — they differ only in *who animates*. So the dispatched action
carries `source: 'js' | 'native' | 'hydration' | 'seed'`. The **reducer ignores it** (state is
identical regardless — keep that invariant, it is testable), but it rides onto the committed snapshot
so the future render layer can reconcile a native-origin delta without re-animating. This is
load-bearing now, not later: seeding ([scenario 1b](./RFC.md#L46)) already needs `animation: none`,
so build it as provenance rather than a one-off flag.

### P-7 — `remove` is targeted, idempotent, with deterministic keys
*(iOS D1.1/D1.3 + react-native 1c, grounded in native `dismissCount` reconciliation)*

Native reports multi-level dismissal as a **count from a source route key**, after the animation,
so `remove` must address an explicit **target (key or index range)** — not an implicit "pop the top"
— to faithfully replay single pop / multi-level pop / pop-to-top ([RFC stack notes](./RFC.md#L359)).
`remove` must be **idempotent**: removing an already-absent target is identity (native fires
after-the-fact; JS may have already reconciled the same pop — two sources, one truth). Keys are
**deterministic and stable across JS and native origin**, so a JS push and its native echo produce
the *same* key and dedupe instead of creating a ghost duplicate screen. Phase 0 spikes `popTo` /
`popToTop` intents (not just `goBack`); Phase 1 tests targeted + double-apply `remove`.

### P-8 — Back-bubbling resolution is in scope now (not deferred with focus-order machinery)
*(Android Delta A/B/C)*

Do **not** conflate "focus-order storage is navigator-local/out-of-scope" with "cross-tab back is
out of scope." The back **resolution** — a pure cross-tree walk from the focused leaf upward, asking
each node's behavior `canHandleBack`, emitting that node's back op, else bubbling, else signalling
app-exit ([RFC scenario 5/6](./RFC.md#L227), [open question](./RFC.md#L413), [fall-through](./RFC.md#L312))
— is exactly the render-free resolution [C12](./RFC.md#L382) says must be provable on its own.
Phase 3 ships `resolveBack(state, focusedPath, behaviorLookup, focusOrder) → { ops } | { exit: true }`.
**focus-order is an injected input** (a `string[]`, [RFC](./RFC.md#L309)), not machinery the resolver
owns — tests supply it directly to exercise tabs cross-tab back (scenario 6) and an empty/exhausted
focus-order to exercise the fall-through→exit branch. The `{ exit: true }` result is the contract the
later Android `BackHandler` needs to return `false` from. Each strategy gains `canHandleBack(node,
localInput) → boolean` (stack: `index > 0`; tabs: a previous tab exists in focus-order).

### P-9 — Honest transition testing; thin Phase 4 (refines P-3)
*(react plan review #2 + minimalism Delta B)*

`react-test-renderer` (the repo's test renderer via `@testing-library/react-native`) is
**synchronous/non-concurrent**, so a "two back-to-back `startTransition` are additive" test passes
*even with `startTransition` deleted* and proves nothing about concurrency, and "intermediate render
discarded" is unobservable. Therefore: **additivity is a pure-reducer test in Phase 1** (apply op A
then B to `prevState`, both present — it's a reducer-purity property, not a React one). Concurrent
**cancellation** is demoted to *documented, unverified-in-unit-tests* (relies on reducer purity +
React's documented transition semantics), optionally probed with a `react-dom` `createRoot` + jsdom
harness with a suspending child. Phase 4 ships only what the isolated end-to-end proof needs (root
`useReducer` + context + a minimal `dispatch`/committed-snapshot bridge so `router.push`/`back` drive
the harness). Production hardening — install timing (`useInsertionEffect`/`useLayoutEffect` before
children's effects), StrictMode double-invoke survival, idempotent pending-intent drain, server
no-op guard, `getServerSnapshot`, context-fan-out selectors — is **documented for the integration
session**, not built now (no live consumer this session).

### P-10 — Homogeneous type commits to C10 option 1 (multi-visible via single `index`)
*(iOS D2.2 — a decision being made by the type, surfaced for veto)*

`NavNode = {key, routes, index}` has a single scalar `index`. This **supports** RFC
[C10 option 1](./RFC.md#L372) (renderer shows `routes[0..n]` at once; `index` = focused column;
SplitView columns get per-column child stacks for free via `RouteEntry.child`) but **precludes**
[C10 option 2](./RFC.md#L374) (`visible: key[]` multi-focus) without a structural field addition.
We consciously commit to option 1 for now. Phase 1 adds a test asserting a multi-visible node
(`routes.length > 1`, renderer shows several) is *expressible/legal*, so no contributor assumes
`routes[0..index] = history` everywhere.

### P-11 — Module naming & relationship to `standard-navigation`
*(general Delta H/I)*

New module dir: `packages/expo-router/src/navigation-state/` (descriptive, follows the
`standard-navigation/` precedent of a new-contract module beside the old `global-state/`; avoids a
`-next`/`-v2` suffix that outlives its temporariness). `tsconfig` compiles all of `./src` and the
package has a single `build/index` entry with no subpath exports, so an unimported module compiles
but exposes nothing — safe.

### P-12 — Phase 0+1 challenge-review outcomes (2026-06-16)
*(4 fresh agents: coverage, test-quality, architecture, minimalism)*

Acted on before the first commit:
- **Thesis honesty (test-quality):** the Phase 0 thesis proves resolution *decides* the right ops
  render-free and purely from node state (absent tab → insert; present tab → set-index computed from
  the node, even when the caller passes a different key). Constructing an absent branch's *content*
  from static config is **Phase 2**, not proven here — P-5 narrowed accordingly. Added the
  absent-precondition assertion in both the unit and harness thesis tests.
- **Cut speculative surface (minimalism):** removed `canHandleBack` + `BackContext` (their consumer
  `resolveBack` is Phase 3 — P-8 updated), `behaviorOfNode` (name→behavior wiring is Phase 3),
  `insert.position` (the seed/anchor "insert before" path is Phase 2), and narrowed `ActionSource`
  to `'js' | 'native'` (`'hydration' | 'seed'` arrive in Phase 2). Un-exported `behaviorFor` so
  `resolve` is the sole seam.
- **Key uniqueness (architecture):** `NavNode.key` is documented as unique across the whole tree;
  `updateNode` short-circuits after the first match (a duplicate key would otherwise be
  double-applied). A future `replace` primitive is expected in **Phase 3a** (remove+insert loses the
  slot/animation semantics) — flagged, not built.
- **Index clamp (architecture):** kept but reframed as a *structural* node invariant (keep `index`
  in bounds), not a navigation decision — the resolver still owns which route is focused. Tests
  reworded to not assert clamp as the goBack mechanism.
- **`focus` smell (architecture):** stack `focus` now means navigate-correct `popTo`-if-present-else-
  `push` (not a blind push alias).
- **Coverage (coverage):** added cross-node batch, no-target-match identity (`toBe` bail-out), and
  params-preservation tests; deleted the tautological provenance and tabs-length tests (folded into
  the idempotent-by-key convergence test) and the hand-written scenario-6 reducer test (real
  scenario 6 lands in Phase 3 with `resolveBack`); strengthened the multi-visible test to assert an
  unfocused column keeps its independent stack depth.

Relationship: this module is the **global state backend** (the whole-app nested tree:
`NavNode` with `child`, `index`). `standard-navigation/` is the **per-navigator render contract**
(a flat `{index, routes:[{key,name,params,href}]}` slice for *one* navigator level). They are
different layers and compatible by design ([D3](./RFC.md#L424)): a navigator will eventually project
its `NavNode` slice into the standard shape. So `NavNode`/`RouteEntry` are genuinely new types (not
a redeclaration of standard-navigation's flat type); the projection is render-integration (out of
scope). Noted so the two shapes aren't accidentally merged or duplicated.
