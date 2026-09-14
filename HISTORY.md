# History

## 2026-09-14 03:55 PDT — Stabilize the native tabs entry point
**Asked:** Deprecate `expo-router/unstable-native-tabs`, rename it to `expo-router/native-tabs`, and prepare a branch for a pull request.
**Did / why:** Added the stable package entry point, retained the unstable path as a deprecated compatibility alias, and updated current source examples, docs, and test apps so existing users are not broken while new usage adopts the stable API.
