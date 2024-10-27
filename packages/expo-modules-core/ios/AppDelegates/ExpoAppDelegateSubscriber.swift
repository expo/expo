// Copyright 2018-present 650 Industries. All rights reserved.

/**
 Base class for app delegate subscribers. Ensures the class
 inherits from `UIResponder` and has `required init()` initializer.
 */
@objc(EXBaseAppDelegateSubscriber)
open class BaseExpoAppDelegateSubscriber: UIResponder {
  public override required init() {
    super.init()
  }

  #if os(macOS)
  @available(*, unavailable)
  public required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  #endif // os(macOS)
}

/**
 Typealias to `UIApplicationDelegate` protocol.
 Might be useful for compatibility reasons if we decide to add more things here.
 */
@objc(EXAppDelegateSubscriberProtocol)
public protocol ExpoAppDelegateSubscriberProtocol: UIApplicationDelegate {
  @objc optional func customizeRootView(_ rootView: UIView)
}

/**
 Typealias merging the base class for app delegate subscribers and protocol inheritance to `UIApplicationDelegate`.
 */
public typealias ExpoAppDelegateSubscriber = BaseExpoAppDelegateSubscriber & ExpoAppDelegateSubscriberProtocol
