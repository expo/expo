---
'@expo/cli': patch
---

Prevent the internal `set()` object utility from writing to `Object.prototype` when a path contains `__proto__`, `constructor`, or `prototype`.
