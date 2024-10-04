// Copyright 2015-present 650 Industries. All rights reserved.

import React

// The core module that describes the `global.expo` object.
internal final class CoreModule: Module {
  internal func definition() -> ModuleDefinition {
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

    Function("getViewConfig") { (viewName: String) -> [String: Any]? in
      var validAttributes: [String: Any] = [:]
      var directEventTypes: [String: Any] = [:]
      let moduleHolder = appContext?.moduleRegistry.get(moduleHolderForName: viewName)

      guard let viewDefinition = moduleHolder?.definition.view else {
        return nil
      }
      for prop in viewDefinition.props {
        validAttributes[prop.name] = true
      }
      for eventName in viewDefinition.eventNames {
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
}
