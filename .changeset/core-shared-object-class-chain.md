---
'expo-modules-core': patch
---

[iOS] Update `expo-modules-macros` to 0.41.0. The JavaScript class of a `@SharedObject` class now extends the JavaScript class of its nearest superclass with the macro, so its instances are `instanceof` that class, and the members of the superclass are on the prototype of the superclass only. A native object of a `@SharedObject` class gets the JavaScript class of its own type, also when the function declares a superclass as the return type. JavaScript can no longer redefine the `@JS` property accessors of a `@SharedObject` class that isn't `final`.
