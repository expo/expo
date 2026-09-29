---
'@expo/require-utils': patch
---

Fix a crash when formatting a stack trace on Node before v22.14.0 if a frame's source map failed to load, such as when calling `console.log` in an API route during `expo start`.
