---
'expo-router': patch
---

Port React Navigation accessibility fixes: use `aria-current` for the focused drawer item on web, expose the disabled state of `PlatformPressable`, and fix a JS stack screen that ignored touches after a route below a transparent modal was removed.
