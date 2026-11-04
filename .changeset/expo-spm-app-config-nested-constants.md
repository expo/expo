---
'expo': patch
---

[iOS] Fix the SwiftPM "Generate Expo app.config" build phase failing when npm nests `expo-constants` under `expo` or pnpm does not link it to the app root. The phase now resolves `expo-constants` through `expo` when the app does not list it.
