// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Native state subclass attached to a SharedObject's JS object. Holds the paired
 native `SharedObject` so callers that already have the JS object can recover
 the native counterpart via `JavaScriptObject.getNativeState(as:)` without going
 through `SharedObjectRegistry`.
 */
internal final class SharedObjectNativeState: JavaScriptNativeState {
  internal let native: SharedObject

  /**
   Weak reference to the JS object this native state is attached to. Populated
   right after `setNativeState` so callers can recover the JS object from the
   native side without going through `SharedObjectRegistry`.
   */
  internal var pairedWeakObject: JavaScriptWeakObject?

  internal init(native: SharedObject, factory: @escaping JavaScriptNativeState.Factory) {
    self.native = native
    super.init(factory: factory)
  }
}
