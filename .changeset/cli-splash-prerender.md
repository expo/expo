---
'@expo/cli': minor
---

`expo export:embed` renders the component configured as `expo-splash-screen`'s `prerender` through React Native's Fabric renderer and ships the resulting template next to the JS bundle.

The screen that replaces the splash is captured once it has settled (the committed view hierarchy with the frames UIKit resolved, plus the custom fonts it uses) and stored in the app container; the next launch prerenders that snapshot instead of the bundled template when the window size, text size, appearance and app build still match. `SplashScreen.saveLaunchScreenAsync()` recaptures on demand (after signing in or out), `SplashScreen.clearLaunchScreenAsync()` drops the snapshot.
