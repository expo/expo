---
'@expo/metro-file-map': patch
---

Detect Bun through `process.versions.bun` instead of declaring `process.isBun` on the global `Process`, so the package's type declarations no longer conflict with `@types/bun` when `skipLibCheck` is off.
