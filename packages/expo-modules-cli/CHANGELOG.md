# expo-modules-cli

## 0.4.0

### Minor Changes

- Add the `swift:expand` and `swift:check` commands. `swift:expand` prints the code that the Expo Modules macros generate for Swift sources, without a build. `swift:check` prints only the macro errors and warnings, and exits with code 1 when there is an error. Both need `expo-modules-macros` 0.27.0. ([#52413](https://github.com/expo/expo/pull/52413) by [@tsapeta](https://github.com/tsapeta))

### Patch Changes

- `generate-types` now renders Swift tuples: an unlabeled tuple as a TypeScript tuple, such as `[number, string]`, and a labeled tuple as an object type, such as `{ x: number; y: number }`. It reads the `scan-exports` schema version 10 of `expo-modules-macros` 0.27.0. ([#52390](https://github.com/expo/expo/pull/52390) by [@tsapeta](https://github.com/tsapeta))

## 0.3.3

### Patch Changes

- Read the `scan-exports` schema of `expo-modules-macros` 0.23.1, which `expo-modules-core` depends on. ([#52200](https://github.com/expo/expo/pull/52200) by [@tsapeta](https://github.com/tsapeta))

## 0.3.2

### Patch Changes

- `generate-types` now keeps the doc comments written in the generated file. Each comment stays above the declaration or member with the same TypeScript name. The command warns when it drops a comment because its declaration is gone, and prints the text of that comment. It also warns when a declaration with a comment changed. ([#51782](https://github.com/expo/expo/pull/51782) by [@tsapeta](https://github.com/tsapeta))

## 0.3.1

### Patch Changes

- Parse command-line arguments with `arg`, the parser that `@expo/cli` uses, instead of `commander`. `expo` already installs `arg`, so the CLI no longer adds its own parser to the project. The short flag for `--version` is now `-v`, as in `npx expo`, and the `help` command is replaced by `--help`. ([#51771](https://github.com/expo/expo/pull/51771) by [@tsapeta](https://github.com/tsapeta))

## 0.3.0

### Minor Changes

- Scan with the `expo-modules-macros` version that `expo-modules-core` depends on, found through the `expo` package of the scanned package, instead of a copy of its own. `expo` is now a peer dependency. The CLI reads the `scan-exports` schema of `expo-modules-macros` 0.20.0, and declares enums, records, and unions nested in other types under their own names. ([#51548](https://github.com/expo/expo/pull/51548) by [@tsapeta](https://github.com/tsapeta))

## 0.2.2

### Patch Changes

- [iOS] Update `expo-modules-macros` to 0.16.0, which supports closure arguments in `@JS` functions and initializers. ([#51037](https://github.com/expo/expo/pull/51037) by [@tsapeta](https://github.com/tsapeta))

## 0.2.1

### Patch Changes

- [iOS] Update `expo-modules-macros` to 0.15.0, which generates only the unowned decode for `@Union` and skips cases whose `decodableKinds` can't match. ([#50894](https://github.com/expo/expo/pull/50894) by [@tsapeta](https://github.com/tsapeta))

## 0.2.0

### Minor Changes

- Add the `expo-modules-cli` package with the `generate-types` command, which generates a TypeScript file for the native API an Expo module exports to JavaScript from its Swift sources. ([#50233](https://github.com/expo/expo/pull/50233) by [@tsapeta](https://github.com/tsapeta))
