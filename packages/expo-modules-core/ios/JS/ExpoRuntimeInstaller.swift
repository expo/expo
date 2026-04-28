// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

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
    runtime.global().defineProperty(EXGlobalCoreObjectPropertyName, value: coreObject, options: [.enumerable])
    return coreObject
  }

  /**
   Installs `expo.modules`, the host object that returns module objects.
   */
  @JavaScriptActor
  internal func installExpoModulesHostObject() throws {
    let coreObject = runtime.global().getPropertyAsObject(EXGlobalCoreObjectPropertyName)

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
      },
      dealloc: { [weak appContext] in
        appContext?.destroy()
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
