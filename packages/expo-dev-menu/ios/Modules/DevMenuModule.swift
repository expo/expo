// Copyright 2015-present 650 Industries. All rights reserved.
import ExpoModulesCore

open class DevMenuModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDevMenu")

    OnCreate {
      DevMenuManager.shared.setAppContext(self.appContext)
    }

    OnDestroy {
      DevMenuManager.shared.clearAppContext(current: self.appContext)
      // Cleanup registered callbacks when the module is destroyed to prevent leaking into other bridges.
      if DevMenuManager.wasInitilized {
        DevMenuManager.shared.registeredCallbacks = []
      }
    }

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

    AsyncFunction("setToolsButtonVisible") { (visible: Bool) in
      DevMenuManager.shared.setShowFloatingActionButton(visible)
    }

    AsyncFunction("addDevMenuCallbacks") { (callbacks: [[String: Any]]) in
      DevMenuManager.shared.registeredCallbacks.removeAll()

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

    AsyncFunction("setAvailableAppKeys") { (keys: [String]) in
      DevMenuManager.shared.availableAppKeys = keys
    }
  }
}
