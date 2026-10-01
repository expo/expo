---
'expo-sqlite': patch
---

[iOS] Speed up binding parameters and reading rows by converting them through a typed value instead of `Any`. Queries that read rows are about 2.5 to 3 times faster and inserts about 2.4 times faster in the native benchmarks.
