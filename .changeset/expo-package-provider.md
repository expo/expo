---
'expo-modules-autolinking': patch
'expo-modules-core': patch
---

On iOS, generated modules providers also list the modules declared with `@ExpoModule` (Expo Modules API 2.0) by npm package, as an `ExpoPackage` for each package, in the new `packages` property. Local modules and inline modules declared with `@ExpoModule` are in the `$local` package. The property is generated only when the installed `expo-modules-core` supports it (58.0.30 or newer). Module registration doesn't change: all modules stay in `getModuleClasses()`.
