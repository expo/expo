# ENG-28595 scope spike report

## Outcome

The spike adds an adapter between Expo Router's unstable split view API and two native renderers:

- `rns` (default): `Split.Host` from React Native Screens.
- `expo-ui`: `NavigationSplitView` from `@expo/ui/swift-ui`.

Both implementations receive the same Expo Router `Stack` as the main/detail navigator. The expo-ui renderer owns the split columns and sidebar/content navigation titles. The detail `Stack` owns route headers and top toolbar items, including `Stack.Toolbar`.

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
      <SplitView.Screen name="index" options={{ title: 'Mail' }} />
      <SplitView.Screen name="[id]" options={{ title: 'Message' }} />
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
| Main navigator        | Always render Expo Router `Stack`                                                        | Required for route headers and `Stack.Toolbar`; a slot/custom content navigator cannot render the native stack toolbar. |
| Adapter               | Keep separate `RNSSplitView` and `ExpoUISplitView` components behind a per-instance prop | Isolates renderer-specific mappings without mutable global state or cross-instance leakage.                             |
| Default               | Keep `rns`                                                                               | Avoids changing existing apps unless they opt in.                                                                       |
| expo-ui loading       | Require `@expo/ui` lazily only when selected                                             | Other platforms and RNS users do not load SwiftUI entry points.                                                         |
| Column headers        | Support only title and title display mode                                                | These are the only required header modifiers present in current `@expo/ui` without native changes.                      |
| Detail toolbar        | Let nested `Stack` render it                                                             | Reuses the existing public `Stack.Toolbar` API and avoids the prohibited native toolbar bridge.                         |
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
| `SplitView.Screen`         | Delegates to `Stack.Screen`                                                            | Observed: selected message configured detail header | [Detail toolbar](./media/ipad-mail-toolbar.png) |
| `Stack.Toolbar`            | Renders through the detail `Stack`                                                     | Observed: reply, reply-all, forward, archive, move, and search items | [Detail toolbar](./media/ipad-mail-toolbar.png) |
| `SplitView.Inspector`      | Warns and is omitted for expo-ui                                                       | Not exercised                                    | — |

Prior runtime evidence exists on commit `acb594d5` for direct `NavigationSplitView` hosting and on the `origin/tuft/1789123608.307849/expo-7783ac2e` prototype branch. It is reference evidence only; this branch requires a fresh runtime pass because the detail navigator architecture is different.

## Problems and constraints

1. Current `@expo/ui` does not expose `toolbarVisibility` or `navigationBarBackButtonHidden`. Supporting `headerShown` or `headerBackVisible` for SwiftUI columns would require native `@expo/ui` changes, so this spike intentionally does not expose those options.
2. `Stack.Toolbar` cannot be translated into the SwiftUI column toolbar using only the current JavaScript API. The nested native stack renders the detail header instead.
3. The detail column may show a UIKit navigation stack inside a SwiftUI `NavigationSplitView`. Runtime verification must check safe-area handling, duplicate navigation chrome, collapse transitions, back behavior, and toolbar placement on iPad and iPhone.
4. Removing the nested detail `SafeAreaProvider` eliminates one redundant inset boundary but does not remove the visible region above the UIKit Stack header. SwiftUI reserves navigation chrome for the `NavigationSplitView` detail while the nested Stack renders a second UIKit navigation bar; the current JavaScript-only `@expo/ui` surface cannot merge or suppress those bars.
5. The public props are a discriminated union. The default `rns` branch accepts the full RNS host API. The `expo-ui` branch accepts only `ref`, `topColumnForCollapsing`, `preferredDisplayMode`, `preferredSplitBehavior`, and a narrowed `columnMetrics`; RNS-only props and secondary/inspector metrics are rejected by TypeScript rather than silently discarded.
6. expo-ui `columnMetrics` uses point-only `preferredPrimaryColumnWidth` and `preferredSupplementaryColumnWidth` names instead of RNS's ambiguous `*WidthOrFraction` names. Minimum and maximum values work without a preferred width; the adapter uses the supplied bound as SwiftUI's required ideal value.
7. UIKit display modes and split behaviors map to their closest SwiftUI equivalents.
8. SwiftUI column visibility and compact-column values are stateful. Prop changes reseed the state, while user/system changes can subsequently update it.
9. `SplitView.Inspector` remains a shared child API but is an unavoidable expo-ui no-op. The implementation warns once in development and omits inspector content.
10. The expo-ui path requires `@expo/ui` to be installed and the native app rebuilt. The router-tester dependency is added, but no native files are changed.
11. The old prototype's native navigation modifiers and toolbar bridge must not be copied into this ticket. They are the only evidence for some richer header controls, not available dependency API.

## Router-tester proof of concept

Route: `/split-view-mail`

The demo resembles Apple Mail with mailbox, message-list, and message-detail columns. Detail routes use `Stack.Screen` and `Stack.Toolbar` with reply, archive, folder, compose, and search controls. The content is intentionally simple.

## Verification

- Focused Jest suites: 3 passed, 15 tests passed. Coverage includes per-instance expo-ui selection, narrowed column-metric types, min/max-only width mapping, `show('secondary')` visibility, the nested detail Stack, and page-level `Stack.Toolbar` items reaching native stack screen options.
- `expo-router` typecheck: passed.
- Router-tester TypeScript check: passed.
- `expo-router` lint: passed.
- Formatting: applied; final check is part of the handoff checks.
- EAS iPad Pro 13-inch (M5) runtime verification: passed. The split view rendered three columns, route selection updated the detail Stack, and `Stack.Toolbar` rendered the requested Mail-style controls.
- A second EAS pass verified that removing the nested detail `SafeAreaProvider` was insufficient: SwiftUI's detail navigation region still leaves a visible gap above the nested UIKit Stack header.
- The three-column demo uses bounded sidebar/content widths. The native sidebar control transitions from [all three columns](./media/ipad-mail-three-column.png) to [content and detail](./media/ipad-mail-two-columns-sidebar-hidden.png), keeping at least two columns visible on the tested iPad.
- Runtime media: [initial detail](./media/ipad-mail-detail.png), [message list](./media/ipad-mail-list.png), [detail toolbar](./media/ipad-mail-toolbar.png), [three-column view](./media/ipad-mail-three-column.png), and [sidebar hidden](./media/ipad-mail-two-columns-sidebar-hidden.png).
- Header inset evidence: [before removing the nested provider](./media/ipad-mail-toolbar-before-inset-fix.png) and [after](./media/ipad-mail-toolbar.png); the remaining SwiftUI navigation region is still visible.

## Runtime prerequisites

- Install workspace dependencies with `pnpm install --frozen-lockfile`.
- Use an expo-ui-capable router-tester iOS development client. Runtime verification used build `0fe0984e-c1ab-41c9-80dc-346fd87edb5e`.
- Use an iPad simulator first to validate three columns and top toolbars, then an iPhone simulator to validate compact-column transitions.
- Open `/split-view-mail`.
