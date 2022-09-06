// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

class DevMenuViewController: UIViewController {
  static let JavaScriptDidLoadNotification = Notification.Name("RCTJavaScriptDidLoadNotification")
  static let ContentDidAppearNotification = Notification.Name("RCTContentDidAppearNotification")

  private let manager: DevMenuManager
  private var reactRootView: DevMenuRootView?
  private var hasCalledJSLoadedNotification: Bool = false

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
    reactRootView?.appProperties = initialProps()
  }

  // MARK: UIViewController

  override func viewDidLoad() {
    super.viewDidLoad()
    maybeRebuildRootView()
  }

  override func viewWillLayoutSubviews() {
    super.viewWillLayoutSubviews()
    reactRootView?.frame = CGRect(x: 0, y: 0, width: view.frame.size.width, height: view.frame.size.height)
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    forceRootViewToRenderHack()
    reactRootView?.becomeFirstResponder()
  }

  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    get {
      return UIInterfaceOrientationMask.all
    }
  }

  @available(iOS 12.0, *)
  override var overrideUserInterfaceStyle: UIUserInterfaceStyle {
    get {
      return manager.userInterfaceStyle
    }
    set {}
  }

  // MARK: private

  private func initialProps() -> [String: Any] {
    let isSimulator = TARGET_IPHONE_SIMULATOR > 0
    
    return [
      "showOnboardingView": manager.shouldShowOnboarding(),
      "appInfo": manager.getAppInfo(),
      "devSettings": manager.getDevSettings(),
      "menuPreferences": DevMenuPreferences.serialize(),
      "uuid": UUID.init().uuidString,
      "isDevice": !isSimulator,
      "registeredCallbacks": manager.registeredCallbacks
    ]
  }

  // RCTRootView assumes it is created on a loading bridge.
  // in our case, the bridge has usually already loaded. so we need to prod the view.
  private func forceRootViewToRenderHack() {
    if !hasCalledJSLoadedNotification, let bridge = manager.appInstance.bridge {
      let notification = Notification(name: DevMenuViewController.JavaScriptDidLoadNotification, object: nil, userInfo: ["bridge": bridge])

      reactRootView?.javaScriptDidLoad(notification)
      hasCalledJSLoadedNotification = true
    }
  }

  private func maybeRebuildRootView() {
    guard let bridge = manager.appInstance.bridge else {
      return
    }
    if reactRootView?.bridge != bridge {
      if reactRootView != nil {
        reactRootView?.removeFromSuperview()
        reactRootView = nil
      }
      hasCalledJSLoadedNotification = false
      reactRootView = DevMenuRootView(bridge: bridge, moduleName: "main", initialProperties: initialProps())
      reactRootView?.frame = view.bounds
      reactRootView?.backgroundColor = UIColor.clear

      if isViewLoaded, let reactRootView = reactRootView {
        view.addSubview(reactRootView)
        view.setNeedsLayout()
      }
    } else {
      updateProps()
    }
  }
}
