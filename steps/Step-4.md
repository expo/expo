# Step 4 — Disable freeze (risk 1)

Branch: `@ubax/eng-transitions-support-in-expo-router`, at `71fb8efe2c4` (`[step 3]` spike +
characterization). Scope source: PLAN.md **Step 4** + **risk 1** + the freeze half of **risk 3**.
No user-facing navigation-behavior change beyond the freeze override; this is a small, mechanical
prop injection at five render sites, plus a CHANGELOG entry. Full suite stays green.

## ⚠️ Lead with this: what the change actually is, and why an explicit `false` is airtight

react-native-screens computes, per screen (`Screen.tsx:200-202`):

```
const freeze = freezeOnBlur && (shouldFreeze !== undefined ? shouldFreeze : activityState === 0);
```

with the default `freezeOnBlur = freezeEnabled()` (`Screen.tsx:85`). So `enableFreeze()` /
`enableFreeze(true)` flips the *default* for `freezeOnBlur` to `true`, and a blurred/detached
screen then freezes. Expo-router today only **forwards** `descriptor.options.freezeOnBlur` into the
screen (all five sites), i.e. it passes `undefined` unless the app set the per-screen option, in
which case rn-screens falls back to `freezeEnabled()`.

Step 4 forces `freezeOnBlur={false}` at the render site, overriding **both** the per-screen option
**and** the `enableFreeze()` default. Because rn-screens gates on `freezeOnBlur &&` — a literal
`false` short-circuits `freeze` to `false` unconditionally, regardless of `enableFreeze(true)` or
`shouldFreeze`. That is why the plan calls an explicit `false` "airtight." A frozen (Suspense-held)
subtree can no longer starve a pending transition (risk 1).

This is a **code change, not a config toggle**: expo-router never called `enableFreeze` itself
(grep-confirmed: zero `enableFreeze` call sites in `src/`), it only forwarded the per-screen
option. The base branch already *removed* a global `enableFreeze(false)` (PR #38837, referenced in
the plan) — so re-forcing freeze off is a deliberate reversal of that direction, at a finer grain
(per-render-site, not global), and needs a loud CHANGELOG entry.

## The five render sites (verified against the live code)

Each site currently destructures `freezeOnBlur` from `descriptor.options` and forwards it verbatim.
The change at each: **stop forwarding the option; pass a literal `false`.** (Do not merely default
it — an explicit user `freezeOnBlur: true` must not win, that is the whole point.)

**Two cross-cutting requirements at every site (folded from arch review):**
- **Inline "why" comment, matching the neighbouring `gestureEnabled` precedent.** On native-stack
  `gestureEnabled` is hard-forced on Android with a two-line `//` explaining the reason
  (`NativeStackView.native.tsx:340-346`) — the established in-repo convention for "expo-router
  hard-overrides a vendored react-navigation option." A bare `freezeOnBlur={false}` clobbering a
  public option is otherwise indistinguishable from a bug. Add a short comment at each of the five
  sites, e.g. *"Forced off so a Suspense-frozen subtree can't starve a pending React transition."*
- **`shouldFreeze` is co-passed at four sites and becomes inert — leave it, with a marker.** Four
  sites also pass a computed `shouldFreeze` (`NativeStackView.native.tsx:405`, `CardStack.tsx:669`,
  `BottomTabView.tsx:281`, `DrawerView.tsx:249`); `TabSlot.tsx` has none. The rn-screens gate is
  `freezeOnBlur && (shouldFreeze ?? activityState===0)`, so a literal `false` short-circuits and
  `shouldFreeze` can no longer affect anything — its per-render computation (`isFabric()` branches,
  `activityState` interpolation) is now dead. **Decision: leave `shouldFreeze` untouched, tagged
  with a `TODO(transitions-freeze)` marker** noting it is inert while freeze is forced off and is
  the reintroduction breadcrumb for the freeze re-enable follow-up — mirroring the branch's existing
  `TODO(prevent-remove)` reintroduction-checklist pattern (`NativeStackView.native.tsx:382`). Do
  **not** strip `shouldFreeze` (that widens the diff and loses the breadcrumb). The note records the
  *why*; the implementation-review will otherwise flag the silent dead computation.

1. **`react-navigation/native-stack/views/NativeStackView.native.tsx`** — `SceneView` destructures
   `freezeOnBlur` from `options` (`:130`) and passes `freezeOnBlur={freezeOnBlur}` to
   `ScreenStackItem` (`:339`). Change the prop to `freezeOnBlur={false}`; drop the now-unused
   `freezeOnBlur` from the `options` destructure (`:130`) so lint doesn't flag an unused binding.
   - **Nuance to record, not fix (opt-out surface):** `{...screenNativeProps}` (from
     `options.unstable_nativeProps`) is spread at `:400`, **after** the `freezeOnBlur` prop at
     `:339`. So a user can still re-enable freeze per-screen via
     `unstable_nativeProps={{ freezeOnBlur: true }}` on native-stack — the documented "raw props
     override expo-router props" escape hatch (see `NativeStackView.unstable-native-props.test`).
     This is the natural opt-out on native-stack and should be mentioned in the CHANGELOG; do not
     move the `freezeOnBlur` line after the spread (that would defeat the override for the common
     case and there is no equivalent hatch on the other four navigators). **Confirmed by review:**
     `ScreenStackItem` does honor `freezeOnBlur` — it is not omitted from its `Props` type and flows
     through `...rest` into the inner rn-screens `<Screen>`, so the native-stack change is not a
     no-op. This `unstable_nativeProps` path is an **incidental, pre-existing** escape hatch, **not
     a designed opt-out** (see the opt-out note under CHANGELOG).
2. **`react-navigation/stack/views/Stack/CardStack.tsx`** (JS stack) — `render()` destructures
   `freezeOnBlur` from `scene.descriptor.options` (`:639`) and passes it to `MaybeScreen`
   (`:668`). Change to `freezeOnBlur={false}`; drop the destructured binding. `MaybeScreen`
   (`stack/views/Screens.tsx`) forwards to `Screens.Screen`, so the same rn-screens gate applies.
   (The plan's Files list says "`CardStack`/`MaybeScreen`" — the injection is at the `CardStack`
   call site; `MaybeScreen`/`Screens.tsx` is just the passthrough and needs **no** edit. The plan
   naming both is describing the path, not two edits.)
3. **`react-navigation/bottom-tabs/views/BottomTabView.tsx`** — destructures `freezeOnBlur` from
   `descriptor.options` (`:242`) and passes it to `MaybeScreen` (`:280`). Change to
   `freezeOnBlur={false}`; drop the destructured binding.
4. **`react-navigation/drawer/views/DrawerView.tsx`** — destructures `freezeOnBlur` from
   `descriptor.options` (`:218`) and passes it to `MaybeScreen` (`:248`). Change to
   `freezeOnBlur={false}`; drop the destructured binding.
5. **`ui/TabSlot.tsx`** — `defaultTabsSlotRender` destructures `freezeOnBlur` from
   `descriptor.options` (`:118`) and passes it to `Screen` (`:134`). Change to
   `freezeOnBlur={false}`; drop the destructured binding.

**Round-3-corrected non-sites (confirmed, do NOT touch):**
- **`fork/native-stack/`** — the plan calls its view wrapper dead code. Not in scope.
- **`layouts/StackClient.tsx`** — renders no screen (it composes the navigator), so nothing to
  inject. Not in scope.
- **`react-navigation/native-stack/views/NativeStackView.tsx`** (the non-`.native`, i.e. **web**
  variant) — renders a plain elements `Screen` with a `display: 'flex' | 'none'` toggle; it has
  **no** `freezeOnBlur` prop and **no** react-native-screens freeze mechanism. Nothing to disable.
  Confirmed by read. This is why the plan scopes only `.native.tsx`.
- **native-tabs / split-view** — the plan states these have no freeze mechanism (nothing to
  disable). Confirmed: no `freezeOnBlur` grep hit in `native-tabs/` render paths or `split-view/`.
- **`layouts/experimental-stack/ExperimentalStackView.tsx`** — live code (an R1 edit target, not
  dead), but it renders the rn-screens **experimental** `Stack` V5 API and controls background
  screens via `activityMode={isPreloaded ? 'detached' : 'attached'}` — there is **no `freezeOnBlur`
  knob** on that API (confirmed by review). Nothing to disable; benign non-site. Listed for audit
  completeness so a reader checking "did we get every freeze site?" sees it addressed.

There is **no react-freeze usage anywhere in expo-router** (grep-confirmed) — every freeze is
mediated by react-native-screens' `Screen`/`ScreenStackItem`, so **prop injection at these five
sites suffices** (plan's own wording).

## Red → green (TDD)

The freeze behavior itself (whether rn-screens actually freezes) is native and **not**
jest-observable — jest mocks rn-screens and never runs the native freeze. So the red assertion is
at the **prop-contract** level: expo-router must pass `freezeOnBlur={false}` to the screen
component **even when the app set `freezeOnBlur: true` on the screen options** (the strongest
falsifiable form — a test that only checks the default case would pass on today's code, which
forwards `undefined`, and would be a tautology against the "override" claim).

**Test vehicle — reuse the existing `NativeStackView.unstable-native-props.test.ios.tsx` shape**
(the nearest precedent): `jest.mock('react-native-screens', …)` wrapping the real component in a
`jest.fn`, `renderRouter` a one-screen navigator with `options={{ freezeOnBlur: true }}`, then
assert the captured props' `freezeOnBlur === false`.

Red-first plan, one test file per navigator kind (platform-appropriate extension):

- **native-stack** (`ScreenStackItem` mock): new file
  `native-stack/views/__tests__/NativeStackView.freeze.test.ios.tsx` (or fold a `describe` into a
  new sibling; do **not** touch the `unstable-native-props` file's premise). Assert:
  (a) with `options={{ freezeOnBlur: true }}`, the captured `ScreenStackItem` props have
  `freezeOnBlur === false`; (b) with no option set, still `false` (default case, so the two
  together prove override, not coincidence). Take the **last** `ScreenStackItem` mock call (a stack
  renders layout-then-screen; mirror the precedent's `calls[calls.length - 1]` indexing and comment
  it per AGENTS.md), with `mockClear()` in `beforeEach`. **Do not** set `freezeOnBlur` via
  `unstable_nativeProps` in the override test — that is the incidental opt-out and would legitimately
  win. Optionally add one assertion that `unstable_nativeProps={{ freezeOnBlur: true }}` **does**
  win (`=== true`), pinning that the escape hatch still exists.
- **JS stack / bottom-tabs / drawer** (`MaybeScreen` → `Screens.Screen`): capture point is
  **resolvable now, not empirically** (test review). rn-screens is **not** globally mocked (the
  testing-library mocks only reanimated + expo-linking), and `screensEnabled()` returns
  `isNativePlatformSupported`, which is `true` under the `.ios`/`.android`/`.native` jest presets.
  So all three `MaybeScreen` wrappers delegate to `<Screens.Screen>` in those files (JS-stack and
  bottom-tabs gate on `Screens?.screensEnabled?.()`; drawer gates on `Screens != null` — both
  truthy under the native preset). **Capture at the rn-screens `Screen`** (mock it as a `jest.fn`
  passthrough, same shape as the native-stack `ScreenStackItem` mock); assert the captured props'
  `freezeOnBlur === false`. Write these as **`.test.ios.tsx`** (or `.native`) — a `.test.web` file
  would fall through to `View`/`ResourceSavingView` and drop the prop (and web has no freeze anyway,
  out of scope). Add a one-line comment in the **drawer** test that its wrapper gate is
  `Screens != null` (not `screensEnabled()`) — functionally identical under jest, but noted so a
  reader doesn't assume all three share the same gate. Do **not** hedge to asserting on the
  `MaybeScreen` wrapper — under the native preset it always delegates to `Screen`.
- **ui TabSlot** (`Screen` from `react-native-screens`): same rn-screens `Screen` mock. Render a
  `ui`-tabs layout (`<Tabs><TabList><TabTrigger …/></TabList><TabSlot/></Tabs>`, per
  `headless-tabs.test.ios.tsx`) with the tab screen carrying `freezeOnBlur: true` in its options
  (flows through `useNavigationBuilder` per-route/`screenOptions`, the same channel `renderRouter`'s
  `options` uses). Assert on the **focused/initial** tab's `Screen` call (`activityState: 2`) —
  `defaultTabsSlotRender` returns `null` for an unvisited lazy tab (`:124`), so don't expect a
  `Screen` call for one. Assert `freezeOnBlur === false`.

**Falsifiability guard (per the Step-3 red discipline):** every assertion must include the
`freezeOnBlur: true` input case, so it can only pass because expo-router actively overrode it — not
because the option happened to be absent. Write each test, watch it fail against current code (it
forwards `true`), then flip the source to `false` and watch it pass.

**Render-count baseline for risk 3 (plan Red line):** the plan asks to *record* a blurred-screen
render-count baseline incl. the multi-tab × deep-stack worst case. Per risk 9 / Step-3, render-count
budgets are **meaningless until the Step-5 flip** (uSES still de-opts; the slice-keyed memo layer
that risk 3 needs lands in Step 5), and the Step-2 note already established render-count budgets are
not assertable pre-flip. So Step 4 **records** the baseline observation in this note / the simulator
(freeze-off means **attached-but-blurred** screens re-render where they previously froze — *not* all
inactive screens: detached screens, via `detachInactiveScreens`/`activityState`, were already not
rendering and are untouched by the freeze knob, which is orthogonal to detachment) but does **not**
add a jest render-count assertion — there is no stable pre-flip budget to pin, and a count test here
would be measuring the un-flipped uSES path. The worst-case measurement (5 tabs × deep stacks) is a
**Step-5** deliverable (that step owns the memo layer and the render-count budget tests); Step 4
notes it as a forward pointer, not a Step-4 artifact. **Surface this to the lead as the one place
Step 4's Red line ("blurred-screen render-count baseline recorded") is satisfied by a written
note + Step-5 pointer rather than a committed jest test — matching the risk-9 pre-decision.**

## CHANGELOG

Loud entry (this overrides a public, documented option — `freezeOnBlur` — and reverses PR #38837's
direction). Under `packages/expo-router/CHANGELOG.md`, likely a "### 🛠 Breaking changes" or a
prominent "### 🎉 New features" / "### 💡 Others" line depending on the repo's current section
convention — check the file's live headings before writing. Content: expo-router now forces
`freezeOnBlur: false` on the screens it renders (native-stack, JS stack, bottom-tabs, drawer, `ui`
TabSlot) to keep React transitions from being starved by frozen subtrees; the per-screen
`freezeOnBlur` option and `enableFreeze()` no longer re-enable freeze on router-rendered screens.
State it as behavior the transitions work depends on.

**Opt-out framing (arch review — do not over-promise).** There is **no first-class opt-out in
Step 4**, and none is in scope: the whole point (risk 1 / D1) is that frozen subtrees must not exist
during transitions. On native-stack the `unstable_nativeProps={{ freezeOnBlur: true }}` path can
still re-enable freeze, but that is an **incidental, pre-existing** escape hatch, not a designed
opt-out — and there is no equivalent on the other four navigators (they take typed props only, no
raw-props spread). Describe it in the CHANGELOG as **advanced / at-your-own-risk** (it reintroduces
exactly the starvation the transitions work fixes), not as *the* supported opt-out. A uniform
opt-out, if wanted, is a follow-up.

## Verification

`CI=1 pnpm test` (all projects incl. RSC), `pnpm build`, `pnpm lint`, then
`et check-packages expo-router`. Monorepo sweep for any out-of-package consumer that reads
`freezeOnBlur` off an expo-router-rendered screen (expected: none — grep-confirmed the option is
per-navigator-vendored). Commit `[step 4] <one line>` (no body, **no Claude mention**); push
`HEAD:@ubax/eng-transitions-support-in-expo-router`.

## PLAN.md corrections (only if Step 4 reveals one)

Candidate correction to confirm with the lead: the plan's Step-4 Red line "blurred-screen
render-count baseline recorded for risk 3 (multi-tab × deep-stack case included)" cannot be a jest
assertion pre-flip (render-count budgets meaningless until Step 5 — consistent with the Step-2/risk-9
pre-decisions). If the lead agrees, land a one-line PLAN.md note under Step 4 pointing the
render-count worst-case measurement at Step 5, mirroring the Step-1/2/3 correction style. Otherwise
no PLAN.md edit.

## Impl-review fold-in (3 fresh Opus agents on the diff + tests)

All three confirmed the diff is correct, minimal, convention-matching, and behavior-scoped to only
the freeze knob (rn-screens `freeze = freezeOnBlur && …` short-circuits on the literal `false`;
`ScreenStackItem` forwards `freezeOnBlur` via `...rest`; no missed sites; web `NativeStackView.tsx`
correctly untouched; `shouldFreeze` correctly left inert with `TODO(transitions-freeze)`). Folded in:

- **[test, HIGH] Last-call indexing was flaky.** The test-strategy agent saw a one-off cold-run
  failure with the stale-call signature (a `Screen` call other than the focused scene was read).
  Fixed by asserting `freezeOnBlur === false` across **every** captured scene call
  (`calls.every(...)`) instead of `mock.calls[last]`. Re-ran 3× clean.
- **[test, MEDIUM→resolved] Coverage only hit the focused scene; the change is about *blurred*
  screens.** Bottom-tabs, drawer, and `ui` TabSlot now render **two** routes (ui uses `lazy: false`
  so the unfocused tab renders) and assert the override on the inactive scene too, guarded by
  `calls.length > 1`. Native-stack/JS-stack keep single-screen (assert-all still hardens ordering).
- **[correctness/test, LOW] Two swapped gate comments** (drawer said `Screens != null`; JS-stack
  said `screensEnabled()`) corrected to match the actual `MaybeScreen` gates.
- **[arch, LOW noted] `defaultTabsSlotRender` is user-overridable** — the `ui` freeze override only
  holds for the default slot render; a user `renderFn` owns its own path. Inherent to headless `ui`;
  the CHANGELOG's "screens Expo Router renders" wording already covers it. No action.
- **[LOW noted] CHANGELOG `#00000` placeholder** matches the neighbouring R1/R2 in-branch entries;
  backfill the real PR number at PR time (same as those two).
