---
'eslint-config-expo': patch
---

Flat config: export a plain config array instead of calling `defineConfig`, so the config loads on ESLint 9.0 to 9.21 as the peer range allows.
