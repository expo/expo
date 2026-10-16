---
'expo-router': patch
---

[iOS] Fix the zoom transition source lookup when a screen opened with `Link.AppleZoom` is closed with `router.back()`. The zoom transition now finds its source view in this case.
