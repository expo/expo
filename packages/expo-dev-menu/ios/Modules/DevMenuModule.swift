// Copyright 2015-present 650 Industries. All rights reserved.
import ExpoModulesCore

open class DevMenuModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDevMenu")

    // MARK: JavaScript API
    AsyncFunction("openMenu") {
      DevMenuManager.shared.openMenu()
    }

    AsyncFunction("closeMenu") {
      DevMenuManager.shared.closeMenu()
    }

    AsyncFunction("hideMenu") {
      DevMenuManager.shared.hideMenu()
    }

    AsyncFunction("addDevMenuCallbacks") { (callbacks: [[String: Any]]) in
      DevMenuManager.shared.registeredCallbacks.removeAll()

      callbacks.forEach { callback in
        guard let name = callback["name"] as? String else {
          return
        }

        let type = callback["type"] as? String ?? "action"
        let value = callback["value"] as? Bool ?? false
        let shouldCollapse = callback["shouldCollapse"] as? Bool ?? (type != "toggle")
        DevMenuManager.shared.registeredCallbacks.append(
          DevMenuManager.Callback(name: name, shouldCollapse: shouldCollapse, type: type, value: value)
        )
      }
    }
  }

  deinit {
    // cleanup registered callbacks when the bridge is deallocated to prevent these leaking into other (potentially unrelated) bridges
    if DevMenuManager.wasInitilized {
      DevMenuManager.shared.registeredCallbacks = []
    }
  }
}
