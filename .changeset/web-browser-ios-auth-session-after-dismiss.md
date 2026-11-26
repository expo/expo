---
'expo-web-browser': patch
---

[iOS] Fix `openAuthSessionAsync` not presenting the browser and never settling when it is called right after `dismissAuthSession`.
