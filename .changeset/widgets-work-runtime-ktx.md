---
'expo-widgets': patch
---

[Android] Fix a release build failing `checkReleaseDuplicateClasses` when another dependency brings WorkManager 2.8 or newer, by pinning `work-runtime-ktx` forward from the 2.7.1 that Glance requests.
