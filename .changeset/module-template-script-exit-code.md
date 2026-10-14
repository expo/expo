---
'expo-module-template': patch
---

Fix the `build` and `test` scripts exiting successfully when TypeScript or Jest can't be started. The scripts now print why the tool couldn't start and how to fix it.
