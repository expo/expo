# Plan — Render layer + `enableNewStateModel()`

Wires the new state model ([navigation-state/](./packages/expo-router/src/navigation-state)) into
real rendering, behind a flag. Architecture rationale: [Decisions.md](./Decisions.md) R-1 (Option B,
reuse expo-router's screen layer, not react-navigation's). Builds on the state phase (P-1…P-15).

**Goal:** `enableNewStateModel()` called at app start swaps expo-router onto the new store + new
navigators (Stack, NativeTabs, ExperimentalStack), all rendering from `{root: NavNode}`.

## Architecture (revised per R-2/R-3, Decisions.md)

```
enableNewStateModel()  → module boolean; isNewStateModelEnabled() READ AT RENDER / per-dispatch (R-3)
        │ (flag on, branched at render inside stable components — no export swap)
ExpoRoot ─ mounts NavigationStateProvider + hydrate(initialURL, store.linking.config) + BackHandler
        │
NavNodeContext  ── hands each route's `child` NavNode (the slice) down to the nested navigator
        │           (slice is reference-stable across unrelated dispatches → re-render bail-out)
each navigator (Stack / NativeTabs / ExperimentalStack), one stable component branching on the flag:
   reads its NavNode slice from NavNodeContext
   → PROJECTS to the shape the EXISTING view consumes (R-2):
        · stack views: an inert StackNavigationState-shaped object {key,index,routes,type:'stack',
          routeNames,preloadedRoutes:[]} + per-route descriptors {route, options, render, navigation}
        · NativeTabsView: {focusedIndex, provenance, tabs:[{routeKey,name,options,contentRenderer}], onTabChange}
   → per-route `navigation` SHIM (the central adapter): satisfies BaseRoute + the view
        (isFocused/getState/addListener/replaceParams) and routes dispatch/emit + native events
        (onDismissed dismissCount, gesture-cancel, tab select) → dispatchNav({..., source:'native'})
   → render: REUSE NativeStackView / ExperimentalStackView / NativeTabsView unchanged
   → descriptor.render(): getQualifiedRouteComponent(routeNode) under Route(params) + NavNodeContext(route.child)
        │
imperative router (routingQueue.run) ─ flag → resolveNavigate/resolveBack → dispatchNav
useRouteInfo ─ flag → project(getNavSnapshot()) → UrlObject
BackHandler (Android) ─ flag → resolveBack → dispatchNav / return false on exit
behavior map ─ module Map<contextKey,'stack'|'tabs'> written at navigator mount (added when needed)
```

## Flag seams (7)
1. **Mount** — `ExpoRoot.tsx`/`useStore.ts`: flag → `NavigationStateProvider` + `hydrate(initialPath, store.linking.config)` instead of `UpstreamNavigationContainer` + `getStateFromPath`.
2. **Linking config** — read-only reuse of `store.linking.config` `{screens, initialRouteName}`.
3. **Imperative** — `routingQueue.run` (single dispatch chokepoint): flag → `resolveNavigate`/`resolveBack` → `dispatchNav` (else, flag-on, `ref.current` is null and actions are dropped — so #1+#3+#4+#7 land in ONE commit, R-Phase C).
4. **Route info** — `useRouteInfo`: flag → `project(getNavSnapshot())` → `UrlObject`.
5. **Behavior map** — module `Map<contextKey, 'stack'|'tabs'>` written at navigator mount (no registry abstraction — P-4/P-12).
6. **Flag module** — module boolean + `enableNewStateModel()`/`isNewStateModelEnabled()`, read at render/per-dispatch (R-3), Fast-Refresh-guarded.
7. **Hardware back** — `NavigationStateProvider` subscribes `BackHandler` → `resolveBack` → `dispatchNav` (`'ops' in r`) / `return false` on `{exit}` (R-5). Replaces the bypassed `useBackButton`.

## Phases (each a reviewable commit; pre-commit ≥3 challenge agents; flag-off suite green every commit)

### R-Phase A — flag module
`navigation-state/enable.ts`: `enableNewStateModel()` / `isNewStateModelEnabled()` (mirror
`screensFeatureFlags`, Fast-Refresh guard). No registry (P-4/P-12). Pure, unit-tested. Smallest first commit.

### R-Phase B — projection + `navigation` shim + `NavNodeContext` + ONE Stack *(core, highest risk)*
`navigation-state/render/`: `NavNode` slice → inert `StackNavigationState`-shaped projection;
per-route `navigation` shim routing dispatch/emit/native-events → `dispatchNav` (source-tagged, R-5);
descriptors via `getQualifiedRouteComponent` under `Route` + `NavNodeContext`; reuse `NativeStackView`.
De-risk key identity (P-7/P-13) + native `dismissCount`→`remove` + disappearing-screen hold, in an
isolated `*.test.tsx` under a real `NavigationStateProvider` (never `renderRouter`).

### R-Phase C — first flag-on vertical slice *(the observable milestone)*
Wire seams #1/#3/#4/#7 atomically; the R-Phase-B Stack navigates end-to-end. Export
`enableNewStateModel` from the public index here (NOT earlier — avoid shipping a no-op public API),
and ship the `<Link.Preview>`-unsupported warn-guard (R-5). Exit criteria: flag-on, deep-link boots,
`router.push`/`back` + hardware back work, `usePathname()` correct, verified on-device
(`/device-testing`, `/android-debugging`); flag-off, full existing suite green.

### R-Phase D — NativeTabs (replicate)
Feed existing `NativeTabsView` from the projected slice; wire `provenance` + four-case `onTabChange`
(`isNativeAction`/`isPrevented`); merge the static full tab list (mount-all) with the promoted tree
(`mount ≠ promotion`, P-10); minimal focus-order producer for cross-tab back.

### R-Phase E — ExperimentalStack (replicate)
Reuse `ExperimentalStackView` via the R-Phase-B projection + shim.

## Out of scope (still deferred)
Drawer, JS Tabs, SplitView, TopTabs (other navigators); `replace` primitive + param-merge; D7
relative scopes; `<Link.Preview>`/preload (gated as unsupported under the flag — R-5); Android
predictive back (unmodeled — commits a final `goBack`); store production hardening (P-9). Disappearing-
screen hold and a minimal tab-focus-order producer ARE in scope (R-5). The flag must leave the OLD
path byte-identical when off (R-3).

## Verification
`et check-packages @expo/router` green at every commit; new code must not break the OLD path (flag
off) or `build`/`test:types`. Isolated render harness, never the shared `renderRouter`. Do not push.
