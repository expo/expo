---
'expo-modules-core': minor
---

On iOS, `@ExpoView` also applies to SwiftUI view structs. The macro adds the `props` and `children` constants. The view renders inside a `Host` from `@expo/ui`, and it can contain, or be contained by, the views of `ExpoSwiftUI.View`. Update `expo-modules-macros` to 0.38.1, which conforms an `ExpoNativeView` subclass to the new `AnyNativeUIKitView` protocol, and warns when its `didUpdateProps` doesn't match the method that core calls.
