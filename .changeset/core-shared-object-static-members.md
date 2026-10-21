---
'expo-modules-core': patch
---

[iOS] Support `static` and `class` `@JS` members on `@SharedObject` classes. They are bound onto the JavaScript class itself, for example `Cache.open(name)`.
