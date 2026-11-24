---
'@expo/metro-config': patch
'expo': patch
---

Use granular chunking for web exports that have async imports inside web workers, and load those imports from separate chunks.
