---
'expo-modules-autolinking': patch
'expo-modules-core': patch
---

Generated modules providers on iOS return the native modules of each npm package as an `ExpoPackage`, keyed by the package name, in the `packages` property. Modules from the app's `modules` directory and inline modules are in the `$local` package, which can't be the name of an npm package. `ModulesProvider.getModuleClasses()` returns the modules of all packages by default. Packages are registered in the order of their names, and the `$local` package last, so the app's own modules win over modules with the same name.
