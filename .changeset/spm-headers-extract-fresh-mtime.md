---
'expo': patch
---

[iOS] Fix an incremental SwiftPM build that reuses a stale `ExpoModulesCore` module after the precompiled headers change version. The SwiftPM plugin now gives the files it unpacks from a precompiled tarball the time of extraction.
