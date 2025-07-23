// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXNotifications

public final class ExpoGoNotificationsEmitterModule: EmitterModule {
  private let scopeKey: String
  // swiftlint:disable:next unavailable_function
  required init(appContext: AppContext) {
    fatalError("Initializer not implemented, use init(appContext:scopeKey:) instead")
  }

  required init(appContext: AppContext, scopeKey: String) {
    self.scopeKey = scopeKey

    super.init(appContext: appContext)
  }

  override public func didReceive(_ response: UNNotificationResponse, completionHandler: @escaping () -> Void) -> Bool {
    if EXScopedNotificationsUtils.shouldNotification(response.notification, beHandledByExperience: scopeKey) {
      return super.didReceive(response, completionHandler: completionHandler)
    }
    completionHandler()
    return true
  }

  override public func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) -> Bool {
    if EXScopedNotificationsUtils.shouldNotification(notification, beHandledByExperience: scopeKey) {
      return super.willPresent(notification, completionHandler: completionHandler)
    }
    return false
  }

  override public func serializedNotification(_ notification: UNNotification) -> [String: Any] {
    return EXScopedNotificationSerializer.serializedNotification(notification)
  }

  override public func serializedResponse(_ response: UNNotificationResponse) -> [String: Any] {
    return EXScopedNotificationSerializer.serializedNotificationResponse(response)
  }
}
