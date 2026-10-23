---
'expo': patch
---

[iOS] A `buildFromSource` pattern such as `".*"` no longer fails the SwiftPM sync when it matches a module that Swift Package Manager cannot build from source, `ExpoModulesCore` included: the plugin links that module precompiled and prints one warning naming it. An entry that names such a module exactly still fails the sync.
