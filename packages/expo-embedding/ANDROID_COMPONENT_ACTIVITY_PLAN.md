# Support standard Compose Activities and themes

Status: Proposed; not implemented.

## Goal

Adding Expo to a standard Android Studio Compose project must not require changing its `ComponentActivity` superclass or its existing XML and Compose themes. Application and Activity integration continue to use composition.

`androidx.activity.ComponentActivity` provides lifecycle, saved-state, activity-result, and back-dispatch support. See the [AndroidX reference](https://developer.android.com/reference/androidx/activity/ComponentActivity).

## Findings

Expo Modules Core currently enforces `AppCompatActivity` in `AppContext` and its activity-result infrastructure. The embedding delegate and scene also require that type. Changing only the embedding templates would leave the SDK's runtime checks in place.

The inspected Core result-registry path uses lifecycle and ordinary Activity APIs. No action-bar or fragment requirement was found in that path. Some individual modules do have additional requirements, so removing the Core restriction does not establish compatibility for every module or feature.

Relevant Core sources:

- `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/AppContext.kt`
- `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/activityaware/`
- `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/activityresult/ActivityResultsManager.kt`
- `packages/expo-modules-core/android/src/main/java/expo/modules/kotlin/activityresult/AppContextActivityResultRegistry.kt`

## Implementation plan

### 1. Broaden Expo Modules Core to support ComponentActivity

Update the checks in `AppContext`, the activity-availability helpers, and the activity-result manager and registry to support `androidx.activity.ComponentActivity`.

Preserve the existing result persistence, pending-result delivery, fallback callbacks, and Activity recreation behavior. Replacing the custom result registry with AndroidX's registry is a separate change and is not required for this milestone.

Preserve compatibility for existing AppCompat-based consumers. Audit public listener and method signatures for source and binary compatibility. Introduce compatibility adapters where necessary instead of mechanically renaming or widening every public signature. Unsupported combinations must fail with an actionable error rather than leave a listener waiting indefinitely.

### 2. Update the embedding delegate and scene

Change `ExpoActivityDelegate.attach()` and `ExpoScene`'s Activity lookup to accept `androidx.activity.ComponentActivity`.

`FragmentActivity` and `AppCompatActivity` should continue working through the same delegate. Do not introduce separate integration APIs for each Activity type.

The intended integration is:

```kotlin
class MainActivity : ComponentActivity(), PermissionAwareActivity {
  private val expo = ExpoActivityDelegate()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    expo.attach(this, (application as MainApplication).expo.host)

    setContent {
      MyAppTheme {
        ExpoScene(expo.host, "Main", Modifier.fillMaxSize())
      }
    }
  }

  // Permission, activity-result, and focus forwarding remain.
}
```

This is an API sketch. The generated integration guide must include all required imports and forwarding methods.

### 3. Remove the host's AppCompat theme requirement

Keep the host project's existing XML window and splash themes and its Compose `MaterialTheme`. `init` must not require a theme replacement.

Removing the host requirement does not require removing every transitive AppCompat dependency. A module may use AppCompat in an Activity it owns, with its own theme, without imposing that requirement on the host Activity.

### 4. Address module-specific requirements

| Module or feature               | Finding and proposed handling                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-camera`                   | Its camera view casts the host to `AppCompatActivity`. The inspected uses need lifecycle ownership. Broaden the type and validate camera lifecycle and permission behavior.                       |
| `expo-video` picture-in-picture | Its helper uses `FragmentActivity` and a fragment to observe PiP behavior. Replace that helper with equivalent Activity listeners and validate PiP transitions separately from basic playback.    |
| `expo-local-authentication`     | Biometric authentication currently relies on `FragmentActivity`. Initially document the feature-specific requirement. Supporting it on plain `ComponentActivity` needs a separate implementation. |
| Image-picker crop Activity      | Keep its own AppCompat Activity and theme. This does not require an AppCompat host; verify the complete picker/crop result flow from a ComponentActivity host.                                    |

The first milestone covers Core, named scenes, SQLite, and ordinary video playback on a plain Compose Activity. Camera, PiP, biometrics, and other module-specific paths require their own validation before being advertised as supported.

Do not restore a global AppCompat requirement to accommodate a single feature. Report specific feature requirements clearly.

### 5. Coordinate SDK delivery with init and documentation

The Core implementation and the embedding templates must be delivered together. For local validation, declare a patched Core package explicitly in the test application's dependencies and build it from source. Do not silently replace registry dependencies with checkout packages or mutate installed SDK sources during setup.

Once a compatible Core version is released, validate that version during setup and provide an actionable error for incompatible installations.

Update the generated `INTEGRATION.md`, README, and examples to default to `ComponentActivity`, with the existing host theme preserved. Keep composition as the only embedding integration pattern.

Retain legacy activity-result forwarding for native modules that still use it. Replace the misleading `@Deprecated` annotation in the host example with localized compiler-warning suppression and a brief compatibility explanation.

Keep changes reviewable: separate the Core compatibility work, embedding tooling/templates, and individual module changes. Each published package change needs its own changeset and checks.

## Test plan

### Core and compatibility tests

- Add regression tests that fail against the current AppCompat-only implementation before changing Core.
- Verify Activity availability, listener registration/removal, and lifecycle delivery with `ComponentActivity` and `AppCompatActivity` hosts.
- Check existing public API consumers for source and binary compatibility where adapters are needed.
- Verify unsupported Activity types and incompatible SDK versions produce actionable errors.

### Native integration tests

Use a fresh Android Studio Compose project with its original Activity superclass and theme unchanged.

- Build embedded Debug and optimized Release variants and launch without Metro.
- Render named scenes, interact with JS state, and unmount/remount surfaces sharing the host.
- Exercise rotation, Activity recreation, background/foreground, native back fallback, and JS-handled back navigation.
- Verify permission grant, denial, cancellation where applicable, and result delivery to native modules.
- Verify activity-result success and cancellation, including recreation and process death while an external Activity is open. Confirm pending and fallback results are delivered correctly without duplicate callbacks or unresolved operations.
- Verify edge-to-edge layout, system bars, light/dark themes, and the existing Compose `MaterialTheme` remain correct.
- Repeat lifecycle and result tests with an AppCompat host to catch regressions.
- Verify SQLite persistence and ordinary video playback on the ComponentActivity host. Validate Camera, PiP, image-picker/crop, and biometrics separately before claiming feature support.

Use physical-device coverage for permission dialogs and hardware-dependent features where emulator coverage is insufficient. Capture before/after screenshots for any visible behavior changes.

### CLI and documentation tests

- Run `init` on a fresh host and verify it generates composition-only instructions without changing Kotlin sources or themes.
- Repeat `init` and verify generated output is stable and unrelated host edits are preserved.
- Compile the complete Kotlin examples from the generated guide in a real host.
- Verify installation and native integration use the dependency versions declared by the app.
- Run the CLI tests and TypeScript checks, and the required package checks for each changed published package.

## Acceptance criteria

- A standard Compose app keeps `ComponentActivity`, its XML theme, and its Compose theme when adding Expo.
- Application and Activity integration use the same composition APIs across supported host types.
- Existing AppCompat hosts continue to work.
- Core lifecycle and activity-result behavior survives recreation and pending-result scenarios.
- Module-specific limitations are explicit and do not become a global host restriction.
- `init` and the integration guide accurately reflect the installed SDK's capabilities.
