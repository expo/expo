# History

## 2026-09-14 04:17 PDT — Complete the native tabs migration

**Asked:** Check whether bare-expo or any other active code still used `expo-router/unstable-native-tabs`.
**Did / why:** Migrated the remaining active app and template imports, including bare-expo, while preserving intentional references in compatibility code, migration documentation, and examples for older SDKs.

## 2026-09-14 03:55 PDT — Stabilize the native tabs entry point

**Asked:** Deprecate `expo-router/unstable-native-tabs`, rename it to `expo-router/native-tabs`, and prepare a branch for a pull request.
**Did / why:** Added the stable package entry point, retained the unstable path as a deprecated compatibility alias, and updated current source examples, docs, and test apps so existing users are not broken while new usage adopts the stable API.
