---
'expo-observe': patch
---

Record unhandled promise rejections as non-fatal errors in production builds on Android and iOS. Each distinct rejection is recorded at most once every 15 minutes. The `errorHandlingEnabled` option also turns this off.
