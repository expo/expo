---
'expo-router': patch
---

Add per-state `renderingMode` for SF Symbol and image icons on iOS and `tinting` on Android to `NativeTabs.Trigger.Icon`. Image icons without `renderingMode` now resolve the mode separately for each state from that state's icon color.
