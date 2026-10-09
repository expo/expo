# windows-tester

A react-native-windows app that checks `expo-modules-jsi` inside a real app on Windows. It is a spike, not an Expo app: it doesn't use `expo` or the real `expo-modules-core` yet.

- `swift/` is a SwiftPM package that builds `ExpoWindowsTester.dll`. It uses `ExpoModulesJSI` to install `globalThis.expoTester` with a few synchronous and asynchronous functions, and `globalThis.windowsTesterModule`, a module written with the `@ExpoModule` and `@JS` macros.
- `swift/Sources/ExpoModulesCore` is a stand-in for `expo-modules-core`, which doesn't build on Windows yet. It has only the declarations that the macro expansions refer to. The macro plugin comes from `EXPO_MODULES_MACROS_PLUGIN`, which the workflow builds from the `expo-modules-macros` repository.
- `windows/` is the `cpp-app` template from react-native-windows 0.84. `ExpoWindowsTesterModule.h` gets the app's `jsi::Runtime` and calls the Swift DLL through a C function. The MSBuild project builds the Swift package before the C++ sources.
- `App.tsx` calls the functions and reports the results. When `EXPO_WINDOWS_TESTER_RESULT` is set, the app writes the results to that file and quits.

react-native-windows needs an older `react-native` than the rest of the repo, so this app is not part of the pnpm workspace. Install its dependencies with `npm ci` in this directory. The `Windows tester` workflow shows the full build, including the headers that `ExpoModulesJSI` needs (`JSI_INCLUDE_DIR`).
