# expo-module-template

## 58.0.6

### Patch Changes

- Fix absolute destinations for standalone modules being created inside the current directory. Standalone modules now get their podspec metadata from `package.json`, and Android uses the `--module-version` value. ([#50184](https://github.com/expo/expo/pull/50184) by [@behenate](https://github.com/behenate))
- Import `SharedObject` and `useReleasingSharedObject` from `expo` instead of `expo-modules-core`, so standalone modules that use `SharedObject` build when installed outside an Expo app. ([#50183](https://github.com/expo/expo/pull/50183) by [@behenate](https://github.com/behenate))

## 58.0.5

### Patch Changes

- Force-bump all packages, due to migration to changesets. ([#50762](https://github.com/expo/expo/pull/50762) by [@kitten](https://github.com/kitten))
