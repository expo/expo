# expo-modules-test-core

## 58.0.7

### Patch Changes

- [iOS] Fix app contexts that own their runtime, such as the ones in unit tests, never being deallocated. ([#53094](https://github.com/expo/expo/pull/53094) by [@tsapeta](https://github.com/tsapeta))

## 58.0.6

### Patch Changes

- Remove the unused glob dependency and move @types/node to devDependencies. ([#52761](https://github.com/expo/expo/pull/52761) by [@kitten](https://github.com/kitten))

## 58.0.5

### Patch Changes

- [iOS] Drain the microtask queue after each task on the JavaScript thread of `TestAppContext`, like React Native does. Promise callbacks now run after the synchronous code, and long `await` loops no longer overflow the native stack. ([#52254](https://github.com/expo/expo/pull/52254) by [@tsapeta](https://github.com/tsapeta))

## 58.0.4

### Patch Changes

- [iOS] Fix native tests that use `TestAppContext` crashing intermittently with "closure argument was escaped in withoutActuallyEscaping block". `TestJavaScriptThread.runAndWait` now drops its reference to the operation before it wakes the caller. ([#51223](https://github.com/expo/expo/pull/51223) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## 58.0.3

### Patch Changes

- Add `TestAppContext`, an `AppContext` for native tests whose runtime has its own JavaScript thread. Use it in place of `AppContext.create()` in tests that call async functions. ([#51015](https://github.com/expo/expo/pull/51015) by [@tsapeta](https://github.com/tsapeta))

## 58.0.2

### Patch Changes

- Force-bump all packages, due to migration to changesets. ([#50762](https://github.com/expo/expo/pull/50762) by [@kitten](https://github.com/kitten))
- Updated dependencies. ([#50762](https://github.com/expo/expo/pull/50762))
  - expo-type-information@0.2.1
