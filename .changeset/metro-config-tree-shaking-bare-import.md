---
'@expo/metro-config': patch
---

Fix tree shaking removing a side-effect import such as `import './polyfill'` when an import with specifiers comes before it in the same module.
