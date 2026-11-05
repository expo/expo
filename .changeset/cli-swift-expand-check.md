---
'expo-modules-cli': minor
---

Add the `swift:expand` and `swift:check` commands. `swift:expand` prints the code that the Expo Modules macros generate for Swift sources, without a build. `swift:check` prints only the macro errors and warnings, and exits with code 1 when there is an error. Both need `expo-modules-macros` 0.27.0.
