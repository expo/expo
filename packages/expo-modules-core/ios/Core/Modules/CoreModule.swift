// Copyright 2015-present 650 Industries. All rights reserved.

internal import React
import Foundation
import ExpoModulesJSI

// The core module that describes the `global.expo` object.
@ExpoModule
internal final class CoreModule: Module {
  @JS
  var expoModulesCoreVersion: ExpoModulesCoreVersion {
    let version = CoreModuleHelper.getVersion()
    let components = version.split(separator: "-")[0].split(separator: ".").compactMap { Int($0) }

    return ExpoModulesCoreVersion(
      version: version,
      major: components[0],
      minor: components[1],
      patch: components[2]
    )
  }

  @JS
  var cacheDir: String {
    FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.path ?? ""
  }

  @JS
  var documentsDir: String {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.path ?? ""
  }

  @JS
  var isRunningOnQuest: Bool {
    false
  }

  @JS
  func uuidv4() -> String {
    return UUID().uuidString.lowercased()
  }

  @JS
  func uuidv5(name: String, namespace: String) throws -> String {
    guard let namespaceUuid = UUID(uuidString: namespace) else {
      throw InvalidNamespaceException(namespace)
    }

    // This method shadows the global `uuidv5(name:namespace:)`, so the call names the module.
    return ExpoModulesCore.uuidv5(name: name, namespace: namespaceUuid).uuidString.lowercased()
  }

  @JS
  func getViewConfig(moduleName: String, viewName: String?) -> ViewConfig? {
    var validAttributes: [String: Bool] = [:]
    var directEventTypes: [String: DirectEventType] = [:]
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
      directEventTypes[normalizedEventName] = DirectEventType(registrationName: eventName)
    }

    return ViewConfig(
      validAttributes: validAttributes,
      directEventTypes: directEventTypes
    )
  }

  // In Expo Go, posting the reload request blocks until the main thread reloads the app,
  // so it must not run on the JavaScript thread.
  @JS(.concurrent)
  func reloadAppAsync(reason: String) async {
    appContext?.reloadAppAsync(reason)
  }

  /**
   Installs the worklet UI runtime from the holder object that the worklets JS code passes to
   `global.expo.installOnUIRuntime`. The holder belongs to the runtime that calls the function, which is also
   the runtime that the factory reads it with.
   */
  @JS
  nonisolated internal func installOnUIRuntime(_ uiRuntimeHolder: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }

    // Check if was already installed
    if appContext._uiRuntime != nil {
      return
    }

    let runtime = copy runtime
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
  // Another call can install the UI runtime between the check of the caller and this function, which runs on
  // the main thread. A second wrapper would replace the one that the getters of the UI runtime use.
  if appContext._uiRuntime != nil {
    return
  }
  let uiRuntime = try factory(appContext, holder, runtime)

  try JavaScriptActor.assumeIsolated {
    try appContext.attach(runtime: uiRuntime)
  }
  appContext._uiRuntime = uiRuntime
}

@Record
internal struct ExpoModulesCoreVersion {
  var version: String
  var major: Int
  var minor: Int
  var patch: Int
}

@Record
internal struct ViewConfig {
  var validAttributes: [String: Bool]
  var directEventTypes: [String: DirectEventType]
}

@Record
internal struct DirectEventType {
  var registrationName: String
}

internal final class WorkletUIRuntimeException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot find UI worklet runtime"
  }
}
