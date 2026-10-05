---
'expo-image': patch
'expo-web-browser': patch
---

Export `app.plugin.js` from `package.json:exports` so tools that resolve config plugins through Node's package exports, such as the config fallback in EAS CLI, find the config plugin again instead of failing with "Unable to resolve a valid config plugin".
