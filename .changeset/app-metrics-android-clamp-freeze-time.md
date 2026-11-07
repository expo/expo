---
"expo-app-metrics": patch
---

[Android] Stop `expo.frameRate.totalDelay` from going negative. Frames that render faster than the target duration no longer subtract from the total.
