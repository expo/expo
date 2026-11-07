---
'eslint-config-expo': patch
---

Legacy config: recognize the globals that Node and browsers share, such as `setTimeout`, `URL` and `structuredClone`. The `shared-node-browser` environment was listed as a global name instead of enabled as an environment.
