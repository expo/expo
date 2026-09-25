// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
#if os(iOS) || os(tvOS)
import UIKit

class DevMenuTouchInterceptor {
  static fileprivate let recognizer: DevMenuGestureRecognizer = DevMenuGestureRecognizer()
  static private var observers: [NSObjectProtocol] = []

  /**
   Returns bool value whether the dev menu touch gestures are being intercepted.
   */
  static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        // Make sure recognizer is enabled/disabled accordingly.
        recognizer.isEnabled = newValue

        if newValue {
          // Attach to the root view controller's view and observe window/scene
          // changes so we can re-attach when the active window changes.
          attachRecognizerToRootView()
          startObserving()
        } else {
          stopObserving()
          recognizer.view?.removeGestureRecognizer(recognizer)
        }
      }
    }
  }

  static private func attachRecognizerToRootView() {
    guard let rootView = Self.findRootView(), recognizer.view != rootView else {
      return
    }
    recognizer.view?.removeGestureRecognizer(recognizer)
    rootView.addGestureRecognizer(recognizer)
  }

  static private func findRootView() -> UIView? {
    let window = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .filter { $0.activationState == .foregroundActive }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow && !Self.isOverlayWindow($0) }
    return window?.rootViewController?.view
  }

  static private func startObserving() {
    guard observers.isEmpty else { return }

    // Re-attach when a different window becomes key
    observers.append(
      NotificationCenter.default.addObserver(
        forName: UIWindow.didBecomeKeyNotification,
        object: nil,
        queue: .main
      ) { _ in
        if isInstalled {
          attachRecognizerToRootView()
        }
      }
    )

    // Re-attach when a scene activates (e.g. app comes to foreground)
    observers.append(
      NotificationCenter.default.addObserver(
        forName: UIScene.didActivateNotification,
        object: nil,
        queue: .main
      ) { _ in
        if isInstalled {
          attachRecognizerToRootView()
        }
      }
    )
  }

  static private func stopObserving() {
    for observer in observers {
      NotificationCenter.default.removeObserver(observer)
    }
    observers.removeAll()
  }

  static private func isOverlayWindow(_ window: UIWindow) -> Bool {
    if window is DevMenuWindow {
      return true
    }
    #if !os(tvOS)
    if window is DevMenuFABWindow {
      return true
    }
    #endif
    return false
  }
}

#endif
