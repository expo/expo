---
'create-expo-module': patch
'expo-module-template': patch
---

Fix absolute destinations for standalone modules being created inside the current directory. Standalone modules now get their podspec metadata from `package.json`, and Android uses the `--module-version` value.
