---
'expo-location': patch
---

[Android] Add background location tracking. `LocationProvider` interface now has `getLocationTaskConsumerClass` and `getRegisteredTaskConsumerClass` methods, which return the `LocationTaskConsumer` class used to handle background location using TaskManager. Added `GmsLocationTaskConsumer` and `AndroidLocationTaskConsumer` implementations. Add `RECEIVE_BOOT_COMPLETED` to the manifest when the `isAndroidBackgroundLocationEnabled` is true.
