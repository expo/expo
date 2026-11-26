---
'@expo/config': minor
---

Add a `pluginMode: 'inspect'` option to `getConfig` to read serialized plugin declarations without resolving or running the plugins.
Preserve `null` values in plugin options returned by `getConfig` when inspecting or applying plugins.
Report `INVALID_CONFIG` when a plugin option contains a symbol value.
