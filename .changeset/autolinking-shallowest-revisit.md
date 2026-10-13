---
"expo-modules-autolinking": patch
---

Fix autolinking choosing a different copy of a duplicated native module between runs when it is reachable at more than one dependency depth, which also made the `@expo/fingerprint` hash unstable.
