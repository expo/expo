---
'@expo/ui': patch
---

[Android] Fix an intermittent `performMeasureAndLayout called during measure layout` crash that tore down the ReactHost when a `Host` with `matchContents` was measured while react-native-reanimated was active. The `onLayoutContent` event is now posted after the measure pass instead of emitted inside it.
