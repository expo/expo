---
'expo-file-system': patch
---

[iOS] Download failures now end with the error's domain and code, for example `[NSURLErrorDomain:-1001]`, so they can be told apart whatever the device language.
