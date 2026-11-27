---
'expo-router': patch
---

Fix a redirect loop when a protected route without `redirectTo` shares its URL with the fallback route.
