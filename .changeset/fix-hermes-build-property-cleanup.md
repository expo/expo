---
'expo-build-properties': patch
---

Remove stale Hermes engine overrides from `Podfile.properties.json` and `gradle.properties` when `useHermesV1` is removed. Preserve unrelated settings and compose Hermes settings from multiple plugin invocations.

While the plugin is active, it regenerates these two owned properties from current plugin options. Manual edits and custom-template values for these properties are replaced. Raw native-property mods overriding them remain order-dependent. Use the same plugin version when composing Hermes settings across plugins.

Removing the entire plugin still requires a clean prebuild to remove its last generated overrides.
