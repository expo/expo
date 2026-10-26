# ENG-28595 scope spike report

## Outcome

The spike adds an adapter between Expo Router's unstable split view API and two native renderers:

- `rns` (default): `Split.Host` from React Native Screens.
- `expo-ui`: `NavigationSplitView` from `@expo/ui/swift-ui`.

Both implementations receive the same Expo Router `Stack` as the main/detail navigator. For the expo-ui renderer, the Stack's native header is hidden and a JavaScript adapter forwards page-level `Stack.Title` and top `Stack.Toolbar` declarations to the SwiftUI detail toolbar. The adapter works, but the embedded native Stack still contributes a separate navigation-host region, leaving one empty row above the expo-ui toolbar. Matching the working pure-SwiftUI toolbar structure did not remove it.

No native code is changed.

## Proposed API

```tsx
import { SplitView } from 'expo-router/unstable-split-view';

export default function Layout() {
  return (
    <SplitView implementation="expo-ui" screenOptions={{ headerLargeTitle: false }}>
      <SplitView.Column title="Mailboxes" headerLargeTitle={false}>
        {/* sidebar */}
      </SplitView.Column>
      <SplitView.Column title="Inbox" headerLargeTitle={false}>
        {/* message list */}
      </SplitView.Column>
      <SplitView.Screen name="index" />
      <SplitView.Screen name="[id]" />
    </SplitView>
  );
}
```

- `implementation="rns" | "expo-ui"` selects the renderer for that split view instance.
- The default remains `rns`.
- `SplitView.Screen` is the same component as `Stack.Screen`.
- `SplitView.screenOptions` accepts native stack screen options.
- `SplitView.Column` adds `title?: string` and `headerLargeTitle?: boolean` for the expo-ui navigation header.
- Existing React Native Screens host props continue to map to the expo-ui renderer where a close SwiftUI equivalent exists.

## Decisions

| Area                  | Decision                                                                                 | Reason                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Main navigator        | Always render Expo Router `Stack`                                                        | Preserves Stack navigation and route state; only its native header is suppressed for expo-ui.                           |
| Adapter               | Keep separate `RNSSplitView` and `ExpoUISplitView` components behind a per-instance prop | Isolates renderer-specific mappings without mutable global state or cross-instance leakage.                             |
| Default               | Keep `rns`                                                                               | Avoids changing existing apps unless they opt in.                                                                       |
| expo-ui loading       | Require `@expo/ui` lazily only when selected                                             | Other platforms and RNS users do not load SwiftUI entry points.                                                         |
| Column headers        | Support only title and title display mode                                                | These are the only required header modifiers present in current `@expo/ui` without native changes.                      |
| Detail toolbar        | Adapt `Stack.Title` and top `Stack.Toolbar.Button` declarations to expo-ui               | Proves the API bridge, but the embedded UIKit Stack still creates a second navigation region.                           |
| Unsupported inspector | Ignore it in expo-ui and warn in development                                             | `NavigationSplitView` has no matching trailing inspector API in current `@expo/ui`.                                     |
| Non-iOS fallback      | Render the same `Stack`                                                                  | Keeps the “always Stack” contract and route header behavior.                                                            |

## Prop mapping

Runtime observation used the existing expo-ui-capable router-tester development build `0fe0984e-c1ab-41c9-80dc-346fd87edb5e` on an EAS iPad Pro 13-inch (M5) simulator. Rows marked “Not exercised” remain source- and test-level findings.

| Prop/API                   | Implemented behavior                                                                   | Expected runtime behavior                        | Media    |
| -------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ | -------- |
| `implementation="expo-ui"` | Selects `NavigationSplitView` for one instance                                         | Observed: SwiftUI split view rendered on iOS     | [Three columns](./media/ipad-mail-three-column.png) |
| `SplitView.Column` ×1      | Maps to sidebar                                                                        | Not exercised                                    | — |
| `SplitView.Column` ×2      | Maps to sidebar/content                                                                | Observed: mailbox, message-list, and detail columns | [Three columns](./media/ipad-mail-three-column.png) |
| `title`                    | Maps to `navigationTitle`                                                              | Observed: Mailboxes and Inbox Gmail titles       | [Three columns](./media/ipad-mail-three-column.png) |
| `headerLargeTitle`         | Maps to `navigationBarTitleDisplayMode`                                                | Observed: inline column titles                   | [Three columns](./media/ipad-mail-three-column.png) |
| `topColumnForCollapsing`   | Maps primary/supplementary/secondary to sidebar/content/detail                         | Not exercised                                    | — |
| `preferredDisplayMode`     | Maps UIKit display modes to SwiftUI visibility                                         | Not exercised                                    | — |
| `preferredSplitBehavior`   | Maps tile to balanced and overlay/displace to prominent detail                         | Observed: tiled content/detail columns           | [Detail toolbar](./media/ipad-mail-toolbar.png) |
| `columnMetrics`            | Accepts only primary/supplementary point widths and maps every min/preferred/max field | Not exercised                                    | — |
| `ref.show(column)`         | Updates compact column and visibility; secondary selects `detailOnly`                  | Not exercised                                    | — |
| `SplitView.Screen`         | Delegates to `Stack.Screen`, forcing its native header off for expo-ui                 | Observed: detail remains route-driven, but its navigation host still contributes an empty region | [VStack experiment](./media/ipad-mail-vstack-toolbar.png) |
| `Stack.Title`              | Registers the focused route's string title with the expo-ui toolbar                   | Observed: Google Photos title rendered in SwiftUI navigation chrome | [Expo UI toolbar](./media/ipad-mail-expo-ui-toolbar.png) |
| Top `Stack.Toolbar.Button` | Maps direct button children and SF Symbol icons to expo-ui `ToolbarItem` and `Button`  | Observed: controls render, but one navigation-row gap remains above them | [VStack experiment](./media/ipad-mail-vstack-toolbar.png) |
| `SplitView.Inspector`      | Warns and is omitted for expo-ui                                                       | Not exercised                                    | — |

Prior runtime evidence exists on commit `acb594d5` for direct `NavigationSplitView` hosting and on the `origin/tuft/1789123608.307849/expo-7783ac2e` prototype branch. It is reference evidence only; this branch requires a fresh runtime pass because the detail navigator architecture is different.

## Problems and constraints

1. The adapter currently covers string `Stack.Title` values and direct `Stack.Toolbar.Button` children in left/right placements. Menus, custom views, spacers, search-bar slots, bottom toolbars, `asChild`, non-SF-Symbol icons, title styles, badges, and the full button styling/state surface still need explicit mappings or development warnings before this can be production API.
2. The adapter reads declarations from the focused route. More tests are needed for push/pop transitions, multiple title/toolbar declarations, and route unmount timing before replacing the RNS implementation by default.
3. The nested detail remains a real native Stack, but expo-ui owns its visible header. Header configuration supplied only through `Stack.Screen` options is not yet adapted; the proof uses `Stack.Title` and `Stack.Toolbar` as requested.
4. The working pure-SwiftUI example places `Toolbar` directly in the detail slot and applies `navigationTitle` to its SwiftUI content. Reproducing that structure with a `VStack` around `RNHostView` did not remove the gap. The accessibility tree still reported both `_TtGC7SwiftUI32NavigationStackHosting` and `Google Photos` navigation bars, showing that the embedded UIKit Stack remains a second navigation host even when `headerShown` is false.
5. The public props are a discriminated union. The default `rns` branch accepts the full RNS host API. The `expo-ui` branch accepts only `ref`, `topColumnForCollapsing`, `preferredDisplayMode`, `preferredSplitBehavior`, and a narrowed `columnMetrics`; RNS-only props and secondary/inspector metrics are rejected by TypeScript rather than silently discarded.
6. expo-ui `columnMetrics` uses point-only `preferredPrimaryColumnWidth` and `preferredSupplementaryColumnWidth` names instead of RNS's ambiguous `*WidthOrFraction` names. Minimum and maximum values work without a preferred width; the adapter uses the supplied bound as SwiftUI's required ideal value.
7. UIKit display modes and split behaviors map to their closest SwiftUI equivalents.
8. SwiftUI column visibility and compact-column values are stateful. Prop changes reseed the state, while user/system changes can subsequently update it.
9. `SplitView.Inspector` remains a shared child API but is an unavoidable expo-ui no-op. The implementation warns once in development and omits inspector content.
10. The expo-ui path requires `@expo/ui` to be installed and the native app rebuilt. The router-tester dependency is added, but no native files are changed.
11. The old prototype's native navigation modifiers and toolbar bridge must not be copied into this ticket. They are the only evidence for some richer header controls, not available dependency API.

## Router-tester proof of concept

Route: `/split-view-mail`

The demo resembles Apple Mail with mailbox, message-list, and message-detail columns. Detail routes use `Stack.Title` and `Stack.Toolbar` with reply, archive, folder, compose, and search controls. The content is intentionally simple.

## Verification

- Focused Jest suites pass, including the nested detail Stack, forced hidden Stack header, and page-level `Stack.Title`/`Stack.Toolbar.Button` output in the expo-ui detail toolbar.
- `expo-router` typecheck: passed.
- Router-tester TypeScript check: passed.
- `expo-router` lint: passed.
- Formatting: applied; final check is part of the handoff checks.
- A fresh EAS iPad Pro 13-inch (M5) pass tested the pure-SwiftUI example's modifier placement by putting `navigationTitle` on a SwiftUI `VStack` around `RNHostView`. The empty navigation row remained unchanged: [VStack experiment](./media/ipad-mail-vstack-toolbar.png). This rules out modifier placement as the cause and isolates the embedded Stack/navigation host as the remaining boundary.
- The three-column demo uses bounded sidebar/content widths. The native sidebar control transitions from [all three columns](./media/ipad-mail-three-column.png) to [content and detail](./media/ipad-mail-two-columns-sidebar-hidden.png), keeping at least two columns visible on the tested iPad.
- Runtime media: [initial detail](./media/ipad-mail-detail.png), [message list](./media/ipad-mail-list.png), [detail toolbar](./media/ipad-mail-toolbar.png), [three-column view](./media/ipad-mail-three-column.png), and [sidebar hidden](./media/ipad-mail-two-columns-sidebar-hidden.png).
- Prior header inset evidence: [before removing the nested provider](./media/ipad-mail-toolbar-before-inset-fix.png) and [after](./media/ipad-mail-toolbar.png). These demonstrate why safe-area changes alone were insufficient.

## Runtime prerequisites

- Install workspace dependencies with `pnpm install --frozen-lockfile`.
- Use an expo-ui-capable router-tester iOS development client. Runtime verification used build `0fe0984e-c1ab-41c9-80dc-346fd87edb5e`.
- Use an iPad simulator first to validate three columns and top toolbars, then an iPhone simulator to validate compact-column transitions.
- Open `/split-view-mail`.
