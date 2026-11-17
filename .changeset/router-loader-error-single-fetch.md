---
'expo-router': patch
---

Prevent failed `loader` requests from being fetched more than once. Failed `loader` results now stay cached until the route's `ErrorBoundary` explicitly calls `retry` or the user leaves the route.
