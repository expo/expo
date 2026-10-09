---
'expo-widgets': patch
---

[Android] Fix minified release builds crashing on launch with `Failed to create an instance of class androidx.work.impl.WorkDatabase.canonicalName`. R8 stripped the no-arg constructor of WorkManager's Room database, which WorkManager creates by reflection; `expo-widgets` now ships consumer keep rules for it and for WorkManager's input mergers.
