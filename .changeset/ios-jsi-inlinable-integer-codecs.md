---
'expo-modules-jsi': patch
---

[iOS] Speed up integer, `BigInt`, and `Optional` decoding and safe-integer encoding by inlining common numeric paths, reading `BigInt` values without cloning handles, and combining tag/value checks across the module boundary.
