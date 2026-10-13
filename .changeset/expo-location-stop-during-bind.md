---
"expo-location": patch
---

[Android] Stop the location foreground service when a background location task is unregistered while the service is still binding, so a `stopLocationUpdatesAsync` that follows `startLocationUpdatesAsync` within milliseconds no longer leaves the service and its notification running.
