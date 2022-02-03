// Copyright 2018-present 650 Industries. All rights reserved.

import UIKit

/**
 Base class for app delegate subscribers. Ensures the class
 inherits from `UIResponder` and has `required init()` initializer.
 */
@objc(EXBaseAppDelegateSubscriber)
open class BaseExpoAppDelegateSubscriber: UIResponder {
  public override required init() {}
}

/**
 Typealias to `UIApplicationDelegate` protocol.
 Might be useful for compatibility reasons if we decide to add more things here.
 */
@objc(EXAppDelegateSubscriberProtocol)
public protocol ExpoAppDelegateSubscriberProtocol: UIApplicationDelegate {}

/**
 Typealias merging the base class for app delegate subscribers and protocol inheritance to `UIApplicationDelegate`.
 */
public typealias ExpoAppDelegateSubscriber = BaseExpoAppDelegateSubscriber & ExpoAppDelegateSubscriberProtocol
