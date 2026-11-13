// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
#if os(iOS) || os(tvOS)
import UIKit

class DevMenuTouchInterceptor {
  static private var windowObserver: NSObjectProtocol?

  /**
   Returns bool value whether the dev menu touch gestures are being intercepted.
   */
  static var isInstalled: Bool = false {
    didSet {
      if isInstalled {
        observeWindows()
      }
      for window in connectedWindows() {
        updateRecognizer(in: window)
      }
    }
  }

  static private func observeWindows() {
    guard windowObserver == nil else {
      return
    }
    windowObserver = NotificationCenter.default.addObserver(
      forName: UIWindow.didBecomeVisibleNotification,
      object: nil,
      queue: .main
    ) { notification in
      if let window = notification.object as? UIWindow {
        updateRecognizer(in: window)
      }
    }
  }

  static private func updateRecognizer(in window: UIWindow) {
    if let recognizer = window.gestureRecognizers?.first(where: { $0 is DevMenuGestureRecognizer }) {
      recognizer.isEnabled = isInstalled
    } else if isInstalled {
      window.addGestureRecognizer(DevMenuGestureRecognizer())
    }
  }

  static private func connectedWindows() -> [UIWindow] {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
  }
}

#endif
