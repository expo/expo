---
'expo-print': patch
---

Fix a crash on Android when the print window cannot load the `uri` given to `printAsync`. `printAsync` now rejects a missing or unsupported `uri` before it opens the print window. When the load fails after the print window opens, the window shows the localized system error message, and the details go to logcat.
