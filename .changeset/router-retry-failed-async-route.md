---
'expo-router': patch
---

Fix an async route that failed to load once staying failed until a full reload. Retrying the error boundary or opening the route again now loads it again.
