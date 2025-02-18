// Copyright 2018-present 650 Industries. All rights reserved.

private var _subscribers = [ExpoAppDelegateSubscriberProtocol]()
private var _reactDelegateHandlers = [ExpoReactDelegateHandler]()

/**
 Class responsible for managing access to app delegate subscribers and react delegates.
 It should be used to access subscribers without depending on the `Expo` package where they are registered.
 */
@objc(EXExpoAppDelegateSubscriberRepository)
public class ExpoAppDelegateSubscriberRepository: NSObject {
  @objc
  public static var subscribers: [ExpoAppDelegateSubscriberProtocol] {
    return _subscribers
  }

  @objc
  public static var reactDelegateHandlers: [ExpoReactDelegateHandler] {
    return _reactDelegateHandlers
  }

  @objc
  public static func registerSubscribersFrom(modulesProvider: ModulesProvider) {
    modulesProvider.getAppDelegateSubscribers().forEach { subscriberType in
      registerSubscriber(subscriberType.init())
    }
  }

  @objc
  public static func registerSubscriber(_ subscriber: ExpoAppDelegateSubscriberProtocol) {
    if _subscribers.contains(where: { $0 === subscriber }) {
      fatalError("Given app delegate subscriber `\(String(describing: subscriber))` is already registered.")
    }
    _subscribers.append(subscriber)
  }

  @objc
  public static func getSubscriber(_ name: String) -> ExpoAppDelegateSubscriberProtocol? {
    return _subscribers.first { String(describing: $0) == name }
  }

  public static func getSubscriberOfType<Subscriber>(_ type: Subscriber.Type) -> Subscriber? {
    return _subscribers.first { $0 is Subscriber } as? Subscriber
  }

  @objc
  public static func registerReactDelegateHandlersFrom(modulesProvider: ModulesProvider) {
    modulesProvider.getReactDelegateHandlers()
      .sorted { tuple1, tuple2 -> Bool in
        return ModulePriorities.get(tuple1.packageName) > ModulePriorities.get(tuple2.packageName)
      }
      .forEach { handlerTuple in
        _reactDelegateHandlers.append(handlerTuple.handler.init())
      }
  }
}
