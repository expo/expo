// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import React

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
