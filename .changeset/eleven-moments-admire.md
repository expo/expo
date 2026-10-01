---
'expo-location': patch
---

[Android] Add the core functionalities for the **next** version: permission getters and requesters, position getter, and `enableLocationServices` prompt. Introduce `LocationProvider` interface to allow for multiple implementations: for now `gms` and `android.location`.
