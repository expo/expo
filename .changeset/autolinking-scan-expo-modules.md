---
'expo-modules-autolinking': patch
'expo': patch
---

[iOS] Detect native module classes annotated with the `@ExpoModule` macro and add them to the generated modules provider automatically, without listing them in `expo-module.config.json`. Generating the modules provider runs the scanner from `expo-modules-macros` once over all package sources and links only the classes that compile for the target platform. When the scan fails, packages that declare their modules still link them, and the build fails if a package relies on the scan for its module classes.
