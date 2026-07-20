# Design Doc: First-Class Transition Support for Expo Router

Status: proposal (planning only, no implementation)
Stacked on: `@ubax/eng-21996-change-the-state-in-expo-router-to-be-global`
Package: `packages/expo-router`

## 1. Problem, Goals, and Scope

### 1.1 What exists today

Expo Router exposes transition behavior only declaratively, per-screen, through
native-stack `NativeStackNavigationOptions`. `NativeStackView.native.tsx`
destructures `animation`, `animationMatchesGesture`, `animationDuration`,
`gestureDirection`, etc. from `descriptor.options` and forwards them to
`ScreenStackItem` as `stackAnimation`, `customAnimationOnSwipe`,
`transitionDuration`, `swipeDirection`. There is:

- **No per-navigation transition override** on `router.push` / `<Link>`:
  `LinkToOptions` (`src/global-state/types.ts`) has only `event`,
  `relativeToDirectory`, `withAnchor`, `dangerouslySingular`, and
  `__internal__*` fields.
- **One internal precedent** for "smuggle a UI directive through a single
  navigation": `INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME`
  (`src/navigationParams.ts`). Its full lifecycle is the template this plan
  generalizes:
  1. **Attach at dispatch:** `getNavigateAction` writes it into `expoParams`,
     merged into `payload.params` via `appendInternalExpoRouterParams`.
  2. **Carry through state:** it lands as a route `param` in committed
     navigation state.
  3. **Consume at render:** `StackClient.tsx` (`disableAnimationInScreenOptions`)
     reads `route.params` and forces `animation: 'none'`.
  4. **Strip from URLs:** `getPathFromState.ts` calls
     `removeInternalExpoRouterParams` so it never appears in a deep link.
  5. **Clear after the transition:** `useScreens.tsx` listens for
     `transitionEnd` and calls `navigation.replaceParams(...)` to drop the
     param so a later back-navigation animates normally.
- Transition-adjacent public API: `Link.AppleZoom` / zoom (`src/link/zoom`,
  iOS 18+), `Link.Preview` (`src/link/preview`), and
  `fork/native-stack/usePreviewTransition.ts`.
- The vendored JS stack (`expo-router/js-stack`, `src/react-navigation/stack`)
  has full custom primitives (`cardStyleInterpolator`, `transitionSpec`,
  `TransitionPresets`); the default native `Stack` does not.
- `ExperimentalStack` (`layouts/experimental-stack/`) supports only a small
  allowlist (`SUPPORTED_OPTION_KEYS` in `ExperimentalStackView.tsx`) and warns
  that animation is "not yet available".
- react-native-screens in this checkout is **4.25.2**. Its custom
  interactive-transition APIs (`ScreenTransition`, `goBackGesture`,
  `unstable_screenStyleInterpolator`) are **not** top-level exports — they live
  under experimental `gamma`/`gesture-handler` namespaces and are unused in the
  repo. So interactive/custom transitions are groundwork only, not v1.

### 1.2 Goals

- **(a) Per-navigation transition override:** `router.push(href, { transition })`,
  and all of `navigate/replace/dismissTo/prefetch`; `<Link transition=…>`.
  One-shot; must not persist.
- **(b) Coherent declarative story:** the per-screen `Stack.Screen` options
  (`animation`, `animationDuration`, `gestureDirection`, …) remain the
  canonical declarative surface; the new `transition` field is a typed,
  navigator-agnostic alias that maps onto them, with clear precedence.
- **(c) Standard-navigation navigators:** custom navigators built on
  `unstable_createStandardRouterNavigator` receive the active transition
  through `createProps` deps so they can honor it.
- **(d) Groundwork for custom/interactive transitions:** an `unstable_` shape
  wide enough to later carry a react-native-screens
  `ScreenTransition`/interpolator and interactive gestures, without an API
  break.

### 1.3 Scope decisions and open questions

- **v1 = declarative built-in transitions only**, expressed as a discriminated
  union that maps to native-stack `animation`/`animationDuration`/
  `gestureDirection`. Custom function interpolators are typed but `unstable_`
  and initially a no-op with a dev warning on the default native `Stack`.
- **Open questions (for the team):**
  1. Is the target shape a single `stackAnimation` enum passthrough, or a
     router-level vocabulary (`'slide' | 'fade' | 'modal' | 'none'`) that
     abstracts over stack/tabs/drawer? This plan proposes the abstract
     vocabulary with an `unstable_native` escape hatch, because (c) requires
     navigator-agnostic semantics.
  2. Does `transition` on a **tab switch** / **drawer** mean anything in v1, or
     native-stack-only? Proposed: native-stack-only honored in v1; tabs/drawer
     accept-and-ignore (no crash), with the value still delivered via
     `createProps` so third-party navigators may use it.
  3. Should GO_BACK accept a per-call transition (`router.back({ transition })`)?
     Proposed yes (see §2.4), because the "smuggle through params" trick cannot
     reach a pop.

## 2. Data Flow Design

### 2.1 Candidate extension points — evaluation

| Option | Where | Verdict |
|---|---|---|
| (a) action `payload.transition` field | `getNavigationAction.ts` payload | Rejected as the *carrier*: the payload is consumed by reducers and dropped; there is no path from payload to the descriptor at render, and it does not survive to the committed route. |
| (b) `RootReducerChangedSlice` | `rootReducer.ts` | Rejected as carrier: `changedSlices` is post-commit diff metadata, not readable by the rendering navigator; would require a parallel side-channel keyed by slice. Useful only for events (§2.6). |
| (c) `NavigatorRegistryEntry` hook | `storeContext.ts` | Rejected: registry entries are per-navigator singletons, not per-navigation; can't express a one-shot transition. |
| (d) internal route params | `navigationParams.ts` + `getNavigationAction.ts` | **CHOSEN.** Exactly the proven `NO_ANIMATION` path: survives into committed state, reaches the descriptor via `route.params`, already has URL-stripping and post-transition-clear machinery, and passes `assertStateIsComplete` (which never inspects `params`, verified in `store.ts`). |
| (e) standard-navigation `createProps` deps | `standard-navigation/index.tsx` | **CHOSEN for delivery to custom navigators (c).** The navigator reads the focused route's transition param out of `state`/`descriptors` and republishes it through `createProps`. |
| (f) `navigationEvents` | `navigationEvents/` | Supplementary: emit a transition event for observability; not the carrier. |

**Decision:** carry the transition as a new internal param (option d), delivered
to custom navigators via `createProps` (option e), with an optional event
(option f). This reuses the entire NO_ANIMATION lifecycle rather than inventing
a parallel one.

### 2.2 The internal param

Add to `navigationParams.ts`:

```ts
export const INTERNAL_EXPO_ROUTER_TRANSITION_PARAM_NAME = '__internal_expo_router_transition';
```

- Add it to `internalExpoRouterParamNames` so it is automatically stripped by
  `removeInternalExpoRouterParams` (URL generation in `getPathFromState.ts`)
  and by preview reconciliation (`link/preview/utils.ts`).
- Its value is the serialized resolved transition (see §3.1). It must be
  JSON-serializable (a plain object of enum strings/numbers) — **no functions**
  carried through params (functions can't survive state
  persistence/rehydration or the `payload.state` splice; interactive
  interpolators are handled separately, §5.6).

### 2.3 Attach at dispatch (forward navigations)

In `getNavigateAction.ts`, extend the `expoParams` block so that when
`options.transition` is present it adds
`[INTERNAL_EXPO_ROUTER_TRANSITION_PARAM_NAME]: resolveTransition(options.transition)`.
This merges into `payload.params` exactly as NO_ANIMATION does, covering
`push/navigate/replace/dismissTo/prefetch` because all route through
`linkTo → getNavigateAction`.

Precedence between the existing preview-driven `NO_ANIMATION` and a user
`transition`: preview navigations set NO_ANIMATION unconditionally; if a
preview also carries a `transition`, NO_ANIMATION wins (documented; preview is
a stronger UI contract). Encode this in `resolveTransition` / the render-time
reader.

### 2.4 Back-navigation and gestures

GO_BACK (`router.back`, `routingQueue.add({type:'GO_BACK'})`) and user
swipe-pops carry **no payload**, and the target screen's own options already
dictate its pop animation via `nextDescriptor` in `NativeStackView.native.tsx`.
Sub-cases:

- **Declarative pop animation** (the common case) already works: the
  disappearing screen's `animation`/`gestureDirection` govern the pop. No
  change needed.
- **Per-call `router.back({ transition })`:** because pop has no destination
  param to write, add an optional one-shot override stored on the store
  instance (`store.pendingBackTransition`), set by `goBack`, read once by the
  popping `NativeStackView` descriptor and cleared. This is `unstable_` in v1.
  Alternative rejected: writing the transition onto the *revealed* route's
  params would leak into that route's subsequent forward animation.
- **Interactive user gesture pops** are governed by
  `animationMatchesGesture`/`fullScreenGestureEnabled` per-screen options only;
  a per-navigation override is meaningless for a gesture the user initiates,
  so it is out of scope.

### 2.5 Preload / replay interactions

- **PRELOAD** (`getPreloadAction` in `getNavigationAction.ts`): preloaded
  screens render with `activityState 0` and are not animating. A transition
  attached to a `prefetch` is meaningless at preload time but must survive so
  that the *subsequent* navigate-to-the-preloaded-route animates. Since preload
  writes `payload.params` too, the param rides along into the preloaded route
  and is honored when it later focuses. Verify the NAVIGATE-reuses-existing-route
  path (`effectiveType !== 'PUSH'`) still re-applies the caller's transition
  param over the stale preloaded one — the reader must prefer the newest param
  write.
- **Mount-window replay** (`pendingReplayRef` in `BaseNavigationContainer.tsx`)
  and **routingQueue** (`routingQueue.ts`) both serialize through
  `dispatchRoot` and carry the full action (including `payload.params`), so the
  transition param survives a deferred/replayed navigation with no extra work.
  Add a test asserting this.

### 2.6 Consume at render + cleanup

- **Native `Stack`:** generalize `disableAnimationInScreenOptions`
  (`StackClient.tsx`) into an `applyTransitionFromParams` wrapper that, for the
  focused route, reads
  `getInternalExpoRouterParams(route.params)[TRANSITION]`, resolves it to
  native-stack option fields (`animation`, `animationDuration`,
  `gestureDirection`), and merges them over the base `screenOptions` result —
  with the NO_ANIMATION path still winning. The existing `condition`-based
  no-animation logic folds into this single wrapper.
- **Cleanup:** extend the `transitionEnd` listener in `useScreens.tsx` to also
  strip `INTERNAL_EXPO_ROUTER_TRANSITION_PARAM_NAME` via the same
  `navigation.replaceParams`. This guarantees the transition is one-shot and
  does not affect the reverse (pop) animation. The `getPathFromState` strip
  already prevents URL leakage.
- **Custom navigators (standard-navigation):** the transition is exposed
  through `createProps` (§2.1 option e). The navigator reads the focused
  route's param out of `state`/`descriptors` and includes a resolved
  `transition` in the props object built in `standard-navigation/index.tsx`, so
  `NavigatorContent` can honor it.
- **Observability (optional):** emit a transition field on the existing
  `actionDispatched` navigation event so devtools/analytics can see which
  transition a navigation requested.

### 2.7 Why this survives the dev invariants

`assertStateIsComplete` (`store.ts`) validates only
`stale/key/index/routeNames/routes` and recurses on `route.state` — it never
reads `route.params`, so a transition param cannot trip it. The single-writer
path (`dispatchRoot`) is untouched: we only enrich `payload.params` upstream
and read `route.params` downstream. The non-identity-render-projection
assertion in `useNavigationBuilder` operates on slice state identity, not
params content, so a stable param object (built once in `resolveTransition`)
will not cause spurious re-projection — but the reader must not synthesize a
fresh options object on every render for routes without a transition (guard on
presence).

## 3. Public API Surface

### 3.1 The `Transition` type (new file `src/transitions/types.ts`)

```ts
/** Built-in, cross-navigator transition presets. */
export type TransitionPreset = 'default' | 'none' | 'fade' | 'slide' | 'modal' | 'flip';

/** Per-navigation transition spec. */
export type Transition =
  | TransitionPreset
  | {
      preset?: TransitionPreset;
      /** Duration in ms. Native-stack `animationDuration`. */
      duration?: number;
      /** Gesture axis; maps to native-stack `gestureDirection`. */
      direction?: 'horizontal' | 'vertical';
      /**
       * Escape hatch: raw react-native-screens `stackAnimation` value, applied
       * verbatim on the native Stack. Overrides `preset`.
       */
      unstable_native?: NativeStackNavigationOptions['animation'];
      /**
       * Groundwork for custom/interactive transitions (react-native-screens
       * ScreenTransition / interpolators). Ignored in v1 with a dev warning.
       */
      unstable_screenStyleInterpolator?: unknown;
    };
```

`preset → native-stack` mapping (in `resolveTransition`): `none→'none'`,
`fade→'fade'`, `slide→'slide_from_right'` (respecting `direction`),
`modal→'slide_from_bottom'`, `flip→'flip'`, `default→undefined` (navigator
default).

### 3.2 `LinkToOptions` (`src/global-state/types.ts`)

```ts
export type LinkToOptions = {
  event?: string;
  relativeToDirectory?: boolean;
  withAnchor?: boolean;
  dangerouslySingular?: SingularOptions;
  /** One-shot transition override for this navigation. Does not persist. */
  transition?: Transition;
  __internal__PreviewKey?: string;
  __internal__tabNavigatorKeys?: string[];
};
```

Because `NavigationOptions = Omit<LinkToOptions, 'event'>`, all `router.*`
methods (`push/navigate/replace/dismissTo/prefetch`) automatically accept
`transition`.

### 3.3 `router.back` (`router.ts`, `ImperativeRouter.back`)

```ts
back: (options?: { transition?: Transition }) => void; // unstable in v1
```

### 3.4 `Link` prop (`src/link/useLinkHooks.ts` `LinkProps`, threaded in `BaseExpoRouterLink.tsx`)

```ts
transition?: Transition;
```

Destructure in `BaseExpoRouterLink` and pass into
`useLinkToPathProps({ ..., transition })`, which already spreads options into
`linkTo`.

### 3.5 `Stack.Screen` options interplay + precedence

The declarative `Stack.Screen options={{ animation, animationDuration,
gestureDirection }}` stay authoritative as the per-screen default. Precedence,
highest first, enforced in the render-time merge (`applyTransitionFromParams`):

1. **Preview / internal NO_ANIMATION** (existing contract).
2. **Per-navigation override** (`router.push(href, { transition })` /
   `<Link transition>`) — the param.
3. **Per-screen option** (`Stack.Screen options.animation` etc.).
4. **Navigator default** (`Stack screenOptions`).

`resolveTransition` returns only the fields the user set, so a `transition`
with `duration` but no `preset` overrides duration while leaving the screen's
`animation` intact.

### 3.6 Stability

- **Stable:** `Transition` presets, `duration`, `direction`;
  `LinkToOptions.transition`; `Link` `transition`;
  `router.push/navigate/replace/dismissTo({ transition })`.
- **`unstable_`:** `router.back({ transition })`, `unstable_native`,
  `unstable_screenStyleInterpolator`, ExperimentalStack support, JS-stack
  custom transition bridging, and tabs/drawer honoring.

## 4. Staged, PR-sized Sequence

Follows the base branch's Step 1..N convention. Early steps are pure plumbing
with no behavior change.

### Step 1 — Types + internal param constant (plumbing, no behavior)
- Files: new `src/transitions/types.ts` (`Transition`, `TransitionPreset`,
  `resolveTransition`); `src/navigationParams.ts` (add
  `INTERNAL_EXPO_ROUTER_TRANSITION_PARAM_NAME`, register in
  `internalExpoRouterParamNames`); `src/global-state/types.ts` (add
  `transition?` to `LinkToOptions`).
- Tests: `navigationParams` — a transition param is stripped by
  `removeInternalExpoRouterParams` and detected by
  `getInternalExpoRouterParams`.
- Exit: builds, type-checks; `transition` accepted by `router.*` types; no
  runtime path reads it yet.

### Step 2 — Attach at dispatch
- Files: `src/global-state/getNavigationAction.ts` (extend `expoParams` with
  the resolved transition); ensure `getPreloadAction` carries it too (params
  already flow).
- Tests: unit — dispatching a NAVIGATE/PUSH with `{ transition }` produces
  `payload.params` containing the internal param; URL round-trip via
  `getPathFromState` does **not** contain it.
- Exit: param present in committed state, no consumer yet (still no visible
  behavior).

### Step 3 — Consume on native `Stack` + cleanup
- Files: `src/layouts/StackClient.tsx` — generalize
  `disableAnimationInScreenOptions` → `applyTransitionFromParams` implementing
  §3.5 precedence and folding in the NO_ANIMATION path; `src/useScreens.tsx` —
  also strip the transition param on `transitionEnd`.
- Tests: `renderRouter` + jest mock of react-native-screens `ScreenStackItem`
  asserting `stackAnimation`/`transitionDuration`/`swipeDirection` on the
  pushed screen reflect the override; param cleared after `transitionEnd`;
  precedence over per-screen option; NO_ANIMATION still wins.
- Exit: `router.push('/x', { transition: 'fade' })` animates as fade; reverse
  pop unaffected.

### Step 4 — `Link` prop + `router.back` override
- Files: `src/link/useLinkHooks.ts` (`LinkProps.transition`),
  `src/link/BaseExpoRouterLink.tsx`, `src/link/Redirect.tsx` (optional
  passthrough); `router.ts` + store field for `pendingBackTransition`;
  `ImperativeRouter.back` signature.
- Tests: `Link.test.ios` — `<Link transition>` reaches `linkTo`;
  `router.back({ transition })` applies once and clears.
- Exit: full stable public API for native Stack.

### Step 5 — Standard-navigation delivery (custom navigators)
- Files: `src/standard-navigation/index.tsx` — read the focused-route
  transition param and add a resolved `transition` to the `createProps` deps
  object; extend the `CreateProps`/deps types.
- Tests: a fixture navigator built with `unstable_createStandardRouterNavigator`
  receives `transition` in its content props after a navigation carrying one.
- Exit: goal (c) satisfied; third-party navigators can honor transitions.

### Step 6 — Preload / replay / singular coverage
- Files: none new; hardening.
- Tests: prefetch-then-navigate applies the navigate's transition;
  mount-window replay (`pendingReplayRef`) preserves the param;
  `dangerouslySingular` + `transition` together behave.
- Exit: edge-case matrix green.

### Step 7 — Web + SSR/static no-op semantics
- Files: `src/layouts/Stack.web.tsx` (accept-and-ignore, no crash); ensure the
  `getPathFromState` strip means no transition param appears in SSR-emitted
  URLs/state.
- Tests: `.test.web` — `transition` prop is a no-op, no console error;
  snapshot has no leaked param. (Groundwork comment for future CSS/View
  Transitions.)
- Exit: web parity (no-op), documented.

### Step 8 — ExperimentalStack support (unstable)
- Files: `src/layouts/experimental-stack/ExperimentalStackView.tsx` — add
  `animation` to `SUPPORTED_OPTION_KEYS` and wire the transition param through
  the experimental Stack's screen options; soften the "not yet available"
  warning.
- Tests: experimental-stack unit test that an override reaches the
  experimental Stack screen.
- Exit: ExperimentalStack honors declarative + per-navigation transitions.

### Step 9 — e2e + docs + changelog
- Files: new `apps/router-e2e/__e2e__/transitions/` app (Maestro) exercising
  push/replace/back with each preset; docs mdx under `docs/` for router
  transitions; API reference via
  `et generate-docs-api-data --packageName expo-router`; `CHANGELOG.md`.
- Tests: Maestro flow asserting navigation completes for each preset;
  `et check-packages expo-router`.
- Exit: shippable, `unstable_` where noted.

## 5. Risks and Edge Cases

- **5.1 Web / no native screens:** `transition` is a no-op on web in v1
  (Step 7). Native-stack `animation` has no web analog today; document as
  reserved for future CSS/`ViewTransition` groundwork. Must not throw or warn
  on every render.
- **5.2 SSR/static:** transition params must never appear in emitted URLs or
  serialized state — guaranteed by the `getPathFromState` strip (Step 1
  registration) plus the fact that transitions originate from imperative/Link
  dispatch, not initial-URL parsing.
- **5.3 State persistence / rehydration:** because the param is stripped from
  URLs and cleared on `transitionEnd`, a persisted/rehydrated state generally
  won't contain it; even if it does (mid-transition snapshot), the value is a
  plain JSON object (no functions), so rehydration is safe and it is cleared
  on the next `transitionEnd`. Interactive interpolator functions are
  explicitly *not* carried in params (§2.2).
- **5.4 Fast Refresh:** the transition param lives in state; a Fast Refresh
  that preserves state may leave a stale param, but the `transitionEnd`
  listener clears it and the reader only applies it to the focused route once
  — no infinite animation. Add a guard so a re-render mid-transition doesn't
  re-trigger.
- **5.5 Dev invariants:** `assertStateIsComplete` ignores `params` — safe.
  Non-identity render-projection assertion: `resolveTransition` must produce a
  **stable** object per navigation and the reader must skip work when no
  transition param is present, so unrelated navigators don't get a new options
  object each render.
- **5.6 Interactive/custom transitions:** react-native-screens 4.25.2 exposes
  `ScreenTransition`/interpolators only under experimental namespaces
  (verified: not in top-level `src/index.tsx`).
  `unstable_screenStyleInterpolator` is typed but a documented no-op with a
  one-time dev warning in v1; wiring it is a follow-up that needs the
  gesture-handler `ScreenGestureDetector` path, not the params channel.
- **5.7 Singular / pop navigations:** `dangerouslySingular` filters history but
  the transition param rides on the surviving focused route; verify the
  singular filter doesn't strip params (Step 6 test). `pop: true`
  transient-route exits should still animate per the override.
- **5.8 Zoom / preview interop:** preview navigations set NO_ANIMATION, which
  wins over `transition` (§2.3 precedence). Zoom transitions use their own
  `INTERNAL_..._ZOOM_*` params and iOS-18 path; a `transition` passed alongside
  `Link.AppleZoom` should be ignored on the zooming screen (zoom wins) —
  assert in a zoom interop test. Full precedence: zoom/preview internal params
  > user `transition` > screen option > navigator default.

## 6. Testing Strategy & Rollout

- **Unit (jest):** write the failing test first at each step. Use
  `renderRouter` + `jest.mock('react-native-screens', …)` (AGENTS.md pattern)
  to assert `ScreenStackItem` props. Platform matrix via
  `.test.ios/.android/.native/.web` suffixes. RSC-check Link changes in
  `__rsc_tests__`.
- **e2e:** new `apps/router-e2e/__e2e__/transitions/` Maestro suite (Step 9).
- **Rollout:** presets, `LinkToOptions.transition`, `Link.transition`, and
  forward `router.*({ transition })` ship **stable**.
  `router.back({ transition })`, `unstable_native`,
  `unstable_screenStyleInterpolator`, ExperimentalStack support, and
  tabs/drawer honoring ship under the `unstable_` prefix. No global feature
  flag needed — the feature is additive and inert unless a `transition` is
  supplied. Verify with `et check-packages expo-router` before each PR; update
  the docs guide + API reference and add a `CHANGELOG.md` entry.
