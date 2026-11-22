---
'expo-splash-screen': minor
---

Add the experimental prerender of the first screen on Android. With the `expo.modules.splashscreen.PRERENDER_SNAPSHOT` meta-data in AndroidManifest.xml, the screen that replaces the splash screen is captured and stored in the cache directory. The next launch draws that snapshot with native views before React Native starts. A snapshot is used only when the window size, density, font scale, appearance, layout direction, and app build still match. The snapshot holds the text of that screen, and there is no API to delete it yet: the next launch after a logout can show the first screen of the last user until React replaces it.
