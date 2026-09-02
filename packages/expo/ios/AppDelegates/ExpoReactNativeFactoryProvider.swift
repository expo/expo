// Copyright 2015-present 650 Industries. All rights reserved.

import React

/**
 Conformed to by the application's `AppDelegate` so that the scene delegate can retrieve
 the React Native factory it created during `application(_:didFinishLaunchingWithOptions:)`.

 In the scene-based life cycle the window is created by the scene delegate, but the factory
 is still owned by the app delegate . This protocol is the bridge between the two.
 */
public protocol ExpoReactNativeFactoryProvider: AnyObject {
  /// The app's window. The scene delegate creates the window and assigns it here so that code
  /// reading `UIApplication.shared.delegate?.window` keeps working (e.g. expo-system-ui).
  /// This is the same `var window: UIWindow?` the app delegate already declares for `UIApplicationDelegate`.
  var window: UIWindow? { get set }

  /// The factory created in `application(_:didFinishLaunchingWithOptions:)`.
  var reactNativeFactory: RCTReactNativeFactory? { get }

  /// The registered React Native module name. Defaults to `"main"`.
  var reactNativeFactoryModuleName: String { get }
}

public extension ExpoReactNativeFactoryProvider {
  var reactNativeFactoryModuleName: String {
    return "main"
  }
}
