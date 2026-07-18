# expo-modules-plugin

This project contains two Gradle plugins that are used to inject the necessary dependencies and configurations into an Android project that uses Expo modules. It also provides a shared project that contains common code for both plugins.

### `expo-autolinking-settings-plugin`

The settings plugin is an entry point for our setup. It should be applied to the root `settings.gradle` file of the application. 

Responsibilities:
- Add all modules into the project hierarchy; modules won't be added to the dependency graph. The `expo` package will depend on them rather than adding them directly to the app project.
- Add extra Maven repositories.
- Link and apply custom plugins.
- Expose autolinking configuration.

### `expo-autolinking-plugin`

This plugin shouldn't be applied directly by the end user. It'll be applied by the `expo` package.

Responsibilities:
- Ensure the dependencies are evaluated before the `expo` package.
- Add previously linked modules to the dependency graph.
- Create a task that will generate the package list file.

### `expo-root-project`

This plugin should be applied to the root `build.gradle` file of the application (the project templates already do this). It configures defaults that apply to the app and all of its modules.

Responsibilities:
- Define default versions shared across all projects (`compileSdkVersion`, `minSdkVersion`, `targetSdkVersion`, `buildToolsVersion`, `ndkVersion`, `kotlinVersion`, `kspVersion`), sourced from React Native's version catalog when available.
- Skip lint-vital analysis for autolinked native modules unless linting is enabled with the `expo.android.enableLint` Gradle property or the `EXPO_ANDROID_ENABLE_LINT` environment variable.
- Override the CMake version for every module when the `android.cmakeVersion` Gradle property is set.
- Set `CMAKE_OBJECT_PATH_MAX=1024` for every module that builds native code with CMake. CMake limits the length of object file paths (250 characters on Windows, 1000 elsewhere) and fails the build when paths exceed the limit, which commonly happens on Windows with deeply nested project structures such as pnpm monorepos.

The `expo.android.cmakeObjectPathMax` Gradle property controls the `CMAKE_OBJECT_PATH_MAX` value:

| Value | Behavior |
| --- | --- |
| Unset or empty | Uses the default of `1024` |
| Integer greater than or equal to `128` (CMake's minimum) | Uses the given value |
| `0` | Opts out; keeps CMake's platform defaults |

Set the property in the app's `gradle.properties` file, for example `expo.android.cmakeObjectPathMax=2048`, or pass it on the command line with `-Pexpo.android.cmakeObjectPathMax=2048`. A module that passes its own `-DCMAKE_OBJECT_PATH_MAX` argument in `externalNativeBuild.cmake.arguments` overrides the value for that module, since its argument comes later on the CMake command line.

The limit is CMake's generate-time prediction of the longest object file path the tools it generates build files for (Ninja, the compiler, the archiver) can handle. CMake can't know their real limits, so it uses a hardcoded conservative guess and fails preemptively, even when those tools support longer paths. Raising `CMAKE_OBJECT_PATH_MAX` removes only that guess; when the tools genuinely can't handle long paths on Windows (the Android Gradle plugin's default CMake 3.22.1 bundles a version of Ninja without long-path support), set the `android.cmakeVersion` Gradle property to select a newer CMake whose Ninja handles long paths.

### `shared`

This project contains common code for both plugins.
