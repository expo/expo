// Copyright 2025-present 650 Industries. All rights reserved.

@_spi(Unsafe) import ExpoModulesJSI

@JavaScriptActor
internal class ExpoRuntimeInstaller: EXJavaScriptRuntimeManager {
  private let appContext: AppContext
  private let runtime: ExpoRuntime

  internal init(appContext: AppContext, runtime: ExpoRuntime) {
    self.appContext = appContext
    self.runtime = runtime
    super.init(runtime: runtime.unsafe_pointee)
  }

  /**
   Installs `global.expo`.
   */
  @JavaScriptActor
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
    let coreObject = try runtime.getCoreObject()

    if coreObject.hasProperty("modules") {
      // Host object already installed
      return
    }
    let modulesHostObject = runtime.createHostObject(
      get: { moduleName in
        return JavaScriptActor.assumeIsolated {
          return self.appContext.getNativeModuleObject(moduleName) ?? .undefined()
        }
      },
      set: { propertyName, value in
        // TODO: Throw JS error
        fatalError("Cannot override property '\(propertyName)' on `global.expo.modules`")
      },
      getPropertyNames: {
        return self.appContext.getModuleNames()
      },
      dealloc: {
        self.appContext.destroy()
      }
    )

    // Define the `global.expo.modules` object as a non-configurable, read-only and enumerable property.
    coreObject.defineProperty("modules", value: modulesHostObject, options: [.enumerable])
  }
}
