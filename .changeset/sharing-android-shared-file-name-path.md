---
'expo-sharing': patch
---

[Android] Fix `getResolvedSharedPayloadsAsync` so that a shared file name from the sending app cannot write the copy outside the cache directory. Each copy now goes into its own directory in the cache, and `originalName` keeps only the last segment of the name.
