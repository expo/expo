---
'@expo/config': patch
---

Keep the serialized `plugins` array in `getConfig` when `skipPlugins` is set, so callers can read which plugins a dynamic config declares without running them.
