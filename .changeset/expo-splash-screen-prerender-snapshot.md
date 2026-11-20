---
'expo-splash-screen': minor
---

Add an experimental prerender of the first screen on iOS. With `ExpoSplashScreenPrerenderSnapshot` in Info.plist, the screen that replaces the splash screen is captured and stored in the Caches directory. The next launch draws that snapshot through Fabric before React Native starts. A snapshot is used only when the window size, text size, appearance, and app build still match. The snapshot holds the text of that screen, and there is no API to delete it yet: the next launch after a logout can show the first screen of the last user until React replaces it.
