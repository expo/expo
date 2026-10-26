// Copyright 2015-present 650 Industries. All rights reserved.

#if !os(macOS) && !os(tvOS)

import ExpoModulesCore
import UIKit
import SwiftUI

/// A passthrough window that hosts the floating action button.
class DevMenuFABWindow: UIWindow {
  private weak var manager: DevMenuManager?
  private var hostingController: UIHostingController<DevMenuFABView>?
  var fabFrame: CGRect = .zero
  private var currentAnimator: UIViewPropertyAnimator?
  private var targetVisibility: Bool?
  private var appWindowFrameObservation: NSKeyValueObservation?

  init(manager: DevMenuManager, windowScene: UIWindowScene) {
    self.manager = manager
    super.init(windowScene: windowScene)
    setupWindow()
    observeAppWindowRotation(in: windowScene)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func setupWindow() {
    windowLevel = UIWindow.Level.statusBar - 1
    backgroundColor = .clear
    isHidden = true
    alpha = 0

    let fabView = DevMenuFABView(
      onOpenMenu: { [weak self] in
        self?.manager?.openMenu()
      },
      onFrameChange: { [weak self] frame in
        self?.fabFrame = frame
      }
    )

    let hostingController = UIHostingController(rootView: fabView)
    hostingController.view.backgroundColor = .clear
    self.hostingController = hostingController
    rootViewController = hostingController
  }

  // react-native-screens rotates only the app window, and UIKit does not ask this overlay for its orientations again.
  // The scene would then report the overlay's old orientation, and react-native-screens would skip the next rotation.
  private func observeAppWindowRotation(in windowScene: UIWindowScene) {
    guard let appWindow = windowScene.windows.first(where: { $0.windowLevel == .normal }) else {
      return
    }
    appWindowFrameObservation = appWindow.observe(\.frame, options: [.old, .new]) { [weak self] _, change in
      guard let old = change.oldValue, let new = change.newValue,
        (old.width > old.height) != (new.width > new.height) else {
        return
      }
      self?.hostingController?.setNeedsUpdateOfSupportedInterfaceOrientations()
    }
  }

  private var edgeTranslation: CGAffineTransform {
    let availableWidth = SceneGeometry.bounds(for: self).width
    let isOnRight = fabFrame == .zero || fabFrame.midX > (availableWidth / 2)
    let dx: CGFloat = isOnRight ? 60 : -60
    return CGAffineTransform(translationX: dx, y: 0)
  }

  func setVisible(_ visible: Bool, animated: Bool = true) {
    // Skip if already animating to the same state
    if targetVisibility == visible {
      return
    }

    // Cancel any in-progress animation and reset to clean state
    if currentAnimator != nil {
      currentAnimator?.stopAnimation(true)
      currentAnimator = nil
      transform = .identity
    }

    targetVisibility = visible

    if visible {
      isHidden = false
      alpha = 0
      transform = edgeTranslation

      let animator = UIViewPropertyAnimator(duration: animated ? 0.5 : 0, dampingRatio: 0.6) {
        self.alpha = 1
        self.transform = .identity
      }
      animator.addCompletion { [weak self] _ in
        self?.targetVisibility = nil
      }
      currentAnimator = animator
      animator.startAnimation()
    } else {
      let animator = UIViewPropertyAnimator(duration: animated ? 0.3 : 0, dampingRatio: 0.8) {
        self.alpha = 0
        self.transform = self.edgeTranslation
      }
      animator.addCompletion { [weak self] position in
        self?.targetVisibility = nil
        if position == .end {
          self?.isHidden = true
          self?.transform = .identity
        }
      }
      currentAnimator = animator
      animator.startAnimation()
    }
  }

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let hitArea = fabFrame.insetBy(dx: -10, dy: -10)
    if hitArea.contains(point) {
      return super.hitTest(point, with: event)
    }

    return nil
  }
}

#endif
