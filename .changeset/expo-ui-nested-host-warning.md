---
"@expo/ui": patch
---

Added a development warning when a `Host` renders directly inside another `Host` without an `RNHostView`. The universal `BottomSheet` no longer adds its own `Host` when it renders inside one.
