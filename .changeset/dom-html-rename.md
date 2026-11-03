---
'@expo/cli': patch
'@expo/metro-config': patch
---

Fix corruption of unrelated string literals in native exports containing DOM components by resolving HTML filenames before Hermes compilation. Defer Hermes compilation only for chunks that reference DOM components.
