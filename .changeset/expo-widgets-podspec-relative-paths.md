---
'expo-widgets': patch
---

[iOS] Stop the `ExpoWidgets` checksum in `Podfile.lock` from changing with the project path. The resource copy phase now uses `${PODS_TARGET_SRCROOT}` instead of an absolute path.
