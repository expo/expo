// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
#if os(iOS) || os(tvOS)
import UIKit

class DevMenuTouchInterceptor {
  static fileprivate let recognizer: DevMenuGestureRecognizer = DevMenuGestureRecognizer()

  /**
   Returns bool value whether the dev menu touch gestures are being intercepted.
   */
  static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        let newValue = newValue
        let block = {
          if newValue {
            // Add the gesture recognizer to the current key window.
            addRecognizerToKeyWindow()
            // Observe future key window changes to keep the recognizer on the active window.
            NotificationCenter.default.addObserver(
              DevMenuTouchInterceptor.self,
              selector: #selector(windowDidBecomeKey(_:)),
              name: UIWindow.didBecomeKeyNotification,
              object: nil
            )
          } else {
            // Remove the gesture recognizer and stop observing.
            recognizer.view?.removeGestureRecognizer(recognizer)
            NotificationCenter.default.removeObserver(
              DevMenuTouchInterceptor.self,
              name: UIWindow.didBecomeKeyNotification,
              object: nil
            )
          }

          // Make sure recognizer is enabled/disabled accordingly.
          recognizer.isEnabled = newValue
        }

        if Thread.isMainThread {
          block()
        } else {
          DispatchQueue.main.async(execute: block)
        }
      }
    }
  }

  @objc static func windowDidBecomeKey(_ notification: Notification) {
    guard let newKeyWindow = notification.object as? UIWindow,
          // Only attach to normal-level app windows; skip system overlays (keyboard, alerts, etc.).
          newKeyWindow.windowLevel == .normal,
          // Do not move the recognizer to the dev menu's own overlay window.
          !(newKeyWindow is DevMenuWindow) else {
      return
    }
    if recognizer.view != newKeyWindow {
      recognizer.view?.removeGestureRecognizer(recognizer)
      newKeyWindow.addGestureRecognizer(recognizer)
    }
  }

  private static func addRecognizerToKeyWindow() {
    // Find the current key window at normal window level, excluding dev menu overlay windows.
    let keyWindow = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first(where: { $0.isKeyWindow && $0.windowLevel == .normal && !($0 is DevMenuWindow) })

    if let window = keyWindow, recognizer.view != window {
      recognizer.view?.removeGestureRecognizer(recognizer)
      window.addGestureRecognizer(recognizer)
    }
  }
}

#endif
