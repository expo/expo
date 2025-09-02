// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

class DevMenuGestureRecognizerDelegate {
  /**
    Handler for three-finger long press gesture.
  */
  @objc
  func handleLongPress(_ gestureReconizer: UILongPressGestureRecognizer) {
    if gestureReconizer.state == UIGestureRecognizer.State.began {
      if DevMenuManager.shared.toggleMenu() {
        #if !os(tvOS)
        let feedback = UIImpactFeedbackGenerator(style: .light)
        feedback.prepare()
        feedback.impactOccurred()
        #endif
      }
      cancelGesture(gestureReconizer)
    }
  }

  /**
   Use a trick that cancels a gesture.
  */
  private func cancelGesture(_ gestureReconizer: UILongPressGestureRecognizer) {
    gestureReconizer.isEnabled = false
    gestureReconizer.isEnabled = true
  }
}

class DevMenuGestureRecognizer: UILongPressGestureRecognizer {
  static fileprivate let gestureDelegate = DevMenuGestureRecognizerDelegate()

  init() {
    super.init(target: DevMenuGestureRecognizer.gestureDelegate, action: #selector(DevMenuGestureRecognizer.gestureDelegate.handleLongPress(_:)))

    #if os(tvOS)
    minimumPressDuration = 2.0
    #else
    numberOfTouchesRequired = 3
    minimumPressDuration = 0.5
    #endif
    allowableMovement = 30
  }
}
