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
  func `native state holds the paired weak JS object after add`() throws {
    let nativeObject = TestSharedObject()
    let jsObject = try runtime.createObject()
    registry.add(native: nativeObject, javaScript: jsObject)

    // The native side carries a back-pointer to its native state, which holds a
    // `JavaScriptWeakObject` to the JS counterpart. `lock()` should resolve.
    let resolved = nativeObject.nativeState?.pairedWeakObject?.lock() != nil
    #expect(resolved)
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
