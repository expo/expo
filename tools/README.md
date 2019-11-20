# Expo Tools

## Versioning Android

1. Run `gulp android-add-rn-version --abi=XX.X.X` in `tools`.
2. Add the new `expoview-abiXX_X_X` project as a dependency of `android/app/build.gradle`.
3. Open `android/versioned-abis/expoview-abiXX_X_X/build.gradle` and add missing `expo-payments-stripe` and `expo-constants` dependencies.
4. Remove `abiXX_X_X/expo/modules/print/PrintDocumentAdapter*Callback.java`.
5. Fix `abiXX_X_X.….R` (compilation will error) references and change them to `abiXX_X_X.host.exp.exponent.R`.
6. Open `VersionedUtils.java` and change two last arguments of `ExponentPackage` constructor to `null`s.
7. Open `PayFlow.java` in `abiXX_X_X` and fix `BuildConfig` reference (import `abiXX_X_X.host.exp.….BuildConfig`).
8. Open `ExponentPackage.java` in `abiXX_X_X` and remove offending line with `ExponentKernelModuleProvider` in `createNativeModules`.
