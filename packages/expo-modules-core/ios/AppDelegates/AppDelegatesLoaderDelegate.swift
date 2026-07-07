// Copyright 2018-present 650 Industries. All rights reserved.
// NOTE: This lives in ExpoModulesCore (not the `expo` package) so the ObjC
// `EXAppDelegatesLoader` +load can call it without the `Expo` Swift target
// depending back on it — which would form an ExpoObjC → Expo cycle under SwiftPM.

@MainActor
@preconcurrency
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
