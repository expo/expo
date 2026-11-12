---
'expo-router': patch
---

Fix an unhandled `REMOVE_ROUTES` warning when a mount `useEffect` update unmounts a stack with `Stack.Protected` routes.
