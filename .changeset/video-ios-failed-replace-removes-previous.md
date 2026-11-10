---
'expo-video': patch
---

[iOS] Fix the previous video that keeps playing after `replaceAsync` fails. The player now removes the previous video and changes the status to `error`.
