// Copyright 2018-present 650 Industries. All rights reserved.

/**
 An extensible react instance creation delegate. This class will loop through each `ExpoReactDelegateHandler` to determine the winner to create the instance.
 */
@objc(EXReactDelegate)
public class ExpoReactDelegate: NSObject {
  private let handlers: [ExpoReactDelegateHandler]
  public let reactNativeFactory: ExpoReactNativeFactoryProtocol

  public init(handlers: [ExpoReactDelegateHandler], reactNativeFactory: ExpoReactNativeFactoryProtocol) {
    self.handlers = handlers
    self.reactNativeFactory = reactNativeFactory
  }

  @objc
  public func createReactRootView(
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView {
    return self.handlers
      .compactMap { $0.createReactRootView(reactDelegate: self, moduleName: moduleName, initialProperties: initialProperties, launchOptions: launchOptions) }
      .first(where: { _ in true })
      ?? {
        guard let appDelegate = (UIApplication.shared.delegate as? (any ReactNativeFactoryProvider)) ??
          ((UIApplication.shared.delegate as? NSObject)?.value(forKey: "_expoAppDelegate") as? (any ReactNativeFactoryProvider)) else {
          return reactNativeFactory.recreateRootView(withBundleURL: nil, moduleName: moduleName, initialProps: initialProperties, launchOptions: launchOptions)
        }

        return appDelegate.recreateRootView(
          withBundleURL: nil,
          moduleName: moduleName,
          initialProps: initialProperties,
          launchOptions: launchOptions
        )
      }()
  }

  @objc
  public func bundleURL() -> URL? {
    return self.handlers.lazy
      .compactMap { $0.bundleURL(reactDelegate: self) }
      .first(where: { _ in true })
  }

  @objc
  public func createRootViewController() -> UIViewController {
    return self.handlers.lazy
      .compactMap { $0.createRootViewController() }
      .first(where: { _ in true }) ?? UIViewController()
  }
}
