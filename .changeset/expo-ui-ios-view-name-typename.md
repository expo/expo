---
"@expo/ui": patch
---

[iOS] Speed up app launch. `ExpoUIView` named each of the 60+ SwiftUI views with `String(describing: contentType)`, which probes three `CustomStringConvertible`-family conformances and builds a `Mirror` per type before falling back to the plain type name. It now calls `_typeName(contentType, qualified: false)` through an opaque, non-inlinable helper, which returns the same name (also for `private` types, where the optimizer's constant-folded `_typeName` would keep the file discriminator). Saves ~100 ms of module registration in a release build.
