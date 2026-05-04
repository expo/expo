// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import React
import ExpoModulesCore

class DevMenuPackagerConnectionHandler {
  weak var manager: DevMenuManager?
  private static var suppressRNDevMenu = true

  init(manager: DevMenuManager) {
    self.manager = manager
  }

  func setup() {
    // `RCT_DEV` isn't available in Swift, that's why we used `DEBUG` instead.
    // It shouldn't diverge, because of the definition of `RCT_DEV`.
#if DEBUG
    self.swizzleRCTDevMenuShow()

    DispatchQueue.main.async { [weak self] in
      guard let self, let manager = self.manager else { return }

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

  private func swizzleRCTDevMenuShow() {
    // [@alan] HACK: We are only doing this to prevent the RN dev menu from showing except when called from
    // our dev menu. Without this, it will still respond to commands coming from the packager. I could not
    // find an easier way to do this until we have a proper api.
    guard let devMenuClass = NSClassFromString("RCTDevMenu") else {
      return
    }
    let originalSelector = NSSelectorFromString("show")
    guard let originalMethod = class_getInstanceMethod(devMenuClass, originalSelector) else {
      return
    }

    let originalImplementation = method_getImplementation(originalMethod)

    let block: @convention(block) (AnyObject) -> Void = { devMenuInstance in
      if DevMenuPackagerConnectionHandler.suppressRNDevMenu {
        return
      }

      typealias ShowFunction = @convention(c) (AnyObject, Selector) -> Void
      let showFunc = unsafeBitCast(originalImplementation, to: ShowFunction.self)
      showFunc(devMenuInstance, originalSelector)
    }

    let blockImpl = imp_implementationWithBlock(block)
    method_setImplementation(originalMethod, blockImpl)
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
      devDelegate.reload()
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

  static func allowRNDevMenuTemporarily() {
    suppressRNDevMenu = false
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
      suppressRNDevMenu = true
    }
  }
}
