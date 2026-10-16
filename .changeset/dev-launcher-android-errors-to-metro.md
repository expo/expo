---
'expo-dev-launcher': patch
---

On Android, a failed app load and a native error in the running app now appear in the terminal that runs `npx expo start`, with the `Android` tag. Before, these errors were visible only on the device. Crash reports sent to the terminal now also have the `Android` tag.
