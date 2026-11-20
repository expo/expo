---
'expo-modules-autolinking': patch
---

On iOS, the generated modules provider qualifies the scanned `@SharedObject` and `@ExpoView` classes of a package with one Swift module, as in `ExpoBrownfield.SharedState`, so a type of the same name in the app target doesn't shadow them.
