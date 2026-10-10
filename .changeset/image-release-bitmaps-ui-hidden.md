---
'expo-image': patch
---

[Android] Release the bitmaps of loaded images when the app's UI is hidden, and load them again when the app comes back to the foreground. Until now they stayed in memory for as long as the app was in the background, which Google Play's Android vitals reports as excessive bitmap memory usage in the cached state.
