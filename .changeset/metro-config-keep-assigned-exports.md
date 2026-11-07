---
'@expo/metro-config': patch
---

Keep the declaration of an unused export when its module assigns to it, so tree shaking does not cause a `ReferenceError` at runtime.
