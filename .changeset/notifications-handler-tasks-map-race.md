---
'expo-notifications': patch
---

[iOS] Fix a crash (`EXC_BAD_ACCESS` in `__RawDictionaryStorage.find`) when the JS notification handler responds while the same foreground notification times out or another one arrives, by handling `handleNotificationAsync` on the main queue.
