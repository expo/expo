---
'expo-modules-core': minor
---

On iOS, a SwiftUI view of `@ExpoView` reads its app context from the weak `appContext` property. Update `expo-modules-macros` to 0.39.0, which adds this property, and decodes `@ViewProps` value props of free-form types such as `[String: Any]`.
