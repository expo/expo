---
'expo-router': patch
---

Fix a failed `loader` being fetched more than once. A failed `loader` result now stays cached until the route's `ErrorBoundary` calls `retry` or the user leaves the route.
