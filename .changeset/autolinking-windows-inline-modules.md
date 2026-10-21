---
'expo-modules-autolinking': patch
---

[Android] Fix the build failing on Windows when `experiments.inlineModules.watchedDirectories` is set. The Gradle plugin now passes each watched directory as its own `--watched-directory` argument instead of a JSON string, which lost its quotes on the Windows command line.
