---
'expo-updates': patch
---

[iOS] Fix a data race on the state events observer. A late teardown on reload no longer removes the new observer.
