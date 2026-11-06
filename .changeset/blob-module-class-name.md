---
'expo-blob': patch
---

Rename the iOS module class from `ExpoBlob` to `BlobModule`, so that its name differs from the Swift module. The precompiled XCFramework failed to verify its module interface. The JavaScript name stays `ExpoBlob`.
