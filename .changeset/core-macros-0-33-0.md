---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.33.0. The `ExpoModulesMacrosPlugin` Swift package product no longer breaks iOS builds in Xcode. The macros report more mistakes as build errors: generic, `static` or misplaced `@JS` members, reserved JavaScript names, a `@SharedObject` class without a superclass, and invalid `@Record`, `@Event` and `@Union` declarations. A parenthesized optional type is treated as optional.
