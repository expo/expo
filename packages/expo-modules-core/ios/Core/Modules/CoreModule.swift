// Copyright 2015-present 650 Industries. All rights reserved.

import React
import Foundation

// The core module that describes the `global.expo` object.
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
      DispatchQueue.main.async {
        RCTTriggerReloadCommandListeners(reason)
      }
    }
  }

  private func getHolderName(_ viewName: String) -> String {
    if let appIdentifier = appContext?.appIdentifier, viewName.hasSuffix("_\(appIdentifier)") {
      return String(viewName.dropLast("_\(appIdentifier)".count))
    }

    return viewName
  }
}
