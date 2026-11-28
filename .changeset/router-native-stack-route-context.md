---
'expo-router': patch
---

Fix memoized screens inside a native stack re-rendering whenever a navigator nested in that stack changes, for example on every tab switch.
