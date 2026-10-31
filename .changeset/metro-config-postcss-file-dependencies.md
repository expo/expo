---
'@expo/metro-config': patch
---

Compile a PostCSS-processed stylesheet again when a file PostCSS read changes, such as an `@import`ed stylesheet, and keep that compile when the stylesheet's own contents did not change.
