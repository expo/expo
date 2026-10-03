---
'expo-sqlite': patch
---

[iOS] Speed up binding parameters and reading rows by converting them through typed values instead of `Any`. Reading rows is up to about 3.3 times faster and inserts up to about 2.8 times faster in the native benchmarks.

A `bigint` bind parameter now binds as a 64-bit integer instead of `NULL`. It still reads back as a number, with the same precision loss above 2^53 as other integer columns.
