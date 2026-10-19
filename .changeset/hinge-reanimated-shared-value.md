---
'expo-hinge': minor
---

Add the optional `expo-hinge/reanimated` entry. `useAnimatedHinge()` returns the hinge as a Reanimated shared value, and `addHingeWorkletListener()` runs a worklet on each hinge change. The UI thread runs both and does not wait for the JavaScript thread. The entry requires `react-native-reanimated` and `react-native-worklets`.
