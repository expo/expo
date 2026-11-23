---
'@expo/metro-config': patch
---

Fix production folding of Platform.OS and Platform.select imports from React Native, React Native Web, and Expo Modules Core. Preserve statement boundaries and safely remove losing branches and their dependencies.
