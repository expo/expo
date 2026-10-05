---
'@expo/require-utils': patch
---

Export `nativeResolveFrom`, which resolves a module with Node's own resolution, including `package.json:exports`, and returns `null` when Node can't resolve it.
