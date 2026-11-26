---
'@expo/cli': patch
---

Exclude `ios/Pods`, `android/app/build`, `android/.gradle` and `.cxx` directories from Metro's file map by adding them to `resolver.blockList` once the project's Metro config is merged, so they also apply when it sets its own `blockList`. On Linux and Windows without Watchman, they're no longer watched either.
