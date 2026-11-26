---
'@expo/metro-file-map': patch
---

Test `ignorePattern` against absolute paths only, as Metro's `metro-file-map` does, and stop excluding `.cxx` directories, which Expo CLI now adds to `resolver.blockList`. The Node crawler also tested each directory against its path relative to `rootDir`, so `blockList` entries anchored to a project-relative path (e.g. `/^ios\/build$/`) no longer exclude anything.
