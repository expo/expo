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
      callbacks.forEach { callback in
        guard let name = callback["name"] as? String else {
          return
        }

        let shouldCollapse = callback["shouldCollapse"] as? Bool ?? true
        DevMenuManager.shared.registeredCallbacks.append(
          DevMenuManager.Callback(name: name, shouldCollapse: shouldCollapse)
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
