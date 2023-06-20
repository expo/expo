// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SafariServices
import React

public class DevMenuInternalModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDevMenuInternal")

    // MARK: JavaScript API
    Constants {
      #if targetEnvironment(simulator)
      let doesDeviceSupportKeyCommands = true
      #else
      let doesDeviceSupportKeyCommands = false
      #endif
      return [
        "doesDeviceSupportKeyCommands": doesDeviceSupportKeyCommands
      ]
    }

    AsyncFunction("fetchDataSourceAsync") { (dataSourceId: String, promise: Promise) in
      for dataSource in DevMenuManager.shared.devMenuDataSources where dataSource.id == dataSourceId {
        dataSource.fetchData { data in
          promise.resolve(data.map { $0.serialize() })
        }
        return
      }

      throw Exception(name: "ERR_DEVMENU_DATA_SOURCE_FAILED", description: "DataSource \(dataSourceId) not found.")
    }

    AsyncFunction("dispatchCallableAsync") { (callableId: String, args: [String: Any]?) in
      DevMenuManager.shared.dispatchCallable(withId: callableId, args: args)
    }

    AsyncFunction("loadFontsAsync") {
      DevMenuManager.shared.loadFonts()
    }

    AsyncFunction("hideMenu") {
      DevMenuManager.shared.hideMenu()
    }

    AsyncFunction("closeMenu") {
      DevMenuManager.shared.closeMenu()
    }

    AsyncFunction("setOnboardingFinished") { (finished: Bool) in
      DevMenuPreferences.isOnboardingFinished = finished
    }

    AsyncFunction("openDevMenuFromReactNative") {
      guard let rctDevMenu = DevMenuManager.shared.currentBridge?.devMenu else {
        return
      }

      DevMenuManager.shared.closeMenu {
        DispatchQueue.main.async {
          rctDevMenu.show()
        }
      }
    }

    AsyncFunction("onScreenChangeAsync") { (currentScreen: String?) in
      DevMenuManager.shared.setCurrentScreen(currentScreen)
    }

    AsyncFunction("fireCallback") { (name: String) in
      guard let callback = DevMenuManager.shared.registeredCallbacks.first(where: { $0.name == name }) else {
        throw Exception(name: "ERR_DEVMENU_ACTION_FAILED", description: "\(name) is not a registered callback")
      }

      DevMenuManager.shared.sendEventToDelegateBridge("registeredCallbackFired", data: name)
      if callback.shouldCollapse {
        DevMenuManager.shared.closeMenu()
      }
    }

    AsyncFunction("copyToClipboardAsync") { (content: String) in
      let clipboard = UIPasteboard.general
      clipboard.string = content as String
    }
  }
}
