---
'expo-router': patch
---

Fix a failed `loader` being fetched more than once. A failed `loader` result now stays cached until the route's `ErrorBoundary` calls `retry`, the user leaves the route, or the new `clearLoaderError` function clears it.
