# ENG-28595 — SwiftUI `NavigationSplitView` spike

## Result

The spike passed on an iPad Pro 13-inch (M5) and iPhone 17 running iOS 26.5.
Expo Router content renders inside `@expo/ui` SwiftUI columns, and each column
accepts independent navigation title and title-display-mode modifiers.

- Frame-by-frame review found no layout shift after the native navigation transition.
- Content respected safe areas and did not overlap either navigation bar.
- Sidebar links opened routed detail content.
- Detail push and edge-swipe pop worked.
- Changing the detail title at runtime updated the native navigation title.
- The iPhone layout collapsed to the detail column and returned to the sidebar.
- In iPad portrait, the sidebar initially appears behind the system “Show Sidebar” control.

Fresh simulator development build:
https://expo.dev/accounts/expo/projects/router-tester/builds/0fe0984e-c1ab-41c9-80dc-346fd87edb5e

## Evidence

- [iPad cold first render](./ipad-cold-first-render.mp4)
- [iPad first-render timeline](./ipad-first-split-timeline.png)
- [iPad runtime title update](./ipad-title-updated.png)
- [iPad detail after pop](./ipad-after-pop.png)
- [iPhone cold first render](./iphone-cold-first-render.mp4)
- [iPhone frame overview](./iphone-frames-overview.png)
- [iPhone initial compact sidebar](./iphone-initial-sidebar.png)
- [iPhone detail and updated title](./iphone-title-updated-detail-two.png)

The EAS Simulator sessions used for verification were stopped after the run.
