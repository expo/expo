---
'expo-modules-autolinking': patch
'expo-modules-core': patch
---

On iOS, generated modules providers return the modules declared with `@ExpoModule` (Expo Modules API 2.0) grouped by npm package, as an `ExpoPackage` for each package, in the `packages` property. Other modules stay in `getModuleClasses()`. Local modules and inline modules declared with `@ExpoModule` are in the `$local` package, which can't be the name of an npm package. Packages are registered after the modules from `getModuleClasses()`, in the order of their names, and the `$local` package last. So a module declared with `@ExpoModule` wins over another module with the same name, also over a local module that doesn't use the macro.
