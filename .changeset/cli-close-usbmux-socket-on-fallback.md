---
'@expo/cli': patch
---

[iOS] Close the usbmuxd socket when `expo run:ios --device` can't reach a device over USB and falls back to `devicectl`, so the command exits after launching the app instead of staying open.
