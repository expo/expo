---
'expo-camera': patch
---

[iOS] Fixed `recordAsync()` never settling when it is called while a recording is already active. It now rejects with an error.
