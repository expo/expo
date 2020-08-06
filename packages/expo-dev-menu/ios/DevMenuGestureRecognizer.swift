// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

class DevMenuGestureRecognizer: UILongPressGestureRecognizer {
  init() {
    super.init(target: nil, action: nil)

    numberOfTouchesRequired = 3
    minimumPressDuration = 0.5
    allowableMovement = 30
  }

  // MARK: UIGestureRecognizer

  /**
   Handler for three-finger long press gesture.
   */
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
    super.touchesEnded(touches, with: event)
    if state == .ended {
      generateImpactFeedback()
    }
  }

  // MARK: private

  /**
   Generates light impact feedback to informing the user that the gesture has been completed.
   */
  private func generateImpactFeedback() {
    if state == .began {
      if DevMenuManager.shared.toggleMenu() {
        let feedback = UIImpactFeedbackGenerator(style: .light)
        feedback.prepare()
        feedback.impactOccurred()
      }
      cancelGesture()
    }
  }

  /**
   Use a trick that cancels a gesture.
   */
  private func cancelGesture() {
    isEnabled = false
    isEnabled = true
  }
}
