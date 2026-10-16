---
'expo-doctor': patch
---

Fix the "Check Expo config (app.json/ app.config.js) schema" check failing for every `ios.icon`: a `.icon` directory was reported as "cannot access file", a `.png` as "should point to a .icon directory", and the light/dark/tinted object form threw a `TypeError` out of the check.
