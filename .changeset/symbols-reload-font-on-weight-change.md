---
"expo-symbols": patch
---

[Android][Web] Fixed `SymbolView` showing a missing-glyph box after its `weight` changes, because the font of the new weight was never loaded.

See: [#50717](https://github.com/expo/expo/pull/50717)
