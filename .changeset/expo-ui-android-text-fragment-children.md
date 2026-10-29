---
'@expo/ui': patch
---

[Android] Fix the Jetpack Compose `Text` dropping nested `Text` spans and strings that are inside a React fragment. Move the fragment flattening helper to a shared util used by both the SwiftUI and Jetpack Compose `Text`.
