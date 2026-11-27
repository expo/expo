---
'expo-modules-autolinking': patch
---

[iOS] Remove the mergeable library data (`LC_ATOM_INFO`) from Release precompiled frameworks, so that apps do not embed binaries at twice their size.
