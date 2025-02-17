// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

@objc
public class AppDelegatesLoaderDelegate: NSObject {
  /**
   Gets and registers AppDelegate subscribers.
   */
  @objc
  public static func registerAppDelegateSubscribers(_ legacySubscriber: ExpoAppDelegateSubscriberProtocol) {
    let modulesProvider = AppContext.modulesProvider(withName: "ExpoModulesProvider")
    ExpoAppDelegateSubscriberRepository.registerSubscriber(legacySubscriber)
    ExpoAppDelegateSubscriberRepository.registerSubscribersFrom(modulesProvider: modulesProvider)
    ExpoAppDelegateSubscriberRepository.registerReactDelegateHandlersFrom(modulesProvider: modulesProvider)
  }
}
