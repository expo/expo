---
'expo': patch
---

Fix web `ViewStyle` and `TextStyle` types so `cursor`, `transitionDuration`, and `userSelect` agree. `cursor: 'grab'` and other CSS cursor strings stay valid, `userSelect` keeps the keywords React Native and react-native-web accept, and `transitionDuration` still accepts a number or a string.
