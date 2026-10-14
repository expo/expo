# create-expo-module

## 58.0.3

### Patch Changes

- Fixed the example app bundling a second copy of `react-native` and `expo` from the module's dependencies, which crashed it with `TypeError: property is not writable` when the module was created with pnpm. The example app now enables `experiments.autolinkingModuleResolution`. ([#51267](https://github.com/expo/expo/pull/51267) by [@behenate](https://github.com/behenate))
- Fix creating a standalone module with pnpm 11 and later failing with `ERR_PNPM_IGNORED_BUILDS`. When pnpm 11 or later is used and the module isn't a project of an existing pnpm workspace, the module and its example app now get their own `pnpm-workspace.yaml`, which skips the unneeded install scripts of Jest's dependencies. Inside an existing pnpm workspace that doesn't allow these scripts, `create-expo-module` now explains how to allow them. The example app's dependencies are now installed once, after the template files are in place. ([#51249](https://github.com/expo/expo/pull/51249) by [@behenate](https://github.com/behenate))

## 58.0.2

### Patch Changes

- Stop creating local modules, and adding platforms to them, in projects using Expo SDK 55 or earlier. The error suggests `npx create-expo-module@sdk-55 --local` instead. Pass `--ignore-compatibility-check` to use the current template anyway. ([#50181](https://github.com/expo/expo/pull/50181) by [@behenate](https://github.com/behenate))
- Roll back files written by module creation or `add-platform-support` when generation fails, and remove downloaded template directories. An invalid `--source` path is now reported without a stack trace. ([#50182](https://github.com/expo/expo/pull/50182) by [@behenate](https://github.com/behenate))
- Fix absolute destinations for standalone modules being created inside the current directory. Standalone modules now get their podspec metadata from `package.json`, and Android uses the `--module-version` value. ([#50184](https://github.com/expo/expo/pull/50184) by [@behenate](https://github.com/behenate))

## 58.0.1

### Patch Changes

- Force-bump all packages, due to migration to changesets. ([#50762](https://github.com/expo/expo/pull/50762) by [@kitten](https://github.com/kitten))
