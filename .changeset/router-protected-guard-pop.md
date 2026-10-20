---
'expo-router': patch
---

Fix a `Stack.Protected` guard that turns false on the focused screen adding a second copy of the screen below instead of returning to it.
