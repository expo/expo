// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

class DevMenuGestureRecognizerDelegate {
  /**
    Handler for three-finger long press gesture.
  */
  @objc
  public func handleLongPress(_ gestureReconizer: UILongPressGestureRecognizer) {
    #if !os(tvOS)
    if gestureReconizer.state == UIGestureRecognizer.State.began {
      if DevMenuManager.shared.toggleMenu() {
        let feedback = UIImpactFeedbackGenerator(style: .light)
        feedback.prepare()
        feedback.impactOccurred()
      }
      cancelGesture(gestureReconizer)
    }
    #endif
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
    super.init(target: DevMenuGestureRecognizer.gestureDelegate, action:#selector(DevMenuGestureRecognizer.gestureDelegate.handleLongPress(_:)))
    #if !os(tvOS)

    numberOfTouchesRequired = 3
    minimumPressDuration = 0.5
    allowableMovement = 30
    #endif
  }
}
