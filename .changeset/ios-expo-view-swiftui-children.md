---
'expo-modules-core': minor
---

On iOS, the children of a SwiftUI view of `@ExpoView` are `ExpoSwiftUI.Child` values. `child.as(SlotView.self)` returns a child of that view type with its current props, children and view struct, and it renders the child. A view of `ExpoSwiftUI.View` finds such a child with `AnyChild.as(_:)`.
