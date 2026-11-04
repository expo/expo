---
'expo-modules-core': patch
---

[iOS] Fix `ExpoModulesCore` header errors in modules that treat warnings as errors. The `EXFileSystemInterface` header now marks its members as non-null, matching `FileSystemManager`, so Swift sees them as `String` and `URL` instead of `String!` and `URL!`.
