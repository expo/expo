// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import React
import ExpoModulesCore

class DevMenuPackagerConnectionHandler {
  weak var manager: DevMenuManager?

  init(manager: DevMenuManager) {
    self.manager = manager
  }

  func setup() {
    // `RCT_DEV` isn't available in Swift, that's why we used `DEBUG` instead.
    // It shouldn't diverge, because of the definition of `RCT_DEV`.
#if DEBUG
    DispatchQueue.main.async { [weak self] in
      guard let self, let manager = self.manager else { return }
      disableRnDevMenu(manager)

      let devSettings: RCTDevSettings? = manager.currentAppContext?.nativeModule(named: "DevSettings")
// TODO(gabrieldonadel): Remove this once we bump react-native-macos to 0.84
#if !os(macOS)
      let packagerConnection = devSettings?.packagerConnection
#else
      let packagerConnection: RCTPackagerConnection? = RCTPackagerConnection.shared()
#endif
      packagerConnection?.addNotificationHandler(
        self.sendDevCommandNotificationHandler,
        queue: DispatchQueue.main,
        forMethod: "sendDevCommand"
      )

      packagerConnection?.addNotificationHandler(
        self.devMenuNotificationHanlder,
        queue: DispatchQueue.main,
        forMethod: "devMenu"
      )

      // RCTDevSettings starts the packager WS before its bundleManager has a host,
      // leaving the socket on localhost so it can't be reached from a physical device.
      // Reconnect to the bundle URL once AppContext is ready.
      if let bundleURL = manager.currentAppContext?.bundleURL, let host = bundleURL.host {
        let port = bundleURL.port ?? 8081
        packagerConnection?.reconnect("\(host):\(port)")
      }
    }
#endif
  }

  private func disableRnDevMenu(_ manager: DevMenuManager) {
    let rctDevMenu: RCTDevMenu? = manager.currentAppContext?.nativeModule(named: "RCTDevMenu")
    rctDevMenu?.devMenuEnabled = false
    rctDevMenu?.keyboardShortcutsEnabled = false
    DevMenuKeyCommandsInterceptor.reinstall()
  }

  @objc
  func sendDevCommandNotificationHandler(_ params: [String: Any]) {
    guard let manager = manager,
      let command = params["name"] as? String,
      let appContext = manager.currentAppContext
    else {
      return
    }

    let devDelegate = DevMenuDevOptionsDelegate(forAppContext: appContext)

    switch command {
    case "reload":
      manager.reload()
    case "toggleDevMenu":
      self.manager?.toggleMenu()
    case "toggleElementInspector":
      devDelegate.toggleElementInsector()
    case "togglePerformanceMonitor":
      devDelegate.togglePerformanceMonitor()
    default:
      NSLog("Unknown command from packager: %@", command)
    }
  }

  @objc
  func devMenuNotificationHanlder(_ parames: [String: Any]) {
    self.manager?.toggleMenu()
  }
}
