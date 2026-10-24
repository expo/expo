# expo-embedding

Experimental CLI for adding Expo to an existing SwiftUI app. iOS native targets stay in a generated Xcode subproject without CocoaPods. The packed CLI includes the starter and native hosts; it does not require an Expo checkout.

iOS requirements: Node 22+, npm (or the app's selected package manager), and Xcode. Ruby, CocoaPods, and the `xcodeproj` gem are not required. This iteration supports iOS 16.4+, Expo SDK 58, React 19.3.0, and React Native 0.88.0. The native build has been tested with Xcode 27.1. Other SDKs and React Native versions are rejected before project generation.

## Set up a new SwiftUI app

1. Create an iOS app in Xcode with the SwiftUI interface. Close the project during setup.
2. Open a terminal in the directory containing the new `.xcodeproj`.
3. Run the CLI using either method below.
4. Add the SwiftUI host wiring shown below, reopen the `.xcodeproj`, select an iOS simulator, and press Run.

The CLI includes its starter files. You do not need to retain or copy an older example app.

For local testing, run the built CLI directly from your new app directory. An app-root npm package or devDependency is not required:

```sh
cd /path/to/YourNewApp
node /path/to/expo/packages/expo-embedding/bin/expo-embedding.js init
```

Alternatively, install the CLI in your app to use the shorter command:

```sh
npm install --save-dev /path/to/expo/packages/expo-embedding
npx expo-embedding init
npx expo-embedding install expo-sqlite
```

If the CLI bundle is missing or you have changed its source, follow the repository setup in [CONTRIBUTING.md](../../CONTRIBUTING.md), then run `pnpm --filter expo-embedding build` from the repository root. Bun is not required.

Run commands from the directory containing the `.xcodeproj` or a subdirectory. A packed copy works the same way; `--expo-repo` is no longer needed or accepted.

`init` creates `expo/package.json`, `index.js`, `App.tsx`, `react-native.config.js`, a small native example module, and Metro config. It registers the starter as `Main`, uses the supported SDK versions for a new manifest, installs the app's declared dependencies, and adds generated paths to `.gitignore`. It preserves an existing Expo app and Metro config. An occupied `expo/` directory without a manifest is rejected without overwriting its files. Inline Swift modules in `expo/Native/` are discovered by Expo autolinking. The example can be renamed or removed. Follow Expo’s inline-module convention: the Swift filename matches its module class name.

Setup remembers the project and target; use `--project App.xcodeproj --target App` to select among multiple candidates. `install` runs Expo's installer inside `expo/`, then refreshes native setup after installation succeeds.

Wire the host into your existing SwiftUI app entry point (keep its actual struct name):

```swift
import SwiftUI
import expoappbrownfield

@main struct MyApp: App {
  @UIApplicationDelegateAdaptor var delegate: ExpoBrownfieldAppDelegate
  @StateObject private var expo = ExpoHost()

  var body: some Scene {
    WindowGroup {
      ExpoScene(name: "Main").frame(height: 240)
        .expoHost(expo)
    }
  }
}
```

You can attach `.expoHost(expo)` to `ContentView()` instead and put the scene inside that view. If you already have an application delegate, subclass `ExpoBrownfieldAppDelegate` and call `super` from overridden lifecycle methods. This class inherits Expo’s delegate implementation; it is not a copied snapshot. The CLI does not rewrite your SwiftUI source files.

Open the app's `.xcodeproj` and press Run. The initial native build takes longer; subsequent builds are incremental. JavaScript is embedded, so Metro is optional. Native targets live in the generated `.expo-source/ExpoEmbedding.xcodeproj`. Xcode uses a generated local codegen helper, independent of the CLI's installation location. Bun is not required. Expo native code builds from the installed packages in `expo/node_modules`; React Native and Hermes use their prebuilt runtime artifacts.

This package is private and has not been published to npm. Local installation makes `npx expo-embedding` available. `npm pack` bundles the TypeScript CLI, the `@bacons/xcode` project parser/serializer, and the native metadata reader into Node JavaScript. It also includes Swift templates and build helpers. Consumers do not need TypeScript, esbuild, Bun, Ruby, or the source checkout. The generator assigns stable identifiers to generated targets and retains the host project's unrelated objects.

## Add dependencies or refresh setup

From the app directory, use the same CLI entry point to install a library:

```sh
node /path/to/expo/packages/expo-embedding/bin/expo-embedding.js install expo-sqlite
```

This runs Expo's installer and refreshes native setup after installation succeeds. With a local devDependency, use `npx expo-embedding install expo-sqlite` instead. Run `init` again after changing native source file lists or deleting `.expo-source`. Existing app files are preserved. After moving the app or changing Node installations, rerun `init` to regenerate machine-local paths. Remove obsolete checkout paths from Metro configs created by older prototypes.

## Dependency ownership

On iOS, `expo/package.json` and its lockfile define the app's dependencies. `init` runs the selected package manager's normal install in `expo/`, so edits to the manifest are applied before native setup. It leaves existing dependency declarations intact. Commit the manifest and lockfile with your app.

The CLI uses `packageManager` when present, otherwise an existing npm, pnpm, Yarn, or Bun lockfile, and defaults to npm for a new app. Conflicting lockfiles require an explicit choice. Use a node_modules-based installation (for Yarn, `nodeLinker: node-modules`). Package managers may use their own internal links; the CLI never links the app to the Expo checkout's dependency tree or substitutes a checkout package for a declared dependency.

The native generator uses Expo autolinking’s resolved package paths, including nested and transitive packages. Codegen, the Swift macro executable, and the bundler also come from the installed dependency tree. The CLI does not substitute checkout packages.

On older setups, `init` moves the shared `node_modules` link (or directory of checkout package links) into `.expo-source/dependencies-backup-*/node_modules` before installing locally. It moves the links themselves and never modifies their shared targets. If an old npm lockfile records checkout links for dependencies declared as registry versions, that lockfile is backed up alongside the links and regenerated from the manifest. Valid lockfiles are retained. If installation fails, fix the reported package-manager error and rerun `init`; the backup remains available. Explicit `file:`, `link:`, and `workspace:` dependencies remain under package-manager control.

## Autolinking and native support

Expo’s autolinking CLI discovers the native graph and generates `ExpoModulesProvider.swift`, including module classes, macro-based modules, application delegate subscribers, and React delegate handlers. The Xcode generator consumes that graph to create source targets in `.expo-source/ExpoEmbedding.xcodeproj`. The host app keeps one subproject dependency and an embedding phase.

Autolinking supplies registration and the resolved package paths. Build instructions now come from two sources:

- Existing SDK 58 recipes handle the Expo/Core/JSI runtime, Expo's bundled modules, SQLite's default build options, and Haptics.
- Other Expo modules use their installed `Package.swift`, then `spm.config.json`, then a supported `.podspec`, in that order. A selected manifest with unsupported features fails setup; the CLI does not silently fall back to a different build description.

For example, Audio uses its shipped `spm.config.json` without an Audio-specific recipe:

```sh
npx expo-embedding install expo-audio
```

This command installs the package and regenerates the subproject in one step. No separate `init` is needed after a successful `install`.

The metadata adapters normalize source files, exclusions, public headers, framework links, native target dependencies, Swift language modes, compiler settings, and copied resources. Dependencies must resolve to another generated target or the provided React Native runtime. Targets build as dynamic frameworks inside the existing subproject. A Swift target's `Bundle.module` accessor resolves resources in that framework. SwiftPM library product aliases are not exposed as separate Xcode products.

The first adapter version is deliberately limited:

- `Package.swift` is evaluated with `swift package dump-package`; Xcode still compiles its source targets. External Swift package dependencies, plugins, macros, binary targets, custom module maps, and resource processing are rejected. Package manifests are evaluated during setup and build-time validation, but there is no native precompile step.
- `spm.config.json` supports local Swift/Objective-C/C++ source targets, including declared shared module names. Custom builds, file remapping, external package downloads, and compiler flag variants are rejected.
- The `.podspec` fallback uses a restricted TypeScript parser without executing Ruby or loading CocoaPods. It accepts literal assignments, arrays, hashes, local metadata variables, platform attributes, dependency declarations, and the common `JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))` expression. File reads are restricted to the installed package's `package.json`. It supports source/header globs, unversioned native dependencies, copied resources, system frameworks/libraries, and selected module/compiler settings. Dynamic build conditions, interpolation, helper calls, subspecs, script phases, vendored dependencies, resource bundles, version constraints, and unknown attributes fail with a diagnostic. Test specification blocks are skipped; unsupported Ruby syntax can still cause rejection. This is not a general Ruby interpreter or a complete CocoaPods replacement.
- Expo's current Apple autolinking still needs a discovery podspec and `expo-module.config.json`, even when `Package.swift` supplies the build instructions. A Swift manifest without a resolved Expo descriptor produces an error. Standalone Swift packages and non-Expo React Native libraries are not yet supported.

`Package.swift` is evaluated with `swift package dump-package`, which executes code shipped by the installed package and is not a sandbox. The JSON and podspec readers do not execute manifest code. Source paths must remain inside the package, and source-tree symlinks are rejected by the adapter. Package-manager links to the package itself are supported.

The CLI checks the full resolved graph, including transitive dependencies. Unsupported metadata, missing dependencies, duplicate target names, and dependency cycles stop setup before either Xcode project is changed. Autolinking exclusions are respected, except the host's required Expo, Core, JSI, and Constants packages cannot be excluded. Worklets, extra native dependencies, and custom LogBox modes remain unsupported.

Config plugins are **not applied** in this iteration. Expo's installer may add a plugin declaration to app config, but the embedding CLI does not apply it to the SwiftUI host. Add permissions, entitlements, URL schemes, capabilities, and other host settings in Xcode. For Audio recording, add the microphone usage description to the host; playback does not require that permission. Plugin-controlled features such as SQLite SQLCipher are not supported by the default source recipe. Dev-client, OTA updates, extensions, and multiple independent React runtimes remain outside the supported scope.

After manual dependency edits or changes to native manifests, resources, or source file lists, rerun `init`. Xcode compares the resolved metadata with the saved plan before codegen and reports stale setup. Inline module registration is refreshed during builds. Repeated setup preserves unchanged generated files and user build phases. On a generation error, the CLI restores the previous project files and generated sources. Dependency installation is separate: an installed package remains installed if native generation fails. This rollback does not cover process termination, runtime downloads, or React Native's intermediate codegen outputs.

## Xcode configurations and CI

Debug and Release work by default. Map custom configurations explicitly in a committed `expo-embedding.json` next to the host project:

```json
{
  "project": "MyApp.xcodeproj",
  "target": "MyApp",
  "configurations": {
    "Development": "Debug",
    "Staging": "Release"
  }
}
```

The generated subproject uses the host’s configuration names. The mapping selects runtime binaries, Swift/C debug flags, and JavaScript bundling mode. An unmapped configuration stops setup with an actionable error. Only one selected application target is supported per generated integration.

For CI, commit the app sources, host project, `expo/package.json`, its lockfile, and optional `expo-embedding.json`. Pin the CLI version as a local devDependency. Regenerate `.expo-source` on each checkout:

```sh
npm ci
npx expo-embedding init --frozen-lockfile
xcodebuild -project MyApp.xcodeproj -scheme MyApp \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/MyApp.xcarchive archive
```

`--frozen-lockfile` uses `npm ci` or the selected package manager’s frozen install. Missing or stale lockfiles fail instead of being updated. Legacy dependency links must be migrated locally before a frozen install. npm has been exercised end to end; other package managers still need equivalent native CI coverage.

The bundle entry follows `expo/package.json` through Expo’s entry resolver. Debug and Release both embed JavaScript and assets. Hermes source maps are written outside the app to `.expo-source/sourcemaps/<configuration>-<platform>/main.jsbundle.map`; retain them alongside the matching archive for crash symbolication. `SOURCEMAP_FILE` can override this location. Source-built framework dSYMs come from Xcode. Supplying symbols for the prebuilt React Native/Hermes binaries remains a release requirement.

## Test plan

- Run `npm test` and the TypeScript check. Tests cover scaffolding, package-manager selection, migration, frozen installs, native graph validation, metadata translation and rejection, podspec parsing, project attachment, stable identifiers, and generation rollback.
- Run `npm pack`, install the tarball in a fresh SwiftUI project, and run `npx expo-embedding init` without an Expo checkout, Bun, Ruby, or CocoaPods. Verify `expo/node_modules` is an app-owned installation. Repeat setup and compare project files; unrelated targets and user build phases must remain intact.
- Run setup twice and compare both project files and the lockfile. Verify unrelated targets and build phases survive. Rename/remove an inline module and verify the generated provider follows it.
- Run `npx expo-embedding install expo-audio` and verify native setup completes automatically. Add local Expo module fixtures for `Package.swift` and `.podspec`; verify target dependencies, language settings, resource loading, and registration.
- Add and remove SQLite, Haptics, or a metadata module through the app manifest and setup. Test a transitive supported module and an unsupported Expo or React Native dependency. Rejected native graphs must not change either project.
- Verify an unknown build configuration fails before installation; map `Staging` to `Release` and archive it with `xcodebuild`.
- Run `init --frozen-lockfile` with a valid lockfile, then with manifest/lockfile drift. Verify the latter fails without rewriting the lockfile or Xcode projects.
- Change a native manifest after setup, including an unsupported build feature; verify stale setup or unsupported metadata errors preserve both projects. Remove a metadata dependency and rerun setup; verify its framework and resources disappear.
- Change the native graph after setup and build directly in Xcode. Verify the build asks for `init` instead of using stale targets.
- Build Debug for an iOS simulator. With Metro stopped, launch a SwiftUI scene, increment the counter, query SQLite, call Haptics, play a bundled Audio clip, read resources from both metadata fixtures, and resolve the bundled Font, KeepAwake, Fetch, and inline native modules.
- Archive Release or its mapped configuration for an iOS device. Inspect embedded frameworks, JavaScript, Constants resources, privacy manifests, source maps, and dSYMs. Validate signing on a physical device and TestFlight separately.

The package remains experimental. Signed-device, store-distribution, lifecycle stress, runtime symbol, and package-manager coverage remain release requirements.
