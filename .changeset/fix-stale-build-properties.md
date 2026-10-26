---
'@expo/config-plugins': patch
---

Remove stale properties from `Podfile.properties.json` and `gradle.properties` when their config values become null or undefined. Preserve empty string values.
