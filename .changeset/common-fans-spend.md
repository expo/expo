---
'expo-location': patch
---

[Android] Add background location tracking. `LocationProvider` interface now has a new method to return a `LocationTaskConsumer` which is used to handle background location using TaskManager. Added LocationTaskConsumer implementation for `gms` and pure `android.location`. Add `RECEIVE_BOOT_COMPLETED` to the manifest when the `isAndroidBackgroundLocationEnabled` is true.
