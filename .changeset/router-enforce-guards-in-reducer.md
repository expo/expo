---
'expo-router': patch
---

Remove protected routes from the navigation state before they render, and reject or redirect navigation to a protected route. Remove the `removeRoutes` prop of the stack navigators.
