---
'expo-modules-autolinking': patch
---

[iOS] Add the `EXPO_MODULES_SCAN_TIMEOUT_MS` environment variable to set the timeout of the scan for `@ExpoModule` classes. The default stays 5000 ms. Raise it when the scan times out on a slow or busy machine, such as a CI runner, and fails the build. Set it in the environment of the build, or export it from `ios/.xcode.env` or `ios/.xcode.env.local`.
