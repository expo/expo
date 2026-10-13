# expo-modules-cli

## 0.2.2

### Patch Changes

- [iOS] Update `expo-modules-macros` to 0.16.0, which supports closure arguments in `@JS` functions and initializers. ([#51037](https://github.com/expo/expo/pull/51037) by [@tsapeta](https://github.com/tsapeta))

## 0.2.1

### Patch Changes

- [iOS] Update `expo-modules-macros` to 0.15.0, which generates only the unowned decode for `@Union` and skips cases whose `decodableKinds` can't match. ([#50894](https://github.com/expo/expo/pull/50894) by [@tsapeta](https://github.com/tsapeta))

## 0.2.0

### Minor Changes

- Add the `expo-modules-cli` package with the `generate-types` command, which generates a TypeScript file for the native API an Expo module exports to JavaScript from its Swift sources. ([#50233](https://github.com/expo/expo/pull/50233) by [@tsapeta](https://github.com/tsapeta))
