---
'expo-router': patch
---

Fix navigating to a route inside `Stack.Protected` whose guard is `false` adding a second copy of the anchor screen to the stack.
