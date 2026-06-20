// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// Property name of the core object in the global scope of the Expo JS runtime, i.e. `global.expo`.
internal let globalCoreObjectPropertyName = "expo"

@JavaScriptActor
internal class ExpoRuntimeInstaller: EXJavaScriptRuntimeManager {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime

  internal init(appContext: AppContext, runtime: JavaScriptRuntime) {
    self.appContext = appContext
    self.runtime = runtime
    let pointer = runtime.withUnsafePointee { $0 }
    super.init(runtime: pointer)
  }

  /**
   Installs `global.expo`.
   */
  @JavaScriptActor
  @discardableResult
  internal func installCoreObject() -> JavaScriptObject {
    let coreObject = runtime.createObject()
    runtime.global().defineProperty(globalCoreObjectPropertyName, value: coreObject, options: [.enumerable])
    return coreObject
  }

  /// Attaches the `AppContext.NativeState` to the `global.expo` object. This ties the app
  /// context's lifetime to the runtime (its release defers to runtime finalization) and lets
  /// code recover the app context from the runtime via `AppContext.from(runtime:)`.
  ///
  /// Pass `ownsLifecycle: true` for the runtime that owns the app context's lifecycle (the main
  /// runtime), so only its teardown runs `destroy()`. Subordinate runtimes (e.g. the UI runtime)
  /// pass `false` to pin the app context and enable recovery without destroying it.
  @JavaScriptActor
  internal func installAppContextNativeState(on coreObject: borrowing JavaScriptObject, ownsLifecycle: Bool) {
    if coreObject.hasNativeState() {
      // Already attached.
      return
    }
    coreObject.setNativeState(AppContext.NativeState(appContext: appContext, ownsLifecycle: ownsLifecycle))
  }

  /**
   Installs `expo.modules`, the host object that returns module objects.
   */
  @JavaScriptActor
  internal func installExpoModulesHostObject() throws {
    let coreObject = try runtime.global().getPropertyAsObject(globalCoreObjectPropertyName)

    if coreObject.hasProperty("modules") {
      // Host object already installed
      return
    }
    let modulesHostObject = runtime.createHostObject(
      get: { [weak appContext] moduleName in
        return appContext?.getNativeModuleObject(moduleName) ?? .undefined
      },
      set: { propertyName, _ in
        throw ReadOnlyExpoModulesPropertyException(propertyName)
      },
      getPropertyNames: { [weak appContext] in
        return appContext?.getModuleNames() ?? []
      }
    )

    // Define the `global.expo.modules` object as a non-configurable, read-only and enumerable property.
    coreObject.defineProperty("modules", value: modulesHostObject, options: [.enumerable])
  }
}

/**
 Raised when JavaScript code attempts to assign to `expo.modules.*`. Module bindings
 are owned by the native side and cannot be replaced from JS.
 */
internal final class ReadOnlyExpoModulesPropertyException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot assign to 'expo.modules.\(param)': "
      + "the `expo.modules` namespace is owned by the native runtime and its bindings cannot be replaced from JavaScript. "
      + "Define or override behavior inside the native module instead."
  }

  // The default `JavaScriptThrowable.message` is `String(reflecting: self)`, which on
  // `Exception` resolves to `debugDescription` (name + reason + Swift file:line). For a
  // JS-facing error we want just `reason`, without leaking native source coordinates.
  var message: String { reason }
}
