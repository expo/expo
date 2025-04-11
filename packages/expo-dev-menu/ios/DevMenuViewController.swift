// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit
import React

class DevMenuViewController: UIViewController {
  static let JavaScriptDidLoadNotification = Notification.Name("RCTJavaScriptDidLoadNotification")
  static let ContentDidAppearNotification = Notification.Name("RCTContentDidAppearNotification")

  private let manager: DevMenuManager
  private var reactRootView: UIView?

  init(manager: DevMenuManager) {
    self.manager = manager

    super.init(nibName: nil, bundle: nil)
    edgesForExtendedLayout = UIRectEdge.init(rawValue: 0)
    extendedLayoutIncludesOpaqueBars = true
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func updateProps() {
    if let reactRootView = reactRootView as? RCTRootView {
      reactRootView.appProperties = initialProps()
    } else if let reactRootView = reactRootView as? RCTSurfaceHostingProxyRootView {
      reactRootView.appProperties = initialProps()
    }
  }

  // MARK: UIViewController

  override func viewDidLoad() {
    super.viewDidLoad()
    rebuildRootView()
  }

  override func viewWillLayoutSubviews() {
    super.viewWillLayoutSubviews()
    reactRootView?.frame = CGRect(x: 0, y: 0, width: view.frame.size.width, height: view.frame.size.height)
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    reactRootView?.becomeFirstResponder()
  }

  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    get {
      return UIInterfaceOrientationMask.all
    }
  }

  override var overrideUserInterfaceStyle: UIUserInterfaceStyle {
    get {
      return manager.userInterfaceStyle
    }
    set {}
  }

  // MARK: private

  private func initialProps() -> [String: Any] {
#if targetEnvironment(simulator)
    let isSimulator = true
#else
    let isSimulator = false
#endif

    return [
      "showOnboardingView": manager.shouldShowOnboarding(),
      "appInfo": manager.getAppInfo(),
      "devSettings": manager.getDevSettings(),
      "menuPreferences": DevMenuPreferences.serialize(),
      "uuid": UUID.init().uuidString,
      "isDevice": !isSimulator,
      "registeredCallbacks": manager.registeredCallbacks.map { $0.name }
    ]
  }

  private func rebuildRootView() {
    reactRootView = manager.appInstance.reactNativeFactory?.rootViewFactory.view(withModuleName: "main", initialProperties: initialProps())
    reactRootView?.frame = view.bounds
    reactRootView?.backgroundColor = UIColor { (traitCollection: UITraitCollection) -> UIColor in
      if traitCollection.userInterfaceStyle == .dark {
        return  UIColor(red: 22 / 255.0, green: 27 / 255.0, blue: 34 / 255.0, alpha: 1)
      }

      return UIColor.clear
    }

    if isViewLoaded, let reactRootView = reactRootView {
      view.addSubview(reactRootView)
      view.setNeedsLayout()
    }
  }
}
