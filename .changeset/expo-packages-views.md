---
'expo-modules-core': patch
---

On iOS, `expo.packages` also exports the `@ExpoView` views that the modules provider lists in `ExpoPackage.views`, as React components next to the modules and shared object classes of the package, for example `expo.packages['expo-blur'].ExpoBlurView`. They are registered in React Native without a module.
