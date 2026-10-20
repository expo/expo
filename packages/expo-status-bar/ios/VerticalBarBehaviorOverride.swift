// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

enum VerticalBarBehavior: String, Enumerable {
  case automatic
  case disabled
}

#if canImport(UIKit, _version: 9127.0.85)
/**
 UIKit reads `preferredVerticalBarBehavior` from the window's root view controller, which React
 Native creates as a plain `UIViewController`. Replacing the base implementation once lets the
 app choose the behavior without a subclass; view controllers that override it keep their own.
 */
@available(iOS 27.1, tvOS 27.1, *)
@MainActor
enum VerticalBarBehaviorOverride {
  nonisolated(unsafe) private static var behavior: UIVerticalBarBehavior = .automatic
  private static var isInstalled = false

  static func set(_ newValue: VerticalBarBehavior) {
    install()
    behavior = newValue == .disabled ? .disabled : .automatic

    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    for window in scenes.flatMap(\.windows) {
      var controller = window.rootViewController
      while let current = controller {
        current.setNeedsUpdateOfVerticalBarConfiguration()
        controller = current.presentedViewController
      }
    }
  }

  private static func install() {
    guard !isInstalled,
      let method = class_getInstanceMethod(
        UIViewController.self,
        #selector(getter: UIViewController.preferredVerticalBarBehavior)
      )
    else {
      return
    }
    isInstalled = true
    let implementation: @convention(block) (UIViewController) -> UIVerticalBarBehavior = { _ in
      VerticalBarBehaviorOverride.behavior
    }
    method_setImplementation(method, imp_implementationWithBlock(implementation))
  }
}
#endif
