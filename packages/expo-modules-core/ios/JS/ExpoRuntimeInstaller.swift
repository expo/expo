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
        // The modules host object is read-only, but the JSI Swift wrapper's `set`
        // callback can't currently throw into JavaScript, so we log and ignore.
        // TODO: switch to a throwing `set` once ExpoModulesJSI supports it.
        log.warn("Ignoring write to expo.modules.\(propertyName); the modules host object is read-only")
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
