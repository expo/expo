// Copyright 2015-present 650 Industries. All rights reserved.

internal import React
import Foundation
import ExpoModulesJSI

// The core module that describes the `global.expo` object.
@ExpoModule
internal final class CoreModule: Module {
  @JS
  let expoModulesCoreVersion: ExpoModulesCoreVersion = {
    let version = CoreModuleHelper.getVersion()
    let components = version.split(separator: "-")[0].split(separator: ".").compactMap { Int($0) }

    return ExpoModulesCoreVersion(
      version: version,
      major: components[0],
      minor: components[1],
      patch: components[2]
    )
  }()

  @JS
  let cacheDir: String = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.path ?? ""

  @JS
  let documentsDir: String = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.path ?? ""

  @JS
  let isRunningOnQuest: Bool = false

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
    let moduleHolder = appContext?.moduleRegistry.get(moduleHolderForName: getHolderName(moduleName))

    guard let viewDefinition = moduleHolder?.definition.views[viewName ?? DEFAULT_MODULE_VIEW] else {
      return nil
    }
    for propName in viewDefinition.getSupportedPropNames() {
      validAttributes[propName] = true
    }
    for eventName in viewDefinition.getSupportedEventNames() {
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

  @JS
  func reloadAppAsync(reason: String) async {
    appContext?.reloadAppAsync(reason)
  }

  private func getHolderName(_ viewName: String) -> String {
    if let appIdentifier = appContext?.appIdentifier, viewName.hasSuffix("_\(appIdentifier)") {
      return String(viewName.dropLast("_\(appIdentifier)".count))
    }

    return viewName
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

    // The runtime is created and stored on the main thread: setting `_uiRuntime` prepares it there.
    // `DispatchQueue.main.sync` doesn't escape its closure and rethrows, so the closure can borrow the
    // holder and the error reaches the caller directly.
    if Thread.isMainThread {
      appContext._uiRuntime = try factory(appContext, uiRuntimeHolder, runtime)
    } else {
      try DispatchQueue.main.sync {
        appContext._uiRuntime = try factory(appContext, uiRuntimeHolder, runtime)
      }
    }
  }
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
