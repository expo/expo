---
'expo-widgets': patch
---

Fix the Android build failing with `Unresolved reference 'jakex7'`. Custom notifications now import the `io.github.expo.peek` packages that the `peek-emittables` dependency provides.
