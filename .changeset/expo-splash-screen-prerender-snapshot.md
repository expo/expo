---
'expo-splash-screen': minor
---

Add an experimental prerender of the first screen on iOS. With `ExpoSplashScreenPrerenderSnapshot` in Info.plist, the screen that replaces the splash screen is captured and stored in the app container. The next launch draws that snapshot through Fabric before React Native starts. A snapshot is used only when the window size, text size, appearance, and app build still match.
