---
'expo-modules-core': patch
---

[iOS] Reduce the overhead of creating a view that has events. Each view no longer searches all of its properties for the event dispatchers. The search runs for the first view of each class, and later views read the property at the position that the search found.
