# Expo Router × react-native-screens Stack v5 scope spike

## Scope and evidence

- Compared Expo Router experimental stack with `react-native-screens` main at `e3e4f4eb97c972ff2666d32814b7a5dcf73a84bb`.
- Spiked against `react-native-screens@4.31.0-nightly-20261104-08c3cbbbf` in `apps/router-tester`.
- EAS builds: iOS `31f86aa6-e314-462d-ba93-cdb0595960d7`; Android `f0106e24-383e-4544-8679-0c893e6d1cd9`.
- Runtime evidence was captured on iOS 27.1 and Android 35. The lab's exhaustive `satisfies` maps make compilation fail when a v5 header field is missing from its controls.
- This is a throwaway scope spike: no commit, push, changeset, documentation, or PR.

## Ranked Expo Router gaps

### P0 — correctness and compatibility

1. **The optional-library fallback was not v5-safe.** Router's bundled fallback described the older `Screen` API, while the experimental stack consumed v5 host/screen/header APIs. That produced misleading types and silent no-ops when the installed native screens binary was v4. The spike adds a local v5 type snapshot and a DEV warning that names unsupported options and asks for a compatible nightly/native rebuild.
2. **The public `ExperimentalStack.Screen` surface was ambiguous.** It reused generic route-screen typing instead of the native v5 screen contract. The spike adds a dedicated typed screen component and merges page-level composition options without overwriting sibling header configuration.

### P1 — user-visible v5 capability

1. **Full `headerConfig` passthrough** was absent. This is the largest gap: all modern iOS and Android native-header features were unreachable.
2. **Android transitions** were absent: 11 presets and `replaceAnimation`.
3. **Host configuration** was absent: Android `direction` and `colorScheme`.
4. **Native header composition** was incomplete: `Header`, `Title`, `BackButton`, items, menus, commands, custom subviews, and spacers.

### P2 — parity and observability

1. Common `subtitle` and native lifecycle callbacks/events were not surfaced coherently.
2. Native stack commands and dismiss/prevention semantics need a documented Router contract. A JS `dismiss` callback cannot reliably be delivered after Router removes the route; the spike exposes the deliverable native event instead.
3. Web fallbacks lacked composition placeholders for `Header`/`Title`; the spike adds them.

## What the spike exposes

- `ExperimentalStack` host: `direction`, `colorScheme`.
- `ExperimentalStack.Screen`: full native `headerConfig`, `animation`, `replaceAnimation`, subtitle, lifecycle/native events, dismiss prevention, and composition options.
- Composition: Header, Title, BackButton, leading/trailing/title/subtitle/large-subtitle items, title and toolbar menus, commands/groups/toggles, spacers, and custom subviews.
- A `/stack-v5` router-tester lab with direct controls plus a JSON editor for nested appearance/menu values.

## Exhaustive feature/evidence matrix

| Feature family | Fields covered | Runtime evidence | Result / problem |
|---|---|---|---|
| Navigation and lifecycle | push, replace, JS/native back, dismiss-to-root, prefetch, `usePreventRemove`, native dismiss prevention, lifecycle/native events | `ios/navigation.png`, `ios/events.png`, `android/navigation.png`, `android/navigation-transitions.mp4` | Push/pop/replace and events work. Native-only prevention and Router prevention have different scopes. |
| Android transitions | default, none, fade, slide 4 directions, fade from top/bottom, iOS from left/right; replace push/pop | `android/navigation-transitions.mp4` | Routed and recorded on nightly. Preset-by-preset automation remains appropriate for an upstream test suite rather than one human evidence clip. |
| Host | Android direction and color scheme | `android/navigation.png`; lab controls | Passed through. These are Android-only upstream. |
| Shared header | title, subtitle, hidden, back hidden, color, translucent, layout direction, shadow | `ios/header-core.png`, `android/header-small.png`; lab/editor | Routed. Subtitle requires iOS 26+ upstream. |
| iOS back/large header | back title/display/menu; large title/subtitle/enabled; prompt | `ios/header-core.png` | Works on iOS 27.1. |
| iOS modern behavior | minimize, restoration, safe-area adjustment | `ios/header-core.png`; lab controls | API is reachable; requires iOS 27+ upstream. |
| iOS appearance | standard/scroll-edge title, large title, subtitle, normal/prominent/back button typography and normal/highlighted/disabled/focused colors | `ios/header-core.png`; exhaustive editor/cases | Reachable. Nested values are best exercised through JSON editor. |
| iOS native items | leading/trailing items, title/subtitle/large-subtitle items, spacers, icons, custom views | `ios/items-leading.png`, `ios/items-all.png` | Works. Live header-config changes can remount/reset local lab section state. |
| iOS menus/commands | title menu, menu/group/command/toggle/primary actions, display modes, Liquid Glass prominence/shape, overflow priority | `ios/items-all.png` | Works where OS-supported; Liquid Glass/overflow behavior is version-gated. |
| Android header mode/icons | small/medium/large; back/overflow drawable or image icons; normal/pressed/focused tints | `android/header-small.png` | Small header verified; all modes/fields are exhaustive controls. |
| Android scroll/lift/colors | five scroll flags, lift-on-scroll, normal/scrolled background, status-bar scrim, group divider | `android/header-scroll-lift.png` | Routed and interactive. Scroll behavior depends on the marked scroll view and content geometry. |
| Android gravity/insets | title/subtitle centered, expanded/collapsed horizontal+vertical gravity, gravity mode, max lines, content insets | lab/editor and exhaustive cases | Reachable; visual combinations are numerous and not all combinations are meaningful. |
| Android typography | title/subtitle/expanded/collapsed title+subtitle color, family, size, weight, style | lab/editor and exhaustive cases | Reachable; platform font availability affects exact rendering. |
| Android composition/menu | background/leading/center/trailing subviews and toolbar menu | `android/items-menu-custom.png` | Native menu and custom leading view verified. |
| FormSheet / ContainedModal / ScrollViewMarker | separate screens v5 components | inventory only | Not Stack screen options. Router needs a separate routing/design decision; intentionally not disguised as Stack support. |

### Media

- iOS: [navigation](media/ios/navigation.png), [header core](media/ios/header-core.png), [leading items](media/ios/items-leading.png), [all items](media/ios/items-all.png), [events](media/ios/events.png), [navigation recording](media/ios/navigation-transitions.mp4)
- Android: [navigation](media/android/navigation.png), [small header](media/android/header-small.png), [scroll/lift header](media/android/header-scroll-lift.png), [menu/custom items](media/android/items-menu-custom.png), [navigation recording](media/android/navigation-transitions.mp4)

## Problems found while spiking

1. **v4 native fallback:** new v5 options otherwise silently no-op. The DEV capability warning is necessary but cannot make a v4 binary implement v5.
2. **Header mutation remount/reset:** changing some nested header items/custom views during runtime resets route-local lab state. This needs an isolated upstream reproduction before shipping an interactive API promise.
3. **Dismiss semantics:** a callback attached to a route that has already been removed is not reliably deliverable in JS. Router should document native events versus navigation events rather than expose a misleading callback.
4. **OS gates:** subtitle/iOS 26 and minimization/restoration/safe-area/overflow/Liquid Glass iOS 27 features need documentation and graceful expectations on older systems.
5. **Huge Android combination space:** the API is exposed exhaustively, but screenshotting every Cartesian combination would not add useful confidence. The lab proves each scalar field is reachable; focused upstream tests should cover semantic combinations.
6. **Evidence tooling:** recordings succeeded on both platforms; focused screenshots capture header states that are difficult to inspect in motion.
7. **Production work still required:** replace the copied local v5 type snapshot with released upstream types when possible, add docs and a changeset, decide separate routing APIs for FormSheet/ContainedModal, and add stable automated native coverage.

## Stack v4 features still missing in v5

Ranked by user impact, then likely engineering cost. Estimates include implementation and focused tests, not release/documentation lead time.

| Rank | Missing v4 capability | Why it is missing in v5 | Estimate |
|---:|---|---|---:|
| 1 | iOS native dismiss prevention | v5's reconciliation/native lifecycle does not yet provide the v4 interception contract | 10–20 engineer-days |
| 2 | Root replacement / arbitrary stack reconciliation | v5 currently models a narrower stack mutation set; general reconciliation has correctness and animation edge cases | 3–20d depending on required cases |
| 3 | Full modal presentation family | v5 split FormSheet/ContainedModal but has not recreated all v4 presentations and transitions | 20–40d |
| 4 | iOS gestures | interactive pop/dismiss and gesture configuration need a new v5 transition contract | 10–20d |
| 5 | iOS animation parity | v5 transition presets are currently Android-focused; UIKit transition work remains | 10–20d |
| 6 | Orientation and system-UI controls | deliberately outside the first stack core; require per-screen native coordination | 10–20d |
| 7 | Search bar integration | not ported to the new header architecture | 5–15d |
| 8 | Nested Android stack inside FormSheet | modal/window and back-dispatch interaction is unresolved | 5–10d |
| 9 | iOS header background/shadow/blur parity | the new appearance model covers typography/buttons first; custom background/effect parity remains | 5–10d |
| 10 | Sheet parity details | detents, grabber, corner radius, expansion and gesture details need mapping to the new modal components | 5–15d |
| 11 | Transition progress events | the new transition implementation does not expose v4 progress nodes/events | 5–10d |
| 12 | `freezeOnBlur` | v5 has not adopted the v4 freeze lifecycle/performance contract | 3–7d |
| 13 | Header back hiding/icon parity | smaller omission in the new header API | 1–5d |
| 14 | iOS host direction/theme | host fields are Android-only upstream today | 3–7d plus API decision |
| 15 | Tab reselection, web/ref passthrough, item-detail parity | lower-priority integration/parity work rather than core stack navigation | 1–5d each |

The main risk is not raw prop plumbing: it is defining lifecycle, reconciliation, and transition semantics that remain correct under Router's declarative route tree.

## Verification

- 62 focused tests across 11 suites pass after the final compatibility-warning change.
- Earlier full spike run: 139 tests across 19 suites pass.
- Expo Router typecheck, formatting, and diff checks pass.
- Router-tester typecheck has only the existing unrelated typed-link `/404` failures.
- Lint has only the existing `useScreens.test.web.tsx` warning.
- Fresh implementation and minimal-diff reviews were run. Review findings were addressed except the intentionally deferred production docs/changeset and the inherent v4 binary limitation.
