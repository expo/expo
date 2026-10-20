---
'expo-router': patch
---

Fix `NativeTabs.Trigger` with `role="search"` so iOS 27 shows a separate search tab. Selecting that tab activates its search field unless `automaticallyActivatesSearch` is `false`.
