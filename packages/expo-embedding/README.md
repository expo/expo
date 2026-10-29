# expo-embedding

Experimental CLI for adding Expo to an existing SwiftUI or Android Compose app. iOS native targets stay in a generated Xcode subproject without CocoaPods. Android uses a separate Gradle library module. The packed CLI includes the starter and native hosts; it does not require an Expo checkout.

iOS requirements: Node 22+, npm (or the app's selected package manager), and Xcode. Ruby, CocoaPods, and the `xcodeproj` gem are not required. This iteration supports iOS 16.4+, Expo SDK 58, React 19.3.0, and React Native 0.88.0. The native build has been tested with Xcode 27.1. Other SDKs and React Native versions are rejected before project generation. Android requirements and setup are below.

## Set up a new SwiftUI app

1. Create an iOS app in Xcode with the SwiftUI interface. Close the project during setup.
2. Open a terminal in the directory containing the new `.xcodeproj`.
3. Run the CLI using either method below.
4. Add the SwiftUI host wiring shown below, reopen the `.xcodeproj`, select an iOS simulator, and press Run.

The CLI includes its starter files. You do not need to retain or copy an older example app.

From the native app directory, run:

```sh
npx expo-embedding init
# Or with Bun:
bunx expo-embedding init
```

An app-root npm package or devDependency is not required. Pin a CLI version for reproducible setup. For local CLI development, follow [CONTRIBUTING.md](../../CONTRIBUTING.md), run `pnpm --filter expo-embedding build`, then use `node /path/to/expo/packages/expo-embedding/bin/expo-embedding.js init` from the app directory.

## Integrate with a coding agent

Ask your agent to run `npx expo-embedding init` (or `bunx expo-embedding init`) in the host app and follow the printed integration guide. After every successful setup, the command prints usage, the selected project and target, native source wiring instructions, and verification steps. No separate agent command or detection is needed.

The guide tells the agent to preserve the existing UI and delegate, complete the source wiring, inspect the resulting diff, and verify the app. Setup generates the Xcode integration; it does not rewrite SwiftUI source files. Failed setup reports the error without printing the completion guide.

## CLI setup behavior

Run commands from the directory containing the `.xcodeproj` or a subdirectory. A packed copy works the same way; `--expo-repo` is no longer needed or accepted.

`init` creates `expo/package.json`, `index.js`, `App.tsx`, `react-native.config.js`, a small native example module, and Metro config. It registers the starter as `Main`, uses the supported SDK versions for a new manifest, installs the app's declared dependencies, and adds generated paths to `.gitignore`. It preserves an existing Expo app and Metro config. An occupied `expo/` directory without a manifest is rejected without overwriting its files. Inline Swift modules in `expo/Native/` are discovered by Expo autolinking. The example can be renamed or removed. Follow Expo’s inline-module convention: the Swift filename matches its module class name.

Setup remembers the project and target; use `--project App.xcodeproj --target App` to select among projects in the integration root. Nested or external project paths are rejected before setup changes files. Run from the directory containing the Xcode project. `install` runs Expo's installer inside `expo/`, then refreshes native setup after installation succeeds.

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

`ExpoHost()` defaults to `.automatic`: Debug checks Metro asynchronously when the first scene mounts, and uses the embedded bundle if the server is unavailable, belongs to another project, or does not respond within one second. Release always uses the embedded bundle without a network check. Start `npx expo start` (or `bunx expo start`) in `expo/`, then relaunch the app to develop with Fast Refresh. All scenes share the selected bundle for that host. Starting or stopping Metro does not replace a running scene or reset its state.

Use `ExpoHost(bundleSource: .embedded)` to force offline behavior, including in Debug. `.developmentServer` requires this project's Metro server and reports an error when it cannot connect. Automatic fallback covers server discovery; compilation and runtime errors from a selected Metro bundle remain visible. On a device, allow local network access and ensure the development machine is reachable. The resolver uses React Native's saved server address, the build machine's address for device builds, or localhost for the simulator, with the host's `RCTMetroPort` override when present.

`npm pack` bundles the TypeScript CLI, the `@bacons/xcode` project parser/serializer, and the native metadata reader into Node JavaScript. It also includes Swift templates and build helpers. Consumers do not need TypeScript, esbuild, Bun, Ruby, or the source checkout. The generator assigns stable identifiers to generated targets and retains the host project's unrelated objects.

## Add dependencies or refresh setup

From the app directory, use the same CLI entry point to install a library:

```sh
npx expo-embedding install expo-sqlite
# Or with Bun:
bunx expo-embedding install expo-sqlite
```

This runs Expo's installer and refreshes native setup after installation succeeds. Run `init` again after changing native source file lists or deleting `.expo-source`. Existing app files are preserved. After moving the app or changing Node installations, rerun `init` to regenerate machine-local paths. Remove obsolete checkout paths from Metro configs created by older prototypes.

## Dependency ownership

On iOS, `expo/package.json` and its lockfile define the app's dependencies. `init` runs the selected package manager's normal install in `expo/`, so edits to the manifest are applied before native setup. It leaves existing dependency declarations intact. Commit the manifest and lockfile with your app. Android uses the npm workspace described below, with a root lockfile.

The CLI uses `packageManager` when present, otherwise an existing npm, pnpm, Yarn, or Bun lockfile, and defaults to npm for a new app. Conflicting lockfiles require an explicit choice. Use a node_modules-based installation (for Yarn, `nodeLinker: node-modules`). Package managers may use their own internal links; the CLI never links the app to the Expo checkout's dependency tree or substitutes a checkout package for a declared dependency.

The native generator uses Expo autolinking’s resolved package paths, including nested and transitive packages. Codegen, the Swift macro executable, and the bundler also come from the installed dependency tree. The CLI does not substitute checkout packages.

On older setups, `init` moves the shared `node_modules` link (or directory of checkout package links) into `.expo-source/dependencies-backup-*/node_modules` before installing locally. It moves the links themselves and never modifies their shared targets. If an old npm lockfile records checkout links for dependencies declared as registry versions, that lockfile is backed up alongside the links and regenerated from the manifest. Valid lockfiles are retained. If installation fails, fix the reported package-manager error and rerun `init`; the backup remains available. Explicit `file:`, `link:`, and `workspace:` dependencies remain under package-manager control.

## Autolinking and native support

This section describes the iOS generator. Android uses the packages' existing Gradle build definitions, as described below.

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

Init preserves the host target's initial `HEADER_SEARCH_PATHS`, `FRAMEWORK_SEARCH_PATHS`, `LD_RUNPATH_SEARCH_PATHS`, and `OTHER_LDFLAGS` in their `[sdk=iphone*]` settings. After init, make further iOS changes in those conditional settings in Xcode, rather than only in the normal target value. Xcode gives the conditional value precedence; `$(inherited)` reads the project-level value. Setup adds `@executable_path/Frameworks` to the runtime search paths so the app can load its embedded frameworks. Rerunning init preserves your conditional settings instead of merging normal values that you may have intentionally overridden.

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

## Android Compose integration

The first Android iteration supports an existing Gradle project with a standard `:app` application module. Use Node 22+, npm, JDK 17 or newer, and an Android SDK compatible with compile SDK 37. Tested toolchains include AGP 9.2.1 with Gradle 9.4.1 and AGP 9.4.1 with Gradle 9.6.0, using the Kotlin Compose plugin 2.2.10 and AGP's built-in Kotlin. The minimum Android API is 24. Other toolchain combinations, product flavors, multiple application modules, and existing React Native integrations are not validated.

Create an Empty Activity Compose project in Android Studio. From its Gradle root, run:

```sh
npx expo-embedding init --platform android
# Or with Bun:
bunx expo-embedding init --platform android
```

For local CLI development, use `node /path/to/expo/packages/expo-embedding/bin/expo-embedding.js init --platform android` after building the package. Installing it as a devDependency is optional. Android is detected automatically when the root has Gradle settings and no Xcode project.

Before installing dependencies, `init` inspects the launch Activity in `app/src/main/AndroidManifest.xml`. The current embedding delegate requires `AppCompatActivity`. For a standard Kotlin Compose Activity that directly extends `ComponentActivity`, setup previews the superclass/import and XML theme changes and asks before applying them. AppCompat is already exposed by the generated library. Your Compose content, callbacks and `MaterialTheme` remain intact. An Activity that already derives from AppCompat is preserved.

If the manifest has no Application name, setup also previews creation of an app-owned `MainApplication.kt` and adds its fully qualified name to the manifest. It uses `Application(), ReactApplication by expo` and forwards the two Application lifecycle callbacks to `ExpoApplicationDelegate`. An explicit `android.app.Application` declaration is handled the same way. Existing manifest attributes are retained, and an unregistered class with the same name is never overwritten.

For an existing Kotlin Application, setup can add composition to a simple class declaration while keeping its superclass and other interfaces. It forwards lifecycle callbacks immediately after their direct `super` calls and preserves the surrounding code. Custom constructors, conditional `super` calls, member/import collisions, Java Applications, unresolved manifest placeholders and existing React Native integrations require manual wiring. An Application already wired with the documented composition pattern is preserved.

For an agent, first run `npx expo-embedding skill --platform android` to inspect the proposed host changes and complete integration guide. `--json` includes exact before/after contents and relative paths. It shares the same planner as setup and does not prompt or write files. Its text preview is for review, not an apply-ready patch; generated Gradle changes and manual Activity delegate/scene wiring are described in the guide.

For an agent or CI run, explicitly authorize the combined Application and Activity changes:

```sh
npx expo-embedding init --platform android --configure-host
```

`CI=1` disables prompts; it does not authorize host edits. Without explicit authorization, noninteractive setup fails when host changes are needed, before installing dependencies or editing the host. An interactive run shows one combined preview and asks once. A decline leaves the host untouched. Commit the configured Application, manifest, Activity and theme, then subsequent runs need no flag. `install` performs the same checks and accepts the same flags. `--migrate-activity=appcompat` remains available to authorize only Activity/theme changes; it does not authorize creating or changing an Application.

Automatic migration supports one launch Activity, literal manifest/namespace declarations, and local XML styles whose explicit parent is `android:Theme.Material.Light.NoActionBar` or `android:Theme.Material.NoActionBar`. It updates each `values*` variant and preserves style items. Existing AppCompat, Material Components and Material 3 XML parents are retained. Custom theme inheritance, dynamic `setTheme` calls, launcher aliases, source-set overrides and custom Activity bases requiring changes need manual integration. Locally defined bases that already derive from AppCompat are recognized. The flag does not force edits to unsupported structures.

Approved host edits are applied together with native generation and restored if generation fails. If a file changes after the preview, setup stops instead of overwriting it. Dependency installation remains separate from this rollback. After migration, build with `./gradlew :app:assembleDebug` and launch the app to verify its XML theme; compilation alone cannot detect every AppCompat theme error. ComponentActivity support in Expo Core alone is not enough to skip migration while the embedding delegate still requires AppCompat.

`init` creates an npm workspace containing `expo/`. JS dependencies remain declared in `expo/package.json`; the root `package-lock.json` controls installation. Expo's Gradle helpers require React Native to resolve from the Gradle root, so npm hoists dependencies into the host's own `node_modules`. No dependency-tree symlink to an Expo checkout is created. Existing root scripts and dependencies are preserved. A conflicting root dependency version or unsupported package manager produces an error. Commit both manifests and the root lockfile.

The CLI adds managed blocks to the settings, root build script, app build script, and `gradle.properties`. Most integration code lives in `.expo-source/android`, exposed as `:expoEmbedding`. The React Native Gradle plugin stays on `:app` because its codegen, JS bundling, resources, and application entry point must participate in the final app build. The app's namespace and source files remain yours.

Application and Activity integration both use composition. After setup, follow `.expo-source/android/INTEGRATION.md` in your host project; it contains the complete Kotlin wiring and manifest/theme steps. The same guide is available in [Android integration](templates/android/INTEGRATION.md).

```kotlin
import android.app.Application
import android.content.res.Configuration
import com.facebook.react.ReactApplication
import expo.embedding.ExpoApplicationDelegate

class MainApplication(
  val expo: ExpoApplicationDelegate = ExpoApplicationDelegate()
) : Application(), ReactApplication by expo {
  override fun onCreate() {
    super.onCreate()
    expo.onCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    expo.onConfigurationChanged(newConfig)
  }
}
```

Set `android:name=".MainApplication"` on the existing manifest `<application>` element.

Keep your existing Activity superclass if it derives from `AppCompatActivity`. A plain Compose `ComponentActivity` must change to `AppCompatActivity`: Expo's native activity-result infrastructure requires it. Use an AppCompat-derived XML theme, such as `Theme.AppCompat.DayNight.NoActionBar`. Your Compose `MaterialTheme` can remain unchanged.

```kotlin
import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import expo.embedding.ExpoActivityDelegate
import expo.embedding.ExpoScene

class MainActivity : AppCompatActivity(), PermissionAwareActivity {
  private val expo = ExpoActivityDelegate()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    expo.attach(this, (application as MainApplication).expo.host)
    setContent {
      ExpoScene(expo.host, "Main", Modifier.fillMaxSize())
    }
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    expo.onWindowFocusChanged(hasFocus)
  }

  @Deprecated("Forwarded for native modules using the legacy Activity result API")
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    expo.onActivityResult(requestCode, resultCode, data)
  }

  override fun requestPermissions(permissions: Array<String>, requestCode: Int, listener: PermissionListener?) {
    expo.requestPermissions(permissions, requestCode, listener)
  }

  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    expo.onRequestPermissionsResult(requestCode, permissions, grantResults)
  }
}
```

Attach once after `super.onCreate()` and before `setContent()`. Use one delegate per Activity instance. Resume, pause, destruction, back navigation, new intents, and configuration changes are observed automatically; do not forward them again. Destruction unregisters the listeners and releases the delegate's Activity reference. Reattaching the same Activity and host is harmless; binding another host or reusing a destroyed delegate is rejected.

`PermissionAwareActivity` lets React Native find the real Activity for permission requests. Implement its three-argument `requestPermissions` method as shown; inherited Android methods provide the permission checks. Keep the three result/focus overrides above. Existing overrides must still call `super` so AndroidX listeners receive events.

The application owns one host. Multiple named scenes share that host; removing a composable stops its React surface. Register another component with `AppRegistry.registerComponent('Details', () => Details)` and display `ExpoScene(expo.host, "Details", ...)`. `initialProps` accepts a `Bundle`; recomposition updates the props while preserving React component state. Treat the Bundle as immutable: keep the same instance while props are unchanged, and supply a new Bundle from Compose state when props change. The initial render and recompositions with the same Bundle do not resend props. Changing the host or scene name remounts the surface. Only one React runtime and one active Expo Activity attachment are supported in this iteration.

For an earlier prototype using `ExpoEmbeddingApplication`, `createExpoHost`, or the `ExpoActivity` superclass, migrate to the delegates above and rerun `init`. Setup removes obsolete generated superclass sources. `--configure-host` can create/register or wire the Application and migrate a standard Activity superclass/theme. Activity delegate attachment and callbacks remain a manual step. Keep your existing Application superclass and any Activity superclass derived from `AppCompatActivity`.

Open the existing project in Android Studio, sync Gradle, and Run. Command-line builds use the normal wrapper:

```sh
./gradlew :app:assembleDebug
./gradlew :app:assembleRelease
npx expo-embedding install expo-sqlite expo-audio expo-video
```

`install` runs `expo install` and refreshes the Gradle integration automatically. Expo autolinking discovers packages and registers their modules; Gradle builds their own `android/build.gradle` projects. Android does not use the iOS build recipes, Swift manifests, or podspec parser. Setup enables Expo's `android.buildFromSource: [".*"]` autolinking option in `expo/package.json`. React Native and Hermes still use their normal Maven runtime artifacts.

Both Debug and Release contain a Hermes bundle and assets. No running Metro server is required. For Metro development, construct the delegate with `ExpoApplicationDelegate(bundleSource = if (BuildConfig.DEBUG) ExpoHost.BundleSource.DevelopmentServer else ExpoHost.BundleSource.Embedded)`, start `npx expo start` in `expo/`, and configure device connectivity and debug-only cleartext HTTP access in your host. Release rejects the development-server mode. Dev-client, OTA updates, and config-plugin application are not included. Apply permissions, intent filters, services, and other plugin-controlled native settings yourself.

Two Gradle compatibility choices are explicit: `android.newDsl=false` enables the legacy AGP API still used by Expo Constants, and an existing `FAIL_ON_PROJECT_REPOS` becomes `PREFER_SETTINGS`. With settings repositories authoritative, add any additional Maven repositories required by third-party modules to `dependencyResolutionManagement.repositories`. AGP 10 is outside this prototype's supported scope. Gradle helpers also invoke `node` through PATH: make Node available to Android Studio's Gradle process.

For CI, run `npx expo-embedding init --platform android --frozen-lockfile` after restoring the root npm installation, then use the Gradle wrapper. Generated files contain local paths and are ignored by Git; rerun setup after moving the project or Node installation. Preserve `app/build/generated/sourcemaps/react/<variant>/index.android.bundle.map` alongside its APK/AAB. Native generation errors roll back the managed Gradle files; dependency installation remains a separate operation.

## Test plan

- Run `npm test` and the TypeScript check. Tests cover scaffolding, package-manager selection, migration, frozen installs, native graph validation, metadata translation and rejection, podspec parsing, project attachment, stable identifiers, and generation rollback.
- Run `npm pack`, install the tarball in a fresh SwiftUI project, and run `npx expo-embedding init` without an Expo checkout, Bun, Ruby, or CocoaPods. Verify `expo/node_modules` is an app-owned installation. Repeat setup and compare project files; unrelated targets and user build phases must remain intact.
- Run setup twice and compare both project files and the lockfile. Verify unrelated targets and build phases survive. Rename/remove an inline module and verify the generated provider follows it.
- Run `npx expo-embedding install expo-audio` and verify native setup completes automatically. Add local Expo module fixtures for `Package.swift` and `.podspec`; verify target dependencies, language settings, resource loading, and registration.
- Add and remove SQLite, Haptics, or a metadata module through the app manifest and setup. Test a transitive supported module and an unsupported Expo or React Native dependency. Rejected native graphs must not change either project.
- Verify an unknown build configuration fails before installation; map `Staging` to `Release` and archive it with `xcodebuild`.
- Run `npx expo-embedding init --frozen-lockfile` with a valid lockfile, then with manifest/lockfile drift. Verify the latter fails without rewriting the lockfile or Xcode projects.
- Change a native manifest after setup, including an unsupported build feature; verify stale setup or unsupported metadata errors preserve both projects. Remove a metadata dependency and rerun setup; verify its framework and resources disappear.
- Change the native graph after setup and build directly in Xcode. Verify the build asks for `init` instead of using stale targets.
- Build Debug for an iOS simulator. With Metro stopped, launch a SwiftUI scene, increment the counter, query SQLite, call Haptics, play a bundled Audio clip, read resources from both metadata fixtures, and resolve the bundled Font, KeepAwake, Fetch, and inline native modules.
- Archive Release or its mapped configuration for an iOS device. Inspect embedded frameworks, JavaScript, Constants resources, privacy manifests, source maps, and dSYMs. Validate signing on a physical device and TestFlight separately.
- Android: initialize a fresh Compose host, repeat setup, and compare the managed files. Build Debug and R8-enabled Release through Gradle. Launch with Metro stopped; confirm two different registered scenes share a runtime and removing one releases its surface without affecting the other. Exercise counters, rotation, background/foreground, activity recreation, back, permissions, and cold launch. Install SQLite, Audio, and Video with the CLI; query SQLite, construct native media players, and mount a VideoView. Media playback and recording require separate device coverage.
- Android Application and Activity composition: migrate an existing generated superclass to the delegate, rerun setup, and verify the obsolete source is removed. Check host lookup through `ReactApplication`, repeat initialization without replacing the host, and reject host access/configuration callbacks before initialization or binding to another Application. Run the native tests in a real host app, then confirm scene rendering after cold launch and Activity recreation. Check automatic resume/pause/destroy and intent/configuration delivery, native back fallback, permission results, legacy Activity results, listener cleanup, and rejection of duplicate or late Activity attachments. Repeat SQLite and video checks when those modules are installed.
- Android Activity migration: inspect the preview on a fresh Compose template, decline it and verify no host edits. Test `CI=1` without the flag, then with `--migrate-activity=appcompat`. Repeat setup and compare source/theme files. Build and launch before and after migration, including light/dark XML variants. Check existing AppCompat hosts, custom bases, unknown theme parents and source-set overrides. Verify that generation failures restore approved host edits and that edits made after preview cause setup to stop.
- Android Application setup: remove the Application name from a disposable host manifest and run `init --configure-host`. Verify that it creates a composed Application, registers its fully qualified name, and preserves the remaining manifest. Repeat setup without the flag and compare files. Test an existing Application with custom initialization, a class-name collision, a source file created after preview, unsupported lifecycle control flow, and rollback that removes a newly created Application. On a device, verify the registered Application exposes an initialized Expo host after process startup and forwards configuration changes without replacing the host.

The Activity migration smoke test passed on a disposable copy of AndroidTest with a separate application ID: interactive decline, CI rejection without the flag, authorized migration, and a second CI run without the flag. Debug built and cold-launched on the ARM64 API 37.2 emulator before and after migration; the original Compose greeting retained its layout. This validates superclass/theme migration, not automatic delegate wiring. Unit tests cover XML variants, custom-base rejection, import preservation, rollback and changes made after preview.

Application setup also passed on that disposable host. Both a newly generated Application and an existing Application with a custom superclass built in Debug and passed two device tests: initialized host lookup after process startup, and configuration forwarding without replacing the host. The existing Application retained its superclass and initialization callbacks. A repeat CI run without authorization flags left the Application, manifest, Activity and theme unchanged. No UI change.

Android validation currently covers an ARM64 API 37.2 emulator: Debug and R8-minified Release cold launches with no Metro, two named surfaces sharing a runtime, unmount/remount with the other surface's counter preserved, rotation, background/foreground, and back navigation. The composed Application passes six native instrumentation tests for host delegation and initialization guards. The migrated Debug host also persists a SQLite counter across process restarts and plays and pauses a bundled video. Audio validation covers creating a native player. Release includes the Hermes bundle, native runtimes, JS source map, and R8 mapping. Recording, permission prompts, and physical-device media behavior still need coverage.

Activity composition additionally passes nine [native device tests](e2e/android/README.md) covering lifecycle forwarding, recreation, new intents, legacy activity results, framework permission denial results, native back fallback, and attachment guards. A host compiled directly from the generated guide renders the embedded scene, handles JS counter input, and resumes after rotation and background/foreground. The permission test uses a permission absent from the fixture manifest, so it does not establish permission-dialog coverage.

The package remains experimental. Emulator/simulator execution, debug-signed Android Release APKs, and unsigned iOS archives do not establish store readiness. Before a supported public release, add signed-device and store-distribution coverage, lifecycle and multi-scene stress tests, CI across the declared toolchain range, prebuilt runtime symbols, and package-manager coverage.
