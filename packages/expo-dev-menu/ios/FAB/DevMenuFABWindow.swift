// Copyright 2015-present 650 Industries. All rights reserved.

#if !os(macOS) && !os(tvOS)

import UIKit
import SwiftUI

/// A passthrough window that hosts the floating action button.
class DevMenuFABWindow: UIWindow {
  private weak var manager: DevMenuManager?
  private var hostingController: UIHostingController<DevMenuFABView>?
  var fabFrame: CGRect = .zero
  private var currentAnimator: UIViewPropertyAnimator?
  private var targetVisibility: Bool?

  init(manager: DevMenuManager, windowScene: UIWindowScene) {
    self.manager = manager
    super.init(windowScene: windowScene)
    setupWindow()
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

    recreateFABView()
  }

  /// Recreates the FAB view to pick up new session state.
  /// Called when the FAB becomes visible to ensure it reads current session configuration.
  private func recreateFABView() {
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

  private var edgeTranslation: CGAffineTransform {
    let screenWidth = windowScene?.screen.bounds.width ?? UIScreen.main.bounds.width
    let isOnRight = fabFrame == .zero || fabFrame.midX > (screenWidth / 2)
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
      // Recreate the FAB view to pick up new session state
      // This ensures the FAB reads current session state when switching between apps
      recreateFABView()

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
    if fabFrame.contains(point) {
      return super.hitTest(point, with: event)
    }

    return nil
  }
}

#endif
