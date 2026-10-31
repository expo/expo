---
'@expo/ui': patch
---

Fix iOS `Host` content that mounts off screen, such as below the fold of a sheet, being centered on a smaller first proposal instead of placed at `alignment`. ([#52641](https://github.com/expo/expo/issues/52641))
