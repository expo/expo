---
'create-expo-module': patch
---

Stop creating local modules, and adding platforms to them, in projects using Expo SDK 55 or earlier. The error suggests `npx create-expo-module@sdk-55 --local` instead. Pass `--ignore-compatibility-check` to use the current template anyway.
