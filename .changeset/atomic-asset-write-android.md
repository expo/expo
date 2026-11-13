---
"expo-updates": patch
---

[Android] Fix a startup crash (`Compiling JS failed: Buffer is smaller than the size stated in the file header`) caused by a truncated update asset. Downloaded assets are now moved into place with an atomic rename after the hash is verified, instead of being stream-copied into the final path, and an asset file that already exists on disk is only reused when it matches the hash declared in the manifest.
