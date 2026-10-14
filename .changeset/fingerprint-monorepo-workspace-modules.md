---
'@expo/fingerprint': patch
---

Fix a config plugin from a linked workspace package being left out of the fingerprint. The config imports it at the top, so it also loads when plugins are skipped, and the diff kept only files inside the project root. The config loader now records which file first imports each module, through `module.registerHooks` on Node 22.15+, and keeps the modules the project's own files load outside `node_modules`.
