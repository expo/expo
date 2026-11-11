---
'expo-tracking-transparency': minor
---

Add `getAdvertisingIdAsync` to read the advertising ID off the JavaScript thread. On Android the synchronous `getAdvertisingId` makes an IPC call to Google Play Services and can block the JavaScript thread for hundreds of milliseconds.
