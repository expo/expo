---
'expo-modules-core': minor
---

On iOS, `measure()` of a view inside a SwiftUI view of `@ExpoView` skips the layout origin of the SwiftUI view, because SwiftUI places it, not Yoga.
