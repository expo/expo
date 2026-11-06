---
'expo-updates': patch
---

[iOS] Stop storing asset download response headers in the updates database. Nothing read them, and they could include cookies.
