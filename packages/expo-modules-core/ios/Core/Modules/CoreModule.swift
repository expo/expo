// Copyright 2015-present 650 Industries. All rights reserved.

internal import React
import Foundation
import ExpoModulesJSI

// The core module that describes the `global.expo` object.
@ExpoModule
internal final class CoreModule: Module {
  internal func definition() -> ModuleDefinition {
    Constant("expoModulesCoreVersion") {
      let version = CoreModuleHelper.getVersion()
      let components = version.split(separator: "-")[0].split(separator: ".").compactMap { Int($0) }

      return [
        "version": version,
        "major": components[0],
        "minor": components[1],
        "patch": components[2]
      ]
    }

    Constant("cacheDir") {
      FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.path ?? ""
    }

    Constant("documentsDir") {
      FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.path ?? ""
    }

    Constant("isRunningOnQuest") {
      false
    }

    // Expose some common classes and maybe even the `modules` host object in the future.
    Function("uuidv4") { () -> String in
      return UUID().uuidString.lowercased()
    }

    Function("uuidv5") { (name: String, namespace: String) -> String in
      guard let namespaceUuid = UUID(uuidString: namespace) else {
        throw InvalidNamespaceException(namespace)
      }

      return uuidv5(name: name, namespace: namespaceUuid).uuidString.lowercased()
    }

    // swiftlint:disable:next unused_closure_parameter
    Function("getViewConfig") { (moduleName: String, viewName: String?) -> [String: Any]? in
      var validAttributes: [String: Any] = [:]
      var directEventTypes: [String: Any] = [:]
      let moduleHolder = appContext?.moduleRegistry.get(moduleHolderForName: moduleName)

      let propNames: [String]
      let eventNames: [String]

      if let viewDefinition = moduleHolder?.definition.views[viewName ?? DEFAULT_MODULE_VIEW] {
        // A view of Expo Modules v1, declared with `View` in the module definition.
        propNames = viewDefinition.getSupportedPropNames()
        eventNames = viewDefinition.getSupportedEventNames()
      } else if let viewType = moduleHolder?.nativeViewTypes[viewName ?? DEFAULT_MODULE_VIEW] {
        // A view of Expo Modules v2, an `@ExpoView` class in `@ExpoModule(views:)`.
        propNames = viewType.propNames
        eventNames = viewType.eventNames
      } else {
        return nil
      }
      for propName in propNames {
        validAttributes[propName] = true
      }
      for eventName in eventNames {
        guard let normalizedEventName = RCTNormalizeInputEventName(eventName) else {
          continue
        }
        directEventTypes[normalizedEventName] = [
          "registrationName": eventName
        ]
      }

      return [
        "validAttributes": validAttributes,
        "directEventTypes": directEventTypes
      ]
    }

    AsyncFunction("reloadAppAsync") { (reason: String) in
      appContext?.reloadAppAsync(reason)
    }
  }

  /**
   Installs the worklet UI runtime from the holder object that the worklets JS code passes to
   `global.expo.installOnUIRuntime`.
   */
  @JS
  nonisolated internal func installOnUIRuntime(_ uiRuntimeHolder: borrowing JavaScriptValue) throws {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }

    // Check if was already installed
    if appContext._uiRuntime != nil {
      return
    }

    let runtime = try appContext.runtime
    guard uiRuntimeHolder.isObject() else {
      throw WorkletUIRuntimeException()
    }

    guard let factory = AppContext.uiRuntimeFactory else {
      throw WorkletUIRuntimeException()
    }

    // The runtime is created, prepared and stored on the main thread, which is the thread of the UI runtime.
    // `DispatchQueue.main.sync` doesn't escape its closure and rethrows, so the closure can borrow the
    // holder and the error reaches the caller directly.
    if Thread.isMainThread {
      try installUIRuntime(factory: factory, holder: uiRuntimeHolder, runtime: runtime, appContext: appContext)
    } else {
      try DispatchQueue.main.sync {
        try installUIRuntime(factory: factory, holder: uiRuntimeHolder, runtime: runtime, appContext: appContext)
      }
    }
  }
}

private func installUIRuntime(
  factory: AppContext.UIRuntimeFactory,
  holder: borrowing JavaScriptValue,
  runtime: JavaScriptRuntime,
  appContext: AppContext
) throws {
  let uiRuntime = try factory(appContext, holder, runtime)

  try JavaScriptActor.assumeIsolated {
    try appContext.attach(runtime: uiRuntime)
  }
  appContext._uiRuntime = uiRuntime
}

internal final class WorkletUIRuntimeException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot find UI worklet runtime"
  }
}
