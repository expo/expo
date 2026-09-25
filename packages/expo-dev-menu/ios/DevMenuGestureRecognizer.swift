// Copyright 2015-present 650 Industries. All rights reserved.
#if os(iOS) || os(tvOS)

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
    cancelsTouchesInView = false
    delaysTouchesBegan = false
    delaysTouchesEnded = false
  }

  // Never prevent other gesture recognizers from recognizing.
  override func canPrevent(_ preventedGestureRecognizer: UIGestureRecognizer) -> Bool {
    return false
  }

  override func canBePrevented(by preventingGestureRecognizer: UIGestureRecognizer) -> Bool {
    return false
  }

  #if !os(tvOS)
  // Fail immediately when the initial touch count is below the required
  // threshold. This removes the recognizer from UIKit's gesture resolution
  // pipeline for single- and double-finger interactions (like the zoom
  // dismiss transition), preventing it from interfering with their animations.
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    super.touchesBegan(touches, with: event)
    let touchCount = event.allTouches?.count ?? touches.count
    if touchCount < numberOfTouchesRequired {
      state = .failed
    }
  }
  #endif
}

#endif
