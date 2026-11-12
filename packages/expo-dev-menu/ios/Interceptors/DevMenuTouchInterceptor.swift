// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
#if os(iOS) || os(tvOS)
import UIKit
import ExpoModulesCore

class DevMenuTouchInterceptor {
  static fileprivate let recognizer: DevMenuGestureRecognizer = DevMenuGestureRecognizer()
  static private var keyWindowObserver: NSObjectProtocol?

  /**
   Returns bool value whether the dev menu touch gestures are being intercepted.
   */
  static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        // Make sure recognizer is enabled/disabled accordingly.
        recognizer.isEnabled = newValue
      }
    }
    didSet {
      if isInstalled {
        observeKeyWindow()
      }
    }
  }

  static private func observeKeyWindow() {
    guard keyWindowObserver == nil else {
      return
    }
    keyWindowObserver = NotificationCenter.default.addObserver(
      forName: UIWindow.didBecomeKeyNotification,
      object: nil,
      queue: .main
    ) { _ in
      attachToKeyWindow()
    }
    attachToKeyWindow()
  }

  static private func attachToKeyWindow() {
    // Moving the recognizer while UIKit processes a touch crashes in iOS 26's gesture system.
    // A window can become key during a touch, so move the recognizer on the next run loop turn.
    DispatchQueue.main.async {
      guard let window = SceneGeometry.keyWindow(), recognizer.view != window else {
        return
      }
      recognizer.view?.removeGestureRecognizer(recognizer)
      window.addGestureRecognizer(recognizer)
    }
  }
}

#endif
