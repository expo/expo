# expo-modules-test-core

## 58.0.3

### Patch Changes

- Add `TestAppContext`, an `AppContext` for native tests whose runtime has its own JavaScript thread. Use it in place of `AppContext.create()` in tests that call async functions. ([#51015](https://github.com/expo/expo/pull/51015) by [@tsapeta](https://github.com/tsapeta))

## 58.0.2

### Patch Changes

- Force-bump all packages, due to migration to changesets. ([#50762](https://github.com/expo/expo/pull/50762) by [@kitten](https://github.com/kitten))
- Updated dependencies. ([#50762](https://github.com/expo/expo/pull/50762))
  - expo-type-information@0.2.1
