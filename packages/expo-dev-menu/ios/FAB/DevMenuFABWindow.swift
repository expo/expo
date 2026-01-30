// Copyright 2015-present 650 Industries. All rights reserved.

#if !os(macOS) && !os(tvOS)

import UIKit
import SwiftUI

/// A passthrough window that hosts the floating action button.
class DevMenuFABWindow: UIWindow {
  private weak var manager: DevMenuManager?
  private var hostingController: UIHostingController<DevMenuFABView>?
  var fabFrame: CGRect = .zero

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
    if visible {
      isHidden = false
      if animated {
        alpha = 0
        transform = edgeTranslation
        UIView.animate(
          withDuration: 0.5,
          delay: 0,
          usingSpringWithDamping: 0.6,
          initialSpringVelocity: 0.8,
          options: .curveEaseOut
        ) {
          self.alpha = 1
          self.transform = .identity
        }
      } else {
        alpha = 1
        transform = .identity
      }
    } else {
      if animated {
        UIView.animate(
          withDuration: 0.4,
          delay: 0,
          usingSpringWithDamping: 0.6,
          initialSpringVelocity: 0.8,
          options: .curveEaseIn
        ) {
          self.alpha = 0
          self.transform = self.edgeTranslation
        } completion: { _ in
          self.isHidden = true
          self.transform = .identity
        }
      } else {
        alpha = 0
        isHidden = true
      }
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
