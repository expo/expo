---
'expo-sqlite': patch
---

[iOS] Speed up binding parameters and reading rows by converting them through typed values instead of `Any`. Reading rows is up to about 3.3 times faster and inserts up to about 2.8 times faster in the native benchmarks.
