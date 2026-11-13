---
"expo-modules-core": patch
---

[iOS] `@ExpoModule` and `@SharedObject` add an `@unchecked Sendable` conformance to their class, so `@JS(.withAsync)` functions compile without declaring it by hand.
