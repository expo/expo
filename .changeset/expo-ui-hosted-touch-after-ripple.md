---
'@expo/ui': patch
---

[Android] Fix an `RNHostView` that ignores touches when a Compose button with a ripple in the same `Host` was pressed earlier. The ripple container that Compose adds was found first during React Native's touch-target search, so the touch went to the `Host` instead of the hosted view.
