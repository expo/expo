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

  #if os(iOS) || os(tvOS)
  @objc
  public func createReactRootView(
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView {
    return self.handlers.lazy
      .compactMap { $0.createReactRootView(reactDelegate: self, moduleName: moduleName, initialProperties: initialProperties, launchOptions: launchOptions) }
      .first(where: { _ in true })
      ?? {
        // TODO: Untill we can extract the target from EXAppDelegateWrapper
        class DummySelectorHandler: NSObject { @objc func dummyMethod() {} }

        guard let expoAppInstance = (UIApplication.shared.delegate as? ExpoAppInstance) ??
          // todo: Remove when EXAppDelegateWrapper is removed
          (UIApplication.shared.delegate as? EXAppDelegateWrapper)?.forwardingTarget(for: #selector(DummySelectorHandler().dummyMethod)) as? ExpoAppInstance else {
            fatalError("The `UIApplication.shared.delegate` is neither an `ExpoAppInstance` nor an `EXAppDelegateWrapper`.")
        }
        return expoAppInstance.recreateRootView(
          withBundleURL: nil,
          moduleName: moduleName,
          initialProps: initialProperties,
          launchOptions: launchOptions
        )
      }()
  }
  #elseif os(macOS)
  @objc
  public func createReactRootView(
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView {
    return UIView()
  }
  #endif

  @objc
  public func bundleURL() -> URL? {
    return self.handlers.lazy
      .compactMap { $0.bundleURL(reactDelegate: self) }
      .first(where: { _ in true })
  }

  @objc
  public func createRootViewController() -> UIViewController {
    return self.handlers.lazy
      .compactMap { $0.createRootViewController(reactDelegate: self) }
      .first(where: { _ in true }) ?? UIViewController()
  }
}
