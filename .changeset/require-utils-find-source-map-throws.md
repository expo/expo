---
'@expo/require-utils': patch
'@expo/cli': patch
---

Fix `expo start` exiting on Node before v22.14.0 when an API route calls `console.log`. Stack frames whose source map fails to load are printed without source mapping instead of throwing.
