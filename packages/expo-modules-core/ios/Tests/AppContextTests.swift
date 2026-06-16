// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("AppContext")
@JavaScriptActor
struct AppContextTests {
  let appContext = AppContext.create()
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `recovers the app context from the runtime`() throws {
    let recovered = AppContext.from(runtime: try runtime)
    #expect(recovered === appContext)
  }
  @Test
  func `from(runtime:) returns nil for a runtime without the core object`() {
    // A bare runtime that was never prepared by an app context has no `global.expo`.
    let bareRuntime = JavaScriptRuntime()
    #expect(AppContext.from(runtime: bareRuntime) == nil)
  }

  // MARK: - NativeState

  @Suite("NativeState")
  @JavaScriptActor
  struct NativeStateTests {
    let appContext = AppContext.create()
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    @Test
    func `is attached to the core object`() throws {
      let coreObject = try runtime.global().getPropertyAsObject("expo")
      let nativeState = coreObject.getNativeState(as: AppContext.NativeState.self)
      #expect(nativeState != nil)
      #expect(nativeState?.appContext === appContext)
    }

    @Test
    func `the main runtime's installed native state owns the app context lifecycle`() throws {
      // The real `prepareRuntime` path (run by `AppContext.create()`) must install a state that
      // owns the lifecycle, otherwise the main runtime's teardown wouldn't destroy the context.
      let coreObject = try runtime.global().getPropertyAsObject("expo")
      let nativeState = coreObject.getNativeState(as: AppContext.NativeState.self)
      #expect(nativeState?.ownsLifecycle == true)
    }

    @Test
    func `installing the native state twice keeps the first one`() throws {
      // The installer guards on `hasNativeState()`, so re-running it must not replace the state
      // already attached by `prepareRuntime`.
      let coreObject = try runtime.global().getPropertyAsObject("expo")
      let original = coreObject.getNativeState(as: AppContext.NativeState.self)
      #expect(original != nil)

      let installer = ExpoRuntimeInstaller(appContext: appContext, runtime: try runtime)
      installer.installAppContextNativeState(on: coreObject, ownsLifecycle: true)

      #expect(coreObject.getNativeState(as: AppContext.NativeState.self) === original)
    }

    @Test
    func `deallocator fires once when the native state is released`() throws {
      var deallocatorCallCount = 0
      let runtime = JavaScriptRuntime()
      let coreObject = runtime.createObject()
      let nativeState = AppContext.NativeState(appContext: appContext, ownsLifecycle: false)
      nativeState.setDeallocator { _ in
        deallocatorCallCount += 1
      }
      coreObject.setNativeState(nativeState)

      coreObject.unsetNativeState()
      try runtime.eval("gc() && gc() && gc()")

      #expect(deallocatorCallCount == 1)
    }

    @Test
    func `deallocator fires once even when the native state is attached to several objects`() throws {
      var deallocatorCallCount = 0
      let runtime = JavaScriptRuntime()
      let firstObject = runtime.createObject()
      let secondObject = runtime.createObject()
      let nativeState = AppContext.NativeState(appContext: appContext, ownsLifecycle: false)
      nativeState.setDeallocator { _ in
        deallocatorCallCount += 1
      }
      firstObject.setNativeState(nativeState)
      secondObject.setNativeState(nativeState)

      // Releasing the first holder must not fire the deallocator while the second still holds it.
      firstObject.unsetNativeState()
      try runtime.eval("gc() && gc() && gc()")
      #expect(deallocatorCallCount == 0)

      // Releasing the last holder fires it exactly once.
      secondObject.unsetNativeState()
      try runtime.eval("gc() && gc() && gc()")
      #expect(deallocatorCallCount == 1)
    }

    @Test
    func `one app context prepares several runtimes and recovers from each`() throws {
      // Each runtime gets its own native state pointing at the same app context, mirroring how
      // `prepareRuntime` / `prepareUIRuntime` install one per runtime. Runtimes (reference
      // types) are kept alive in the array; their core objects stay reachable through
      // `global.expo`.
      let runtimes = (0..<3).map { _ in JavaScriptRuntime() }

      for runtime in runtimes {
        let coreObject = runtime.createObject()
        coreObject.setNativeState(AppContext.NativeState(appContext: appContext, ownsLifecycle: false))
        runtime.global().defineProperty(globalCoreObjectPropertyName, value: coreObject, options: [.enumerable])
      }

      for runtime in runtimes {
        #expect(AppContext.from(runtime: runtime) === appContext)
      }
    }

    @Test
    func `releasing a subordinate runtime's native state does not destroy the app context`() throws {
      // A subordinate runtime (e.g. the UI runtime) is installed with `ownsLifecycle: false`,
      // so tearing it down must not destroy an app context that still backs other runtimes.
      let appContext = AppContext.create()
      // The app context's own (main) runtime stays alive throughout this test.
      _ = try appContext.runtime

      // Stand in for a subordinate runtime: its own native state pointing at the same app context.
      let subordinateRuntime = JavaScriptRuntime()
      let coreObject = subordinateRuntime.createObject()
      coreObject.setNativeState(AppContext.NativeState(appContext: appContext, ownsLifecycle: false))
      subordinateRuntime.global().defineProperty(globalCoreObjectPropertyName, value: coreObject, options: [.enumerable])

      // Tear the subordinate runtime down.
      try subordinateRuntime.global().getPropertyAsObject(globalCoreObjectPropertyName).unsetNativeState()
      try subordinateRuntime.eval("gc() && gc() && gc()")

      // The app context survived: its main runtime is still recoverable.
      #expect(throws: Never.self) {
        _ = try appContext.runtime
      }
    }

    @Test
    func `releasing the main runtime's native state destroys the app context`() throws {
      let appContext = AppContext.create()

      // Stand in for the main runtime: a native state installed with `ownsLifecycle: true`.
      let mainRuntime = JavaScriptRuntime()
      let coreObject = mainRuntime.createObject()
      coreObject.setNativeState(AppContext.NativeState(appContext: appContext, ownsLifecycle: true))
      mainRuntime.global().defineProperty(globalCoreObjectPropertyName, value: coreObject, options: [.enumerable])

      // Tearing it down runs `destroy()`, which unpins the app context's runtime.
      try mainRuntime.global().getPropertyAsObject(globalCoreObjectPropertyName).unsetNativeState()
      try mainRuntime.eval("gc() && gc() && gc()")

      #expect(throws: Exceptions.RuntimeLost.self) {
        _ = try appContext.runtime
      }
    }

    @Test
    func `subordinate runtime teardown leaves the app context backing the main runtime intact`() throws {
      // The exact regression `ownsLifecycle` guards against: one app context backs both a main
      // and a subordinate runtime. The subordinate is released first and must not destroy the
      // context; only the later main-runtime teardown does.
      //
      // `AppContext.create()` already installs the owning (main) native state on the app
      // context's own runtime, mirroring `prepareRuntime`. The subordinate is attached the same
      // way `prepareUIRuntime` would, with `ownsLifecycle: false`.
      let appContext = AppContext.create()
      let mainRuntime = try appContext.runtime

      let subordinateRuntime = JavaScriptRuntime()
      let subordinateCoreObject = subordinateRuntime.createObject()
      subordinateCoreObject.setNativeState(AppContext.NativeState(appContext: appContext, ownsLifecycle: false))
      subordinateRuntime.global().defineProperty(globalCoreObjectPropertyName, value: subordinateCoreObject, options: [.enumerable])

      // Both runtimes recover the same app context while alive.
      #expect(AppContext.from(runtime: mainRuntime) === appContext)
      #expect(AppContext.from(runtime: subordinateRuntime) === appContext)

      // Tear the subordinate down first: it must not destroy the shared app context.
      try subordinateRuntime.global().getPropertyAsObject(globalCoreObjectPropertyName).unsetNativeState()
      try subordinateRuntime.eval("gc() && gc() && gc()")

      #expect(throws: Never.self) {
        _ = try appContext.runtime
      }
      #expect(AppContext.from(runtime: mainRuntime) === appContext)

      // Now tear the main runtime down: this one owns the lifecycle, so it destroys the context.
      try mainRuntime.global().getPropertyAsObject(globalCoreObjectPropertyName).unsetNativeState()
      try mainRuntime.eval("gc() && gc() && gc()")

      #expect(throws: Exceptions.RuntimeLost.self) {
        _ = try appContext.runtime
      }
    }

    @Test
    func `destroy is safe to run repeatedly`() throws {
      // The owning runtime's deallocator calls `appContext.destroy()`; it must tolerate being
      // called more than once (e.g. the `_runtime = nil` path plus the deallocator).
      let appContext = AppContext.create()
      appContext.destroy()
      appContext.destroy()

      // After destruction the runtime is unpinned and can no longer be recovered.
      #expect(throws: Exceptions.RuntimeLost.self) {
        _ = try appContext.runtime
      }
    }
}

// MARK: - ModuleProvider

extension AppContextTests {
  @Suite("moduleProviderClassNames")
  struct ModuleProviderClassNamesTests {
    @Test
    func `maps bundle names to qualified class names`() {
      let classNames = AppContext.moduleProviderClassNames(
        withName: "ExpoModulesProvider",
        bundleNames: ["MyApp"]
      )

      #expect(classNames == [
        "MyApp.ExpoModulesProvider"
      ])
    }

    @Test
    func `deduplicates identical candidates`() {
      let classNames = AppContext.moduleProviderClassNames(
        withName: "ExpoModulesProvider",
        bundleNames: ["ExpoApp", "ExpoApp"]
      )

      #expect(classNames == [
        "ExpoApp.ExpoModulesProvider"
      ])
    }

    @Test
    func `preserves order and emits both candidates when CFBundleExecutable differs from CFBundleName`() {
      // When CFBundleExecutable differs from CFBundleName (e.g. dotted bundle name), both
      // candidates are emitted with the executable-derived one first, since it is the Swift
      // module name by construction.
      let classNames = AppContext.moduleProviderClassNames(
        withName: "ExpoModulesProvider",
        bundleNames: ["Universal_internal", "Universal.internal"]
      )

      #expect(classNames == [
        "Universal_internal.ExpoModulesProvider",
        "Universal.internal.ExpoModulesProvider"
      ])
    }
  }

  @Test
  func `module provider class names preserves order and deduplicates across CFBundleName and CFBundleExecutable`() {
    // When CFBundleName == CFBundleExecutable (already a valid identifier), only one candidate is produced.
    let classNames = AppContext.moduleProviderClassNames(
      withName: "ExpoModulesProvider",
      bundleNames: ["UniversalApp", "UniversalApp"]
    )

    #expect(classNames == [
      "UniversalApp.ExpoModulesProvider"
    ])
  }
}
