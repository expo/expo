// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoNotifications

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
    content: NotificationContentRecord,
    triggerInput: [String: Any]?
  ) throws -> UNNotificationRequest? {
    content.data = (content.data ?? [:]).merging([
      "experienceId": scopeKey,
      "scopeKey": scopeKey
    ]) { _, new in new }

    if let categoryIdentifier = content.categoryIdentifier {
      let scopedCategoryIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: categoryIdentifier, forExperience: scopeKey)
      content.categoryIdentifier = scopedCategoryIdentifier
    }

    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    return try super.buildNotificationRequest(identifier: scopedIdentifier, content: content, triggerInput: triggerInput)
  }

  override public func serializedNotificationRequests(_ requests: [UNNotificationRequest]) -> [NotificationRequestRecord] {
    return requests.map {
      EXScopedNotificationSerializer.serializedNotificationRequest($0)
    }
  }

  override public func cancelScheduledNotification(_ identifier: String) {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    super.cancelScheduledNotification(scopedIdentifier)
  }

  override public func cancelAllScheduledNotifications() {
    UNUserNotificationCenter.current().getPendingNotificationRequests { [weak self] requests in
      guard let self else { return }

      let identifiers = requests
        .map(\.identifier)
        .filter { EXScopedNotificationsUtils.isId($0, scopedByExperience: self.scopeKey) }

      UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
    }
  }
}
