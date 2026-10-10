---
'expo-localization': patch
---

Stop resetting `I18nManager.allowRTL` / `forceRTL` on every launch when the config plugin leaves `supportsRTL` / `forcesRTL` unset. The module now remembers which of the two values came from the app config, so a value set in the config is still applied on every launch, dropping it still restores the React Native default (once, on the first launch without it), and an app that switches to RTL at runtime with `I18nManager.forceRTL(true)` keeps it across reloads, as in SDK 57.
