---
'@expo/router-server': patch
'expo-router': patch
---

Reduced the size of the generated `Href` type so large apps no longer fail with TS2590 (`Expression produces a union type that is too complex to represent`).
