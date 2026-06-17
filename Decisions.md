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

## Render-layer phase (2026-06-17)

### R-1 — Render architecture: navigators as pure `NavigatorArgs` render targets (Option B), not container state-substitution (Option A)
*(decided by a fresh architecture agent + a view-contract audit agent)*

To render real screens from the new tree, **Option B**: project a `NavNode` slice into the
`standard-navigation` `NavigatorArgs` (`{state:{index,routes}, descriptors:{key:{options,render()}},
actions, emitter}`) and feed NEW navigator components. This is RFC [D3](./RFC.md#L424)/[D5](./RFC.md#L426)
("native becomes a render target", "navigators are a pure rendering layer").

**Rejected Option A** (drive react-navigation's `NavigationStateContext` from the reducer and reuse
existing navigators): `useNavigationBuilder` does not passively read state — it runs incoming state
through `getRehydratedState`/`getStateForAction` and writes back via `setState`, so two state machines
fight; and it keeps RN routers as the live semantic authority, which only runs when mounted, defeating
[C12](./RFC.md#L382)/P-5 (render-free resolution for unmounted branches — the whole thesis).

**Reuse line (the hybrid):** do NOT rebuild react-navigation's `SceneView`/`useDescriptors`/RSC
wrappers. Reuse **expo-router's own** screen-component layer (`getQualifiedRouteComponent`/`Route`
from `useScreens.tsx`, which already handles Suspense/error-boundary/RSC/lazy) to produce each
descriptor's `render()`, and recurse via a new `NavNodeContext` that hands each route's `child`
NavNode to the nested navigator. Under the flag the whole tree uses the new navigators, so recursion
flows through `NavNodeContext`, never react-navigation's context.

**View reuse map (audited):** `NativeTabsView` is a clean contract (`{focusedIndex, tabs:[{routeKey,
name,options,contentRenderer}], onTabChange}`) — reuse as-is. `NativeStackView` and
`ExperimentalStackView` are RN-coupled (consume full `StackNavigationState` + `preloadedRoutes` +
`describe`) — need thin new views on `{index, routes, descriptors}`.

**Highest risk:** the key-identity contract end-to-end (hydration mint → push mint → native echo
dedupe → descriptor key → screen reconciliation, P-7/P-13). De-risk with a single-Stack leaf prototype
before the other two navigators.

### R-2 — Reuse existing views via a `navigation` shim (revises R-1's "thin new views")
*(react-native + iOS + React plan reviews converge)*

Do NOT write thin new stack views. `NativeStackView`/`ExperimentalStackView` are ~600/210 lines of
headers, sheets, `preventRemove`, freeze math, gestures, and native-`dismissCount` reconciliation —
rewriting regresses features. And `getQualifiedRouteComponent`'s `BaseRoute` *requires* a
react-navigation `navigation` object anyway (`isFocused`/`getState`/`addListener('focus'|'transitionEnd')`/
`replaceParams`/`useStateForPath`), so a shim is unavoidable. Therefore: keep my reducer as the state
owner (Option B — no `useNavigationBuilder`), but **project each `NavNode` slice into the shape the
EXISTING view consumes** (an inert `StackNavigationState`-shaped object for the stack views;
`{focusedIndex, provenance, tabs, onTabChange}` for `NativeTabsView`) **plus a per-route `navigation`
shim** whose `dispatch`/`emit` route into `dispatchNav`. Feeding an inert projected state does NOT
re-create Option A's fight (no `setState`/`getStateForAction` round-trip — nothing reconciles it).
This reverses the memory note's "no reconstructed navigation" guidance *for this case* because the
shim is the price of reusing the heavy native views; keep it honest/documented and source-tagged.

### R-3 — Flag = render-time branch in a stable component (NOT an export swap)
*(React + general reviews)*

`enableNewStateModel()` sets a module boolean; `isNewStateModelEnabled()` reads it **at render and
per-dispatch, never at module-eval**. Each navigator export stays ONE stable component that branches
internally (`isNewStateModelEnabled() ? <New/> : <Old/>`). Rationale: an eval-time export swap races
the user's `enableNewStateModel()` call (the flag is almost always still `false` when `expo-router` is
first imported) and would change what the ~19 flag-off RN-shape test files import. Mirror
`screensFeatureFlags`'s init guard; account for Fast-Refresh resetting the module boolean. **Invariant:
flag-off is byte-identical to today** — every new-path side effect (behavior registration,
`NavNodeContext`, bridge install) must be guarded or only reachable flag-on; run the RN-shape suite
flag-off at every commit.

### R-4 — Vertical-slice-first sequencing (revises the R-Phase list)
*(general review — mount + imperative + route-info are mutually load-bearing)*

Flag-on there is no `NavigationContainerRef`, so `routingQueue.run`'s `if (ref.current)` silently
drops every action, and `useRouteInfo` returns stale state without projection — so mount (#1) +
imperative (#3) + route-info (#4) must land in ONE commit. Re-sequenced phases:
- **A** — flag module only (`enableNewStateModel`/`isNewStateModelEnabled`). No registry (cut per
  P-4/P-12; a plain module `Map<contextKey,behavior>` is added when a navigator first needs it).
- **B** — `NavNode`→view projection + per-route `navigation` shim + `NavNodeContext` + ONE Stack,
  proven under a real `NavigationStateProvider` in an isolated `*.test.tsx` (key-identity de-risk).
- **C** — first flag-on vertical slice: mount + imperative + route-info + hardware-back, wired atomically;
  one Stack navigable end-to-end; exit criteria = on-device push/back works AND flag-off suite green.
- **D** — NativeTabs (replicate; feed existing `NativeTabsView`, wire `provenance`/`onTabChange`).
- **E** — ExperimentalStack (replicate, reuse the stack view).

### R-5 — Seam #7: hardware back; native reconciliation is in-scope for B/C
*(Android + iOS + react-native reviews)*

- **Hardware back (#7):** the new mount bypasses `fork/useBackButton`. `NavigationStateProvider` must
  subscribe `BackHandler` → `resolveBack(getNavSnapshot(), lookup, focusOrder)`; `'ops' in r` →
  `dispatchNav` + `return true`, else `return false` (Android exits). Branch on `'ops' in r`, not
  `ops.length`.
- **Focus-order producer:** add a minimal per-tabs-node focus history (appended on tab change), else
  Android cross-tab back exits the app instead of returning to the previous tab. Amends the
  out-of-scope "focus-order storage" line.
- **Native reconciliation in B/C (not deferred):** the `navigation` shim carries `source:'native'`;
  native `onDismissed(dismissCount)` → multi-key `remove` (idempotent dedupe, P-7); JS `back()` should
  commit the `remove` on the native callback, not synchronously, so the outgoing screen stays mounted
  for the pop/back-swipe animation (disappearing-screen hold lives in the view via the shim). Tabs:
  carry the `provenance` counter and the four-case `onTabChange` (`isNativeAction`/`isPrevented`).
- **Link preview / preload:** the tree has no `preloadedRoutes`; gate `<Link.Preview>` as unsupported
  under the flag for now (warn), rather than silently breaking iOS peek/pop.

### R-7 — Render-phase scope (user steer, 2026-06-17)

Build R-Phases B–E (all three navigators + flag seam wiring) with **jest tests**; on-device
verification is explicitly skipped this pass (user to verify later) — so claims are "jest-green",
not "device-verified". When the flag is ON and an app uses a navigator type not yet ported (Drawer,
JS Tabs, TopTabs, SplitView), **throw a clear error** naming the navigator and that the new state
model doesn't support it yet — no silent breakage, no risky mixed-mode coexistence.

### R-9 — R-Phase B part 2 (Stack render via shim) review outcomes
*(4 fresh agents: architecture, coverage, quality, minimalism)*

A `Stack` renders real screens from the new tree through the existing `NativeStackView` + a per-screen
`navigation` shim, wrapped in the provider contexts `NavigationContent` supplies (Theme,
NavigationHelpers, NavigationStateListener, FocusedRouteKey, PreventRemove). 40 render tests; 314 total.
Acted on:
- **Memoize on the slice** (the top fix): descriptors/shims/projection are `useMemo`d on the `NavNode`
  slice (reference-stable), so screen `navigation` identity is stable — otherwise `BaseRoute`'s
  focus/transitionEnd effects re-subscribe every render and `React.memo` is defeated.
- **Throw, don't render blank** (R-7): an unmatched route name throws a clear error; `describe`
  (preloaded routes) throws "not supported under enableNewStateModel" since the tree has no preload.
- **Cut speculative shim methods**: removed `push`/`navigate`/`pop`/`popToTop`/`removeListener` (no
  view-layer caller — the live native path is `dispatch`'s `POP`/`POP_TO_TOP`; header back uses
  `goBack`); kept the 6 `BaseRoute` methods + `emit` + `dispatch` + `canGoBack`. Cross-navigator
  navigate/back land in R-Phase C (resolved against the whole tree, not focus-on-node).
- **Stronger tests**: push asserts committed `getNavSnapshot()` index/order (not just "mounted");
  push→back asserts the screen is removed; the **nested-navigator recursion** seam is exercised; a
  native-origin `POP` asserts `source:'native'` (P-6).

Known limitations carried forward (jest-green; on-device pending — R-7):
- **Per-screen `options` are `{}`** — header/sheet/gesture/presentation options aren't projected yet,
  so the reused view's full feature set is dormant until an options-projection phase.
- **`setParams`/`replaceParams` are documented no-ops** — param updates need the deferred `replace`
  primitive (P-15); `replaceParams` is safe because the new model never sets the no-animation param.
- **Route→RouteNode matching is by `route.name === child.route`** — fine for static segments; dynamic
  segments/groups need handling in a later phase.
- **Disappearing-screen hold / native dismissCount→remove** is wired through the shim's `dispatch`
  but not yet exercised against real `react-native-screens` lifecycle (on-device, R-Phase C+).

### R-10 — R-Phase C (flag-on vertical slice) review outcomes
*(4 fresh agents: architecture, flag-off integrity, test quality, minimalism)*

`enableNewStateModel()` now switches the app end-to-end: `ExpoRoot` mounts `NavigationStateProvider`
+ the hydrated app tree + the new `Stack` (flag-swapped at the `StackClient` export, render-time
branch — flag-off renders the byte-identical `StackImpl`); `routingQueue.run` resolves imperative
actions via the new model; `useRouteInfo` projects the tree to the `UrlObject`; Android `BackHandler`
→ `resolveBack`. Integration tests (real `ExpoRoot` via `renderRouter`, flag on): boot, deep-link
boot, `router.push`/`back` + `usePathname`, and a "new provider mounted" oracle. **Flag-off is
byte-identical** — full suite (4372 tests) green; the only flag-off deltas are an inert extra context
read in `useRouteInfo` and one extra wrapper component, both verified harmless.

Acted on: `unwrapSlot` finds the `__root` slot by name (not position); dropped the speculative
`hydrateAppTree` export; trimmed the stale `store.tsx` roadmap comment; fixed the `behaviorMap`
"live view"→"snapshot" comment; noted why the root needs its own shim.

**Known limits (documented, deferred):**
- **R-10a `push` ≡ `navigate`:** `imperativeDispatch` ignores `options.event`, so `router.push` to an
  already-present route won't add a duplicate (uses navigate semantics). Pinned by a KNOWN-LIMIT test.
- **R-10b not-found/sitemap:** `_sitemap`/`+not-found` can be top-level siblings of `__root`; the
  unwrap/re-wrap and `getRouteInfoFromState`'s sibling-handling aren't fully wired for those focused
  cases. Fine for matched routes (the slice); to finish before GA.
- **Behavior registration is effect-time** (mounted navigators only) — the documented C12/P-4
  stand-in; unmounted-branch behavior lookup still pending the static manifest.
- Per-screen `options` still `{}`; `setParams` no-op (P-15); on-device verification still pending (R-7).

### R-11 — R-Phase E (ExperimentalStack)

`createStackNavigator` generalized into `createTreeStackNavigator(View)` — `NativeStackView` and
`ExperimentalStackView` consume the identical `{state, navigation, descriptors, describe}` contract,
so `ExperimentalStack` reuses the entire Stack machinery (projection, shim, providers, behavior
registration), only swapping the view. Flag-swapped at the `experimental-stack` export like Stack
(R-3); flag-off byte-identical. Integration test (flag on): boot + push/back. Full suite (4373) green.
Reviewed via the shared factory already covered by R-9/R-10's 4 agents + the full suite, rather than a
fresh round, since it is a mechanical reuse of the proven pattern.

### R-8 — R-Phase B foundation (NavNodeContext + projection) review outcomes
*(3 fresh agents)*

`render/navNodeContext.tsx` (slice handoff; nested providers = recursion) and
`render/projectToStackState.ts` (NavNode → inert StackNavigationState the existing views read) are the
first render pieces. Confirmed: projection produces everything `NativeStackView` reads (index,
routes`{key,name,params}`, key, empty preloadedRoutes); reducer reference-stability is genuinely
exploitable so a navigator can memoize on its slice. Folded in: trimmed over-claiming headers (the
memo win needs the consumer to `useMemo` the projection — noted, not implemented here), a note on the
`as` cast (bridges `routeNames`), added empty-routes + undefined-params coverage. Honest framing: the
projection is ONE of three inputs the stack view needs — the per-route `navigation` shim + descriptors
+ the `route.child`→`NavNodeProvider` recursion wiring live in the (still-unbuilt) descriptor/shim
layer; `state.key` must equal the shim's dispatch `target`. The full `NativeStackView` reuse requires
shimming the large `NativeStackNavigationProp` surface — the substantial remaining work.

### R-6 — R-Phase A (flag module) review outcomes
*(3 fresh agents)*

`navigation-state/enable.ts` ships `enableNewStateModel()`/`isNewStateModelEnabled()` as a module-level
`let` (not globalThis — agents confirmed jest gives each test file a fresh module registry, so a
module `let` is test-isolated across files; globalThis would leak across files in a worker). One-way,
no args, no `disable` (toggling off mid-session can't unwind mounted navigators). Added a test-only
`__resetNewStateModelForTests()` seam (called in `afterEach`) because jest-expo does not reset modules
between tests *within* a file, so render tests that opt in must restore the flag to keep the flag-off
path green — chosen over `jest.resetModules()`+re-require (a multi-module footgun for render tests
that read the flag across modules). Not exported from the public index until R-Phase C (avoid shipping
a no-op public API). Fast-Refresh resets the boolean (accepted, documented — full reload to toggle).

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

### P-13 — Single key-minting authority (Phase 2 review, architecture finding)
*(4 fresh agents on hydration+projection)*

The architecture + coverage agents caught a real cross-phase risk: hydration minted keys with a
*per-call* counter while runtime push (Phase 3) would mint differently — so a hydrated route and a
later push/native-echo of the "same" route could carry incomparable keys and fail to dedupe (ghost
duplicate screen, violating P-7). Fix: `navigation-state/keys.ts` `createRouteKey(name)` is now the
**single minting authority** (module-level monotonic counter, `${name}#${n}` format), used by
hydration and by all future runtime minting. Keys are **opaque, not content-derived** (a stack may
hold the same route twice). The dedupe contract is: **JS mints once, native echoes the same key**;
the reducer dedupes by key equality. Determinism-across-calls was dropped (it isn't required and the
test was weak — test-quality finding); the real invariant tested is tree-global uniqueness, incl.
when a route name repeats across branches. Also removed the dead `route.key ??` fallback
(`getStateFromPath` never emits keys) and added coverage for multi-sibling nodes, non-last focus
projection, dynamic-segment + query round-trips, and `hydrate → undefined`.

### P-14 — Phase 3a (back-bubbling) + Phase 4 (store/bridge) review outcomes
*(4 fresh agents: coverage, test-quality, architecture, minimalism)*

Acted on now:
- **`resolveBack` empty-ops = keep bubbling** (architecture): a node handles back only if it produces
  ops; empty ops bubble on. Prevents a handler silently swallowing an Android back press (was safe
  only by accidental double-guarding between `back.ts` and the stack strategy).
- **Minimalism:** dropped the unused `focusedChain(rootName)` param, un-exported `FocusedNode`,
  trimmed the `back.ts` header.
- **Coverage/quality:** added `tree.test.ts` (leaf/deep/out-of-range/empty + name-keying); added
  3-level bubbling through a stuck inner navigator to a middle stack; split the fall-through test
  into its three real causes (no focus-order / current-tab-first / previous-tab-absent); added store
  remount-reinstalls-bridge, `useNavigationTree`-throws-outside-provider, and a committed-snapshot
  (`getNavSnapshot().root.index === 1`) assertion before `resolveBack`.

Known limitations / deferred to integration (documented, no consumer this session):
- **Behavior keyed by owning-route name** is a non-unique stand-in (`tree.ts`); the production
  manifest will key by `contextKey`/layout path (refines P-4). Acceptable while the lookup is an
  injected input and `resolveBack` is the only consumer.
- **Transition policy should key off `source`** — seed/hydration must commit synchronously
  (`animation: none`, RFC C13/1b), not via `startTransition`. `dispatchNav` wraps unconditionally
  for now; revisit when Phase 2 introduces the `'seed'`/`'hydration'` sources.
- **Committed-snapshot contract** needs a pending-intent channel; the effect-mirrored snapshot lags
  by one commit under a concurrent root (P-3). Synchronous test renderer hides this.
- **tabs-back lives in `back.ts`, stack-back is delegated to the strategy** — asymmetric. The clean
  fix is a `localInput` (focus-order) parameter on `BehaviorStrategy.resolve` (the channel P-8 named);
  do it in Phase 3 so both are delegated symmetrically.

### P-15 — Forward navigation (`resolveNavigate`) review outcomes
*(3 fresh agents: coverage, test-quality+architecture, minimalism)*

`navigate(path)` = hydrate the target → diff against current along the target's focused path → ops
via the seam (RFC scenarios 3/4). Confirmed/clarified by review:
- **Sibling navigation pushes (history-preserving), not replaces** — that is correct `navigate`
  semantics (a route absent from the stack is pushed); `replace` is a distinct, deferred action.
  Pinned with a test.
- **Known limit, documented + tested:** routes are matched by **name only**, so re-navigating to a
  same-named route with different params focuses the existing one **without** updating params — needs
  the deferred `replace` primitive (Decisions P-12). A `KNOWN LIMIT` test pins the current behavior.
- **Absolute-only seam:** the target is hydrated from root, so relative/navigator scopes (D7) must
  resolve to an absolute path upstream. Documented.
- **Reducer `setIndex` no-op guard** added (identity when index unchanged) so a redundant `setIndex`
  (emitted when focusing the already-focused tab) preserves referential identity for React bail-out;
  directly tested.
- The "no-op navigation" test was renamed to reflect that it proves the **reducer absorbs** redundant
  ops (not that the resolver emits none); the refocus test now also asserts the focused tab's stack
  is untouched.

Relationship: this module is the **global state backend** (the whole-app nested tree:
`NavNode` with `child`, `index`). `standard-navigation/` is the **per-navigator render contract**
(a flat `{index, routes:[{key,name,params,href}]}` slice for *one* navigator level). They are
different layers and compatible by design ([D3](./RFC.md#L424)): a navigator will eventually project
its `NavNode` slice into the standard shape. So `NavNode`/`RouteEntry` are genuinely new types (not
a redeclaration of standard-navigation's flat type); the projection is render-integration (out of
scope). Noted so the two shapes aren't accidentally merged or duplicated.
