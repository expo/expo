---
"@expo/config": patch
---

Replace the `deepmerge` dependency with a local config merge helper that ignores `__proto__` properties to prevent prototype injection.
