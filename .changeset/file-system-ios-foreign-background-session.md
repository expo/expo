---
'expo-file-system': patch
---

[iOS] Fix the app never calling the system completion handler of `handleEventsForBackgroundURLSession`, for `expo-file-system` background downloads and for background sessions of other modules.
