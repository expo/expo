---
'expo-router': patch
---

When the active protected route's guard fails and its `redirectTo` points to a route of the same navigator, show the redirect destination on the first render instead of the blocked screen.
