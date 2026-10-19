---
'expo-router': patch
---

Fix `NativeTabs` dropping a `NativeTabs.Trigger` wrapped in `Protected`, even when its guard passes.
