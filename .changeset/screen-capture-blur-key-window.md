---
'expo-screen-capture': patch
---

[iOS] Fix the app switcher blur from `enableAppSwitcherProtectionAsync` being drawn behind the app when the app uses native tabs. The blur is now added to the key window.
