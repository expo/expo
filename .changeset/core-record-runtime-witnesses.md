---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.21.0. `@Record` types now convert between JavaScript and native code with less overhead and no longer need an app context. `@ExpoModule` and `@SharedObject` now report a build error when two `@JS` members of one object have the same JavaScript name, because JavaScript could reach only one of them.
