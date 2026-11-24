---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.35.0. `@ExpoModule(views:)` emits the view types as `[any AnyNativeView.Type]`, so the compiler rejects a class that isn't an `@ExpoView`.
