# create-expo-module

## 58.0.2

### Patch Changes

- Stop creating local modules, and adding platforms to them, in projects using Expo SDK 55 or earlier. The error suggests `npx create-expo-module@sdk-55 --local` instead. Pass `--ignore-compatibility-check` to use the current template anyway. ([#50181](https://github.com/expo/expo/pull/50181) by [@behenate](https://github.com/behenate))
- Roll back files written by module creation or `add-platform-support` when generation fails, and remove downloaded template directories. An invalid `--source` path is now reported without a stack trace. ([#50182](https://github.com/expo/expo/pull/50182) by [@behenate](https://github.com/behenate))
- Fix absolute destinations for standalone modules being created inside the current directory. Standalone modules now get their podspec metadata from `package.json`, and Android uses the `--module-version` value. ([#50184](https://github.com/expo/expo/pull/50184) by [@behenate](https://github.com/behenate))

## 58.0.1

### Patch Changes

- Force-bump all packages, due to migration to changesets. ([#50762](https://github.com/expo/expo/pull/50762) by [@kitten](https://github.com/kitten))
