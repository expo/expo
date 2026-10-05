---
'expo-modules-core': patch
'@expo/ui': patch
---

[iOS] Speed up native module registration at app launch by classifying definition elements and naming types without Swift protocol conformance lookups, which scan every conformance record in the app.
