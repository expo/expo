---
'expo-modules-core': patch
---

[Android] Fix release builds crashing at launch when the app uses an Expo Modules API 2.0 module, such as `expo-crypto`. R8 removed classes and members that the v2 runtime reaches through reflection and JNI.
