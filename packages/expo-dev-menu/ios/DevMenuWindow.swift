// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit
import React

#if os(tvOS)
protocol PresentationControllerDelegate: AnyObject {
}
#else
protocol PresentationControllerDelegate: UISheetPresentationControllerDelegate {
}
#endif
class DevMenuWindow: UIWindow, PresentationControllerDelegate {
  private let manager: DevMenuManager
  private let devMenuViewController: DevMenuViewController
  private var isPresenting = false
  private var isDismissing = false

  required init(manager: DevMenuManager) {
    self.manager = manager
    self.devMenuViewController = DevMenuViewController(manager: manager)

    super.init(frame: UIScreen.main.bounds)

    self.rootViewController = UIViewController()
    self.backgroundColor = UIColor(white: 0, alpha: 0.4)
    #if os(tvOS)
    self.windowLevel = .normal
    #else
    self.windowLevel = .statusBar
    #endif
    self.isHidden = true
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func becomeKey() {
    super.becomeKey()
    if !isPresenting && !isDismissing {
      presentDevMenu()
    }
  }

  private func presentDevMenu() {
    guard !isPresenting && !isDismissing else {
      return
    }

    guard let rootVC = self.rootViewController, rootVC.presentedViewController == nil else {
      return
    }

    guard rootVC.isViewLoaded && rootVC.view.window != nil else {
      return
    }

    isPresenting = true
    #if os(tvOS)
    devMenuViewController.modalPresentationStyle = .automatic
    #else
    devMenuViewController.modalPresentationStyle = .pageSheet
    #endif

    #if os(tvOS)
    #else
    if #available(iOS 15.0, *) {
      if let sheet = devMenuViewController.sheetPresentationController {
        if #available(iOS 16.0, *) {
          sheet.detents = [
            .custom(resolver: { context in
              return context.maximumDetentValue * 0.6
            }),
            .large()
          ]
        } else {
          sheet.detents = [.medium(), .large()]
        }

        sheet.largestUndimmedDetentIdentifier = .large
        sheet.prefersEdgeAttachedInCompactHeight = true
        sheet.delegate = self
      }
    }
    #endif

    rootVC.present(devMenuViewController, animated: true) { [weak self] in
      self?.isPresenting = false
    }
  }

  func closeBottomSheet(_ completion: (() -> Void)? = nil) {
    guard !isDismissing && !isPresenting else {
      return
    }
    isDismissing = true

    resetScrollPosition()
    UIView.animate(withDuration: 0.3) {
      self.backgroundColor = .clear
    }

    devMenuViewController.dismiss(animated: true) {
      self.isDismissing = false
      self.isHidden = true
      self.backgroundColor = UIColor(white: 0, alpha: 0.4)
      completion?()
    }
  }

  private func resetScrollPosition() {
    if let scrollView = findScrollView(in: devMenuViewController.view) {
      scrollView.setContentOffset(.zero, animated: false)
    }
  }

  private func findScrollView(in view: UIView) -> UIScrollView? {
    if let scrollView = view as? UIScrollView {
      return scrollView
    }

    for subview in view.subviews {
      if let scrollView = findScrollView(in: subview) {
        return scrollView
      }
    }

    return nil
  }

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let view = super.hitTest(point, with: event)
    if view == self.rootViewController?.view && event?.type == .touches {
      manager.hideMenu()
      return self.rootViewController?.view
    }
    return view
  }

  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    manager.hideMenu()
  }
}
