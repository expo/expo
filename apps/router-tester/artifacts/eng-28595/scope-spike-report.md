# ENG-28595 scope spike report

## Outcome

The spike adds an adapter between Expo Router's unstable split view API and two native renderers:

- `rns` (default): `Split.Host` from React Native Screens.
- `expo-ui`: `NavigationSplitView` from `@expo/ui/swift-ui`.

Both implementations receive the same Expo Router `Stack` as the main/detail navigator. For the expo-ui renderer, the Stack's native header is hidden and a JavaScript adapter forwards page-level `Stack.Title` and top `Stack.Toolbar` declarations to the SwiftUI detail toolbar. The fresh Mail-only run still shows extra vertical space below the detail toolbar, while the other column headers stay compact. Earlier reduced runs did not reproduce it, so the exact trigger remains unresolved.

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
| Detail toolbar        | Adapt `Stack.Title` and top `Stack.Toolbar.Button` declarations to expo-ui               | Proves the API bridge; toolbar positioning remains unresolved.                                                        |
| Unsupported inspector | Ignore it in expo-ui and warn in development                                             | `NavigationSplitView` has no matching trailing inspector API in current `@expo/ui`.                                     |
| Non-iOS fallback      | Render the same `Stack`                                                                  | Keeps the “always Stack” contract and route header behavior.                                                            |

## Prop mapping

The mappings below describe the current implementation and the Mail-only EAS run.

| Prop/API                   | Implemented behavior                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `implementation="expo-ui"` | Selects `NavigationSplitView` for one instance                                         |
| `SplitView.Column` ×1      | Maps to sidebar                                                                        |
| `SplitView.Column` ×2      | Maps to sidebar/content                                                                |
| `title`                    | Maps to `navigationTitle`                                                              |
| `headerLargeTitle`         | Maps to `navigationBarTitleDisplayMode`                                                |
| `topColumnForCollapsing`   | Maps primary/supplementary/secondary to sidebar/content/detail                         |
| `preferredDisplayMode`     | Maps UIKit display modes to SwiftUI visibility                                         |
| `preferredSplitBehavior`   | Maps tile to balanced and overlay/displace to prominent detail                         |
| `columnMetrics`            | Accepts only primary/supplementary point widths and maps every min/preferred/max field |
| `ref.show(column)`         | Updates compact column and visibility; secondary selects `detailOnly`                  |
| `SplitView.Screen`         | Delegates to `Stack.Screen`, forcing its native header off for expo-ui                 |
| `Stack.Title`              | Registers the focused route's string title with the expo-ui toolbar                   |
| Top `Stack.Toolbar.Button` | Maps direct button children and SF Symbol icons to expo-ui `ToolbarItem` and `Button`  |
| `SplitView.Inspector`      | Warns and is omitted for expo-ui                                                       |

Prior runtime evidence exists on commit `acb594d5` for direct `NavigationSplitView` hosting and on the `origin/tuft/1789123608.307849/expo-7783ac2e` prototype branch. It is reference evidence only because the detail navigator architecture is different.

## Problems and constraints

1. The adapter currently covers string `Stack.Title` values and direct `Stack.Toolbar.Button` children in left/right placements. Menus, custom views, spacers, search-bar slots, bottom toolbars, `asChild`, non-SF-Symbol icons, title styles, badges, and the full button styling/state surface still need explicit mappings or development warnings before this can be production API.
2. The adapter reads declarations from the focused route. More tests are needed for push/pop transitions, multiple title/toolbar declarations, and route unmount timing before replacing the RNS implementation by default.
3. The nested detail remains a real native Stack, but expo-ui owns its visible header. Header configuration supplied only through `Stack.Screen` options is not yet adapted; the proof uses `Stack.Title` and `Stack.Toolbar` as requested.
4. An earlier Mail experiment with a `VStack` around `RNHostView` showed an offset and exposed both `_TtGC7SwiftUI32NavigationStackHosting` and `Google Photos` navigation bars. A reduced nested-Stack run stayed aligned. The hierarchy alone therefore did not reproduce the Mail behavior; the missing condition is unknown.
5. A pure SwiftUI detail without `RNHostView` or Stack also stayed aligned in the earlier run. The fresh Mail run still shows the offset, confirming that the larger Mail composition contains an additional trigger not present in either reduction.
6. The public props are a discriminated union. The default `rns` branch accepts the full RNS host API. The `expo-ui` branch accepts only `ref`, `topColumnForCollapsing`, `preferredDisplayMode`, `preferredSplitBehavior`, and a narrowed `columnMetrics`; RNS-only props and secondary/inspector metrics are rejected by TypeScript rather than silently discarded.
7. expo-ui `columnMetrics` uses point-only `preferredPrimaryColumnWidth` and `preferredSupplementaryColumnWidth` names instead of RNS's ambiguous `*WidthOrFraction` names. Minimum and maximum values work without a preferred width; the adapter uses the supplied bound as SwiftUI's required ideal value.
8. UIKit display modes and split behaviors map to their closest SwiftUI equivalents.
9. SwiftUI column visibility and compact-column values are stateful. Prop changes reseed the state, while user/system changes can subsequently update it.
10. `SplitView.Inspector` remains a shared child API but is an unavoidable expo-ui no-op. The implementation warns once in development and omits inspector content.
11. The expo-ui path requires `@expo/ui` to be installed and the native app rebuilt. The router-tester dependency is added, but no native files are changed.
12. The old prototype's native navigation modifiers and toolbar bridge must not be copied into this ticket. They are the only evidence for some richer header controls, not available dependency API.

## Router-tester proof of concept

Route: `/split-view-mail`

The demo resembles Apple Mail with mailbox, message-list, and message-detail columns. Detail routes use `Stack.Title` and `Stack.Toolbar` with reply, archive, folder, compose, and search controls. The content is intentionally simple.

## Verification

- Earlier focused Jest suites, `expo-router` typecheck, and `expo-router` lint passed for the adapter.
- The reduced EAS experiment stayed aligned after a push, but its registered title did not render. This remains an unresolved observation; the isolation route has been removed.
- The Mail demo has bounded sidebar/content widths and is configured to retain content and detail when the sidebar is hidden.
- A fresh EAS iPad run verified the three-column layout, selected-message state, and sidebar-hidden two-column layout.
- The selected-message state visibly renders all seven SF Symbol toolbar buttons. With three columns, the narrow detail column omits the navigation title to make room for the controls; after hiding the sidebar, the wider detail column shows both `Google Photos` and the controls. Hiding the sidebar preserves the message-list and detail columns, as intended.
- Current screenshots:
  - `media/ipad-mail-three-columns.png`
  - `media/ipad-mail-message.png`
  - `media/ipad-mail-sidebar-hidden.png`

## Runtime prerequisites

- Install workspace dependencies with `pnpm install --frozen-lockfile`.
- Use an expo-ui-capable router-tester iOS development client. Runtime verification used build `0fe0984e-c1ab-41c9-80dc-346fd87edb5e`.
- Use an iPad simulator first to validate three columns and top toolbars, then an iPhone simulator to validate compact-column transitions.
- Open `/split-view-mail` for the Mail demo.
