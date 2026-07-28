// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

/**
 New Swift Testing-based suite for `SharedObjectRegistry`. Coexists with
 `SharedObjectRegistrySpec` (Quick/Nimble) until the rest of the spec is
 migrated.
 */
@Suite("SharedObjectRegistry")
@JavaScriptActor
struct SharedObjectRegistryTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }
  var registry: SharedObjectRegistry { appContext.sharedObjectRegistry }

  init() {
    self.appContext = AppContext.create()
  }

  @Test
  func `attaches an expo NativeState recoverable from the JS object`() throws {
    let nativeObject = TestSharedObject()
    let jsObject = try runtime.createObject()
    registry.add(native: nativeObject, javaScript: jsObject)

    // Pins the cross-package contract that `SharedObject::NativeState` derives
    // from `expo::NativeState` on Apple. If the `__has_include` probe in
    // `EventEmitter.h` falls back, this returns false.
    let hasNativeState = jsObject.hasNativeState()
    #expect(hasNativeState)
  }

  @Test
  func `getNativeState recovers the SharedObjectNativeState wrapper`() throws {
    let nativeObject = TestSharedObject()
    let jsObject = try runtime.createObject()
    registry.add(native: nativeObject, javaScript: jsObject)

    let recovered = jsObject.getNativeState(as: SharedObjectNativeState.self)?.native
    #expect(recovered === nativeObject)
  }

  @Test
  func `native state holds the paired JS object per runtime after add`() throws {
    let runtime = try runtime
    let nativeObject = TestSharedObject()
    let jsObject = try runtime.createObject()
    registry.add(native: nativeObject, javaScript: jsObject)

    // The native side carries a back-pointer to its native state, which maps the runtime to its
    // paired JS counterpart. Recovering it for this runtime should resolve.
    let resolved = nativeObject.nativeState?.javaScriptObject(in: runtime) != nil
    #expect(resolved)
  }

  @Test
  func `javaScriptObject(in:) is repeatable, not consumed on first read`() throws {
    let runtime = try runtime
    let nativeObject = TestSharedObject()
    let jsObject = runtime.createObject()
    registry.add(native: nativeObject, javaScript: jsObject)
    let nativeState = try #require(nativeObject.nativeState)

    // Reading the pairing must not consume it: two consecutive lookups for the same runtime should
    // both resolve to the originally paired JS object.
    #expect(nativeState.javaScriptObject(in: runtime)?.asValue() == jsObject.asValue())
    #expect(nativeState.javaScriptObject(in: runtime)?.asValue() == jsObject.asValue())
  }

  @Test
  func `native object is paired independently per runtime`() throws {
    let primaryRuntime = try runtime
    let secondaryRuntime = JavaScriptRuntime()

    let nativeObject = TestSharedObject()
    let primaryObject = primaryRuntime.createObject()
    registry.add(native: nativeObject, javaScript: primaryObject)

    // Pair the same native object with a second runtime's JS object, reusing the existing native state.
    let nativeState = try #require(nativeObject.nativeState)
    let secondaryObject = secondaryRuntime.createObject()
    secondaryObject.setNativeState(nativeState)
    nativeState.setJavaScriptObject(secondaryObject, in: secondaryRuntime)

    // Each runtime resolves to its own JS counterpart. Compare within a runtime only (cross-runtime
    // strict-equality is meaningless).
    #expect(nativeState.javaScriptObject(in: primaryRuntime)?.asValue() == primaryObject.asValue())
    #expect(nativeState.javaScriptObject(in: secondaryRuntime)?.asValue() == secondaryObject.asValue())
  }

  @Test
  func `the same native state is shared across runtimes, not duplicated`() throws {
    let primaryRuntime = try runtime
    let secondaryRuntime = JavaScriptRuntime()

    let nativeObject = TestSharedObject()
    let primaryObject = primaryRuntime.createObject()
    registry.add(native: nativeObject, javaScript: primaryObject)

    // Attach the existing native state to a second runtime's JS object, reusing the shared C++ pointee.
    let nativeState = try #require(nativeObject.nativeState)
    let secondaryObject = secondaryRuntime.createObject()
    secondaryObject.setNativeState(nativeState)
    nativeState.setJavaScriptObject(secondaryObject, in: secondaryRuntime)

    // Both runtimes' JS objects recover the very same `SharedObjectNativeState` instance — the state is
    // shared, not duplicated per runtime.
    let recoveredFromPrimary = primaryObject.getNativeState(as: SharedObjectNativeState.self)
    let recoveredFromSecondary = secondaryObject.getNativeState(as: SharedObjectNativeState.self)
    #expect(recoveredFromPrimary === nativeState)
    #expect(recoveredFromSecondary === nativeState)
    #expect(recoveredFromPrimary === recoveredFromSecondary)
  }

  @Test
  func `unsetting native state triggers automatic delete`() throws {
    let nativeObject = TestSharedObject()
    let jsObject = try runtime.createObject()
    let id = registry.add(native: nativeObject, javaScript: jsObject)
    #expect(registry.get(id) != nil)

    // Detach drops JSI's shared_ptr; the destructor's releaser calls `registry.delete(id)`.
    jsObject.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")

    #expect(registry.get(id) == nil)
    #expect(nativeObject.sharedObjectId == 0)
  }

  @Test
  func `re-adding a still-paired native object reuses its id and single registry entry`() throws {
    let primaryRuntime = try runtime
    let secondaryRuntime = JavaScriptRuntime()

    let nativeObject = TestSharedObject()
    let firstId = registry.add(native: nativeObject, javaScript: primaryRuntime.createObject())

    // Pair the same, still-alive native object again (e.g. from a second runtime). Because it already
    // carries a native state, `add` must reuse that state's id rather than mint a new one — otherwise
    // the C++ `NativeState.objectId` (which drives the releaser/`delete`) would disagree with
    // `sharedObjectId`, leaking the first registry entry.
    let secondId = registry.add(native: nativeObject, javaScript: secondaryRuntime.createObject())

    #expect(secondId == firstId)
    #expect(nativeObject.sharedObjectId == firstId)
    #expect(registry.size == 1)
    #expect(registry.get(firstId)?.native === nativeObject)
  }

  @Test
  func `re-adding the same native object after deletion gets a fresh id`() throws {
    let nativeObject = TestSharedObject()
    let firstId = registry.add(native: nativeObject, javaScript: try runtime.createObject())
    registry.delete(firstId)

    let secondId = registry.add(native: nativeObject, javaScript: try runtime.createObject())
    #expect(secondId != firstId)
    #expect(nativeObject.sharedObjectId == secondId)
  }

  @Test
  func `toNativeObject returns nil for an object without native state`() throws {
    let jsObject = try runtime.createObject()
    let result = registry.toNativeObject(jsObject)
    #expect(result == nil)
  }

  @Test
  func `toNativeObject returns the paired native after add`() throws {
    let nativeObject = TestSharedObject()
    let jsObject = try runtime.createObject()
    registry.add(native: nativeObject, javaScript: jsObject)
    let result = registry.toNativeObject(jsObject)
    #expect(result === nativeObject)
  }

  @Test
  func `releaser tolerates a deallocated registry`() throws {
    // Build a throwaway registry, register an object on it, then drop the registry
    // before triggering the releaser. The `[weak self]` capture should make the
    // releaser a no-op rather than crashing on a dangling reference.
    var localRegistry: SharedObjectRegistry? = SharedObjectRegistry(appContext: appContext)
    let nativeObject = TestSharedObject()
    let jsObject = try runtime.createObject()
    localRegistry?.add(native: nativeObject, javaScript: jsObject)

    localRegistry = nil

    // The native state is still attached to `jsObject`. Detaching now would call
    // the releaser whose `[weak self]` is now nil — must not crash.
    jsObject.unsetNativeState()
    try runtime.eval("gc() && gc() && gc()")
  }
}

private final class TestSharedObject: SharedObject {}
