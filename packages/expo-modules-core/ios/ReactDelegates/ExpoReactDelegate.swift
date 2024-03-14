// Copyright 2018-present 650 Industries. All rights reserved.

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
  public func createReactRootView(
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView {
    return self.handlers.lazy
      .compactMap { $0.createReactRootView(reactDelegate: self, moduleName: moduleName, initialProperties: initialProperties, launchOptions: launchOptions) }
      .first(where: { _ in true }) ?? ExpoReactRootViewFactory.createDefaultReactRootView(nil, moduleName: moduleName, initialProperties: initialProperties)
  }

  @objc
  public func createRootViewController() -> UIViewController {
    return self.handlers.lazy
      .compactMap { $0.createRootViewController(reactDelegate: self) }
      .first(where: { _ in true }) ?? UIViewController()
  }
}
