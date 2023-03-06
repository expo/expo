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
          let command = params["name"] as? String,
          let bridge = manager.currentBridge
    else {
      return
    }

    let devDelegate = DevMenuDevOptionsDelegate(forBridge: bridge)

    switch command {
    case "reload":
      devDelegate.reload()
    case "toggleDevMenu":
      self.manager?.toggleMenu()
    case "toggleRemoteDebugging":
      devDelegate.toggleRemoteDebugging()
    case "toggleElementInspector":
      devDelegate.toggleElementInsector()
    case "togglePerformanceMonitor":
      devDelegate.togglePerformanceMonitor()
    case "reconnectReactDevTools":
      // Emit the `RCTDevMenuShown` for the app to reconnect react-devtools
      // https://github.com/facebook/react-native/blob/22ba1e45c52edcc345552339c238c1f5ef6dfc65/Libraries/Core/setUpReactDevTools.js#L80
      bridge.enqueueJSCall("RCTNativeAppEventEmitter.emit", args: ["RCTDevMenuShown"])
    default:
      NSLog("Unknown command from packager: %@", command)
    }
  }

  @objc
  func devMenuNotificationHanlder(_ parames: [String: Any]) {
    self.manager?.toggleMenu()
  }
}
