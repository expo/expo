---
'@expo/fingerprint': patch
---

Fix the Expo config being silently left out of the fingerprint on Node 22.18+ when `app.config.ts` imports a `.ts` file. The module capture hook now forwards every `Module._compile` argument, so Node can still strip types from the imported file.
