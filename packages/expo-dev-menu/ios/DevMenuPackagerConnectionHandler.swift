// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

class DevMenuPackagerConnectionHandler {
  weak var manager: DevMenuManager?

  init(manager: DevMenuManager) {
    self.manager = manager
  }

  func setup() {
    // `RCT_DEV` isn't available in Swift, that's why we used `DEBUG` instead.
    // It shouldn't diverge, because of the definition of `RCT_DEV`.
#if DEBUG
    RCTPackagerConnection
      .shared()
      .addNotificationHandler(
        self.sendDevCommandNotificationHandler,
        queue: DispatchQueue.main,
        forMethod: "sendDevCommand"
      )

    RCTPackagerConnection
      .shared()
      .addNotificationHandler(
        self.devMenuNotificationHanlder,
        queue: DispatchQueue.main,
        forMethod: "devMenu"
      )
#endif
  }

  @objc
  func sendDevCommandNotificationHandler(_ params: [String: Any]) {
    guard let manager = manager,
          let command = params["name"] as? String
    else {
      return
    }

    let devSettings = DevMenuDevSettings.shared

    switch command {
    case "reload":
      devSettings.reload()
    case "toggleDevMenu":
      manager.toggleMenu()
    case "toggleRemoteDebugging":
      devSettings.toggleRemoteDebugging()
    case "toggleElementInspector":
      devSettings.toggleElementInspector()
    case "togglePerformanceMonitor":
      devSettings.togglePerformanceMonitor()
    default:
      NSLog("Unknown command from packager: %@", command)
    }
  }

  @objc
  func devMenuNotificationHanlder(_ parames: [String: Any]) {
    self.manager?.toggleMenu()
  }
}
