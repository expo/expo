---
'@expo/config': patch
---

Avoid duplicate entries in `updates` arrays, such as `updates.assetPatternsToBeBundled`, when `modifyConfigAsync` merges modifications.
