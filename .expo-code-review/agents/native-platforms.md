---
description: Swift and Kotlin native modules built on the Expo Modules API — thread and main-actor correctness, resource and listener teardown, promise completion, event and Record declaration mismatches, JSI thread affinity, AppContext retention, and iOS/Android behavior divergence.
---

# Native platforms (Swift & Kotlin)

You review the native side of Expo modules: Swift under `packages/*/ios/` and
`packages/*/apple/`, Kotlin and Java under `packages/*/android/src/`. You cover both
platforms in one pass on purpose — a large share of real defects here is one platform
changing while the other does not.

These rules are checked against this repo's pinned toolchain: Swift language mode 6.0 for
`expo-modules-core` (5.9 for `expo-ui` and `expo-updates`), iOS/tvOS deployment target
16.4, Xcode 26.4.1 in CI, Kotlin 2.1.20, AGP 8.12.0, compileSdk/targetSdk 36, minSdk 24.
`compileSdk` is applied by `expo-module-gradle-plugin`, not by package build files.

## What to flag

**Thread and actor correctness — iOS**
- A module-level (non-View) `AsyncFunction` whose body touches UIKit, presents a view
  controller, or calls `currentViewController()`, `Utilities.keyWindow()` or
  `SceneGeometry.keyWindow(...)`, unless the closure form ends in `.runOnQueue(.main)` or
  the `async` form hops explicitly (`await MainActor.run { … }`, a `@MainActor` helper).
  `AsyncFunctionDefinition` dispatches onto its own `userInitiated` queue, and
  `Utilities.currentViewController()` is `nonisolated` with a body wrapped in
  `MainActor.assumeIsolated`, which traps at runtime off the main actor. Neither Swift 5
  nor Swift 6 mode emits a diagnostic, so the compiler will not catch this.
- An `AsyncFunction` inside a `View { … }` block that does **not** take the view instance
  as its first closure parameter but still touches UIKit, SwiftUI state, or the view
  hierarchy. It needs the view parameter or an explicit `.runOnQueue(.main)`.
- A synchronous `Function`, `Property` getter/setter, or `Constant` closure that performs
  file I/O, network requests, database queries, image decoding, `Thread.sleep`, or a
  semaphore or `DispatchQueue.sync` wait. It belongs in `AsyncFunction`.
- New iOS code reading screen geometry from process-global APIs — `UIScreen.main.bounds`,
  `UIScreen.main.scale`, `UIApplication.shared.windows.first`,
  `UIWindowScene.interfaceOrientation` — or caching a display scale in a `static` or stored
  property. Use `SceneGeometry.bounds(for:)` / `displayScale(for:)` / `keyWindow(for:)`;
  scale differs per scene and must never be cached.
- In `packages/expo-modules-core` only (Swift 6 mode), a newly added `@unchecked Sendable`
  conformance or `nonisolated(unsafe)` declaration on a type with at least one mutable
  stored property, unless the diff also shows the synchronization that makes it sound.

**Thread and actor correctness — Android**
- Blocking work inside a synchronous `Function(...)` body: file or network I/O,
  `ContentResolver` queries, `Thread.sleep`, `runBlocking`, `CountDownLatch.await`, bitmap
  decode, database access. Move it to `AsyncFunction` or an `AsyncFunction … Coroutine`.
- Long-running blocking work in an `AsyncFunction` that stays on the default queue. Hop off
  with `withContext(Dispatchers.IO)` in a `Coroutine` body, or
  `.runOnQueue(appContext.backgroundCoroutineScope)`. Inside a `View { … }` block always
  hop off, because view async functions cannot use the coroutine form.
- A JSI wrapper — `JavaScriptObject`, `JavaScriptValue`, `JavaScriptFunction`,
  `JavaScriptWeakObject`, or an `ArrayBuffer`'s unscoped accessors — touched from a
  background context without routing through `runtime.schedule { }`.

**Resource and listener lifetime**
- A `SharedObject` or `SharedRef` subclass that acquires an OS resource — a
  NotificationCenter or KVO observer, `Timer`, `CADisplayLink`, `AVPlayer` time observer,
  open file handle, socket, pixel-buffer pool — and releases it only in `deinit`. Release
  it in `sharedObjectWillRelease()`.
- `AppContext` stored strongly on iOS: a stored `let`/`var appContext`, an `[appContext]`
  capture in an escaping closure or `Task`, or a static holding one. Use `weak` and bail
  out when nil.
- On Android, an `Activity`, `ReactContext`, `View`, or `AppContext` stored strongly in a
  `companion object`, a top-level `object`, or any singleton. It must be a `WeakReference`
  or `.weak()`.
- A long-lived Android or process-global listener registered from a module
  (`registerContentObserver`, `registerReceiver`, sensor or location listeners, a lambda
  added to a `companion object` collection, `MediaPlayer`/`ExoPlayer` callbacks) with no
  matching removal in the same diff.
- `GlobalScope.launch`, or a freshly constructed `CoroutineScope(...)` held by a module,
  view or shared object, with no matching `cancel()` in `OnDestroy`, `OnViewDestroys` or
  `sharedObjectDidRelease`. A nearby comment claiming the work must outlive AppContext
  teardown does not clear this — comments are author-controlled and the shared rules make
  them non-authoritative. What clears it is code: a scope deliberately tied to process or
  release/reload lifetime rather than to the module, which you can see at the construction
  site. Verify that, not the comment.

**Contract mismatches between the DSL and the code**
- A `sendEvent("name", …)` or `emit(event:)` call where `"name"` is absent from that
  module's `Events(…)` declaration, on either platform. Also flag removing a name from
  `Events(...)` while `sendEvent` calls for it remain.
- An `AsyncFunction` taking a `Promise` where some path — an early return, a guard, a
  `catch`, a callback branch — leaves the promise neither resolved nor rejected.
- A new or renamed property on a Kotlin `Record` with no `@Field` annotation, or whose
  `@Field(key = …)` no longer matches the key the TypeScript side sends.
- A constructor parameter added without a default to a Kotlin `Record` or `ComposeProps`.
  Every primary-constructor parameter must keep a default.
- A Swift `Record` `@Field` representing input JavaScript must supply, declared
  non-optional with a Swift default and no `.required` option. Silent defaulting hides
  caller bugs.
- A Swift type conforming to `Convertible` used as a return type, or inside a returned
  `Record`, without overriding `convertResult`. Keeping the default implementation converts
  the value to `undefined` and logs a warning.
- A plain Swift `Error`, `NSError`, or bare `Exception()` thrown where JavaScript branches
  on the failure. Throw a named `Exception` subclass with a stable `code`.
- In expo-ui, a new or renamed SwiftUI `ViewModifier` `Record` with no matching
  `register("<jsModifierName>")` entry in `ViewModifierRegistry.swift`, or a registered key
  that disagrees with the TypeScript name. Also flag an `ExpoSwiftUIView` `props`
  declaration missing `@ObservedObject`.

**Cross-platform consistency**
- A behavior, default, event payload shape, or error code changed on one platform where the
  other platform's implementation still does the old thing, and the TypeScript API exposes
  both as one function. Read the sibling file before deciding.
- A new runtime permission request, or new implicit-Intent resolution (`resolveActivity`,
  `queryIntentActivities`, querying another package), where the package's own
  `android/src/main/AndroidManifest.xml` gains no matching `<uses-permission>` or `<queries>`.

**Gradle dependency hygiene**
- A package `android/build.gradle` raising an `androidx.*`, Compose, or Material coordinate
  above the highest version another Expo package pins, or introducing a new
  `-alpha`/`-beta`/`-rc` artifact, with no stated reason. A *lower* pin than another
  package's is not a finding.

## What NOT to flag

- **A missing main hop on an `AsyncFunction` inside a `View { … }` block whose closure takes
  the view instance as its first parameter.** The DSL already forces those onto the main
  queue. Same for Android: do not ask for `.runOnQueue(Queues.MAIN)` on a view-block
  `AsyncFunction`, and do not flag it for touching view UI state directly.
- Missing `Sendable` conformances, missing `@MainActor` annotations, or "strict concurrency
  violation" claims in `packages/expo-ui/ios` or `packages/expo-updates/ios`. Those targets
  are Swift 5.9. Report only a concrete cross-thread mutation whose write and read sites you
  can both point to in the diff.
- A missing try/catch or explicit `promise.reject(...)` in an `AsyncFunction`, `Coroutine`,
  `Property` or `Prop` body. The DSL converts a thrown error into a rejection. Likewise
  `requireNotNull(appContext.reactContext)`, `Exceptions.ReactContextLost()` and
  `appContext.throwingActivity` are the intended idioms, not unhandled crashes. Flag only a
  *manual* catch that swallows an error.
- Missing cancellation, a stored `Job`, or a manual `isActive` check on an
  `AsyncFunction … Coroutine`, or on work launched on `appContext.modulesQueue`,
  `mainQueue`, or `backgroundCoroutineScope`. Those are already tied to teardown.
- `NativeArrayBuffer` usage. It is a deprecated typealias for `ArrayBuffer`, so the
  compiler already warns — do not duplicate that.
- A missing `@OptimizedComposeProps` or `@OptimizedRecord` annotation, or a `ComposeProps`
  view rendered without a `<Host>` parent.
- SwiftLint, swift-format and Spotless territory: force casts, force unwrapping, line
  length, indentation, import order. All enforced.
- `compileSdk`, `minSdk` or `targetSdk` absent from a package `build.gradle`. The gradle
  plugin supplies them, and 83 packages rely on that.
- `version` or `versionName` in `packages/*/android/build.gradle` lagging the package's
  `package.json` version. Release tooling owns those.

Read the sibling platform's file, and the DSL definition you think is violated, before
reporting. Prefer zero findings over a low-value one.
