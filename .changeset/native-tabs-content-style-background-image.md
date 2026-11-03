---
'expo-router': patch
---

Accept `backgroundImage` in the `contentStyle` of `NativeTabs` and `NativeTabs.Trigger`. React Native 0.87 made it the stable name of `experimental_backgroundImage`, which `contentStyle` still accepts.
