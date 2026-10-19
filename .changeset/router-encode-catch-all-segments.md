---
'expo-router': patch
---

Fix catch-all route params with `?`, `#`, `%`, or spaces that broke the web URL. Each segment of a catch-all param is now encoded, the same as a dynamic route param.
