---
'@expo/prebuild-config': patch
---

Prebuild no longer applies `expo-dev-client`'s config plugin automatically when the project excludes `expo-dev-client` from autolinking, so a build made that way no longer declares the `exp+<slug>` scheme.
