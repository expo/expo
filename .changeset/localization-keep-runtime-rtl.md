---
'expo-localization': patch
---

Stop resetting `I18nManager.forceRTL` / `allowRTL` on every launch when the config plugin leaves `supportsRTL` / `forcesRTL` unset. The preferences are now written only when the plugin sets them, so an app that switches to an RTL language at runtime with `I18nManager.forceRTL(true)` keeps it across reloads, as in SDK 57.
