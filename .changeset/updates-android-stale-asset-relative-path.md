---
'expo-updates': patch
---

[Android] Fix assets of an update failing to load when a row with the same key pointed to a file that no longer exists, such as an embedded resource of a previous binary: the newly downloaded file's location is now stored.
