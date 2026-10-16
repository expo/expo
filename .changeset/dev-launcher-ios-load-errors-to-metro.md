---
'expo-dev-launcher': patch
---

On iOS, a failed app load now appears in the terminal that runs `npx expo start`, with the `iOS` tag. Before, the error was visible only on the device. Crash reports sent to the terminal now also have the `iOS` tag.
