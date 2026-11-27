---
'@expo/metro-config': patch
---

Define `__EXPO_PROJECT_ROOT__` in the prelude of development bundles. Its value is the Metro project root, and no environment variable or `.env` file can change it.
