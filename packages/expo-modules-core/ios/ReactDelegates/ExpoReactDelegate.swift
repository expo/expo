// Copyright 2018-present 650 Industries. All rights reserved.

import React_RCTAppDelegate

/**
 An extensible react instance creation delegate. This class will loop through each `ExpoReactDelegateHandler` to determine the winner to create the instance.
 */
@objc(EXReactDelegate)
public class ExpoReactDelegate: NSObject {
  private let handlers: [ExpoReactDelegateHandler]

  public init(handlers: [ExpoReactDelegateHandler]) {
    self.handlers = handlers
  }

  @objc
  public func createReactHost(withBundleURL bundleURL: URL?, launchOptions: [UIApplication.LaunchOptionsKey : Any]?) -> ExpoReactHostWrapper {
    self.handlers.forEach { $0.hostWillCreate() }
    let result = self.handlers.lazy
      .compactMap { $0.createReactHost(reactDelegate: self, launchOptions: launchOptions) }
      .first(where: { _ in true }) ?? ExpoReactRootViewFactory.createReactHost(withBundleURL: bundleURL, launchOptions: launchOptions)
    self.handlers.forEach { $0.hostDidCreate(reactHost: result) }
    return result
  }

  @objc
  public func createRootView(
    host: ExpoReactHostWrapper,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?
  ) -> UIView {
    return self.handlers.lazy
      .compactMap { $0.createRootView(reactDelegate: self, host: host, moduleName: moduleName, initialProperties: initialProperties) }
      .first(where: { _ in true }) ?? ExpoReactRootViewFactory.createRootView(host, moduleName: moduleName, initialProperties: initialProperties)
  }

  @objc
  public func createRootViewController() -> UIViewController {
    return self.handlers.lazy
      .compactMap { $0.createRootViewController(reactDelegate: self) }
      .first(where: { _ in true }) ?? UIViewController()
  }
}
