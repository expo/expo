---
'expo-doctor': patch
---

Fix the "Check Expo config (app.json/ app.config.js) schema" check for `ios.icon`. A `.icon` directory was reported as "cannot access file", and a `.png` as "should point to a .icon directory". With the light/dark/tinted object form, the check reported no asset errors at all, not even a missing image or a missing file in another field such as `android.icon`.
