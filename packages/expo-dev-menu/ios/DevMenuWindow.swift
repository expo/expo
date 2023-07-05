// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

private func firstSubview<T: UIView>(_ rootView: UIView, ofType type: T.Type) -> T? {
  var resultView: T?
  for view in rootView.subviews {
    if let view = view as? T {
      resultView = view
      break
    }

    if let foundView = firstSubview(view, ofType: T.self) {
      resultView = foundView
      break
    }
  }
  return resultView
}

class DevMenuWindow: UIWindow, OverlayContainerViewControllerDelegate {
  private let manager: DevMenuManager

  private let bottomSheetController: OverlayContainerViewController
  private let devMenuViewController: DevMenuViewController

  init(manager: DevMenuManager) {
    self.manager = manager
    bottomSheetController = OverlayContainerViewController(style: .flexibleHeight)
    devMenuViewController = DevMenuViewController(manager: manager)

    super.init(frame: UIScreen.main.bounds)

    bottomSheetController.delegate = self
    bottomSheetController.viewControllers = [devMenuViewController]

    self.rootViewController = bottomSheetController
    self.backgroundColor = UIColor(white: 0, alpha: 0.4)
    self.bounds = UIScreen.main.bounds
    self.windowLevel = .statusBar
    self.isHidden = true
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func becomeKey() {
    // We set up the background of the RN root view to mask all artifacts caused by Yoga when the bottom sheet is dragged.
    devMenuViewController.view.backgroundColor = UIColor(red: 0.97, green: 0.97, blue: 0.98, alpha: 1)

    devMenuViewController.updateProps()
    bottomSheetController.moveOverlay(toNotchAt: OverlayNotch.open.rawValue, animated: true)

    setDrivingScrollView()
  }

  // In order to create a smooth interplay between a mobile bottom sheet and scrolling through its contents,
  // the 'drivingScrollView' property must be established. However, it may not be immediately accessible
  // when the menu is first opened. As a result, we schedule a task that periodically verifies the availability of the scroll view.
  // TODO(@lukmccall): find a better way how to detect if the scroll view is available.
  private func setDrivingScrollView() {
    let scrollView = firstSubview(devMenuViewController.view, ofType: UIScrollView.self)
    if scrollView == nil {
      DispatchQueue.main.async {
        self.setDrivingScrollView()
      }
    } else {
      bottomSheetController.drivingScrollView = scrollView
    }
  }

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let view = super.hitTest(point, with: event)
    if view == self {
      bottomSheetController.moveOverlay(toNotchAt: OverlayNotch.hidden.rawValue, animated: true)
    }

    return view == self ? nil : view
  }

  enum OverlayNotch: Int, CaseIterable {
    case hidden, open, fullscreen
  }

  func numberOfNotches(in containerViewController: OverlayContainerViewController) -> Int {
    return OverlayNotch.allCases.count
  }

  func overlayContainerViewController(
    _ containerViewController: OverlayContainerViewController,
    heightForNotchAt index: Int,
    availableSpace: CGFloat
  ) -> CGFloat {
    switch OverlayNotch.allCases[index] {
    case .fullscreen:
    // Before the dev menu is opened for the first time the availableSpace equals zero (correct value is loaded while opening the dev menu).
    // In order to avoid crashing the app because of returning a negative value make sure that the returned value is >= 0.
    return max(availableSpace - 45, 0)
    case .open:
      return availableSpace * 0.6
    case .hidden:
      return 0
    }
  }

  func overlayContainerViewController(
    _ containerViewController: OverlayContainerViewController,
    didMoveOverlay overlayViewController: UIViewController,
    toNotchAt index: Int
  ) {
    if index == OverlayNotch.hidden.rawValue {
      manager.hideMenu()
    }
  }

  func closeBottomSheet(completion: (() -> Void)? = nil) {
    bottomSheetController.moveOverlay(toNotchAt: OverlayNotch.hidden.rawValue, animated: true, completion: completion)
  }
}
