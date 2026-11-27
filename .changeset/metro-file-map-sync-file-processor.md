---
'@expo/metro-file-map': patch
---

Process files synchronously in-band, as upstream `metro-file-map` does. This makes lazy SHA-1 computation and worker-thread crawls faster. For `unstable_fileMapPlugins` workers, `getContent()` returns a `Buffer` again rather than a promise, matching upstream.
