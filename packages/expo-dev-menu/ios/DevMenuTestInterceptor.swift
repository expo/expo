// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuTestInterceptor {
  @objc
  var shouldShowAtLaunch: Bool { get }

  @objc
  var isOnboardingFinishedKey: Bool { get }
}

@objc
public class DevMenuTestInterceptorManager: NSObject {
  static var interceptor: DevMenuTestInterceptor?

  @objc
  public static func setTestInterceptor(_ interceptor: DevMenuTestInterceptor?) {
    DevMenuTestInterceptorManager.interceptor = interceptor
  }
}
