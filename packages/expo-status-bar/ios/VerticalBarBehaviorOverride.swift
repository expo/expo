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
 `automatic` defers to UIKit's original implementation, so only `disabled` is forced.
 */
@available(iOS 27.1, tvOS 27.1, *)
@MainActor
enum VerticalBarBehaviorOverride {
  nonisolated(unsafe) private static var forcedBehavior: UIVerticalBarBehavior?
  private static var isInstalled = false

  static func set(_ newValue: VerticalBarBehavior) {
    forcedBehavior = newValue == .disabled ? .disabled : nil
    guard forcedBehavior != nil || isInstalled else {
      return
    }
    install()

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
    let selector = #selector(getter: UIViewController.preferredVerticalBarBehavior)
    guard !isInstalled, let method = class_getInstanceMethod(UIViewController.self, selector) else {
      return
    }
    isInstalled = true
    typealias Getter = @convention(c) (UIViewController, Selector) -> UIVerticalBarBehavior
    let original = unsafeBitCast(method_getImplementation(method), to: Getter.self)
    let implementation: @convention(block) (UIViewController) -> UIVerticalBarBehavior = {
      controller in
      VerticalBarBehaviorOverride.forcedBehavior ?? original(controller, selector)
    }
    method_setImplementation(method, imp_implementationWithBlock(implementation))
  }
}
#endif
