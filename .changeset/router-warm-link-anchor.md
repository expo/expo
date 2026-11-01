---
'expo-router': patch
---

Fix a deep link that arrives while the app is running opening a nested stack without its `unstable_settings.anchor` screen, or with an anchor that is missing the route's params.
