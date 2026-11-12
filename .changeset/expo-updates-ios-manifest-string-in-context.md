---
'expo-updates': patch
---

[iOS] Send `latestManifest` and `downloadedManifest` to JS as JSON strings, as on Android. Converting the manifest dictionary on every download progress event could use enough memory during a first download for iOS to terminate the app.
