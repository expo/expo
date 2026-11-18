---
'expo-router': patch
---

When a protected route's guard fails, remove its visits and keep the remaining screens, so the screen below a closed guard is shown again instead of a new anchor screen. Custom navigators no longer receive hidden descriptors for blocked routes.
