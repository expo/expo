---
'expo-router': patch
---

Fixed `unstable_settings.anchor` being ignored for layouts that load asynchronously, which hid the back button after a reload on web ([#50641](https://github.com/expo/expo/issues/50641)). Layouts now load only when they first render, and each navigator applies its anchor when it mounts.

**Breaking change:** the internal `RouteNode.initialRouteName` field is removed. A group-specific anchor no longer selects which group a URL resolves to when the URL matches the same route in several groups.
