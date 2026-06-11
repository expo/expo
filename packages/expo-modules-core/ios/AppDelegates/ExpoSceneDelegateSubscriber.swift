// Copyright 2018-present 650 Industries. All rights reserved.

#if os(iOS) || os(tvOS)

/**
 Base class for scene delegate subscribers. Ensures the class
 inherits from `UIResponder` and has `required init()` initializer.
 */
@objc(EXBaseSceneDelegateSubscriber)
open class BaseExpoSceneDelegateSubscriber: UIResponder {
  public override required init() {
    super.init()
  }
}

/**
 Protocol that scene delegate subscribers conform to. Mirrors `UIWindowSceneDelegate`
 so subscribers can react to the UIKit scene-based life cycle the same way app delegate
 subscribers react to `UIApplicationDelegate` events.
 */
@objc(EXSceneDelegateSubscriberProtocol)
public protocol ExpoSceneDelegateSubscriberProtocol: UIWindowSceneDelegate {}

/**
 Typealias merging the base class for scene delegate subscribers and protocol inheritance to `UIWindowSceneDelegate`.
 */
public typealias ExpoSceneDelegateSubscriber = BaseExpoSceneDelegateSubscriber & ExpoSceneDelegateSubscriberProtocol

#endif // os(iOS) || os(tvOS)
