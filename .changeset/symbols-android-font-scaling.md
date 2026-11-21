---
'expo-symbols': patch
---

Fix `SymbolView` on Android growing, shrinking, or getting cut off when the system font size is changed. The symbol now stays at its `size`, like on iOS.
