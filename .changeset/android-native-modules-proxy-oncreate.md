---
'expo-modules-core': patch
---

[Android] Fixed Expo modules not receiving `OnCreate` when JavaScript reaches the JSI `NativeModulesProxy` before the legacy one, for example with lazy imports, which made modules like `expo-web-browser` fail on first use. Its constants are read lazily again, as before #46964.
