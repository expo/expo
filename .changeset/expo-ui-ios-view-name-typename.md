---
"@expo/ui": patch
---

[iOS] Speed up app launch. `ExpoUIView` named each of the 60+ SwiftUI views with `String(describing: contentType)`, which probes three `CustomStringConvertible`-family conformances and builds a `Mirror` per type before falling back to the plain type name. It now calls `_typeName(contentType, qualified: false)` directly, which returns the same name. Saves ~100 ms of module registration in a release build.
