// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXNotifications

public final class ExpoGoNotificationsSchedulerModule: SchedulerModule {
  private let scopeKey: String
  // swiftlint:disable:next unavailable_function
  required init(appContext: AppContext) {
    fatalError("Initializer not implemented, use init(appContext:scopeKey:) instead")
  }

  required init(appContext: AppContext, scopeKey: String) {
    self.scopeKey = scopeKey

    super.init(appContext: appContext)
  }

  override public func buildNotificationRequest(
    identifier: String,
    contentInput: [String: Any],
    triggerInput: [String: Any]?
  ) throws -> UNNotificationRequest? {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    return try super.buildNotificationRequest(identifier: scopedIdentifier, contentInput: contentInput, triggerInput: triggerInput)
  }

  override public func serializedNotificationRequests(_ requests: [UNNotificationRequest]) -> [[String: Any]] {
    return requests.map {
      EXScopedNotificationSerializer.serializedNotificationRequest($0)
    }
  }

  override public func cancelScheduledNotification(_ identifier: String) {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    super.cancelScheduledNotification(scopedIdentifier)
  }

  override public func cancelAllScheduledNotifications() {
    UNUserNotificationCenter.current().getPendingNotificationRequests { (requests: [UNNotificationRequest]) in
      var identifierSet: Set<String> = []
      requests.forEach { request in
        if EXScopedNotificationsUtils.isId(request.identifier, scopedByExperience: self.scopeKey) {
          identifierSet.insert(request.identifier)
        }
      }
      UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: Array(identifierSet))
    }
  }
}
