---
"expo-updates": patch
---

Fix the embedded manifest giving every duplicate asset scale the same `packagerHash`, which made updates download assets already in the binary.

See: [#50757](https://github.com/expo/expo/pull/50757)
