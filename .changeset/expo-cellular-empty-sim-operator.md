---
'expo-cellular': patch
---

[Android] Fix `getMobileCountryCodeAsync()` and `getMobileNetworkCodeAsync()` throwing a `StringIndexOutOfBoundsException` when the SIM operator is empty or incomplete, for example right after leaving airplane mode. They now resolve to `null` instead.
