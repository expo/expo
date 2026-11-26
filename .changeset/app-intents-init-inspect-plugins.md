---
'expo-app-intents': patch
---

Read the `expo-app-intents` plugin entry from the evaluated app config in `init`, so plugin entries from a dynamic config and entries that use a path inside the package are detected.
For dynamic configs, init prints only the settings to update by hand. It edits static-only projects automatically.
