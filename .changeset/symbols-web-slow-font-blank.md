---
'expo-symbols': patch
---

[Web] Fix `SymbolView` staying blank for the life of the page when the Material Symbols font file takes longer than the `expo-font` load timeout to arrive. The glyph is now drawn once the `@font-face` rule is registered, and the browser paints it when the file loads.
