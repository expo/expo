---
'expo-modules-core': patch
---

[macOS] Attach SwiftUI hosting views even when no `NSViewController` is in the responder chain, such as a React root view set directly as `NSWindow.contentView`. Previously, `@expo/ui` content in such windows rendered nothing.
