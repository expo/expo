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
  public required init?(coder: NSCoder) {
    super.init(coder: coder)
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

  /**
   Function that is called automatically by the `ExpoAppDelegate` once the subscriber is successfully registered.
   If the subscriber is loaded from the modules provider, it is executed just before the main code of the app,
   thus even before any other `UIApplicationDelegate` function. Use it if your subscriber needs to run some code as early as possible,
   but keep in mind that this affects the application loading time.
   */
  @objc optional func subscriberDidRegister()
}

/**
 Typealias merging the base class for app delegate subscribers and protocol inheritance to `UIApplicationDelegate`.
 */
public typealias ExpoAppDelegateSubscriber = BaseExpoAppDelegateSubscriber & ExpoAppDelegateSubscriberProtocol
