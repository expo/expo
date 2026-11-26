---
'expo-modules-core': patch
---

[iOS] Fixed Expo Modules v2 views ignoring their own props that come without a JavaScript runtime on the JavaScript thread: React's updates after a `setNativeProps` call, and Reanimated's values at React commits.
