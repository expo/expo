---
'@expo/fingerprint': patch
---

Fix the modules an ES module config or config plugin imports being left out of the fingerprint. Node loads them without `Module._compile`, so the module capture hook now also records each ES module Node's loader evaluates, through `module.registerHooks` on Node 22.15+.
